"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Languages,
  LogOut,
  UserRound,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { logoutAction } from "@/lib/platform/actions";
import type { SessionUser } from "@/lib/platform/types";

const MENU_ID = "profile";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProfileMenu({ user }: { user: SessionUser }) {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const showAvatar = Boolean(user.avatarUrl) && !avatarFailed;

  useEffect(() => {
    setAvatarFailed(false);
  }, [user.avatarUrl]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!open) return;
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onOpenOther(event: Event) {
      const id = (event as CustomEvent<string>).detail;
      if (id === MENU_ID) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("plat-header-menu-open", onOpenOther);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("plat-header-menu-open", onOpenOther);
    };
  }, [open]);

  function toggle() {
    if (!open) {
      window.dispatchEvent(
        new CustomEvent("plat-header-menu-open", { detail: MENU_ID }),
      );
    }
    setOpen((value) => !value);
  }

  function toggleLocale() {
    setLocale(locale === "es" ? "en" : "es");
  }

  return (
    <div className="plat-profile-menu" ref={wrapRef}>
      <button
        type="button"
        className="plat-avatar-btn"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Menú de perfil"
        onClick={toggle}
      >
        {showAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl!}
            alt={user.name}
            className="plat-avatar-img"
            referrerPolicy="no-referrer"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <span className="plat-avatar-fallback">
            {initials(user.name) || "IW"}
          </span>
        )}
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          className="plat-avatar-caret"
          aria-hidden
        />
      </button>

      {open ? (
        <div className="plat-profile-panel" id={panelId} role="menu">
          <div className="plat-profile-panel-head is-rich">
            <span className="plat-profile-panel-avatar" aria-hidden>
              {showAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl!}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <span>{initials(user.name) || "IW"}</span>
              )}
            </span>
            <div>
              <p>{user.name}</p>
              <span>{user.email}</span>
            </div>
          </div>

          <div className="plat-profile-panel-section">
            <button
              type="button"
              className="plat-profile-panel-item"
              role="menuitem"
              onClick={toggleLocale}
            >
              <Languages size={15} />
              <span className="plat-profile-panel-item-label">
                {locale === "es" ? "Idioma" : "Language"}
              </span>
              <span className="plat-profile-panel-item-meta">
                {locale === "es" ? "Español" : "English"}
                <ChevronRight size={14} aria-hidden />
              </span>
            </button>
            <Link
              href="/plataforma/perfil"
              className="plat-profile-panel-item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <UserRound size={15} />
              <span className="plat-profile-panel-item-label">
                {locale === "es" ? "Perfil" : "Profile"}
              </span>
            </Link>
          </div>

          <div className="plat-profile-panel-section">
            <form action={logoutAction}>
              <button
                type="submit"
                className="plat-profile-panel-item is-danger"
                role="menuitem"
              >
                <LogOut size={15} />
                <span className="plat-profile-panel-item-label">
                  {locale === "es" ? "Cerrar sesión" : "Log out"}
                </span>
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
