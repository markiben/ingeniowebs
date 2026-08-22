"use client";

import { FormEvent, Suspense, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import { unsubscribeNewsletterPublicAction } from "@/lib/platform/actions";

function BajaCard({ children }: { children: ReactNode }) {
  return (
    <div className="baja-card">
      <div className="baja-brand">
        <Logo variant="navbar" height={36} className="baja-logo" />
      </div>
      {children}
    </div>
  );
}

function BajaForm() {
  const searchParams = useSearchParams();
  const initialEmail = (searchParams.get("email") ?? "").trim();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <BajaCard>
        <h1>Listo, te diste de baja</h1>
        <p>
          Sacamos tu email de la lista de novedades de Ingenio Webs. Si cambiás
          de opinión, podés volver a suscribirte desde el sitio.
        </p>
        <div className="baja-links">
          <Link href="/#newsletter">Volver a suscribirme</Link>
          <Link href="/">Volver al sitio</Link>
        </div>
      </BajaCard>
    );
  }

  return (
    <BajaCard>
      <h1>Darse de baja</h1>
      <p>
        Ingresá el email con el que te suscribiste. Dejamos de enviarte
        novedades de inmediato.
      </p>
      <form
        className="baja-form"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            setError("");
            const result = await unsubscribeNewsletterPublicAction(formData);
            if (result && !result.ok) {
              setError(result.error);
              return;
            }
            setDone(true);
          });
        }}
      >
        <label className="baja-field-nolabel">
          <span className="sr-only">Email</span>
          <input
            type="email"
            name="email"
            required
            defaultValue={initialEmail}
            autoComplete="email"
            inputMode="email"
            placeholder="Email"
          />
        </label>
        {error ? <p className="baja-error">{error}</p> : null}
        <button type="submit" className="baja-btn" disabled={pending}>
          {pending ? "Procesando…" : "Confirmar baja"}
        </button>
      </form>
      <div className="baja-links">
        <Link href="/#newsletter">Seguir suscripto</Link>
        <Link href="/">Volver al sitio</Link>
      </div>
    </BajaCard>
  );
}

export default function BajaPage() {
  return (
    <main className="baja-page">
      <Suspense
        fallback={
          <BajaCard>
            <h1>Darse de baja</h1>
            <p>Cargando…</p>
          </BajaCard>
        }
      >
        <BajaForm />
      </Suspense>
    </main>
  );
}
