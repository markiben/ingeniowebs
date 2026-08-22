/**
 * Google Apps Script — notificaciones Ingenio Webs
 *
 * Maneja:
 * - type: "contact" (POST) → aviso interno de formularios / chat
 * - type: "password_reset" (GET/POST) → código de recupero al email del usuario
 * - type: "newsletter_welcome" (POST) → email HTML de bienvenida + descuento
 *
 * IMPORTANTE: creá / autorizá este script con info@ingeniowebs.com
 *
 * Cómo activarlo:
 * 1. https://script.google.com → pegá este código → Guardar
 * 2. Implementar → Nueva implementación → Aplicación web
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier persona
 * 3. Si ya existía: Administrar implementaciones → Editar → Nueva versión
 * 4. Copiá la URL /exec a .env.local como GOOGLE_CONTACT_WEBHOOK_URL
 */

const NOTIFY_EMAIL = "info@ingeniowebs.com";
const SHEET_ID = ""; // opcional
const FROM_NAME = "Ingenio Webs";

function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || "{}");
    const type = data.type || "contact";

    if (type === "password_reset") {
      return handlePasswordReset(data);
    }

    if (type === "newsletter_welcome") {
      return handleNewsletterWelcome(data);
    }

    return handleContact(data);
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  }
}

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    if (params.type === "password_reset") {
      return handlePasswordReset({
        email: params.email,
        name: params.name,
        code: params.code,
      });
    }

    return ContentService.createTextOutput(
      "Ingenio Webs contact webhook OK",
    );
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  }
}

function handlePasswordReset(data) {
  const email = String((data && data.email) || "").trim();
  const name = String((data && data.name) || "Usuario").trim();
  const code = String((data && data.code) || "")
    .trim()
    .toUpperCase();

  if (!email || !code) {
    return jsonResponse({ ok: false, error: "email_and_code_required" });
  }

  const body = [
    "Hola " + name + ",",
    "",
    "Recibimos un pedido para recuperar tu contraseña en Ingenio Webs.",
    "",
    "Tu código de recupero es:",
    code,
    "",
    "El código vence en 1 hora.",
    "Si no pediste este cambio, ignorá este mensaje.",
    "",
    "— " + FROM_NAME,
  ].join("\n");

  MailApp.sendEmail({
    to: email,
    subject: "[" + FROM_NAME + "] Código de recupero de contraseña",
    body: body,
    name: FROM_NAME,
  });

  return jsonResponse({ ok: true, type: "password_reset" });
}

function handleNewsletterWelcome(data) {
  const email = String((data && data.email) || "").trim();
  const name = String((data && data.name) || "Suscriptor").trim();
  const subject = String(
    (data && data.subject) || "[" + FROM_NAME + "] Bienvenida a la newsletter",
  ).trim();
  const textBody = String((data && data.textBody) || "").trim();
  const htmlBody = String((data && data.htmlBody) || "").trim();

  if (!email || (!textBody && !htmlBody)) {
    return jsonResponse({ ok: false, error: "email_and_body_required" });
  }

  var sendOptions = {
    htmlBody: htmlBody || undefined,
    name: FROM_NAME,
    replyTo: NOTIFY_EMAIL,
  };

  try {
    GmailApp.sendEmail(
      email,
      subject,
      textBody || "Gracias por suscribirte a Ingenio Webs.",
      sendOptions,
    );
  } catch (error) {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: textBody || "Gracias por suscribirte a Ingenio Webs.",
      htmlBody: htmlBody || undefined,
      name: FROM_NAME,
      replyTo: NOTIFY_EMAIL,
    });
  }

  // Aviso interno real (BCC a la misma cuenta NO llega a la bandeja, solo a Enviados).
  try {
    GmailApp.sendEmail(
      NOTIFY_EMAIL,
      "[Newsletter] Welcome enviado a " + email,
      [
        "Se envió el email de bienvenida / descuento.",
        "",
        "Destinatario: " + email,
        "Nombre: " + name,
        "Asunto: " + subject,
        "Fecha: " + new Date().toISOString(),
      ].join("\n"),
      { name: FROM_NAME },
    );
  } catch (internalError) {
    // No bloquear el envío al suscriptor si falla la copia interna.
  }

  return jsonResponse({
    ok: true,
    type: "newsletter_welcome",
    name: name,
    to: email,
  });
}

function handleContact(data) {
  const name = data.name || "Sin nombre";
  const email = data.email || "Sin email";
  const phone = data.phone || "—";
  const company = data.company || "—";
  const source = data.source || "web";
  const message = data.message || "";
  const receivedAt = data.receivedAt || new Date().toISOString();

  const body = [
    "Nuevo contacto desde Ingenio Webs",
    "",
    "Fuente: " + source,
    "Nombre: " + name,
    "Email: " + email,
    "Teléfono: " + phone,
    "Empresa / tipo: " + company,
    "Fecha: " + receivedAt,
    "",
    "Mensaje:",
    message,
  ].join("\n");

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: "[Ingenio Webs] Nuevo contacto: " + name,
    body: body,
    replyTo: email !== "Sin email" ? email : undefined,
  });

  if (SHEET_ID) {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    sheet.appendRow([
      receivedAt,
      source,
      name,
      email,
      phone,
      company,
      message,
    ]);
  }

  return jsonResponse({ ok: true, type: "contact" });
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
