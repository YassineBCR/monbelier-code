import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // N'accepter que les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Récupère les données envoyées par ton Frontend (OrderForm.tsx)
    const { items, customer_email, metadata } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items, // Tes articles
      mode: 'payment',
      customer_email: customer_email,
      metadata: metadata, // Très important : contient l'ID de ta commande Supabase
      // req.headers.origin permet d'avoir le bon lien (localhost en dev, ton-domaine.vercel.app en prod)
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    // Renvoie l'URL de paiement Stripe au Frontend
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Erreur Stripe Checkout :', error);
    res.status(500).json({ error: error.message });
  }
}