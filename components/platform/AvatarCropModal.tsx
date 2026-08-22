"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { X, ZoomIn } from "lucide-react";

async function cropToBlob(
  imageSrc: string,
  crop: Area,
  mime = "image/jpeg",
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const size = Math.max(1, Math.round(Math.min(crop.width, crop.height)));
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas.");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size,
    size,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo recortar la imagen."));
          return;
        }
        resolve(blob);
      },
      mime,
      0.92,
    );
  });
}

export default function AvatarCropModal({
  imageSrc,
  open,
  pending = false,
  onCancel,
  onConfirm,
}: {
  imageSrc: string;
  open: boolean;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  if (!open) return null;

  return (
    <div className="plat-modal-root plat-avatar-crop-root" role="presentation">
      <button
        type="button"
        className="plat-modal-backdrop"
        aria-label="Cerrar"
        onClick={onCancel}
      />
      <div
        className="plat-modal plat-avatar-crop-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Ajustar foto de perfil"
      >
        <div className="plat-avatar-crop-top">
          <h3>Ajustar foto</h3>
          <button
            type="button"
            className="plat-notify-center-icon"
            aria-label="Cerrar"
            onClick={onCancel}
          >
            <X size={16} />
          </button>
        </div>

        <div className="plat-avatar-crop-stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <label className="plat-avatar-crop-zoom">
          <ZoomIn size={15} aria-hidden />
          <span>Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>

        <div className="plat-avatar-crop-actions">
          <button
            type="button"
            className="plat-profile-card-btn"
            onClick={onCancel}
            disabled={pending || busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="plat-btn"
            disabled={pending || busy || !croppedArea}
            onClick={() => {
              if (!croppedArea) return;
              setBusy(true);
              void cropToBlob(imageSrc, croppedArea)
                .then((blob) => {
                  onConfirm(
                    new File([blob], "avatar.jpg", { type: "image/jpeg" }),
                  );
                })
                .catch(() => {
                  setBusy(false);
                });
            }}
          >
            {busy || pending ? "Guardando..." : "Usar foto"}
          </button>
        </div>
      </div>
    </div>
  );
}
