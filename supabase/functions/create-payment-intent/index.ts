import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") || "https://monbelier.fr";
const FROM_EMAIL = "Mon Bélier <noreply@monbelier.fr>";

// ── Types ──────────────────────────────────────────────────────────────────
type EmailType = "confirmation" | "pret_a_recuperer";

interface EmailPayload {
  reservationId: string;
  type: EmailType;
}

// ── Templates HTML ─────────────────────────────────────────────────────────
function templateConfirmation(data: {
  prenom: string;
  numero_commande: string;
  mosquee_nom: string;
  quantite: number;
  noms_sacrifice: string[];
  qr_token: string;
}) {
  const pickupUrl = `${APP_URL}/retrait/${data.qr_token}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pickupUrl)}&bgcolor=ffffff&color=064e3b`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#065f46,#059669);padding:40px 32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
        🐑 Mon Bélier
      </h1>
      <p style="color:#a7f3d0;margin:8px 0 0;font-size:14px;">Service de livraison pour l'Aïd Al-Adha</p>
    </div>

    <!-- Body -->
    <div style="padding:40px 32px;">
      <h2 style="color:#064e3b;font-size:24px;margin:0 0 8px;">Réservation confirmée ! ✅</h2>
      <p style="color:#475569;font-size:16px;margin:0 0 24px;">
        Bonjour <strong>${data.prenom}</strong>, votre paiement a bien été reçu.
      </p>

      <!-- Récap commande -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:32px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:4px 0;">Numéro de commande</td>
            <td style="color:#064e3b;font-weight:700;font-size:15px;text-align:right;">${data.numero_commande}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:4px 0;">Quantité</td>
            <td style="color:#1e293b;font-weight:600;text-align:right;">${data.quantite} agneau(x)</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:4px 0;">Mosquée de retrait</td>
            <td style="color:#1e293b;font-weight:600;text-align:right;">${data.mosquee_nom}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:4px 0;">Nom(s) du sacrifice</td>
            <td style="color:#1e293b;font-weight:600;text-align:right;">${data.noms_sacrifice.join(", ")}</td>
          </tr>
        </table>
      </div>

      <!-- QR Code -->
      <div style="text-align:center;background:#1e293b;border-radius:16px;padding:32px;margin-bottom:32px;">
        <p style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">
          Votre Pass de Retrait
        </p>
        <img src="${qrImageUrl}" alt="QR Code" style="width:200px;height:200px;border-radius:12px;background:#fff;padding:8px;" />
        <p style="color:#ffffff;font-family:monospace;font-size:20px;font-weight:700;margin:16px 0 4px;letter-spacing:2px;">
          ${data.numero_commande}
        </p>
        <p style="color:#64748b;font-size:11px;margin:0;">
          Présentez ce QR code à la mosquée lors du retrait
        </p>
      </div>

      <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Vous recevrez un second email dès que votre colis sera disponible à la mosquée.
        Vous pourrez alors vous y rendre pour récupérer votre agneau.
      </p>

      <div style="text-align:center;margin-top:32px;">
        <a href="${pickupUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;">
          Voir ma réservation en ligne →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        Mon Bélier · Service de livraison d'agneau · Montpellier<br/>
        En cas de problème : <a href="mailto:contact@monbelier.fr" style="color:#059669;">contact@monbelier.fr</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function templatePretARecuperer(data: {
  prenom: string;
  numero_commande: string;
  mosquee_nom: string;
  mosquee_adresse: string;
  mosquee_horaires: string;
  qr_token: string;
}) {
  const pickupUrl = `${APP_URL}/retrait/${data.qr_token}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pickupUrl)}&bgcolor=ffffff&color=064e3b`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#065f46,#059669);padding:40px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">📦</div>
      <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;">Votre colis est arrivé !</h1>
      <p style="color:#a7f3d0;margin:8px 0 0;font-size:14px;">Vous pouvez venir le récupérer</p>
    </div>

    <!-- Body -->
    <div style="padding:40px 32px;">
      <p style="color:#475569;font-size:16px;margin:0 0 24px;">
        Bonjour <strong>${data.prenom}</strong>,<br/>
        Al Hamdulillah, votre commande <strong>${data.numero_commande}</strong> est disponible à la mosquée.
      </p>

      <!-- Mosquée info -->
      <div style="background:#f0fdf4;border:2px solid #059669;border-radius:12px;padding:24px;margin-bottom:32px;">
        <h3 style="color:#064e3b;margin:0 0 12px;font-size:18px;">📍 Lieu de retrait</h3>
        <p style="color:#1e293b;font-size:16px;font-weight:700;margin:0 0 4px;">${data.mosquee_nom}</p>
        <p style="color:#64748b;font-size:14px;margin:0 0 12px;">${data.mosquee_adresse}</p>
        ${data.mosquee_horaires ? `
        <div style="background:#ecfdf5;border-radius:8px;padding:12px;">
          <p style="color:#065f46;font-size:13px;font-weight:600;margin:0;">
            🕐 ${data.mosquee_horaires}
          </p>
        </div>` : ""}
      </div>

      <!-- QR Code -->
      <div style="text-align:center;background:#1e293b;border-radius:16px;padding:28px;margin-bottom:32px;">
        <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">
          Présentez ce QR code
        </p>
        <img src="${qrImageUrl}" alt="QR Code" style="width:160px;height:160px;border-radius:10px;background:#fff;padding:6px;" />
        <p style="color:#ffffff;font-family:monospace;font-size:18px;font-weight:700;margin:12px 0 0;letter-spacing:2px;">
          ${data.numero_commande}
        </p>
      </div>

      <div style="text-align:center;">
        <a href="${pickupUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;">
          Voir les détails →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        Mon Bélier · Service de livraison d'agneau · Montpellier
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Envoi via Resend ────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return res.json();
}

// ── Handler principal ───────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { reservationId, type }: EmailPayload = await req.json();

    if (!reservationId || !type) {
      throw new Error("Missing reservationId or type");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Récupère la réservation avec les infos mosquée
    const { data: res, error } = await supabase
      .from("reservations")
      .select("*, mosquees(nom, adresse, horaires, telephone)")
      .eq("id", reservationId)
      .single();

    if (error || !res) throw new Error("Reservation not found");

    const clientEmail = res.email;
    if (!clientEmail) throw new Error("No email for this reservation");

    let subject = "";
    let html = "";

    if (type === "confirmation") {
      subject = `✅ Réservation confirmée - ${res.numero_commande} | Mon Bélier`;
      html = templateConfirmation({
        prenom: res.prenom || "Client",
        numero_commande: res.numero_commande,
        mosquee_nom: res.mosquees?.nom || "Mosquée partenaire",
        quantite: res.quantite,
        noms_sacrifice: Array.isArray(res.noms_sacrifice) ? res.noms_sacrifice : [res.noms_sacrifice],
        qr_token: res.qr_token,
      });
    } else if (type === "pret_a_recuperer") {
      subject = `📦 Votre colis est disponible - ${res.numero_commande} | Mon Bélier`;
      html = templatePretARecuperer({
        prenom: res.prenom || "Client",
        numero_commande: res.numero_commande,
        mosquee_nom: res.mosquees?.nom || "Mosquée partenaire",
        mosquee_adresse: res.mosquees?.adresse || "",
        mosquee_horaires: res.mosquees?.horaires || "",
        qr_token: res.qr_token,
      });
    } else {
      throw new Error(`Unknown email type: ${type}`);
    }

    await sendEmail(clientEmail, subject, html);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});