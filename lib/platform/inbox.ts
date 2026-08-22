export type InboxTab = "chat" | "mensajes" | "formularios";

export const INBOX_TABS: { id: InboxTab; label: string }[] = [
  { id: "chat", label: "Webchat" },
  { id: "mensajes", label: "Mensajes" },
  { id: "formularios", label: "Formularios" },
];

export function isInboxTab(value: string | null | undefined): value is InboxTab {
  return value === "chat" || value === "mensajes" || value === "formularios";
}

export function inboxPath(tab: InboxTab = "chat", id?: string | null) {
  const params = new URLSearchParams({ tab });
  if (id) params.set("id", id);
  return `/plataforma/inbox?${params.toString()}`;
}
