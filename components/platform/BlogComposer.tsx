"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  ChevronDown,
  Eye,
  ImagePlus,
  Pencil,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import BlogSlashEditor from "@/components/platform/BlogSlashEditor";
import PlatformConfirmDialog from "@/components/platform/PlatformConfirmDialog";
import PlatformSectionHero from "@/components/platform/PlatformSectionHero";
import {
  deleteBlogPostAction,
  saveBlogPostAction,
} from "@/lib/platform/actions";
import { BLOG_TOPICS, resolveTopicId } from "@/lib/blog-topics";
import { formatBlogArticleDate } from "@/lib/blog-types";
import type { PlatformBlogDraft } from "@/lib/platform/types";

const TOPIC_LABELS: Record<string, string> = {
  diseno: "Diseño",
  desarrollo: "Desarrollo",
  proyectos: "Proyectos",
  negocios: "Negocios",
  novedades: "Novedades",
};

const TOPIC_OPTIONS = BLOG_TOPICS.map((topic) => ({
  id: topic.id,
  label: TOPIC_LABELS[topic.id] ?? topic.id,
  cover: topic.cover,
  accent: topic.accent,
}));

function topicLabel(category: string) {
  const id = resolveTopicId(category);
  return TOPIC_LABELS[id] ?? category;
}

function topicOptionByLabel(label: string) {
  return (
    TOPIC_OPTIONS.find((entry) => entry.label === label) ||
    TOPIC_OPTIONS.find((entry) => entry.id === resolveTopicId(label)) ||
    TOPIC_OPTIONS[TOPIC_OPTIONS.length - 1]
  );
}

