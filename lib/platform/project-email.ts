function siteOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "https://ingeniowebs.com";
}

export function buildProjectRegisteredSubject(projectCode: string) {
  const code = projectCode.trim() || "—";
  return `[ Ingenio Webs ] Tu proyecto ${code} ha sido registrado con éxito!`;
}

/** @deprecated Prefer buildProjectRegisteredSubject(projectCode) */
export const PROJECT_REGISTERED_SUBJECT =
  "[ Ingenio Webs ] Tu proyecto ha sido registrado con éxito!";

export function buildProjectRegisteredEmailBody(
  name: string,
  projectCode: string,
) {
  const trimmed = name.trim();
  const firstName = trimmed.split(/\s+/)[0] || "hola";
  const code = projectCode.trim() || "—";
  const registerUrl = `${siteOrigin()}/plataforma/registro?code=${encodeURIComponent(code)}`;

  return [
    `¡Hola, ${firstName}!`,
    "",
    `¡Excelentes noticias! Tu proyecto ya se encuentra registrado oficialmente bajo el número de identificación ${code}.`,
    "",
    "Para que podamos comenzar y puedas realizar el seguimiento detallado de los avances, por favor completá los siguientes pasos:",
    "",
    `1. Ingresá al registro de la plataforma: ${registerUrl}`,
    `2. Verificá que el código de proyecto sea ${code}.`,
    "3. Completá tu registro con tu correo electrónico y contraseña, o directamente a través de Google.",
    "4. Iniciá sesión para visualizar el cronograma y el estado de tu proyecto en tiempo real.",
    "",
    "Estamos muy entusiasmados de empezar a trabajar juntos en esto.",
    "",
    "Si tenés cualquier duda durante el proceso, simplemente respondé a este correo y te ayudamos de inmediato.",
    "",
    "Saludos cordiales,",
  ].join("\n");
}

/**
 * Gmail omite la firma HTML si la URL trae `body`.
 * Abrimos solo con destinatario + asunto (incluye código IW);
 * el cuerpo se copia al portapapeles para pegarlo (Ctrl+V) y conservar la firma.
 */
export function toProjectRegisteredGmailUrl(
  email: string,
  projectCode?: string,
) {
  const value = email.trim();
  if (!value) return null;

  const params = new URLSearchParams({
    fs: "1",
    tf: "cm",
    to: value,
    su: projectCode?.trim()
      ? buildProjectRegisteredSubject(projectCode)
      : PROJECT_REGISTERED_SUBJECT,
  });
  return `https://mail.google.com/mail/u/0/?${params.toString()}`;
}

export async function copyProjectRegisteredEmailBody(
  name: string,
  projectCode: string,
) {
  const body = buildProjectRegisteredEmailBody(name, projectCode);
  await navigator.clipboard.writeText(body);
  return body;
}
