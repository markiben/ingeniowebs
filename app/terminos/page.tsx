import type { Metadata } from "next";
import LegalDocument from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Términos | Ingenio Webs",
  description: "Términos de uso de Ingenio Webs.",
  alternates: { canonical: "/terminos" },
};

export default function TermsPage() {
  return <LegalDocument kind="terms" />;
}
