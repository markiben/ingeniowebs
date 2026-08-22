"use client";

import { useEffect, useRef, useState } from "react";
import { CHAT_EMOJI_CATEGORIES } from "@/lib/chat-emojis";

export default function ChatEmojiPicker({
  open,
  onClose,
  onPick,
  variant = "widget",
}: {
  open: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
  variant?: "widget" | "platform";
}) {
  const [categoryId, setCategoryId] = useState(CHAT_EMOJI_CATEGORIES[0]?.id ?? "");
  const rootRef = useRef<HTMLDivElement>(null);
  const active =
    CHAT_EMOJI_CATEGORIES.find((category) => category.id === categoryId) ??
    CHAT_EMOJI_CATEGORIES[0];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !active) return null;

  return (
    <div
      ref={rootRef}
      className={`chat-emoji-picker is-${variant}`}
      role="dialog"
      aria-label="Emojis"
    >
      <div className="chat-emoji-cats" role="tablist">
        {CHAT_EMOJI_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={category.id === active.id}
            className={`chat-emoji-cat${category.id === active.id ? " is-active" : ""}`}
            onClick={() => setCategoryId(category.id)}
            title={category.label}
          >
            {category.emojis[0]}
          </button>
        ))}
      </div>
      <div className="chat-emoji-label">{active.label}</div>
      <div className="chat-emoji-grid">
        {active.emojis.map((emoji) => (
          <button
            key={`${active.id}-${emoji}`}
            type="button"
            className="chat-emoji-btn"
            onClick={() => onPick(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
