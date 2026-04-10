import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Utilise la clé SERVICE ROLE pour passer outre les règles RLS de Supabase depuis le backend
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

// DÉSACTIVER LE BODY PARSER DE VERCEL POUR LE WEBHOOK
export const config = {
  api: {
    bodyParser: false,
  },
};

// Fonction pour récupérer le buffer brut de la requête (requis par Stripe)
async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Méthode non autorisée');
  }

  const payload = await getRawBody(req);
  const signature = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err) {
    console.error(`Erreur de validation du Webhook: ${err.message}`);
    return res.status(400).send(`Erreur Webhook: ${err.message}`);
  }

  // Traiter l'événement quand le paiement est réussi
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.order_id; // L'ID passé dans le composant React

    if (orderId) {
      // Met à jour la commande dans Supabase comme "payée"
      const { error } = await supabase
        .from('orders') // Remplace 'orders' par le nom exact de ta table
        .update({ payment_status: 'paid', status: 'confirmed' })
        .eq('id', orderId);

      if (error) {
        console.error('Erreur de mise à jour Supabase:', error);
        return res.status(500).json({ error: 'Erreur BDD' });
      }
    }
  }

  // Toujours répondre 200 à Stripe pour confirmer la réception
  res.status(200).json({ received: true });
}