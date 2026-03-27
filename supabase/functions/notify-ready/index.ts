import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const payload = await req.json()
  
  // On ne déclenche l'e-mail QUE si le statut passe à 'pret' (ou le mot que vous aurez choisi)
  if (payload.record.statut === 'pret' && payload.old_record.statut !== 'pret') {
    
    // On récupère le mail de l'utilisateur (on suppose qu'il est lié ou stocké)
    // Ici on peut aussi récupérer les infos via payload.record.nom/prenom
    
    const resendKey = Deno.env.get('RESEND_API_KEY');
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Mosquée IBN ROCHD <contact@votre-domaine.fr>',
        to: ['le-mail-du-client@test.com'], // Vous devrez faire une petite requête pour avoir son mail
        subject: `Votre commande est prête ! - Mosquée IBN ROCHD`,
        html: `
          <h2>Bonne nouvelle !</h2>
          <p>Salam Alaykoum ${payload.record.prenom},</p>
          <p>Votre commande d'agneau est prête à être récupérée au point de retrait choisi.</p>
          <p>N'oubliez pas de vous munir de votre numéro de réservation : <strong>${payload.record.id.split('-')[0]}</strong>.</p>
          <p>À très bientôt.</p>
        `
      })
    });
  }

  return new Response("ok", { status: 200 })
})