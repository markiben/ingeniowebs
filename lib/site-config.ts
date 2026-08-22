/** Email principal de contacto / Workspace de Ingenio Webs */
export const CONTACT_EMAIL = "info@ingeniowebs.com";

export const siteConfig = {
  contactEmail: CONTACT_EMAIL,
  calendlyUrl:
    process.env.NEXT_PUBLIC_CALENDLY_URL ??
    "https://calendly.com/ingeniowebs/consultoria",
  meetingDurationMinutes: 30,
  timezoneLabel: {
    es: "GMT-3 · Argentina",
    en: "GMT-3 · Argentina",
  },
} as const;

export const socialLinks = {
  linkedin:
    process.env.NEXT_PUBLIC_LINKEDIN_URL ??
    "https://www.linkedin.com/company/ingeniowebs",
  instagram:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/ingeniowebs/",
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://www.tiktok.com/@ingeniowebs",
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "https://t.me/marcobret",
} as const;

export type SocialNetwork = keyof typeof socialLinks;

export const socialLinkOrder: SocialNetwork[] = [
  "linkedin",
  "instagram",
  "tiktok",
  "telegram",
];

export function buildCalendlyUrl(name: string, email: string, phone?: string) {
  const url = new URL(siteConfig.calendlyUrl);
  url.searchParams.set("name", name.trim());
  url.searchParams.set("email", email.trim());
  if (phone?.trim()) {
    // Primera pregunta personalizada en Calendly (configurar "Teléfono" como pregunta #1).
    url.searchParams.set("a1", phone.trim());
  }
  return url.toString();
}

export function buildCalendlyPrefill(name: string, email: string, phone?: string) {
  const prefill: {
    name: string;
    email: string;
    customAnswers?: Record<string, string>;
  } = {
    name: name.trim(),
    email: email.trim(),
  };

  if (phone?.trim()) {
    prefill.customAnswers = { a1: phone.trim() };
  }

  return prefill;
}