export default function BlogComposer({
  posts,
}: {
  posts: PlatformBlogDraft[];
}) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const topicMenuRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState("Novedades");
  const [topicOpen, setTopicOpen] = useState(false);
  const [tab, setTab] = useState<"constructor" | "publicaciones">(
    "constructor",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverDragging, setCoverDragging] = useState(false);
  const [pending, startTransition] = useTransition();

  const topicMeta = useMemo(() => topicOptionByLabel(category), [category]);
  const coverSrc = cover.trim();
  const coverIsRemote = /^https?:\/\//i.test(coverSrc);
  const previewDate = useMemo(
    () => formatBlogArticleDate(new Date().toISOString(), "es"),
    [],
  );

  useEffect(() => {
    if (!topicOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!topicMenuRef.current?.contains(event.target as Node)) {
        setTopicOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setTopicOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [topicOpen]);

  function resetForm() {
    setEditingId(null);
    setCategory("Novedades");
    setTopicOpen(false);
    setTitle("");
    setDescription("");
    setCover("");
    setContent("");
    setError("");
    setSuccess("");
  }

  function loadPost(post: PlatformBlogDraft) {
    const label = topicLabel(post.category);
    setEditingId(post.id);
    setCategory(label);
    setTitle(post.title);
    setDescription(post.description || "");
    setCover(post.cover || "");
    setContent(post.content || "");
    setError("");
    setSuccess(`Editando: ${post.title}`);
    setTab("constructor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadCover(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("La portada tiene que ser una imagen.");
      return;
    }
    setUploadingCover(true);
    setError("");
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
        error?: string;
      };
      if (!response.ok || !data.url) {
        setError(data.error || "No se pudo subir la portada.");
        return;
      }
      setCover(data.url);
    } catch {
      setError("Error de red al subir la portada.");
    } finally {
      setUploadingCover(false);
    }
  }

  function save(publish: boolean) {
    const formData = new FormData();
    if (editingId) formData.set("id", editingId);
    formData.set("title", title);
    formData.set("description", description);
    formData.set("category", category);
    formData.set("cover", cover);
    formData.set("content", content);
    formData.set("publish", publish ? "1" : "0");

    startTransition(async () => {
      setError("");
      setSuccess("");
      const result = await saveBlogPostAction(formData);
      if (!result.ok) {
        setError(result.error || "No se pudo guardar.");
        return;
      }
      router.refresh();
      if (publish) {
        resetForm();
        setSuccess(result.message || "Publicado.");
        return;
      }
      if (result.id) setEditingId(result.id);
      setSuccess(result.message || "Listo.");
    });
  }

  return (
    <div className="plat-blog-hub">
      <PlatformSectionHero
        title="Blog"
        subtitle="Creá artículos y administrá lo publicado en la web."
        tabs={
          <div className="plat-tabs" role="tablist" aria-label="Blog">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "constructor"}
              className={`plat-tab${tab === "constructor" ? " is-active" : ""}`}
              onClick={() => setTab("constructor")}
            >
              Constructor
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "publicaciones"}
              className={`plat-tab${tab === "publicaciones" ? " is-active" : ""}`}
              onClick={() => setTab("publicaciones")}
            >
              Publicaciones
              <span className="plat-tab-count">
                {posts.length > 99 ? "99+" : posts.length}
              </span>
            </button>
          </div>
        }
      />

      {tab === "constructor" ? (
      <section className="plat-card plat-quote-panel plat-blog-composer">
        {editingId ? (
          <div className="plat-blog-composer-toolbar">
            <button
              type="button"
              className="plat-btn is-ghost"
              onClick={resetForm}
              disabled={pending}
            >
              Nuevo
            </button>
          </div>
        ) : null}

        <div className="plat-blog-canvas">
          <div className="plat-blog-topic-pick" ref={topicMenuRef}>
            <button
              type="button"
              className={`plat-blog-topic-chip is-menu${
                topicOpen ? " is-open" : ""
              }`}
              style={{ borderColor: topicMeta.accent }}
              aria-expanded={topicOpen}
              aria-haspopup="listbox"
              aria-label="Tópico"
              onClick={() => setTopicOpen((open) => !open)}
            >
              <span>{category}</span>
              <ChevronDown size={13} strokeWidth={2.5} />
            </button>
            {topicOpen ? (
              <div className="plat-menu-panel plat-blog-topic-menu" role="listbox">
                {TOPIC_OPTIONS.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    role="option"
                    aria-selected={category === topic.label}
                    className={`plat-menu-item${
                      category === topic.label ? " is-active" : ""
                    }`}
                    onClick={() => {
                      setCategory(topic.label);
                      setTopicOpen(false);
                    }}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <input
            className="plat-blog-title-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Título del artículo"
          />

          <input
            className="plat-blog-subtitle-input"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Subtítulo / descripción para la tarjeta y SEO"
          />

          <div className="plat-blog-cover">
            <button
              type="button"
              className={`plat-blog-cover-drop${coverSrc ? " has-image" : ""}${coverDragging ? " is-dragging" : ""}${uploadingCover ? " is-uploading" : ""}`}
              disabled={pending || uploadingCover}
              onClick={() => coverInputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setCoverDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setCoverDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const next = event.relatedTarget as Node | null;
                if (next && event.currentTarget.contains(next)) return;
                setCoverDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setCoverDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) void uploadCover(file);
              }}
              aria-label={
                coverSrc
                  ? "Cambiar portada"
                  : "Elegir o arrastrar portada"
              }
            >
              {coverSrc ? (
                coverIsRemote ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverSrc} alt="" />
                ) : (
                  <Image
                    src={coverSrc}
                    alt=""
                    fill
                    unoptimized
                    sizes="560px"
                    className="plat-blog-cover-img"
                  />
                )
              ) : null}
              <span className="plat-blog-cover-drop-overlay">
                <ImagePlus size={22} />
                <strong>
                  {uploadingCover
                    ? "Subiendo…"
                    : coverSrc
                      ? "Cambiar portada"
                      : "Arrastrá o hacé click"}
                </strong>
                {!uploadingCover ? (
                  <span>JPG, PNG, WEBP o GIF</span>
                ) : null}
              </span>
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void uploadCover(file);
              }}
            />
          </div>

          <div className="plat-blog-body-label">Contenido</div>
          <BlogSlashEditor value={content} onChange={setContent} />
        </div>

        {error ? <p className="plat-error">{error}</p> : null}
        {success ? <p className="plat-success">{success}</p> : null}

        <div className="plat-blog-actions">
          <button
            type="button"
            className="plat-btn is-ghost"
            disabled={pending || !title.trim() || !content.trim()}
            onClick={() => setPreviewOpen(true)}
          >
            <Eye size={15} />
            Vista previa
          </button>
          <button
            type="button"
            className="plat-btn is-ghost"
            disabled={pending || !title.trim() || !content.trim()}
            onClick={() => save(false)}
          >
            <Save size={15} />
            {pending ? "Guardando…" : "Guardar borrador"}
          </button>
          <button
            type="button"
            className="plat-btn"
            disabled={pending || !title.trim() || !content.trim()}
            onClick={() => save(true)}
          >
            <Send size={15} />
            {pending ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </section>
      ) : (
      <section className="plat-card plat-quote-panel plat-blog-list plat-quote-list">
        <div className="plat-quote-list-scroll">
          <table className="plat-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Tópico</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className={editingId === post.id ? "is-focused" : undefined}>
                  <td>
                    <strong>{post.title}</strong>
                  </td>
                  <td>{topicLabel(post.category)}</td>
                  <td>
                    <span
                      className={`plat-badge${
                        post.status === "published" ? " is-done" : " is-warn"
                      }`}
                    >
                      {post.status === "published" ? "Publicado" : "Borrador"}
                    </span>
                  </td>
                  <td>{new Date(post.updatedAt).toLocaleString("es-AR")}</td>
                  <td className="plat-quote-actions-cell">
                    <div className="plat-row-actions">
                      <button
                        type="button"
                        className="plat-btn is-ghost plat-icon-btn"
                        title="Editar"
                        disabled={pending}
                        onClick={() => loadPost(post)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="plat-btn is-danger plat-icon-btn"
                        title="Eliminar"
                        disabled={pending}
                        onClick={() => setDeleteId(post.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5}>Todavía no hay borradores ni publicaciones.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {previewOpen ? (
        <div
          className="plat-blog-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa del artículo"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="plat-blog-preview-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="plat-blog-preview-bar">
              <strong>Vista previa</strong>
              <button
                type="button"
                className="plat-btn is-ghost plat-icon-btn"
                onClick={() => setPreviewOpen(false)}
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <div className="plat-blog-preview-stage blog-journal-page">
              <article className="blog-article">
                <header className="blog-article-header">
                  <p className="blog-article-date">
                    <span>{previewDate.weekday}</span>
                    <span aria-hidden="true">·</span>
                    <span>{previewDate.fullDate}</span>
                    {previewDate.time ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{previewDate.time}</span>
                      </>
                    ) : null}
                  </p>
                  <p className="blog-article-category">{category}</p>
                  <h1 className="blog-article-title">
                    {title.trim() || "Sin título"}
                  </h1>
                  {description.trim() ? (
                    <p className="blog-article-lead">{description.trim()}</p>
                  ) : null}
                </header>

                {coverSrc ? (
                  <div className="blog-article-hero">
                    {coverIsRemote ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverSrc}
                        alt={title.trim() || "Portada"}
                        className="object-cover object-center"
                      />
                    ) : (
                      <Image
                        src={coverSrc}
                        alt={title.trim() || "Portada"}
                        fill
                        unoptimized
                        sizes="(max-width: 960px) 100vw, 860px"
                        className="object-cover object-center"
                      />
                    )}
                  </div>
                ) : null}

                <div className="blog-article-content">
                  <ReactMarkdown>
                    {content.trim() || "_Sin contenido_"}
                  </ReactMarkdown>
                </div>
              </article>
            </div>
          </div>
        </div>
      ) : null}

      <PlatformConfirmDialog
        open={Boolean(deleteId)}
        title="Eliminar artículo"
        description="Se borra de la plataforma y, si estaba publicado, también del blog público."
        confirmLabel="Eliminar"
        pending={pending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          const formData = new FormData();
          formData.set("id", deleteId);
          const wasEditing = editingId === deleteId;
          setDeleteId(null);
          startTransition(async () => {
            setError("");
            const result = await deleteBlogPostAction(formData);
            if (!result.ok) {
              setError(result.error || "No se pudo eliminar.");
              return;
            }
            router.refresh();
            if (wasEditing) resetForm();
            setSuccess(result.message || "Eliminado.");
          });
        }}
      />
    </div>
  );
}
