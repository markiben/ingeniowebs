"use client";

import type { ReactNode } from "react";
import Logo from "@/components/Logo";
import HeroBackground from "@/components/HeroBackground";

export default function PlatformAuthShell({
  title,
  subtitle,
  children,
  compact = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`plat-body plat-auth has-login-bg${compact ? " is-compact" : ""}`}
    >
      <HeroBackground variant="dark" className="plat-auth-network-bg" />
      <div className={`plat-auth-card${compact ? " is-compact" : ""}`}>
        <div className="plat-auth-brand">
          <Logo
            variant="navbar"
            height={compact ? 30 : 36}
            className="plat-auth-logo"
          />
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
