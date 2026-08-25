import type { Metadata } from "next";
import LegalDocument from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Privacidad | Ingenio Webs",
  description: "Política de privacidad de Ingenio Webs.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacyPage() {
  return <LegalDocument kind="privacy" />;
}
