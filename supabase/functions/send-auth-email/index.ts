// supabase/functions/send-auth-email/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const FROM_EMAIL = "contact@monbelier.fr";
const FROM_NAME  = "MonBelier";
const SITE_NAME  = "MonBelier";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface AuthHookPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: { nom?: string; full_name?: string };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type:
      | "signup"
      | "recovery"
      | "invite"
      | "magiclink"
      | "email_change"
      | "reauthentication";
    site_url: string;
    verification_link?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const resendApiKey    = Deno.env.get("RESEND_API_KEY");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY"); // injecté automatiquement

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY manquant" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: AuthHookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Payload invalide" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { user, email_data } = payload;
  const userName =
    user.user_metadata?.nom ||
    user.user_metadata?.full_name ||
    user.email.split("@")[0];

  // ── Construction du lien avec apikey ──────────────────────────────────────
  // L'endpoint /auth/v1/verify de Supabase requiert l'apikey dans la requête.
  // On l'ajoute directement dans l'URL pour que le clic depuis l'email fonctionne.
  let actionLink: string;

  if (email_data.verification_link) {
    const url = new URL(email_data.verification_link);
    if (supabaseAnonKey) url.searchParams.set("apikey", supabaseAnonKey);
    actionLink = url.toString();
  } else {
    const params = new URLSearchParams({
      token:       email_data.token_hash,
      type:        email_data.email_action_type,
      redirect_to: email_data.redirect_to,
    });
    if (supabaseAnonKey) params.set("apikey", supabaseAnonKey);
    actionLink = `${email_data.site_url}/auth/v1/verify?${params.toString()}`;
  }

  const emailContent = buildEmailContent(
    email_data.email_action_type,
    userName,
    actionLink
  );

  if (!emailContent) {
    return new Response(JSON.stringify({ success: true, skipped: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:    `${FROM_NAME} <${FROM_EMAIL}>`,
      to:      [user.email],
      subject: emailContent.subject,
      html:    emailContent.html,
    }),
  });

  if (!resendResponse.ok) {
    const errorBody = await resendResponse.text();
    console.error("Erreur Resend:", errorBody);
    return new Response(
      JSON.stringify({ error: "Échec envoi email", details: errorBody }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

// ─── Templates ────────────────────────────────────────────────────────────

function buildEmailContent(
  type: AuthHookPayload["email_data"]["email_action_type"],
  userName: string,
  actionLink: string
): { subject: string; html: string } | null {
  switch (type) {
    case "signup":
      return {
        subject: `Confirmez votre adresse email — ${SITE_NAME}`,
        html: template({
          title: "Bienvenue ! 🎉",
          userName,
          intro: `Merci de vous être inscrit sur <strong>${SITE_NAME}</strong>. Confirmez votre adresse email pour activer votre compte.`,
          buttonText: "Confirmer mon email",
          buttonHref: actionLink,
          note: "Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.",
        }),
      };
    case "recovery":
      return {
        subject: `Réinitialisation de votre mot de passe — ${SITE_NAME}`,
        html: template({
          title: "Réinitialisation du mot de passe",
          userName,
          intro: `Vous avez demandé à réinitialiser votre mot de passe sur <strong>${SITE_NAME}</strong>.`,
          buttonText: "Réinitialiser mon mot de passe",
          buttonHref: actionLink,
          note: "Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.",
        }),
      };
    case "magiclink":
      return {
        subject: `Votre lien de connexion — ${SITE_NAME}`,
        html: template({
          title: "Connexion par lien magique",
          userName,
          intro: `Cliquez ci-dessous pour vous connecter à <strong>${SITE_NAME}</strong>.`,
          buttonText: "Me connecter",
          buttonHref: actionLink,
          note: "Ce lien expire dans 1 heure et ne peut être utilisé qu'une seule fois.",
        }),
      };
    case "email_change":
      return {
        subject: `Confirmez votre nouvelle adresse email — ${SITE_NAME}`,
        html: template({
          title: "Changement d'adresse email",
          userName,
          intro: `Confirmez votre nouvelle adresse email pour mettre à jour votre compte <strong>${SITE_NAME}</strong>.`,
          buttonText: "Confirmer mon nouvel email",
          buttonHref: actionLink,
          note: "Si vous n'avez pas fait cette demande, ignorez cet email.",
        }),
      };
    case "invite":
      return {
        subject: `Vous avez été invité à rejoindre ${SITE_NAME}`,
        html: template({
          title: `Invitation — ${SITE_NAME}`,
          userName,
          intro: `Vous avez été invité à rejoindre <strong>${SITE_NAME}</strong>.`,
          buttonText: "Accepter l'invitation",
          buttonHref: actionLink,
          note: "Ce lien expire dans 24 heures.",
        }),
      };
    default:
      return null;
  }
}

interface TemplateOptions {
  title: string;
  userName: string;
  intro: string;
  buttonText: string;
  buttonHref: string;
  note: string;
}

function template({ title, userName, intro, buttonText, buttonHref, note }: TemplateOptions): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:#059669;padding:28px 32px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">${SITE_NAME}</p>
        </td></tr>
        <tr><td style="padding:36px 32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">${title}</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#374151;">Bonjour ${userName},</p>
          <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">${intro}</p>
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="border-radius:8px;background:#059669;">
              <a href="${buttonHref}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${buttonText}</a>
            </td>
          </tr></table>
          <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
            Ou copiez ce lien dans votre navigateur :<br/>
            <a href="${buttonHref}" style="color:#059669;word-break:break-all;">${buttonHref}</a>
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">${note}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}