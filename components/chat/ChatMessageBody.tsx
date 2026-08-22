"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
} from "react";
import { Download, FileText, X } from "lucide-react";
import type { LiveChatMessage } from "@/lib/platform/types";

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.18;

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

async function downloadUrl(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("fetch failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename || "archivo";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "archivo";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

function clampOffset(
  x: number,
  y: number,
  zoom: number,
  stage: HTMLElement | null,
  image: HTMLImageElement | null,
) {
  if (!stage || !image || zoom <= MIN_ZOOM) return { x: 0, y: 0 };

  const stageW = stage.clientWidth;
  const stageH = stage.clientHeight;
  const baseW = image.offsetWidth;
  const baseH = image.offsetHeight;
  if (!stageW || !stageH || !baseW || !baseH) return { x: 0, y: 0 };

  const scaledW = baseW * zoom;
  const scaledH = baseH * zoom;
  const maxX = Math.max(0, (scaledW - stageW) / 2);
  const maxY = Math.max(0, (scaledH - stageH) / 2);

  return {
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
  };
}

export default function ChatMessageBody({
  message,
  className = "",
}: {
  message: LiveChatMessage;
  className?: string;
}) {
  const attachment = message.attachment;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    if (!previewOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closePreview();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  useEffect(() => {
    if (!previewOpen) return;
    setOffset((current) =>
      clampOffset(
        current.x,
        current.y,
        zoom,
        stageRef.current,
        imageRef.current,
      ),
    );
  }, [zoom, previewOpen]);

  function closePreview() {
    setPreviewOpen(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setDragging(false);
    dragRef.current = null;
  }

  function openPreview() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setPreviewOpen(true);
  }

  function onPreviewWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    setZoom((current) => {
      const next = current + direction * ZOOM_STEP;
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(next.toFixed(2))));
    });
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || zoom <= MIN_ZOOM) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    setDragging(true);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || zoom <= MIN_ZOOM) return;
    setOffset(
      clampOffset(
        drag.originX + (event.clientX - drag.startX),
        drag.originY + (event.clientY - drag.startY),
        zoom,
        stageRef.current,
        imageRef.current,
      ),
    );
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
  }

  async function handleDownload() {
    if (!attachment) return;
    setDownloading(true);
    try {
      await downloadUrl(attachment.url, attachment.name);
    } finally {
      setDownloading(false);
    }
  }

  const canPan = zoom > MIN_ZOOM;

  return (
    <div className={`chat-message-body ${className}`.trim()}>
      {message.body ? <p>{message.body}</p> : null}
      {attachment ? (
        attachment.kind === "image" ? (
          <>
            <button
              type="button"
              className="chat-message-image"
              title="Ver imagen"
              onClick={openPreview}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={attachment.url} alt={attachment.name} />
            </button>

            {previewOpen ? (
              <div
                className="chat-image-lightbox"
                role="dialog"
                aria-modal="true"
                aria-label={attachment.name}
              >
                <button
                  type="button"
                  className="chat-image-lightbox-backdrop"
                  aria-label="Cerrar"
                  onClick={closePreview}
                />
                <div className="chat-image-lightbox-panel">
                  <div className="chat-image-lightbox-bar">
                    <span className="chat-image-lightbox-name">
                      {attachment.name}
                      <small>
                        {" "}
                        · scroll zoom
                        {canPan ? " · arrastrá para navegar" : ""} ·{" "}
                        {Math.round(zoom * 100)}%
                      </small>
                    </span>
                    <div className="chat-image-lightbox-actions">
                      <button
                        type="button"
                        className="chat-image-lightbox-btn"
                        disabled={downloading}
                        onClick={() => void handleDownload()}
                      >
                        <Download size={16} />
                        Descargar
                      </button>
                      <button
                        type="button"
                        className="chat-image-lightbox-btn is-ghost"
                        aria-label="Cerrar"
                        onClick={closePreview}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div
                    ref={stageRef}
                    className={`chat-image-lightbox-stage${canPan ? " can-pan" : ""}${dragging ? " is-dragging" : ""}`}
                    onWheel={onPreviewWheel}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imageRef}
                      src={attachment.url}
                      alt={attachment.name}
                      className="chat-image-lightbox-img"
                      style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                      }}
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            className="chat-message-file"
            onClick={() => void handleDownload()}
            disabled={downloading}
            title="Descargar archivo"
          >
            <FileText size={16} />
            <span>
              <strong>{attachment.name}</strong>
              <small>
                {formatBytes(attachment.size)}
                {downloading ? " · Descargando…" : " · Descargar"}
              </small>
            </span>
            <Download size={15} />
          </button>
        )
      ) : null}
    </div>
  );
}
