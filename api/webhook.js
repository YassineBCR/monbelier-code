import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe   = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// IMPORTANT : Vercel doit recevoir le raw body pour que Stripe puisse vérifier la signature
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end',  () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const rawBody = await getRawBody(req);
  const sig     = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotence : vérifie si l'événement a déjà été traité
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .single();

  if (existing) return res.status(200).send('Already processed');

  // Enregistre l'événement
  await supabase.from('stripe_events').insert([{ id: event.id, type: event.type }]);

  // Gère le succès du paiement
  if (event.type === 'checkout.session.completed') {
    const session       = event.data.object;
    const reservationId = session.client_reference_id;

    await supabase
      .from('reservations')
      .update({ statut_paiement: 'paye' })
      .eq('id', reservationId);
  }

  res.status(200).send('OK');
}