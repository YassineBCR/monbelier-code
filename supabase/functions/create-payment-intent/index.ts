import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const { reservationId, quantite, email } = await req.json()

    // Création de la session Stripe Checkout
// Création de la session Stripe Checkout
const session = await stripe.checkout.sessions.create({
  customer_email: email,
  line_items: [
    {
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Agneau Aïd - Réservation (x${quantite})`,
          description: 'Sacrifice et livraison incluse',
        },
        unit_amount: 36000, 
      },
      quantity: quantite,
    },
  ],
  mode: 'payment',
  // MODIFIER CES DEUX LIGNES :
  success_url: `${req.headers.get('origin')}/success?id=${reservationId}`,
  cancel_url: `${req.headers.get('origin')}/cancel`,
  metadata: { reservationId },
})

    // C'EST CETTE PARTIE QUI EST IMPORTANTE :
    return new Response(JSON.stringify({ 
      sessionId: session.id,
      url: session.url // <-- On renvoie bien l'URL !
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})