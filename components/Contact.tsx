"use client";

import { useState, FormEvent, useEffect } from "react";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, CheckCircle, Mail } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import SectionHeading from "./SectionHeading";
import ContactMeetingScheduler from "./ContactMeetingScheduler";
import { ensureCalendlyStylesheet, initCalendlyUi } from "@/lib/calendly-ui";
import { captureLeadAction } from "@/lib/platform/actions";

type ContactMode = "form" | "meeting";

const panelMotion = {
  initial: { opacity: 1, x: 0 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 1, x: 0 },
  transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const },
};

export default function Contact() {
  const { t } = useLanguage();
  const section = t.contact;
  const [mode, setMode] = useState<ContactMode>("form");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendlyReady, setCalendlyReady] = useState(false);

  const labelClass = "contact-label";

  useEffect(() => {
    ensureCalendlyStylesheet();
    return initCalendlyUi();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await captureLeadAction({
      source: "contact_form",
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      company: String(form.get("clientType") ?? ""),
      message: [
        String(form.get("message") ?? ""),
        `Tipo de cliente: ${String(form.get("clientType") ?? "")}`,
        `Tipo de proyecto: ${String(form.get("projectType") ?? "")}`,
        `Presupuesto: ${String(form.get("budget") ?? "")}`,
      ].join("\n"),
    });
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section id="contacto" className="contact-section" data-chat-surface="dark">
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
        onLoad={() => setCalendlyReady(true)}
      />

      <div className="contact-section-glow" aria-hidden="true" />

      <div className="contact-section-inner">
        <SectionHeading
          label={section.label}
          title={section.title}
          spacing="compact"
          variant="dark"
        />

        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
          className="contact-card"
        >
          <div className="contact-layout">
            <div className="contact-tabs" role="tablist" aria-label={section.label}>
              <button
                type="button"
                role="tab"
                id="contact-tab-form"
                aria-selected={mode === "form"}
                aria-controls="contact-panel-form"
                className={`contact-tab${mode === "form" ? " is-active" : ""}`}
                onClick={() => setMode("form")}
              >
                <span className="contact-tab-icon" aria-hidden="true">
                  <Mail size={18} strokeWidth={2} />
                </span>
                <span className="contact-tab-label">{section.tabForm}</span>
              </button>
              <button
                type="button"
                role="tab"
                id="contact-tab-meeting"
                aria-selected={mode === "meeting"}
                aria-controls="contact-panel-meeting"
                className={`contact-tab${mode === "meeting" ? " is-active" : ""}`}
                onClick={() => setMode("meeting")}
              >
                <span className="contact-tab-icon" aria-hidden="true">
                  <CalendarDays size={18} strokeWidth={2} />
                </span>
                <span className="contact-tab-label">{section.tabMeeting}</span>
              </button>
            </div>

            <div className="contact-body">
              <AnimatePresence mode="wait" initial={false}>
                {mode === "form" ? (
                  <motion.div
                    key="form"
                    id="contact-panel-form"
                    role="tabpanel"
                    aria-labelledby="contact-tab-form"
                    className="contact-panel"
                    {...panelMotion}
                  >
                    {submitted ? (
                      <div className="contact-success">
                        <CheckCircle
                          size={44}
                          className="mx-auto text-iw-blue"
                          strokeWidth={1.5}
                        />
                        <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
                          {section.successTitle}
                        </h3>
                        <p className="mt-2 text-sm text-muted">{section.successMessage}</p>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleSubmit}
                        className="contact-form"
                        suppressHydrationWarning
                      >
                        <h3 className="contact-form-title">{section.formTitle}</h3>
                        <div className="contact-form-grid">
                          <div>
                            <label htmlFor="name" className={labelClass}>
                              {section.name}
                            </label>
                            <input
                              id="name"
                              name="name"
                              required
                              className="input-apple contact-input"
                              placeholder={section.namePlaceholder}
                              suppressHydrationWarning
                            />
                          </div>
                          <div>
                            <label htmlFor="email" className={labelClass}>
                              {section.email}
                            </label>
                            <input
                              id="email"
                              name="email"
                              type="email"
                              required
                              className="input-apple contact-input"
                              placeholder={section.emailPlaceholder}
                              suppressHydrationWarning
                            />
                          </div>
                          <div>
                            <label htmlFor="phone" className={labelClass}>
                              {section.phone}
                            </label>
                            <input
                              id="phone"
                              name="phone"
                              type="tel"
                              className="input-apple contact-input"
                              placeholder={section.phonePlaceholder}
                              suppressHydrationWarning
                            />
                          </div>
                          <div>
                            <label htmlFor="clientType" className={labelClass}>
                              {section.clientType}
                            </label>
                            <select
                              id="clientType"
                              name="clientType"
                              className="input-apple contact-input"
                              suppressHydrationWarning
                            >
                              {section.clientTypes.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="projectType" className={labelClass}>
                              {section.projectType}
                            </label>
                            <select
                              id="projectType"
                              name="projectType"
                              className="input-apple contact-input"
                              suppressHydrationWarning
                            >
                              {section.projectTypes.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="budget" className={labelClass}>
                              {section.budget}
                            </label>
                            <select
                              id="budget"
                              name="budget"
                              className="input-apple contact-input"
                              suppressHydrationWarning
                            >
                              {section.budgetRanges.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="contact-form-span">
                            <label htmlFor="message" className={labelClass}>
                              {section.message}
                            </label>
                            <textarea
                              id="message"
                              name="message"
                              required
                              rows={3}
                              className="input-apple contact-input resize-none"
                              placeholder={section.messagePlaceholder}
                              suppressHydrationWarning
                            />
                          </div>
                          <div className="contact-form-actions">
                            <button
                              type="submit"
                              disabled={loading}
                              className="btn-primary contact-submit !py-3 text-sm disabled:opacity-60 sm:text-base"
                            >
                              {loading ? section.submitting : section.submit}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="meeting"
                    id="contact-panel-meeting"
                    role="tabpanel"
                    aria-labelledby="contact-tab-meeting"
                    className="contact-panel contact-panel--meeting"
                    {...panelMotion}
                  >
                    <ContactMeetingScheduler calendlyReady={calendlyReady} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
