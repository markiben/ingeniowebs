/** Número internacional sin + ni espacios. Ej: 5491127106417 */
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5491127106417";

/** Usuario de Telegram sin @. Ej: marcobret */
export const TELEGRAM_USER =
  process.env.NEXT_PUBLIC_TELEGRAM_USER ?? "marcobret";

export function getWhatsAppUrl(message: string) {
  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${WHATSAPP_NUMBER}?${params.toString()}`;
}

export function getTelegramUrl(message: string) {
  const params = new URLSearchParams({ text: message });
  return `https://t.me/${TELEGRAM_USER}?${params.toString()}`;
}
