import fs from "fs";
import path from "path";
import { createId } from "./id";
import type { LiveChatAttachment } from "./types";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
]);

const ALLOWED_IMAGES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type UploadLike = {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export function asUploadFile(value: unknown): UploadLike | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as {
    name?: unknown;
    type?: unknown;
    size?: unknown;
    arrayBuffer?: unknown;
  };
  if (typeof candidate.arrayBuffer !== "function") return null;
  if (typeof candidate.size !== "number" || !(candidate.size > 0)) return null;
  return {
    name:
      typeof candidate.name === "string" && candidate.name.trim()
        ? candidate.name.trim()
        : "archivo",
    type: typeof candidate.type === "string" ? candidate.type : "",
    size: candidate.size,
    arrayBuffer: () =>
      (candidate.arrayBuffer as () => Promise<ArrayBuffer>)(),
  };
}

function mimeFromName(name: string) {
  const ext = path.extname(name).replace(".", "").toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "pdf":
      return "application/pdf";
    case "txt":
      return "text/plain";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xls":
      return "application/vnd.ms-excel";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "zip":
      return "application/zip";
    default:
      return "application/octet-stream";
  }
}

function extensionFor(file: UploadLike, mime: string) {
  const fromName = path.extname(file.name).replace(".", "").toLowerCase();
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) return fromName;
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "application/pdf") return "pdf";
  if (mime === "text/plain") return "txt";
  return "bin";
}

export async function saveLiveChatAttachment(
  file: UploadLike,
  sessionId: string,
): Promise<{ ok: true; attachment: LiveChatAttachment } | { ok: false; error: string }> {
  if (!file || file.size <= 0) {
    return { ok: false, error: "Seleccioná un archivo válido." };
  }

  const mime = file.type || mimeFromName(file.name);
  const isImage = mime.startsWith("image/");

  if (isImage && !ALLOWED_IMAGES.has(mime)) {
    return { ok: false, error: "Imagen no permitida. Usá JPG, PNG, WEBP o GIF." };
  }
  if (!isImage && !ALLOWED_MIME.has(mime)) {
    return {
      ok: false,
      error: "Formato no permitido. Usá imagen, PDF, Word, Excel, TXT o ZIP.",
    };
  }

  const max = isImage ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  if (file.size > max) {
    return {
      ok: false,
      error: isImage
        ? "La imagen quedó demasiado pesada para enviarla."
        : "El archivo no puede superar 25 MB.",
    };
  }

  const safeSession = sessionId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  if (!safeSession) return { ok: false, error: "Conversación inválida." };

  const dir = path.join(
    process.cwd(),
    "public",
    "platform",
    "live-chat",
    safeSession,
  );
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const id = createId("lca");
  const ext = extensionFor(file, mime);
  const filename = `${id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(dir, filename), buffer);

  return {
    ok: true,
    attachment: {
      url: `/platform/live-chat/${safeSession}/${filename}`,
      name: file.name.slice(0, 120) || filename,
      mimeType: mime,
      size: file.size,
      kind: isImage ? "image" : "file",
    },
  };
}
