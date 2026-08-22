"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Paperclip, Send, Smile, X } from "lucide-react";
import ChatEmojiPicker from "@/components/chat/ChatEmojiPicker";
import {
  CHAT_MAX_FILE_BYTES,
  CHAT_MAX_ORIGINAL_IMAGE_BYTES,
  isChatImageFile,
  prepareChatAttachment,
} from "@/lib/chat-compress-image";

export type ChatComposerAttachment = {
  file: File;
  previewUrl?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (payload: {
    body: string;
    attachment: File | null;
  }) => void | Promise<void>;
  placeholder: string;
  disabled?: boolean;
  variant?: "widget" | "platform";
  sendLabel?: string;
  emojiTitle?: string;
  attachTitle?: string;
  showSendLabel?: boolean;
  trailing?: ReactNode;
};

const COMPOSER_MAX_LINES = 4;

export default function ChatComposer({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  variant = "widget",
  sendLabel = "Enviar",
  emojiTitle = "Emojis",
  attachTitle = "Adjuntar archivo o imagen",
  showSendLabel = false,
}: Props) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachment, setAttachment] = useState<ChatComposerAttachment | null>(
    null,
  );
  const [preparing, setPreparing] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    return () => {
      if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    };
  }, [attachment]);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const hadFocus = document.activeElement === el;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    el.style.height = "auto";
    const styles = window.getComputedStyle(el);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
    const paddingY =
      Number.parseFloat(styles.paddingTop) +
      Number.parseFloat(styles.paddingBottom);
    const maxHeight = lineHeight * COMPOSER_MAX_LINES + paddingY;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    if (hadFocus) {
      el.focus({ preventScroll: true });
      try {
        el.setSelectionRange(start, end);
      } catch {
        /* ignore */
      }
    }
  }, [value]);

  function insertEmoji(emoji: string) {
    const input = textRef.current;
    if (!input) {
      onChange(`${value}${emoji}`);
      setEmojiOpen(false);
      return;
    }
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
    onChange(next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      input.focus();
      const caret = start + emoji.length;
      input.setSelectionRange(caret, caret);
    });
  }

  async function onFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setLocalError("");
    setPreparing(true);
    try {
      const isImage = isChatImageFile(file);
      if (isImage && file.size > CHAT_MAX_ORIGINAL_IMAGE_BYTES) {
        throw new Error("La imagen no puede superar 40 MB.");
      }
      if (!isImage && file.size > CHAT_MAX_FILE_BYTES) {
        throw new Error("El archivo no puede superar 25 MB.");
      }

      const prepared = await prepareChatAttachment(file);
      if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      const previewUrl = isChatImageFile(prepared)
        ? URL.createObjectURL(prepared)
        : undefined;
      setAttachment({ file: prepared, previewUrl });
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "No se pudo adjuntar el archivo.",
      );
      setAttachment(null);
    } finally {
      setPreparing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clearAttachment() {
    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
  }

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (disabled || preparing) return;
    const body = value.trim();
    if (!body && !attachment) return;
    setLocalError("");
    try {
      await onSubmit({
        body,
        attachment: attachment?.file ?? null,
      });
      clearAttachment();
      setEmojiOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo enviar.";
      setLocalError(
        /body exceeded|bodysizelimit/i.test(message)
          ? "El archivo es demasiado pesado para enviarlo. Probá con otra imagen o un archivo más liviano."
          : message,
      );
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    void handleSubmit();
  }

  const toolsDisabled = disabled || preparing;
  const canSend = Boolean(value.trim() || attachment) && !toolsDisabled;

  return (
    <form
      className={`chat-composer is-${variant}`}
      onSubmit={(event) => void handleSubmit(event)}
    >
      {attachment ? (
        <div className="chat-composer-preview">
          {attachment.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={attachment.previewUrl} alt="" />
          ) : (
            <span className="chat-composer-file-name">{attachment.file.name}</span>
          )}
          <button
            type="button"
            className="chat-composer-preview-clear"
            onClick={clearAttachment}
            aria-label="Quitar adjunto"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      {preparing ? (
        <p className="chat-composer-hint">Optimizando imagen…</p>
      ) : null}

      <div className="chat-composer-row">
        <div className="chat-composer-tools">
          <div className="chat-composer-emoji-wrap">
            <button
              type="button"
              className={`chat-composer-tool${emojiOpen ? " is-open" : ""}`}
              title={emojiTitle}
              aria-label={emojiTitle}
              aria-expanded={emojiOpen}
              disabled={toolsDisabled}
              onClick={() => setEmojiOpen((open) => !open)}
            >
              <Smile size={18} />
            </button>
            <ChatEmojiPicker
              open={emojiOpen}
              onClose={() => setEmojiOpen(false)}
              onPick={insertEmoji}
              variant={variant}
            />
          </div>

          <button
            type="button"
            className="chat-composer-tool"
            title={attachTitle}
            aria-label={attachTitle}
            disabled={toolsDisabled}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            className="sr-only"
            accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip"
            disabled={toolsDisabled}
            onChange={(event) => void onFileChange(event.target.files)}
          />
        </div>

        <textarea
          ref={textRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="chat-composer-input"
          disabled={preparing}
          rows={1}
          enterKeyHint="send"
        />

        <button
          type="submit"
          className="chat-composer-send"
          disabled={!canSend}
          aria-label={sendLabel}
        >
          <Send size={16} />
          {showSendLabel ? <span>{sendLabel}</span> : null}
        </button>
      </div>

      {localError ? <p className="chat-composer-error">{localError}</p> : null}
    </form>
  );
}
