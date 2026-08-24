"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  FileText,
  Heading2,
  ImageIcon,
  Italic,
  Link2,
  List,
  Paperclip,
  Quote,
  Type,
} from "lucide-react";
import PlatformConfirmDialog from "@/components/platform/PlatformConfirmDialog";

type SlashCommand = {
  id: string;
  label: string;
  hint: string;
  icon: typeof Type;
};

const COMMANDS: SlashCommand[] = [
  {
    id: "heading",
    label: "Título",
    hint: "Encabezado de sección",
    icon: Heading2,
  },
  {
    id: "text",
    label: "Texto",
    hint: "Párrafo normal",
    icon: Type,
  },
  {
    id: "bold",
    label: "Negrita",
    hint: "Texto en negrita",
    icon: Bold,
  },
  {
    id: "italic",
    label: "Cursiva",
    hint: "Texto en cursiva",
    icon: Italic,
  },
  {
    id: "link",
    label: "Link",
    hint: "URL + texto a mostrar",
    icon: Link2,
  },
  {
    id: "list",
    label: "Lista",
    hint: "Viñetas",
    icon: List,
  },
  {
    id: "quote",
    label: "Cita destacada",
    hint: "Bloque destacado",
    icon: Quote,
  },
  {
    id: "image",
    label: "Imagen",
    hint: "Adjuntar imagen",
    icon: ImageIcon,
  },
  {
    id: "file",
    label: "Archivo",
    hint: "PDF u otro · texto a medida",
    icon: Paperclip,
  },
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Markdown subset → HTML for TipTap initial content. */
export function markdownToHtml(markdown: string) {
  if (!markdown.trim()) return "<p></p>";

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;
  let inList = false;

  const inline = (text: string) => {
    let out = escapeHtml(text);
    out = out.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (_m, alt, src) =>
        `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`,
    );
    out = out.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_m, label, href) =>
        `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`,
    );
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return out;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      i += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h2>${inline(line.slice(3))}</h2>`);
      i += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h1>${inline(line.slice(2))}</h1>`);
      i += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`);
      i += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li><p>${inline(line.slice(2))}</p></li>`);
      i += 1;
      continue;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    const imageOnly = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageOnly) {
      html.push(
        `<p><img src="${escapeHtml(imageOnly[2])}" alt="${escapeHtml(imageOnly[1])}" /></p>`,
      );
      i += 1;
      continue;
    }

    html.push(`<p>${inline(line)}</p>`);
    i += 1;
  }

  if (inList) html.push("</ul>");
  return html.join("") || "<p></p>";
}

function serializeInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }
  if (!(node instanceof HTMLElement)) return "";

  const tag = node.tagName.toLowerCase();
  if (tag === "br") return "\n";
  if (tag === "strong" || tag === "b") {
    return `**${Array.from(node.childNodes).map(serializeInline).join("")}**`;
  }
  if (tag === "em" || tag === "i") {
    return `*${Array.from(node.childNodes).map(serializeInline).join("")}*`;
  }
  if (tag === "a") {
    const href = node.getAttribute("href") || "";
    const label =
      Array.from(node.childNodes).map(serializeInline).join("") || href;
    return `[${label}](${href})`;
  }
  if (tag === "img") {
    const src = node.getAttribute("src") || "";
    const alt = node.getAttribute("alt") || "";
    return `![${alt}](${src})`;
  }
  return Array.from(node.childNodes).map(serializeInline).join("");
}

