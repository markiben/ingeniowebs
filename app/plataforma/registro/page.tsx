"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, useTransition } from "react";
import AuthDivider from "@/components/platform/AuthDivider";
import GoogleAuthButton from "@/components/platform/GoogleAuthButton";
import PasswordField from "@/components/platform/PasswordField";
import PlatformAuthShell from "@/components/platform/PlatformAuthShell";
import { registerAction } from "@/lib/platform/actions";
import {
  getPasswordChecks,
  isPasswordStrong,
  PASSWORD_RULES_LABELS,
} from "@/lib/platform/password";

function isCodeRelatedError(message: string) {
  const text = message.toLowerCase();
  return (
    text.includes("código") ||
    text.includes("proyecto") ||
    text.includes("google") ||
    text.includes("acceso habilitado")
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error") ?? "";
  const [codeError, setCodeError] = useState(
    queryError && isCodeRelatedError(queryError) ? queryError : "",
  );
  const [formError, setFormError] = useState(
    queryError && !isCodeRelatedError(queryError) ? queryError : "",
  );
  const [code, setCode] = useState(
    (searchParams.get("code") ?? "").trim().toUpperCase(),
  );
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const passwordOk = isPasswordStrong(password);
  const passwordsMatch =
    password.length > 0 && password === confirmPassword;

  return (
    <PlatformAuthShell
      compact
      title="Registro de cliente"
      subtitle="Usá el código IW y el mismo email de la cotización."
    >
      <form
        className="plat-form plat-form-register"
        autoComplete="on"
        action={(formData) => {
          startTransition(async () => {
            setCodeError("");
            setFormError("");
            if (!isPasswordStrong(password)) {
              setFormError(
                "La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial.",
              );
              return;
            }
            if (password !== confirmPassword) {
              setFormError("Las contraseñas no coinciden.");
              return;
            }
            formData.set("password", password);
            const result = await registerAction(formData);
            if (result && !result.ok) {
              if (isCodeRelatedError(result.error)) setCodeError(result.error);
              else setFormError(result.error);
            }
          });
        }}
      >
        <label className="plat-field-nolabel">
          <span className="sr-only">Código de proyecto</span>
          <input
            name="code"
            required
            placeholder="Código de proyecto"
            autoComplete="off"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              if (codeError) setCodeError("");
            }}
            aria-invalid={codeError ? true : undefined}
            aria-describedby={codeError ? "register-code-error" : undefined}
          />
        </label>
        {codeError ? (
          <p id="register-code-error" className="plat-error plat-error-inline" role="alert">
            {codeError}
          </p>
        ) : null}

        <div className="plat-form-row">
          <label className="plat-field-nolabel">
            <span className="sr-only">Nombre</span>
            <input
              name="name"
              required
              placeholder="Nombre"
              autoComplete="name"
            />
          </label>
          <label className="plat-field-nolabel">
            <span className="sr-only">Teléfono</span>
            <input
              name="phone"
              placeholder="Teléfono"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
        </div>

        <label className="plat-field-nolabel">
          <span className="sr-only">Email</span>
          <input
            type="email"
            name="email"
            required
            placeholder="Email"
            autoComplete="email"
            inputMode="email"
          />
        </label>

        <div className="plat-form-row">
          <PasswordField
            name="password"
            value={password}
            onChange={setPassword}
            placeholder="Contraseña"
            autoComplete="new-password"
            required
          />
          <PasswordField
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repetí contraseña"
            autoComplete="new-password"
            required
          />
        </div>

        <ul className="plat-password-rules is-compact" aria-live="polite">
          {PASSWORD_RULES_LABELS.map((rule) => (
            <li
              key={rule.key}
              className={checks[rule.key] ? "is-ok" : "is-pending"}
            >
              <span aria-hidden="true">{checks[rule.key] ? "✓" : "•"}</span>
              {rule.label}
            </li>
          ))}
          <li className={passwordsMatch ? "is-ok" : "is-pending"}>
            <span aria-hidden="true">{passwordsMatch ? "✓" : "•"}</span>
            Las contraseñas coinciden
          </li>
        </ul>

        {formError ? <p className="plat-error">{formError}</p> : null}
        <button
          className="plat-btn"
          type="submit"
          disabled={pending || !passwordOk || !passwordsMatch}
        >
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <AuthDivider label="o" />
      <GoogleAuthButton
        mode="register"
        disabled={pending}
        className="is-dark"
        onError={(message) => {
          setFormError("");
          setCodeError(message);
        }}
        getRegisterParams={() => {
          const trimmed = code.trim().toUpperCase();
          if (!trimmed) {
            return {
              error:
                "Ingresá el código de proyecto antes de continuar con Google.",
            };
          }
          return { code: trimmed, phone: phone.trim() || undefined };
        }}
      />

      <div className="plat-links">
        <Link href="/plataforma/login">Ya tengo cuenta</Link>
        <Link href="/">Volver al sitio</Link>
      </div>
    </PlatformAuthShell>
  );
}

export default function PlatformRegisterPage() {
  return (
    <Suspense
      fallback={
        <PlatformAuthShell
          compact
          title="Registro de cliente"
          subtitle="Usá el código de proyecto que te dio Ingenio Webs."
        >
          <p className="plat-auth-email-hint">Cargando…</p>
        </PlatformAuthShell>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
