import Stripe from "npm:stripe@11.1.0"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { session_id } = await req.json()
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { 
      apiVersion: '2022-11-15', 
      httpClient: Stripe.createFetchHttpClient() 
    })
    
    // 1. Récupération de la session Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id)

    if (session.payment_status === 'paid') {
      const meta = session.metadata!
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!, 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // 2. On récupère le nom de la mosquée
      const { data: mosqueeData } = await supabase
        .from('mosquees')
        .select('nom')
        .eq('id', meta.mosquee_id)
        .single();
      
      const nomMosquee = mosqueeData?.nom || "la mosquée sélectionnée";

      // 3. Création de la réservation en base
      const { data: res, error } = await supabase
        .from('reservations')
        .insert([{
          user_id: meta.user_id,
          nom: meta.nom,
          prenom: meta.prenom,
          telephone: meta.telephone,
          quantite: parseInt(meta.quantite),
          mosquee_id: meta.mosquee_id,
          noms_sacrifice: JSON.parse(meta.sacrifices),
          statut: 'en_attente' 
        }])
        .select().single()

      if (error) throw error;

      // 4. Envoi de l'e-mail avec Resend
      const resendKey = Deno.env.get('RESEND_API_KEY');
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${resendKey}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          from: 'Mon Belier <contact@monbelier.fr>', // 👈 Votre domaine est ici
          to: [session.customer_details.email],
          subject: `Confirmation de réservation - ${res.id.split('-')[0]}`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #064e3b; padding: 30px; text-align: center; border-radius: 20px 20px 0 0;">
                <h1 style="color: #fbbf24; margin: 0; font-size: 28px; text-transform: uppercase;">Aïd Al-Adha 2026</h1>
              </div>
              
              <div style="padding: 40px; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 0 0 20px 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #064e3b; margin-top: 0;">Salam Alaykoum ${meta.prenom},</h2>
                <p style="font-size: 16px; line-height: 1.6;">Nous avons le plaisir de vous confirmer la validation de votre réservation.</p>
                
                <div style="background-color: #fffbeb; border: 2px dashed #f59e0b; padding: 25px; border-radius: 15px; margin: 30px 0;">
                  <p style="margin: 0 0 10px 0; color: #92400e; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Référence de réservation</p>
                  <p style="margin: 0 0 20px 0; color: #064e3b; font-size: 32px; font-weight: 900;">${res.id.split('-')[0]}</p>
                  
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 5px 0; color: #64748b;">Quantité :</td>
                      <td style="padding: 5px 0; text-align: right; font-weight: bold;">${meta.quantite} agneau(x)</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #64748b;">Lieu de retrait :</td>
                      <td style="padding: 5px 0; text-align: right; font-weight: bold;">${nomMosquee}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #64748b;">Montant payé :</td>
                      <td style="padding: 5px 0; text-align: right; font-weight: bold;">${(session.amount_total / 100).toFixed(2)}€</td>
                    </tr>
                  </table>
                </div>

                <p style="font-size: 15px; color: #475569; font-style: italic;">
                  Vous recevrez un nouvel e-mail dès que votre commande sera prête à être récupérée à <strong>${nomMosquee}</strong>.
                </p>
                
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                
                <p style="font-size: 14px; color: #64748b; text-align: center; margin-bottom: 0;">
                  Barak'Allahu Fikoum,<br>
                  <strong>L'équipe Mon Belier</strong>
                </p>
              </div>
            </div>
          `
        })
      });
      
      return new Response(JSON.stringify({ success: true, reservation: res }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})