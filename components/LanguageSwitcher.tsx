"use client";

import { useLanguage } from "./LanguageProvider";
import type { Locale } from "@/lib/i18n";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  const options: Locale[] = ["es", "en"];

  return (
    <div
      className={`lang-switch ${className}`}
      role="group"
      aria-label={locale === "es" ? "Idioma" : "Language"}
    >
      {options.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={locale === code ? "active" : undefined}
          aria-pressed={locale === code}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
