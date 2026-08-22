"use client";

import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import Logo from "./Logo";
import { SocialIcon } from "./SocialIcons";
import { openCookieConsent } from "./CookieConsent";
import { siteConfig, socialLinkOrder, socialLinks } from "@/lib/site-config";
import { goToHomeSection, toHomeSectionHref } from "@/lib/scroll-to-section";

export default function Footer() {
  const { t } = useLanguage();
  const activeSocials = socialLinkOrder;

  return (
    <footer className="site-footer-wrap" data-chat-surface="dark">
      <div className="site-footer nav-bar">
        <div className="site-footer-inner">
          <div className="site-footer-grid">
            <div className="site-footer-brand">
              <Logo height={58} variant="navbar" className="site-footer-logo" />
              <p className="site-footer-desc">{t.footer.description}</p>
              <div className="site-footer-social">
                <p className="site-footer-heading site-footer-social-label">
                  {t.footer.socialTitle}
                </p>
                <div className="site-footer-social-links">
                  {activeSocials.map((network) => {
                    const url = socialLinks[network].trim();
                    const label = t.footer.social[network];

                    if (!url) {
                      return (
                        <span
                          key={network}
                          className="site-footer-social-link is-disabled"
                          aria-label={label}
                          title={label}
                        >
                          <SocialIcon network={network} />
                        </span>
                      );
                    }

                    return (
                      <a
                        key={network}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="site-footer-social-link"
                        aria-label={label}
                      >
                        <SocialIcon network={network} />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="site-footer-col site-footer-col--links">
              <h4 className="site-footer-heading">{t.footer.linksTitle}</h4>
              <nav className="site-footer-links">
                {t.navLinks.map((link) => {
                  const href = toHomeSectionHref(link.href);
                  return (
                    <a
                      key={link.href}
                      href={href}
                      className="nav-link site-footer-nav-link"
                      onClick={(event) => goToHomeSection(href, event)}
                    >
                      {link.label}
                    </a>
                  );
                })}
              </nav>
            </div>

            <div className="site-footer-col site-footer-col--contact">
              <h4 className="site-footer-heading">{t.footer.contactTitle}</h4>
              <div className="site-footer-contact">
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="nav-link site-footer-nav-link site-footer-mail"
                >
                  <Mail size={15} strokeWidth={1.75} />
                  <span>{siteConfig.contactEmail}</span>
                </a>
                <p className="site-footer-meta">
                  <MapPin size={15} strokeWidth={1.75} />
                  {t.footer.remote}
                </p>
              </div>
            </div>
          </div>

          <div className="site-footer-bottom">
            <p>
              © {new Date().getFullYear()} Ingenio Webs. {t.footer.rights}
            </p>
            <nav className="site-footer-legal" aria-label="Legal">
              <Link href="/privacidad">{t.footer.privacy}</Link>
              <span aria-hidden="true">·</span>
              <Link href="/terminos">{t.footer.terms}</Link>
              <span aria-hidden="true">·</span>
              <button type="button" onClick={openCookieConsent}>
                {t.footer.cookies}
              </button>
              <span aria-hidden="true">·</span>
              <span>ingeniowebs.com</span>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
