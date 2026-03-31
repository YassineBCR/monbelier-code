import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { reservationId, quantite } = req.body;

  if (!reservationId) return res.status(400).json({ error: 'reservationId manquant' });

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
          quantity: quantite || 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url:  `${process.env.CLIENT_URL}/cancel`,
      client_reference_id: reservationId,
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}