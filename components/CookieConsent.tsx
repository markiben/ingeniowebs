"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Settings2, X } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

const STORAGE_KEY = "iw-cookie-consent";
export const COOKIE_CONSENT_EVENT = "iw:open-cookie-consent";

type ConsentValue = "accepted" | "rejected" | "custom";

type Prefs = {
  performance: boolean;
  functional: boolean;
  targeting: boolean;
};

const DEFAULT_PREFS: Prefs = {
  performance: false,
  functional: false,
  targeting: false,
};

function readConsent(): ConsentValue | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "accepted" || value === "rejected" || value === "custom") return value;
  } catch {
    /* ignore */
  }
  return null;
}

function writeConsent(value: ConsentValue, prefs?: Prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
    if (prefs) localStorage.setItem(`${STORAGE_KEY}-prefs`, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function openCookieConsent() {
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

export default function CookieConsent() {
  const { t } = useLanguage();
  const copy = t.cookieConsent;
  const [visible, setVisible] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => {
    setReady(true);
    if (!readConsent()) setVisible(true);

    const onOpen = () => {
      setPrefsOpen(false);
      setVisible(true);
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onOpen);
  }, []);

  const closeBanner = () => {
    setVisible(false);
    setPrefsOpen(false);
  };

  const allowAll = () => {
    writeConsent("accepted", {
      performance: true,
      functional: true,
      targeting: true,
    });
    closeBanner();
  };

  const rejectAll = () => {
    writeConsent("rejected", DEFAULT_PREFS);
    setPrefs(DEFAULT_PREFS);
    closeBanner();
  };

  const confirmChoices = () => {
    const allOff = !prefs.performance && !prefs.functional && !prefs.targeting;
    writeConsent(allOff ? "rejected" : "custom", prefs);
    closeBanner();
  };

  if (!ready || !visible) return null;

  return (
    <div
      className={`cookie-consent${prefsOpen ? " is-prefs-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
    >
      {prefsOpen && <div className="cookie-consent-backdrop" aria-hidden="true" />}

      {prefsOpen ? (
        <div className="cookie-prefs-panel">
          <div className="cookie-prefs-header">
            <div className="cookie-consent-icon" aria-hidden="true">
              <Cookie size={22} strokeWidth={1.75} />
            </div>
            <button
              type="button"
              className="cookie-prefs-close"
              onClick={() => setPrefsOpen(false)}
              aria-label={copy.close}
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          <h2 className="cookie-prefs-title">{copy.prefsTitle}</h2>
          <p className="cookie-prefs-desc">
            {copy.prefsDescription}{" "}
            <Link href="/privacidad" className="cookie-consent-inline-link" onClick={closeBanner}>
              {copy.moreInfo}
            </Link>
          </p>

          <p className="cookie-prefs-manage">{copy.prefsManage}</p>
          <ul className="cookie-prefs-list">
            <li className="cookie-prefs-item">
              <div>
                <p className="cookie-prefs-item-title">{copy.categories.necessary.title}</p>
                <p className="cookie-prefs-item-desc">{copy.categories.necessary.description}</p>
              </div>
              <span className="cookie-prefs-always">{copy.alwaysActive}</span>
            </li>
            {(
              [
                ["performance", copy.categories.performance],
                ["functional", copy.categories.functional],
                ["targeting", copy.categories.targeting],
              ] as const
            ).map(([key, category]) => (
              <li key={key} className="cookie-prefs-item">
                <div>
                  <p className="cookie-prefs-item-title">{category.title}</p>
                  <p className="cookie-prefs-item-desc">{category.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[key]}
                  className={`cookie-toggle${prefs[key] ? " is-on" : ""}`}
                  onClick={() => setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))}
                >
                  <span className="cookie-toggle-knob" />
                </button>
              </li>
            ))}
          </ul>

          <div className="cookie-prefs-actions">
            <button type="button" className="cookie-btn cookie-btn--ghost" onClick={rejectAll}>
              {copy.reject}
            </button>
            <button type="button" className="cookie-btn cookie-btn--ghost" onClick={confirmChoices}>
              {copy.confirmChoices}
            </button>
            <button type="button" className="cookie-btn cookie-btn--solid" onClick={allowAll}>
              {copy.accept}
            </button>
          </div>
        </div>
      ) : (
        <div className="cookie-banner">
          <div className="cookie-banner-top">
            <div className="cookie-consent-icon" aria-hidden="true">
              <Cookie size={22} strokeWidth={1.75} />
            </div>
            <div className="cookie-banner-copy">
              <h2 id="cookie-consent-title" className="cookie-consent-title">
                {copy.title}
              </h2>
              <p className="cookie-consent-desc">
                {copy.description}{" "}
                <Link href="/privacidad" className="cookie-consent-inline-link" onClick={closeBanner}>
                  {copy.cookiesPolicy}
                </Link>{" "}
                <Link href="/privacidad" className="cookie-consent-inline-link" onClick={closeBanner}>
                  {copy.privacyLink}
                </Link>
              </p>
            </div>
          </div>

          <div className="cookie-banner-bottom">
            <button type="button" className="cookie-configure" onClick={() => setPrefsOpen(true)}>
              <Settings2 size={16} strokeWidth={2} aria-hidden="true" />
              {copy.configure}
            </button>
            <div className="cookie-banner-actions">
              <button type="button" className="cookie-btn cookie-btn--muted" onClick={rejectAll}>
                {copy.reject}
              </button>
              <button type="button" className="cookie-btn cookie-btn--solid" onClick={allowAll}>
                {copy.accept}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
