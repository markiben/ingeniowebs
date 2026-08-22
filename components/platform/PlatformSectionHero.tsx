import type { ReactNode } from "react";

export default function PlatformSectionHero({
  title,
  subtitle,
  actions,
  tabs,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  tabs?: ReactNode;
}) {
  return (
    <header
      className={`plat-section-hero${tabs ? " has-tabs" : ""}`}
    >
      <div className="plat-section-hero-head">
        <div>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? (
          <div className="plat-section-hero-actions">{actions}</div>
        ) : null}
      </div>
      {tabs ? (
        <div className="plat-section-hero-tabs">{tabs}</div>
      ) : null}
    </header>
  );
}