/** TipTap HTML → markdown subset for publish/save. */
export function htmlToMarkdown(html: string) {
  if (typeof window === "undefined") return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks: string[] = [];

  const pushBlock = (value: string) => {
    const trimmed = value.replace(/\n+$/g, "");
    if (trimmed.trim()) blocks.push(trimmed);
  };

  Array.from(doc.body.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || "").trim();
      if (text) pushBlock(text);
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const tag = node.tagName.toLowerCase();

    if (tag === "h1") {
      pushBlock(`# ${serializeInline(node)}`);
      return;
    }
    if (tag === "h2" || tag === "h3") {
      pushBlock(`## ${serializeInline(node)}`);
      return;
    }
    if (tag === "blockquote") {
      const text = serializeInline(node).trim();
      pushBlock(
        text
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n"),
      );
      return;
    }
    if (tag === "ul") {
      const items = Array.from(node.querySelectorAll(":scope > li")).map(
        (li) => `- ${serializeInline(li).trim()}`,
      );
      pushBlock(items.join("\n"));
      return;
    }
    if (tag === "ol") {
      const items = Array.from(node.querySelectorAll(":scope > li")).map(
        (li, index) => `${index + 1}. ${serializeInline(li).trim()}`,
      );
      pushBlock(items.join("\n"));
      return;
    }
    if (tag === "p") {
      pushBlock(serializeInline(node));
      return;
    }
    if (tag === "img") {
      const src = node.getAttribute("src") || "";
      const alt = node.getAttribute("alt") || "";
      pushBlock(`![${alt}](${src})`);
      return;
    }
    pushBlock(serializeInline(node));
  });

  return blocks.join("\n\n");
}

function getSlashQuery(editor: Editor) {
  const { from } = editor.state.selection;
  const textBefore = editor.state.doc.textBetween(
    Math.max(0, from - 80),
    from,
    "\n",
  );
  // Match the last `/query` before the cursor (even mid-line).
  const match = textBefore.match(/\/([^\n/]*)$/);
  if (!match) return null;
  const query = match[1] ?? "";
  const deleteFrom = from - query.length - 1;
  return { query, deleteFrom, deleteTo: from };
}

