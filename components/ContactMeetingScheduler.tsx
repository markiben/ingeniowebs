"use client";

import { FormEvent, useCallback, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Mail, Video } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { buildCalendlyPrefill, buildCalendlyUrl, siteConfig } from "@/lib/site-config";
import {
  injectCalendlyOverrides,
  lockPageForCalendly,
  unlockPageForCalendly,
} from "@/lib/calendly-ui";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: {
        url: string;
        prefill?: {
          name?: string;
          email?: string;
          customAnswers?: Record<string, string>;
        };
      }) => void;
    };
  }
}

const benefitIcons = [Mail, Clock3, Video] as const;

interface ContactMeetingSchedulerProps {
  calendlyReady: boolean;
}

export default function ContactMeetingScheduler({ calendlyReady }: ContactMeetingSchedulerProps) {
  const { t, locale } = useLanguage();
  const section = t.contact;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const openCalendly = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const trimmedPhone = phone.trim();

      if (!trimmedName || !trimmedEmail) return;

      const url = buildCalendlyUrl(trimmedName, trimmedEmail, trimmedPhone || undefined);
      const prefill = buildCalendlyPrefill(trimmedName, trimmedEmail, trimmedPhone || undefined);

      injectCalendlyOverrides();

      if (window.Calendly) {
        lockPageForCalendly();
        window.Calendly.initPopupWidget({ url, prefill });
        return;
      }

      unlockPageForCalendly();
      if (!calendlyReady) return;

      window.open(url, "_blank", "noopener,noreferrer");
    },
    [name, email, phone, calendlyReady]
  );

  return (
    <div className="contact-meeting">
      <div className="contact-meeting-layout">
        <aside className="contact-meeting-aside">
          <div className="contact-meeting-intro">
            <h3 className="contact-meeting-title">{section.meetingTitle}</h3>
            <p className="contact-meeting-desc">{section.meetingDescription}</p>
            <p className="contact-meeting-meta">
              <Clock3 size={14} strokeWidth={2} aria-hidden="true" />
              {section.meetingDuration.replace(
                "{minutes}",
                String(siteConfig.meetingDurationMinutes)
              )}
              <span aria-hidden="true">·</span>
              {siteConfig.timezoneLabel[locale]}
            </p>
          </div>

          <ul className="contact-meeting-benefits">
            {section.meetingBenefits.map((benefit, index) => {
              const Icon = benefitIcons[index] ?? CheckCircle2;
              return (
                <li key={benefit} className="contact-meeting-benefit">
                  <span className="contact-meeting-benefit-icon" aria-hidden="true">
                    <Icon size={15} strokeWidth={2} />
                  </span>
                  <span>{benefit}</span>
                </li>
              );
            })}
          </ul>

          <p className="contact-meeting-powered contact-meeting-powered--aside">
            {section.meetingPoweredNote}
          </p>
        </aside>

        <form className="contact-meeting-form" onSubmit={openCalendly}>
          <p className="contact-meeting-prefill-label">{section.meetingFormIntro}</p>
          <div className="contact-meeting-fields">
            <div>
              <label htmlFor="meeting-name" className="contact-label">
                {section.name}
              </label>
              <input
                id="meeting-name"
                name="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input-apple contact-input"
                placeholder={section.namePlaceholder}
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="meeting-email" className="contact-label">
                {section.email}
              </label>
              <input
                id="meeting-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-apple contact-input"
                placeholder={section.emailPlaceholder}
                autoComplete="email"
              />
            </div>
            <div className="contact-meeting-field-phone">
              <label htmlFor="meeting-phone" className="contact-label">
                {section.meetingPhone}
              </label>
              <input
                id="meeting-phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="input-apple contact-input"
                placeholder={section.meetingPhonePlaceholder}
                autoComplete="tel"
              />
              <p className="contact-meeting-phone-hint">{section.meetingPhoneHint}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!calendlyReady}
            className="btn-primary contact-meeting-cta w-full !py-3 text-sm disabled:opacity-60 sm:text-base"
          >
            <CalendarDays size={18} strokeWidth={2} aria-hidden="true" />
            {calendlyReady ? section.meetingCta : section.meetingLoading}
          </button>
        </form>
      </div>
    </div>
  );
}
