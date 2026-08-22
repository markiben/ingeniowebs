/**
 * Email HTML de bienvenida al newsletter (pieza promocional / welcome email).
 * Ancho estándar 600px, tablas + CSS inline (compatible con clientes de correo).
 */

function siteOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv && !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(fromEnv)) {
    return fromEnv.replace(/\/$/, "");
  }
  // En dev nunca mandar links localhost: Gmail los marca como spam y no entrega.
  return "https://ingeniowebs.com";
}

export function getNewsletterWelcomePromo() {
  const percentRaw = process.env.NEWSLETTER_WELCOME_DISCOUNT_PERCENT?.trim();
  const percent = Math.min(
    90,
    Math.max(1, Number(percentRaw) || 10),
  );
  const code =
    process.env.NEWSLETTER_WELCOME_PROMO_CODE?.trim() ||
    `BIENVENIDA${percent}`;
  return { percent, code };
}

export function buildNewsletterWelcomeSubject(percent: number) {
  return `Bienvenida a Ingenio Webs — ${percent}% en tu próximo proyecto`;
}

export function buildNewsletterWelcomeTextBody(input: {
  name: string;
  email: string;
  percent: number;
  code: string;
}) {
  const firstName =
    input.name.trim().split(/\s+/)[0] || "hola";
  const origin = siteOrigin();
  const bajaUrl = `${origin}/baja?email=${encodeURIComponent(input.email)}`;

  return [
    `¡Hola, ${firstName}!`,
    "",
    "Gracias por sumarte a la newsletter de Ingenio Webs.",
    "",
    `Como bienvenida, tenés un ${input.percent}% de descuento en tu próximo proyecto.`,
    `Código: ${input.code}`,
    "",
    `Mencioná el código al contactarnos o agendar una reunión: ${origin}/#contacto`,
    "",
    `Darte de baja: ${bajaUrl}`,
    "",
    "— Ingenio Webs",
  ].join("\n");
}

export function buildNewsletterWelcomeHtmlBody(input: {
  name: string;
  email: string;
  percent: number;
  code: string;
}) {
  const firstName =
    input.name.trim().split(/\s+/)[0] || "hola";
  const origin = siteOrigin();
  const contactUrl = `${origin}/#contacto`;
  const bajaUrl = `${origin}/baja?email=${encodeURIComponent(input.email)}`;
  const { percent, code } = input;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bienvenida Ingenio Webs</title>
</head>
<body style="margin:0;padding:0;background:#070a0f;font-family:Arial,Helvetica,sans-serif;color:#e8f1fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#070a0f;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#0c1a2e;border:1px solid rgba(125,211,252,0.22);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 12px;text-align:center;">
              <p style="margin:0;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#7dd3fc;font-weight:700;">Ingenio Webs</p>
              <h1 style="margin:12px 0 0;font-size:26px;line-height:1.25;color:#ffffff;">¡Hola, ${escapeHtml(firstName)}!</h1>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.5;color:rgba(232,241,250,0.72);">
                Gracias por suscribirte. Te dejamos un beneficio exclusivo por sumarte a la lista.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 20px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1b75bb;border-radius:14px;">
                <tr>
                  <td style="padding:28px 24px;text-align:center;">
                    <p style="margin:0;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.85);font-weight:700;">
                      Oferta de bienvenida
                    </p>
                    <p style="margin:10px 0 0;font-size:42px;line-height:1;font-weight:800;color:#ffffff;">
                      ${percent}% OFF
                    </p>
                    <p style="margin:10px 0 0;font-size:15px;line-height:1.45;color:rgba(255,255,255,0.9);">
                      En tu próximo proyecto web con Ingenio Webs
                    </p>
                    <p style="margin:18px 0 0;display:inline-block;padding:10px 16px;border-radius:999px;background:rgba(0,0,0,0.28);border:1px solid rgba(255,255,255,0.28);font-size:14px;letter-spacing:0.08em;color:#ffffff;font-weight:700;">
                      Código: ${escapeHtml(code)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 8px;text-align:center;">
              <p style="margin:0;font-size:14px;line-height:1.5;color:rgba(232,241,250,0.7);">
                Mencioná el código al escribirnos o al agendar una reunión. Válido para nuevos proyectos.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 28px;text-align:center;">
              <a href="${contactUrl}" style="display:inline-block;padding:14px 22px;border-radius:10px;background:#1b75bb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">
                Quiero aprovechar el descuento
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;text-align:center;border-top:1px solid rgba(255,255,255,0.08);">
              <p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:rgba(232,241,250,0.45);">
                Recibiste este email porque te suscribiste a la newsletter de Ingenio Webs.<br />
                <a href="${bajaUrl}" style="color:#7dd3fc;text-decoration:underline;">Darse de baja</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