export default function BlogSlashEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingKindRef = useRef<"image" | "file" | null>(null);
  const applyingExternalRef = useRef(false);
  const menuRef = useRef<{ query: string; index: number } | null>(null);
  const filteredRef = useRef<SlashCommand[]>([]);
  const runCommandRef = useRef<(id: string) => void>(() => {});

  const [menu, setMenu] = useState<{
    query: string;
    index: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [linkDraft, setLinkDraft] = useState<{
    href: string;
    label: string;
    replaceFrom: number | null;
    replaceTo: number | null;
  } | null>(null);
  const [fileDraft, setFileDraft] = useState<{
    url: string;
    label: string;
    fileName: string;
  } | null>(null);
  const [draftError, setDraftError] = useState("");

  const filtered = useMemo(() => {
    if (!menu) return [];
    const q = menu.query.toLowerCase();
    return COMMANDS.filter(
      (command) =>
        command.label.toLowerCase().includes(q) ||
        command.id.includes(q) ||
        command.hint.toLowerCase().includes(q),
    );
  }, [menu]);

  menuRef.current = menu;
  filteredRef.current = filtered;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({
        HTMLAttributes: { class: "plat-blog-editor-image" },
      }),
      Placeholder.configure({
        placeholder:
          placeholder ||
          "Empezá a escribir… Usá / para título, negrita, link, imagen…",
      }),
    ],
    content: markdownToHtml(value),
    editorProps: {
      attributes: {
        class: "plat-blog-editor-prose",
      },
      handleKeyDown: (_view, event) => {
        const currentMenu = menuRef.current;
        const currentFiltered = filteredRef.current;
        if (!currentMenu || currentFiltered.length === 0) return false;

        if (event.key === "ArrowDown") {
          event.preventDefault();
          setMenu((prev) =>
            prev
              ? {
                  ...prev,
                  index: (prev.index + 1) % currentFiltered.length,
                }
              : prev,
          );
          return true;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setMenu((prev) =>
            prev
              ? {
                  ...prev,
                  index:
                    (prev.index - 1 + currentFiltered.length) %
                    currentFiltered.length,
                }
              : prev,
          );
          return true;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          event.preventDefault();
          const command =
            currentFiltered[currentMenu.index] ?? currentFiltered[0];
          if (command) runCommandRef.current(command.id);
          return true;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setMenu(null);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: current }) => {
      if (applyingExternalRef.current) return;
      onChange(htmlToMarkdown(current.getHTML()));

      const slash = getSlashQuery(current);
      if (slash) {
        setMenu({ query: slash.query, index: 0 });
      } else {
        setMenu(null);
      }
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentMd = htmlToMarkdown(editor.getHTML());
    if (currentMd.trim() === value.trim()) return;
    applyingExternalRef.current = true;
    editor.commands.setContent(markdownToHtml(value), { emitUpdate: false });
    applyingExternalRef.current = false;
  }, [editor, value]);

  const deleteSlashQuery = useCallback(() => {
    if (!editor) return;
    const slash = getSlashQuery(editor);
    if (!slash) return;
    editor
      .chain()
      .focus()
      .deleteRange({ from: slash.deleteFrom, to: slash.deleteTo })
      .run();
    setMenu(null);
  }, [editor]);

  const runCommand = useCallback(
    (commandId: string) => {
      if (!editor) return;
      deleteSlashQuery();

      if (commandId === "heading") {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        return;
      }
      if (commandId === "text") {
        editor.chain().focus().setParagraph().run();
        return;
      }
      if (commandId === "bold") {
        if (editor.state.selection.empty) {
          editor
            .chain()
            .focus()
            .insertContent("<strong>texto</strong>")
            .run();
          const { from } = editor.state.selection;
          editor.commands.setTextSelection({ from: from - 5, to: from });
        } else {
          editor.chain().focus().toggleBold().run();
        }
        return;
      }
      if (commandId === "italic") {
        if (editor.state.selection.empty) {
          editor.chain().focus().insertContent("<em>texto</em>").run();
          const { from } = editor.state.selection;
          editor.commands.setTextSelection({ from: from - 5, to: from });
        } else {
          editor.chain().focus().toggleItalic().run();
        }
        return;
      }
      if (commandId === "link") {
        const { from, to, empty } = editor.state.selection;
        const selected = empty
          ? ""
          : editor.state.doc.textBetween(from, to, " ");
        setLinkDraft({
          href: "https://",
          label: selected.trim(),
          replaceFrom: empty ? null : from,
          replaceTo: empty ? null : to,
        });
        setDraftError("");
        return;
      }
      if (commandId === "list") {
        editor.chain().focus().toggleBulletList().run();
        return;
      }
      if (commandId === "quote") {
        editor.chain().focus().toggleBlockquote().run();
        return;
      }
      if (commandId === "image" || commandId === "file") {
        pendingKindRef.current = commandId;
        fileRef.current?.click();
      }
    },
    [deleteSlashQuery, editor],
  );

  runCommandRef.current = runCommand;

  function confirmLink() {
    if (!editor || !linkDraft) return;
    const href = linkDraft.href.trim();
    const label = linkDraft.label.trim();
    if (!href || !label) {
      setDraftError(
        !href
          ? "Ingresá la URL del enlace."
          : "Ingresá el texto que se va a mostrar.",
      );
      return;
    }
    setDraftError("");

    const safeHref = escapeHtml(href);
    const safeLabel = escapeHtml(label);

    if (
      linkDraft.replaceFrom != null &&
      linkDraft.replaceTo != null &&
      linkDraft.replaceTo > linkDraft.replaceFrom
    ) {
      editor
        .chain()
        .focus()
        .deleteRange({
          from: linkDraft.replaceFrom,
          to: linkDraft.replaceTo,
        })
        .insertContent(`<a href="${safeHref}">${safeLabel}</a>`)
        .run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${safeHref}">${safeLabel}</a>`)
        .run();
    }
    setLinkDraft(null);
  }

  function confirmFile() {
    if (!editor || !fileDraft) return;
    const label = fileDraft.label.trim();
    if (!label) {
      setDraftError("Ingresá el texto que se va a mostrar.");
      return;
    }
    setDraftError("");
    editor
      .chain()
      .focus()
      .insertContent(
        `<p><a href="${escapeHtml(fileDraft.url)}">${escapeHtml(label)}</a></p>`,
      )
      .run();
    setFileDraft(null);
  }

  async function onFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const kind = pendingKindRef.current;
    pendingKindRef.current = null;
    if (!file || !kind || !editor) return;

    setUploadError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/plataforma/blog/upload", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as {
        ok?: boolean;
        url?: string;
        name?: string;
        error?: string;
      };
      if (!response.ok || !data.url) {
        setUploadError(data.error || "No se pudo subir el archivo.");
        return;
      }

      if (kind === "image") {
        editor
          .chain()
          .focus()
          .setImage({ src: data.url, alt: file.name })
          .run();
      } else {
        const fileName = data.name || file.name;
        setFileDraft({
          url: data.url,
          label: "",
          fileName,
        });
        setDraftError("");
      }
    } catch {
      setUploadError("Error de red al subir el archivo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="plat-blog-editor">
      <div className="plat-blog-editor-hint">
        Escribí <kbd>/</kbd> para insertar título, texto, negrita, link, imagen o
        archivo.
        {uploading ? <span> Subiendo…</span> : null}
      </div>
      <div className="plat-blog-editor-shell">
        <EditorContent editor={editor} />
        {menu && filtered.length > 0 ? (
          <div className="plat-blog-slash" role="listbox">
            {filtered.map((command, index) => {
              const Icon = command.icon;
              return (
                <button
                  key={command.id}
                  type="button"
                  role="option"
                  aria-selected={index === menu.index}
                  className={`plat-blog-slash-item${index === menu.index ? " is-active" : ""}`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    runCommand(command.id);
                  }}
                >
                  <span className="plat-blog-slash-icon">
                    <Icon size={15} />
                  </span>
                  <span className="plat-blog-slash-copy">
                    <strong>{command.label}</strong>
                    <span>{command.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {uploadError ? <p className="plat-error">{uploadError}</p> : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf,application/pdf"
        hidden
        onChange={onFilePicked}
      />
      <p className="plat-blog-editor-tools" aria-hidden>
        <FileText size={12} /> Formato visual · se guarda compatible con el blog
      </p>

      <PlatformConfirmDialog
        open={Boolean(linkDraft)}
        title="Insertar enlace"
        description="Elegí la URL y el texto que se va a mostrar en el artículo."
        confirmLabel="Insertar"
        cancelLabel="Cancelar"
        tone="primary"
        onCancel={() => {
          setLinkDraft(null);
          setDraftError("");
        }}
        onConfirm={confirmLink}
      >
        <label className="plat-field">
          URL
          <input
            type="url"
            value={linkDraft?.href ?? ""}
            onChange={(event) =>
              setLinkDraft((current) =>
                current ? { ...current, href: event.target.value } : current,
              )
            }
            placeholder="https://"
            autoComplete="off"
          />
        </label>
        <label className="plat-field">
          Texto a mostrar
          <input
            type="text"
            value={linkDraft?.label ?? ""}
            onChange={(event) =>
              setLinkDraft((current) =>
                current ? { ...current, label: event.target.value } : current,
              )
            }
            placeholder="Ej: Visitá nuestra web"
            autoComplete="off"
          />
        </label>
        <p className="plat-modal-hint">
          Ese texto es lo que lee el visitante; la URL queda detrás.
        </p>
        {draftError && linkDraft ? (
          <p className="plat-error">{draftError}</p>
        ) : null}
      </PlatformConfirmDialog>

      <PlatformConfirmDialog
        open={Boolean(fileDraft)}
        title="Texto del archivo"
        description="El archivo ya se subió. Elegí cómo se muestra el enlace en el blog."
        confirmLabel="Insertar"
        cancelLabel="Cancelar"
        tone="primary"
        onCancel={() => {
          setFileDraft(null);
          setDraftError("");
        }}
        onConfirm={confirmFile}
      >
        <label className="plat-field">
          Texto a mostrar
          <input
            type="text"
            value={fileDraft?.label ?? ""}
            onChange={(event) =>
              setFileDraft((current) =>
                current ? { ...current, label: event.target.value } : current,
              )
            }
            placeholder="Ej: Descargá el PDF aquí"
            autoComplete="off"
          />
        </label>
        <p className="plat-modal-hint">
          Archivo: {fileDraft?.fileName || "—"}
        </p>
        {draftError && fileDraft ? (
          <p className="plat-error">{draftError}</p>
        ) : null}
      </PlatformConfirmDialog>
    </div>
  );
}
