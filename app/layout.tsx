import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import MotionProvider from "@/components/MotionProvider";
import CookieConsent from "@/components/CookieConsent";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/** Evita flash claro en /plataforma antes de hidratar. */
const PLAT_DARK_BOOT = `(function(){try{if(location.pathname.indexOf("/plataforma")!==0)return;localStorage.setItem("plat-theme-v2","dark");document.documentElement.classList.add("plat-dark-boot");}catch(e){}})();`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light",
};

/* metadataBase es lo que permite declarar las imágenes con rutas
   relativas: sin esto, Next no puede convertirlas en las URLs absolutas
   que exigen Facebook, WhatsApp, LinkedIn y X para mostrar la tarjeta. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ingeniowebs.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Ingenio Webs | Diseño Web & Desarrollo de Software",
  description:
    "Diseño UI/UX, desarrollo Full Stack, plataformas a medida y aplicaciones web para empresas y emprendedores. Soluciones digitales de alto impacto.",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  keywords: [
    "diseño web",
    "desarrollo software",
    "full stack",
    "aplicaciones web",
    "sistemas a medida",
    "Ingenio Webs",
  ],
  openGraph: {
    title: "Ingenio Webs | Diseño Web & Desarrollo de Software",
    description:
      "Transformamos ideas en plataformas digitales, sistemas a medida y aplicaciones web de alto impacto.",
    url: SITE_URL,
    siteName: "Ingenio Webs",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/og-ingenio-webs.jpg",
        width: 1200,
        height: 630,
        alt: "Ingenio Webs — Diseño web y desarrollo de software",
      },
    ],
  },
  /* summary_large_image es la que muestra la imagen ancha; sin esto X
     usaba "summary", que la recorta a una miniatura cuadrada. */
  twitter: {
    card: "summary_large_image",
    title: "Ingenio Webs | Diseño Web & Desarrollo de Software",
    description:
      "Transformamos ideas en plataformas digitales, sistemas a medida y aplicaciones web de alto impacto.",
    images: ["/og-ingenio-webs.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2" },
      { url: "/favicon.png?v=2", type: "image/png", sizes: "256x256" },
      { url: "/favicon-32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png?v=2", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-icon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} site-root`}
      suppressHydrationWarning
    >
      <body className="site-body antialiased">
        <Script id="plat-dark-boot" strategy="beforeInteractive">
          {PLAT_DARK_BOOT}
        </Script>
        {/* Safari samples this to tint the bottom chrome; taller on iPad via CSS */}
        <div className="ios-safari-bottom-bleed" aria-hidden="true" />
        <LanguageProvider>
          <MotionProvider>
            {children}
            <CookieConsent />
          </MotionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
