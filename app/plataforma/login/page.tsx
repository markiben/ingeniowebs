"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import AuthDivider from "@/components/platform/AuthDivider";
import GoogleAuthButton from "@/components/platform/GoogleAuthButton";
import PasswordField from "@/components/platform/PasswordField";
import PlatformAuthShell from "@/components/platform/PlatformAuthShell";
import { loginAction } from "@/lib/platform/actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error") ?? "";
  const [error, setError] = useState(queryError);
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <PlatformAuthShell
      title="Iniciar sesión"
      subtitle="Acceso exclusivo para clientes con proyecto activo."
    >
      <form
        className="plat-form"
        action={(formData) => {
          startTransition(async () => {
            setError("");
            // Use the native field value (typing + browser autofill).
            // Do not overwrite with React state — autofill often fills the DOM
            // without updating controlled state, and set() would send the wrong password.
            const result = await loginAction(formData);
            if (result && !result.ok) setError(result.error);
          });
        }}
      >
        <label className="plat-field-nolabel">
          <span className="sr-only">Email</span>
          <input
            type="email"
            name="email"
            required
            placeholder="Email"
            autoComplete="username email"
            inputMode="email"
          />
        </label>
        <PasswordField
          name="password"
          value={password}
          onChange={setPassword}
          placeholder="Contraseña"
          autoComplete="current-password"
          required
        />

        <div className="plat-login-meta">
          <label className="plat-remember">
            <input type="checkbox" name="remember" />
            <span>Seguir conectado</span>
          </label>
          <Link href="/plataforma/recuperar" className="plat-forgot-link">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error ? <p className="plat-error">{error}</p> : null}
        <button className="plat-btn" type="submit" disabled={pending}>
          {pending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <AuthDivider />
      <GoogleAuthButton
        mode="login"
        disabled={pending}
        className="is-dark"
      />

      <div className="plat-links">
        <Link href="/plataforma/registro">Registrarme con código</Link>
        <Link href="/">Volver al sitio</Link>
      </div>
    </PlatformAuthShell>
  );
}

export default function PlatformLoginPage() {
  return (
    <Suspense
      fallback={
        <PlatformAuthShell
          title="Iniciar sesión"
          subtitle="Acceso exclusivo para clientes con proyecto activo."
        >
          <p className="plat-auth-email-hint">Cargando…</p>
        </PlatformAuthShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
