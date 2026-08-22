import type { Metadata } from "next";
import "./plataforma.css";
import "./plataforma-dark.css";

export const metadata: Metadata = {
  title: "Plataforma | Ingenio Webs",
  robots: { index: false, follow: false },
};

export default function PlataformaRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
