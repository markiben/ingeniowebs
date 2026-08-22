"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FormsCenter from "@/components/platform/FormsCenter";
import LiveChatCenter from "@/components/platform/LiveChatCenter";
import MessageCenter from "@/components/platform/MessageCenter";
import PlatformSectionHero from "@/components/platform/PlatformSectionHero";
import {
  INBOX_TABS,
  inboxPath,
  isInboxTab,
  type InboxTab,
} from "@/lib/platform/inbox";
import { isLiveChatUnreadForAdmin } from "@/lib/platform/live-chat-utils";
import type {
  LiveChatSession,
  PlatformLead,
  PlatformMessage,
} from "@/lib/platform/types";

export default function InboxCenter({
  messages,
  liveChats,
  leads,
  liveChatBotMode = false,
  operator,
}: {
  messages: PlatformMessage[];
  liveChats: LiveChatSession[];
  leads: PlatformLead[];
  liveChatBotMode?: boolean;
  operator: { name: string; avatarUrl?: string | null };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: InboxTab = isInboxTab(tabParam) ? tabParam : "chat";

  const counts = useMemo(
    () => ({
      mensajes: messages.filter((message) => !message.read).length,
      chat: liveChats.filter(
        (chat) => chat.status !== "closed" && isLiveChatUnreadForAdmin(chat),
      ).length,
      formularios: leads.filter((lead) => !lead.read).length,
    }),
    [messages, liveChats, leads],
  );

  function selectTab(next: InboxTab) {
    if (next === tab) return;
    router.replace(inboxPath(next), { scroll: false });
  }

  return (
    <div className="plat-inbox-hub">
      <PlatformSectionHero
        title="Inbox"
        subtitle="Webchat, mensajes y formularios en un solo lugar."
        tabs={
          <div
            className="plat-tabs"
            role="tablist"
            aria-label="Inbox"
          >
            {INBOX_TABS.map((item) => {
              const count = counts[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  className={`plat-tab${tab === item.id ? " is-active" : ""}`}
                  onClick={() => selectTab(item.id)}
                >
                  {item.label}
                  <span className="plat-tab-count">
                    {count > 99 ? "99+" : count}
                  </span>
                </button>
              );
            })}
          </div>
        }
      />

      {tab === "chat" ? (
        <LiveChatCenter
          chats={liveChats}
          botMode={liveChatBotMode}
          operator={operator}
        />
      ) : null}
      {tab === "mensajes" ? <MessageCenter messages={messages} /> : null}
      {tab === "formularios" ? <FormsCenter leads={leads} /> : null}
    </div>
  );
}
