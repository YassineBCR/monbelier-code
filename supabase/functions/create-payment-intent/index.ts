import Stripe from "https://esm.sh/stripe@11.1.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_id, nom, prenom, telephone, quantite, email, mosquee_id, sacrifices } = await req.json()
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2022-11-15', httpClient: Stripe.createFetchHttpClient() })

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [{
        price_data: { currency: 'eur', product_data: { name: "Agneau Aïd Al-Adha 2026" }, unit_amount: 35000 }, // 0.50€ pour le test
        quantity: quantite,
      }],
      mode: 'payment',
      // 👇 La magie est ici : on renvoie le client avec son numéro de session Stripe
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/reservation`,
      metadata: { 
        user_id, nom, prenom, telephone, quantite: quantite.toString(), mosquee_id, sacrifices: JSON.stringify(sacrifices)
      },
    })

    return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})