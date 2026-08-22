"use client";

import { FormEvent, useState, useTransition } from "react";
import { CheckCircle, Info, Mail } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import SectionHeading from "./SectionHeading";
import { subscribeNewsletterAction } from "@/lib/platform/actions";

export default function Newsletter() {
  const { t } = useLanguage();
  const section = t.newsletter;
  const [done, setDone] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [subscriberName, setSubscriberName] = useState("");
  const [successDetail, setSuccessDetail] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <section id="newsletter" className="newsletter-section">
      <div className="newsletter-inner">
        <SectionHeading
          label={section.label}
          title={section.title}
          description={section.description}
          spacing="compact"
          variant="dark"
          titleClassName="text-gradient-rgb"
        />

        <div
          className={`newsletter-card${done ? " is-success" : ""}${
            alreadyRegistered ? " is-existing" : ""
          }`}
        >
          {done ? (
            <div className="newsletter-success" role="status" aria-live="polite">
              {alreadyRegistered ? (
                <Info size={32} strokeWidth={2} />
              ) : (
                <CheckCircle size={32} strokeWidth={2} />
              )}
              <div>
                <strong>
                  {alreadyRegistered
                    ? section.alreadyRegisteredTitle
                    : subscriberName
                      ? `¡Gracias, ${subscriberName}!`
                      : section.successTitle}
                </strong>
                <p>
                  {successDetail ||
                    (alreadyRegistered
                      ? section.alreadyRegisteredMessage
                      : section.successMessage)}
                </p>
              </div>
            </div>
          ) : (
            <form
              className="newsletter-form"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const form = event.currentTarget;
                const formData = new FormData(form);
                const name = String(formData.get("name") ?? "").trim();
                startTransition(async () => {
                  setError("");
                  const result = await subscribeNewsletterAction(formData);
                  if (result && !result.ok) {
                    setError(result.error);
                    return;
                  }

                  const exists =
                    Boolean(result && "alreadyRegistered" in result) &&
                    result.alreadyRegistered === true;

                  setAlreadyRegistered(exists);
                  setSubscriberName(name.split(/\s+/)[0] || "");

                  if (exists) {
                    setSuccessDetail(section.alreadyRegisteredMessage);
                  } else if (
                    result &&
                    "welcomeSent" in result &&
                    result.welcomeSent === false
                  ) {
                    setSuccessDetail(section.welcomeFailedMessage);
                  } else if (
                    result &&
                    "welcomeSent" in result &&
                    result.welcomeSent === true
                  ) {
                    setSuccessDetail(section.welcomeSentMessage);
                  } else {
                    setSuccessDetail(section.successMessage);
                  }
                  setDone(true);
                });
              }}
            >
              <div className="newsletter-fields">
                <label>
                  {section.name}
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder={section.namePlaceholder}
                  />
                </label>
                <label>
                  {section.email}
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder={section.emailPlaceholder}
                  />
                </label>
              </div>
              {error ? <p className="newsletter-error">{error}</p> : null}
              <button type="submit" className="btn-primary" disabled={pending}>
                <Mail size={16} />
                {pending ? section.submitting : section.submit}
              </button>
              <p className="newsletter-note">{section.privacyNote}</p>
              <p className="newsletter-unsubscribe">
                {section.publicUnsubscribeLabel}{" "}
                <a href="/baja">/baja</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
