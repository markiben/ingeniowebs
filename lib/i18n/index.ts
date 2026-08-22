import type { Locale, Translations } from "./types";
import { es } from "./es";
import { en } from "./en";

export type { Locale, Translations };

const dictionaries: Record<Locale, Translations> = { es, en };

export function getTranslations(locale: Locale): Translations {
  return dictionaries[locale];
}

export const locales: Locale[] = ["es", "en"];

export const localeLabels: Record<Locale, string> = {
  es: "ES",
  en: "EN",
};
