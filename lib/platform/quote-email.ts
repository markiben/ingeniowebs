export function buildQuoteEmailBody(input: {
  clientName: string;
  code: string;
  projectTitle: string;
  totalLabel: string;
  pdfFileName: string;
}) {
  const name = input.clientName.trim() || "hola";
  return [
    `Hola, ${name}`,
    "",
    `Gracias por confiar en nosotros para este proyecto. Armamos la cotización ${input.code} pensando en lo que necesitás para “${input.projectTitle}”.`,
    "",
    `Inversión propuesta: ${input.totalLabel}`,
    "",
    "Te dejamos el PDF con el desglose. Revisalo con calma y, cuando quieras, charlamos cualquier detalle juntos.",
    "",
    "Un abrazo,",
  ].join("\n");
}

export function toQuoteGmailUrl(input: {
  email: string;
  clientName: string;
  code: string;
  projectTitle: string;
  totalLabel: string;
  pdfFileName: string;
}) {
  const value = input.email.trim();
  if (!value) return null;

  const params = new URLSearchParams({
    fs: "1",
    tf: "cm",
    to: value,
    su: `[ Ingenio Webs ] Cotización ${input.code}`,
  });

  return {
    url: `https://mail.google.com/mail/u/0/?${params.toString()}`,
    body: buildQuoteEmailBody(input),
  };
}
