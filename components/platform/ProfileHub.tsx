"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import {
  Lock,
  Mail,
  Pencil,
  Shield,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import AvatarCropModal from "@/components/platform/AvatarCropModal";
import PasswordField from "@/components/platform/PasswordField";
import PlatformConfirmDialog from "@/components/platform/PlatformConfirmDialog";
import {
  changePasswordAction,
  deleteAccountAction,
  updateProfileAction,
} from "@/lib/platform/actions";
import {
  PROFILE_COUNTRIES,
  countryLabel,
} from "@/lib/platform/profile-fields";

export type ProfileHubValues = {
  name: string;
  country?: string;
  phone: string;
  company: string;
  email: string;
  avatarUrl?: string | null;
  role: "admin" | "client";
  hasPassword: boolean;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProfileHub({
  defaultValues,
}: {
  defaultValues: ProfileHubValues;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState(defaultValues.avatarUrl ?? "");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const editPanelId = useId();
  const passwordPanelId = useId();

  useEffect(() => {
    setPreview(defaultValues.avatarUrl ?? "");
  }, [defaultValues.avatarUrl]);

  useEffect(() => {
    if (!editOpen && !passwordOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setEditOpen(false);
        setPasswordOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editOpen, passwordOpen]);

  const personalRows = useMemo(
    () => [
      { label: "Nombre completo", value: defaultValues.name || "—" },
      { label: "Empresa", value: defaultValues.company || "—" },
      {
        label: "País",
        value: countryLabel(defaultValues.country) || "—",
      },
      { label: "Teléfono", value: defaultValues.phone || "—" },
      { label: "Email", value: defaultValues.email || "—" },
    ],
    [defaultValues],
  );

  function saveAvatar(file: File) {
    const formData = new FormData();
    formData.set("name", defaultValues.name);
    formData.set("company", defaultValues.company);
    formData.set("country", defaultValues.country ?? "");
    formData.set("phone", defaultValues.phone);
    formData.set("email", defaultValues.email);
    formData.set("avatar", file);
    startTransition(async () => {
      setError("");
      setSuccess("");
      const result = await updateProfileAction(formData);
      if (!result.ok) {
        setError(result.error);
        setCropSrc(null);
        return;
      }
      setPreview(URL.createObjectURL(file));
      setCropSrc(null);
      setSuccess(result.message);
      router.refresh();
    });
  }

  return (
    <div className="plat-profile-hub">
      <section className="plat-profile-hero">
        <div className="plat-profile-hero-avatar-wrap">
          <div className="plat-profile-hero-avatar">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt={defaultValues.name} />
            ) : (
              <span>{initials(defaultValues.name) || "IW"}</span>
            )}
          </div>
          <button
            type="button"
            className="plat-profile-hero-edit-avatar"
            aria-label="Cambiar foto"
            onClick={() => fileRef.current?.click()}
          >
            <Pencil size={13} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setCropSrc(URL.createObjectURL(file));
            }}
          />
        </div>

        <div className="plat-profile-hero-copy">
          <div className="plat-profile-hero-title-row">
            <h2>{defaultValues.name}</h2>
            <button
              type="button"
              className="plat-profile-edit-btn"
              onClick={() => {
                setPasswordOpen(false);
                setEditOpen(true);
              }}
            >
              <Pencil size={13} />
              Editar perfil
            </button>
          </div>
          <p>
            {defaultValues.email}
            {defaultValues.company ? ` · ${defaultValues.company}` : ""}
            {defaultValues.country
              ? ` · ${countryLabel(defaultValues.country)}`
              : ""}
          </p>
        </div>
      </section>

      {error ? <p className="plat-error">{error}</p> : null}
      {success ? <p className="plat-success">{success}</p> : null}

      <div className="plat-profile-stack">
        <article className="plat-profile-card">
          <span className="plat-profile-card-icon" aria-hidden>
            <Mail size={18} />
          </span>
          <div className="plat-profile-card-body">
            <h3>Cuenta</h3>
            <p>Tu email de acceso a la plataforma.</p>
            <strong>{defaultValues.email}</strong>
          </div>
        </article>

        <article className="plat-profile-card">
          <span className="plat-profile-card-icon" aria-hidden>
            <UserRound size={18} />
          </span>
          <div className="plat-profile-card-body">
            <h3>Información personal</h3>
            <dl className="plat-profile-data-list">
              {personalRows.map((row) => (
                <div key={row.label} className="plat-profile-data-row">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </article>

        <article className="plat-profile-card">
          <span className="plat-profile-card-icon" aria-hidden>
            <Shield size={18} />
          </span>
          <div className="plat-profile-card-body">
            <h3>Seguridad</h3>
            <p>
              {defaultValues.hasPassword
                ? "Cambiá tu contraseña ingresando la actual y la nueva dos veces."
                : "Esta cuenta entra con Google y no tiene contraseña local."}
            </p>
            {defaultValues.hasPassword ? (
              <button
                type="button"
                className="plat-profile-card-btn"
                onClick={() => {
                  setEditOpen(false);
                  setPasswordOpen(true);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                <Lock size={13} />
                Cambiar contraseña
              </button>
            ) : null}
          </div>
        </article>

        <article className="plat-profile-card is-danger">
          <span className="plat-profile-card-icon is-danger" aria-hidden>
            <Trash2 size={18} />
          </span>
          <div className="plat-profile-card-body">
            <h3>Eliminar cuenta</h3>
            <p>
              Al eliminar tu cuenta perderás el acceso a la plataforma. Podés
              pedir reactivación contactando a Ingenio Webs, pero el acceso
              queda bloqueado de inmediato.
            </p>
            <button
              type="button"
              className="plat-profile-card-btn is-danger"
              onClick={() => {
                setDeletePassword("");
                setDeleteConfirm("");
                setDeleteOpen(true);
              }}
            >
              Eliminar cuenta permanentemente
            </button>
          </div>
        </article>
      </div>

      {editOpen ? (
        <>
          <button
            type="button"
            className="plat-notify-backdrop"
            aria-label="Cerrar edición de perfil"
            onClick={() => setEditOpen(false)}
          />
          <aside
            className="plat-profile-drawer"
            id={editPanelId}
            role="dialog"
            aria-modal="true"
            aria-label="Información del perfil"
          >
            <div className="plat-profile-drawer-top">
              <h2>Información del perfil</h2>
              <button
                type="button"
                className="plat-notify-center-icon"
                aria-label="Cerrar"
                onClick={() => setEditOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form
              className="plat-profile-drawer-form"
              action={(formData) => {
                startTransition(async () => {
                  setError("");
                  setSuccess("");
                  const result = await updateProfileAction(formData);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setSuccess(result.message);
                  setEditOpen(false);
                  router.refresh();
                });
              }}
            >
              <label>
                Nombre completo
                <input
                  name="name"
                  required
                  defaultValue={defaultValues.name}
                  autoComplete="name"
                />
              </label>
              <label>
                Empresa
                <input
                  name="company"
                  defaultValue={defaultValues.company}
                  autoComplete="organization"
                />
              </label>
              <div className="plat-profile-drawer-grid">
                <label>
                  País
                  <select
                    name="country"
                    defaultValue={defaultValues.country ?? ""}
                  >
                    <option value="">Seleccioná un país</option>
                    {PROFILE_COUNTRIES.map((entry) => (
                      <option key={entry.code} value={entry.code}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Teléfono
                  <input
                    name="phone"
                    defaultValue={defaultValues.phone}
                    autoComplete="tel"
                  />
                </label>
              </div>
              <label>
                Mail
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={defaultValues.email}
                  autoComplete="email"
                />
              </label>

              {error && editOpen ? <p className="plat-error">{error}</p> : null}

              <div className="plat-profile-drawer-footer">
                <button className="plat-btn" type="submit" disabled={pending}>
                  {pending ? "Guardando..." : "Actualizar"}
                </button>
              </div>
            </form>
          </aside>
        </>
      ) : null}

      {passwordOpen ? (
        <>
          <button
            type="button"
            className="plat-notify-backdrop"
            aria-label="Cerrar cambio de contraseña"
            onClick={() => setPasswordOpen(false)}
          />
          <aside
            className="plat-profile-drawer"
            id={passwordPanelId}
            role="dialog"
            aria-modal="true"
            aria-label="Cambiar contraseña"
          >
            <div className="plat-profile-drawer-top">
              <h2>Cambiar contraseña</h2>
              <button
                type="button"
                className="plat-notify-center-icon"
                aria-label="Cerrar"
                onClick={() => setPasswordOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form
              className="plat-profile-drawer-form"
              action={(formData) => {
                formData.set("currentPassword", currentPassword);
                formData.set("password", newPassword);
                formData.set("confirmPassword", confirmPassword);
                startTransition(async () => {
                  setError("");
                  setSuccess("");
                  const result = await changePasswordAction(formData);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setSuccess(result.message);
                  setPasswordOpen(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                });
              }}
            >
              <PasswordField
                label="Contraseña actual"
                name="currentPassword"
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
                required
              />
              <PasswordField
                label="Nueva contraseña"
                name="password"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
                required
              />
              <PasswordField
                label="Repetir nueva contraseña"
                name="confirmPassword"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                required
              />

              {error && passwordOpen ? (
                <p className="plat-error">{error}</p>
              ) : null}

              <div className="plat-profile-drawer-footer">
                <button className="plat-btn" type="submit" disabled={pending}>
                  {pending ? "Guardando..." : "Actualizar contraseña"}
                </button>
              </div>
            </form>
          </aside>
        </>
      ) : null}

      <PlatformConfirmDialog
        open={deleteOpen}
        title="Eliminar cuenta"
        description="Esta acción bloquea el acceso de inmediato. Escribí ELIMINAR para confirmar."
        confirmLabel="Eliminar cuenta"
        pending={pending}
        pendingLabel="Eliminando..."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          const formData = new FormData();
          formData.set("password", deletePassword);
          formData.set("confirmText", deleteConfirm);
          startTransition(async () => {
            setError("");
            const result = await deleteAccountAction(formData);
            if (result && !result.ok) setError(result.error);
          });
        }}
      >
        {defaultValues.hasPassword ? (
          <PasswordField
            label="Contraseña"
            value={deletePassword}
            onChange={setDeletePassword}
            autoComplete="current-password"
            required
          />
        ) : null}
        <label className="plat-field">
          Escribí ELIMINAR
          <input
            value={deleteConfirm}
            onChange={(event) => setDeleteConfirm(event.target.value)}
            placeholder="ELIMINAR"
            autoComplete="off"
          />
        </label>
      </PlatformConfirmDialog>

      <AvatarCropModal
        open={Boolean(cropSrc)}
        imageSrc={cropSrc ?? ""}
        pending={pending}
        onCancel={() => setCropSrc(null)}
        onConfirm={(file) => saveAvatar(file)}
      />
    </div>
  );
}
