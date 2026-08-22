/** Max side length for chat images after client compression. */
const MAX_EDGE = 1920;
/** Soft target size after compression. */
const TARGET_BYTES = 1.8 * 1024 * 1024;
/** Absolute max for an original image before we refuse. */
export const CHAT_MAX_ORIGINAL_IMAGE_BYTES = 40 * 1024 * 1024;
/** Absolute max for non-image files. */
export const CHAT_MAX_FILE_BYTES = 25 * 1024 * 1024;

function isImageFile(file: File) {
  return (
    file.type.startsWith("image/") ||
    /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name)
  );
}

function loadImageBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Compresses / resizes chat images so prints and heavy photos upload reliably.
 * Animated GIFs are left untouched (within the original size cap).
 */
export async function prepareChatAttachment(file: File): Promise<File> {
  if (!isImageFile(file)) {
    if (file.size > CHAT_MAX_FILE_BYTES) {
      throw new Error("El archivo no puede superar 25 MB.");
    }
    return file;
  }

  if (file.size > CHAT_MAX_ORIGINAL_IMAGE_BYTES) {
    throw new Error("La imagen no puede superar 40 MB.");
  }

  // Keep animated GIFs as-is if they fit a softer cap.
  if (file.type === "image/gif" || /\.gif$/i.test(file.name)) {
    if (file.size > 12 * 1024 * 1024) {
      throw new Error("El GIF no puede superar 12 MB.");
    }
    return file;
  }

  // Already small enough — no work.
  if (file.size <= TARGET_BYTES && file.type === "image/jpeg") {
    return file;
  }

  const source = await loadImageBitmap(file);
  const width = "width" in source ? source.width : 0;
  const height = "height" in source ? source.height : 0;
  if (!width || !height) {
    throw new Error("No se pudo leer la imagen.");
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);
  if ("close" in source && typeof source.close === "function") {
    source.close();
  }

  let quality = 0.86;
  let blob: Blob | null = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (!blob) break;
    if (blob.size <= TARGET_BYTES || quality <= 0.5) break;
    quality -= 0.08;
  }

  if (!blob) {
    // Fallback: send original if still under hard cap.
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export function isChatImageFile(file: File) {
  return isImageFile(file);
}
