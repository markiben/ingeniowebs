export type ContactNotifyPayload = {
  source: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  message: string;
};

export type PasswordResetNotifyPayload = {
  email: string;
  name: string;
  code: string;
};

export type NewsletterWelcomeNotifyPayload = {
  email: string;
  name: string;
  subject: string;
  textBody: string;
  htmlBody: string;
};

type NotifyResult =
  | { sent: true; type?: string }
  | {
      sent: false;
      reason: "missing_webhook" | "webhook_error" | "network_error" | "outdated_script";
    };

function getWebhookUrl() {
  return process.env.GOOGLE_CONTACT_WEBHOOK_URL?.trim() || "";
}

function parseScriptResponse(text: string): NotifyResult {
  const trimmed = text.trim();
  if (trimmed.includes("webhook OK")) {
    console.error("[notifyGoogle] got healthcheck instead of mail handler");
    return { sent: false, reason: "webhook_error" };
  }
  try {
    const parsed = JSON.parse(trimmed) as {
      ok?: boolean;
      error?: string;
      type?: string;
    };
    if (parsed.ok === false) {
      console.error("[notifyGoogle] script error", parsed.error);
      return { sent: false, reason: "webhook_error" };
    }
    if (parsed.ok === true) return { sent: true, type: parsed.type };
  } catch {
    // ignore non-json
  }
  return { sent: true };
}

async function postWebhook(body: Record<string, unknown>): Promise<NotifyResult> {
  const webhook = getWebhookUrl();
  if (!webhook) return { sent: false, reason: "missing_webhook" };

  const payload = JSON.stringify({
    ...body,
    receivedAt: new Date().toISOString(),
  });

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: payload,
      redirect: "follow",
      cache: "no-store",
    });
    const text = await response.text();
    if (!response.ok) {
      console.error("[notifyGoogle] webhook status", response.status);
      return { sent: false, reason: "webhook_error" };
    }
    return parseScriptResponse(text);
  } catch (error) {
    console.error("[notifyGoogle]", error);
    return { sent: false, reason: "network_error" };
  }
}

/**
 * Envía el formulario a un Google Apps Script desplegado como Web App.
 * Configurá GOOGLE_CONTACT_WEBHOOK_URL en .env.local.
 */
export async function notifyGoogleContact(payload: ContactNotifyPayload) {
  return postWebhook({
    type: "contact",
    ...payload,
  });
}

/**
 * Recupero de contraseña: usa GET (Apps Script rompe los POST con redirect 405).
 */
export async function notifyPasswordResetEmail(
  payload: PasswordResetNotifyPayload,
): Promise<NotifyResult> {
  const webhook = getWebhookUrl();
  if (!webhook) return { sent: false, reason: "missing_webhook" };

  try {
    const url = new URL(webhook);
    url.searchParams.set("type", "password_reset");
    url.searchParams.set("email", payload.email);
    url.searchParams.set("name", payload.name);
    url.searchParams.set("code", payload.code);

    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
    });
    const text = await response.text();
    if (!response.ok) {
      console.error("[notifyGoogle] reset status", response.status, text.slice(0, 200));
      return { sent: false, reason: "webhook_error" };
    }
    return parseScriptResponse(text);
  } catch (error) {
    console.error("[notifyGoogle] reset", error);
    return { sent: false, reason: "network_error" };
  }
}

/**
 * Welcome email al suscribirse al newsletter (HTML + texto).
 * Usa POST para poder mandar el cuerpo HTML completo.
 */
export async function notifyNewsletterWelcomeEmail(
  payload: NewsletterWelcomeNotifyPayload,
): Promise<NotifyResult> {
  const result = await postWebhook({
    type: "newsletter_welcome",
    email: payload.email,
    name: payload.name,
    subject: payload.subject,
    textBody: payload.textBody,
    htmlBody: payload.htmlBody,
  });

  // Script viejo trata newsletter_welcome como "contact" y manda a info@, no al suscriptor.
  if (result.sent && result.type && result.type !== "newsletter_welcome") {
    console.error(
      "[notifyGoogle] newsletter welcome: script desactualizado (respondió type=" +
        result.type +
        "). Actualizá scripts/google-apps-script-contact.js en script.google.com y publicá una nueva versión.",
    );
    return { sent: false, reason: "outdated_script" };
  }

  return result;
}
