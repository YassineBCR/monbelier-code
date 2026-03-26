import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Important pour le webhook Stripe (doit utiliser le raw body)
app.post('/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Vérifier si l'événement a déjà été traité (Idempotence)
  const { data: existingEvent } = await supabase.from('stripe_events').select('id').eq('id', event.id).single();
  if (existingEvent) return response.status(200).send('Event already processed');

  // Enregistrer l'événement
  await supabase.from('stripe_events').insert([{ id: event.id, type: event.type }]);

  // Gérer le succès du paiement
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const reservationId = session.client_reference_id;

    // Mettre à jour la base de données Supabase
    await supabase
      .from('reservations')
      .update({ statut_paiement: 'paye' })
      .eq('id', reservationId);
  }

  response.status(200).send();
});

app.use(cors());
app.use(express.json());

// Route pour créer la session de paiement Stripe
app.post('/create-checkout-session', async (req, res) => {
  const { reservationId, quantite } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Mouton Aïd Al-Adha (Mon Bélier)',
              description: 'Réservation pour le sacrifice',
            },
            unit_amount: 36000, // 360.00 EUR en centimes
          },
          quantity: quantite,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/espace-client?success=true`,
      cancel_url: `${process.env.CLIENT_URL}/reservation?canceled=true`,
      client_reference_id: reservationId, // Pour lier le paiement à la réservation
    });

    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Serveur Stripe en écoute sur le port 3000'));
