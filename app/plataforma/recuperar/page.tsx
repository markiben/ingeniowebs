"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import PasswordField from "@/components/platform/PasswordField";
import PlatformAuthShell from "@/components/platform/PlatformAuthShell";
import {
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/lib/platform/actions";
import {
  getPasswordChecks,
  isPasswordStrong,
  PASSWORD_RULES_LABELS,
} from "@/lib/platform/password";

export default function PlatformRecoverPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const passwordOk = isPasswordStrong(password);
  const passwordsMatch =
    password.length > 0 && password === confirmPassword;
  const canSubmit =
    Boolean(token.trim()) && passwordOk && passwordsMatch && !pending;

  const subtitle =
    step === 1
      ? "Ingresá el email de tu cuenta. Te mandamos un código por correo."
      : step === 2
        ? "Revisá tu email, pegá el código y elegí una contraseña nueva."
        : "Tu contraseña fue actualizada correctamente.";

  return (
    <PlatformAuthShell title="Recuperar contraseña" subtitle={subtitle}>
        <div className="plat-form">
          {step === 1 ? (
            <>
              <label>
                Email de la cuenta
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              {error ? <p className="plat-error">{error}</p> : null}

              <button
                className="plat-btn"
                type="button"
                disabled={pending || !email.trim()}
                onClick={() => {
                  startTransition(async () => {
                    setError("");
                    setMessage("");
                    const formData = new FormData();
                    formData.set("email", email);
                    const result = await requestPasswordResetAction(formData);
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    setMessage(result.message);
                    setToken("");
                    setPassword("");
                    setConfirmPassword("");
                    setStep(2);
                  });
                }}
              >
                {pending ? "Enviando..." : "Enviar código al email"}
              </button>
            </>
          ) : null}

          {step === 2 ? (
            <>
              {message ? <p className="plat-success">{message}</p> : null}

              <label>
                Código de recupero
                <input
                  required
                  autoComplete="one-time-code"
                  placeholder="Pegá el código del email"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                />
              </label>

              <PasswordField
                label="Nueva contraseña"
                value={password}
                onChange={setPassword}
                placeholder="Creá una contraseña segura"
                autoComplete="new-password"
                required
              />

              <PasswordField
                label="Repetir contraseña"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Repetí la misma contraseña"
                autoComplete="new-password"
                required
              />

              <ul className="plat-password-rules" aria-live="polite">
                {PASSWORD_RULES_LABELS.map((rule) => (
                  <li
                    key={rule.key}
                    className={checks[rule.key] ? "is-ok" : "is-pending"}
                  >
                    <span aria-hidden="true">
                      {checks[rule.key] ? "✓" : "•"}
                    </span>
                    {rule.label}
                  </li>
                ))}
                <li className={passwordsMatch ? "is-ok" : "is-pending"}>
                  <span aria-hidden="true">{passwordsMatch ? "✓" : "•"}</span>
                  Las contraseñas coinciden
                </li>
              </ul>

              {error ? <p className="plat-error">{error}</p> : null}

              <button
                className="plat-btn"
                type="button"
                disabled={!canSubmit}
                onClick={() => {
                  startTransition(async () => {
                    setError("");
                    setMessage("");
                    if (password !== confirmPassword) {
                      setError("Las contraseñas no coinciden.");
                      return;
                    }
                    const formData = new FormData();
                    formData.set("email", email);
                    formData.set("token", token);
                    formData.set("password", password);
                    const result = await resetPasswordAction(formData);
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    setMessage(result.message);
                    setPassword("");
                    setConfirmPassword("");
                    setToken("");
                    setStep(3);
                  });
                }}
              >
                {pending ? "Guardando..." : "Actualizar contraseña"}
              </button>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <p className="plat-success plat-success-banner" role="status">
                ¡Contraseña cambiada con éxito!
              </p>
              <p className="plat-auth-email-hint">
                Ya podés iniciar sesión con <strong>{email}</strong> y tu nueva
                contraseña.
              </p>
              <button
                className="plat-btn"
                type="button"
                onClick={() => router.push("/plataforma/login")}
              >
                Ir al login
              </button>
            </>
          ) : null}
        </div>

        <div className="plat-links">
          <Link href="/plataforma/login">Volver al login</Link>
        </div>
    </PlatformAuthShell>
  );
}
