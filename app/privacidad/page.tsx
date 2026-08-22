import type { Metadata } from "next";
import LegalDocument from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Privacidad | Ingenio Webs",
  description: "Política de privacidad de Ingenio Webs.",
};

export default function PrivacyPage() {
  return <LegalDocument kind="privacy" />;
}
