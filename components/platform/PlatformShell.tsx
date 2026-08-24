"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Calculator,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Newspaper,
  Users,
  X,
} from "lucide-react";
import Logo from "@/components/Logo";
import NotificationsPanel from "@/components/platform/NotificationsPanel";
import PlatformLiveRefresh from "@/components/platform/PlatformLiveRefresh";
import { PlatformThemeProvider } from "@/components/platform/PlatformThemeContext";
import ProfileMenu from "@/components/platform/ProfileMenu";
import { logoutAction } from "@/lib/platform/actions";
import type { PlatformNotification } from "@/lib/platform/notifications";
import type { SessionUser } from "@/lib/platform/types";

const SIDEBAR_KEY = "plat-sidebar-expanded";

/** Persists across Soft Navigations so remounted shells don't flash expanded→collapsed. */
let sidebarExpandedCache: boolean | null = null;

function readSidebarExpanded(): boolean {
  if (sidebarExpandedCache !== null) return sidebarExpandedCache;
  if (typeof window === "undefined") return true;
  try {
    sidebarExpandedCache = window.localStorage.getItem(SIDEBAR_KEY) !== "0";
  } catch {
    sidebarExpandedCache = true;
  }
  return sidebarExpandedCache;
}

function writeSidebarExpanded(next: boolean) {
  sidebarExpandedCache = next;
  try {
    window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
  } catch {
    /* ignore */
  }
}

const adminLinks = [
  { href: "/plataforma", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plataforma/inbox", label: "Inbox", icon: Inbox },
  { href: "/plataforma/cotizador", label: "Cotizador", icon: Calculator },
  { href: "/plataforma/clientes", label: "Clientes", icon: Users },
  { href: "/plataforma/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/plataforma/newsletter", label: "Newsletter", icon: Mail },
  { href: "/plataforma/blog", label: "Blog CMS", icon: Newspaper },
  { href: "/plataforma/vista-cliente", label: "Vista cliente", icon: Eye },
];

const clientLinks = [
  { href: "/plataforma", label: "Mi proyecto", icon: LayoutDashboard },
];

export default function PlatformShell({
  user,
  children,
  notifications = [],
  showNotifications = false,
}: {
  user: SessionUser;
  children: React.ReactNode;
  notifications?: PlatformNotification[];
  showNotifications?: boolean;
}) {
  const pathname = usePathname();
  const links = user.role === "admin" ? adminLinks : clientLinks;
  const [expanded, setExpanded] = useState(readSidebarExpanded);
  const [isMobile, setIsMobile] = useState(false);
  const [animateSidebar, setAnimateSidebar] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const railMode = !expanded && !isMobile;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setExpanded(readSidebarExpanded());
    // Enable width transition only after preference is applied (avoids expand/shrink flash).
    const id = requestAnimationFrame(() => setAnimateSidebar(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("plat-dark-boot");
    try {
      localStorage.setItem("plat-theme-v2", "dark");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobile || !mobileNavOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMobile, mobileNavOpen]);

  function toggleSidebar() {
    setAnimateSidebar(true);
    setExpanded((value) => {
      const next = !value;
      writeSidebarExpanded(next);
      return next;
    });
  }

  return (
    <PlatformThemeProvider theme="dark">
      <div
        className="plat-body is-app"
        data-plat-theme="dark"
        suppressHydrationWarning
      >
        <PlatformLiveRefresh enabled intervalMs={20000} />

        <header className="plat-site-header">
          <div className="nav-bar">
            <div className="plat-top-nav-inner">
              {isMobile ? (
                <button
                  type="button"
                  className="plat-mobile-menu-btn"
                  onClick={() => setMobileNavOpen((open) => !open)}
                  aria-label={mobileNavOpen ? "Cerrar menú" : "Abrir menú"}
                  aria-expanded={mobileNavOpen}
                >
                  <Menu size={20} strokeWidth={2.25} />
                </button>
              ) : null}
              <Link href="/plataforma" className="plat-top-nav-brand">
                <Logo variant="navbar" height={34} />
              </Link>
              <div className="plat-content-bar-actions">
                {showNotifications ? (
                  <NotificationsPanel notifications={notifications} />
                ) : null}
                <ProfileMenu user={user} />
              </div>
            </div>
          </div>
        </header>

        {isMobile && mobileNavOpen ? (
          <button
            type="button"
            className="plat-mobile-nav-backdrop"
            aria-label="Cerrar menú"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        <div
          className={`plat-shell${railMode ? " is-collapsed" : ""}${
            animateSidebar ? " is-animating" : ""
          }${isMobile && mobileNavOpen ? " is-mobile-nav-open" : ""}`}
          suppressHydrationWarning
        >
          <aside className="plat-sidebar" aria-hidden={isMobile && !mobileNavOpen}>
            <div className="plat-menubar">
              <span className="plat-menubar-icon-slot" aria-hidden="true" />
              <span className="plat-menubar-label">Menú</span>
              {isMobile ? (
                <button
                  type="button"
                  className="plat-mobile-nav-close"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Cerrar menú"
                >
                  <X size={18} strokeWidth={2.25} />
                </button>
              ) : null}
              <button
                type="button"
                className="plat-menubar-toggle"
                onClick={toggleSidebar}
                aria-label={railMode ? "Expandir menú" : "Contraer menú"}
                title={railMode ? "Expandir" : "Contraer"}
              >
                {railMode ? (
                  <ChevronsRight size={16} strokeWidth={2.25} />
                ) : (
                  <ChevronsLeft size={16} strokeWidth={2.25} />
                )}
              </button>
            </div>

            <nav className="plat-nav">
              {links.map((link) => {
                const Icon = link.icon;
                const active =
                  link.href === "/plataforma"
                    ? pathname === "/plataforma"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={active ? "is-active" : undefined}
                    title={link.label}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <Icon size={16} strokeWidth={2} />
                    <span className="plat-nav-label">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <form action={logoutAction} className="plat-logout">
              <button
                type="submit"
                className="plat-btn is-ghost"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
                <span className="plat-nav-label">Cerrar sesión</span>
              </button>
            </form>
          </aside>

          <div className="plat-main">
            <div className="plat-content">{children}</div>
          </div>
        </div>
      </div>
    </PlatformThemeProvider>
  );
}
