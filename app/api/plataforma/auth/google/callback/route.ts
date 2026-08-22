import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/platform/auth";
import {
  exchangeGoogleCode,
  fetchGoogleProfile,
  getGoogleOAuthStateCookieName,
  getRequestBaseUrl,
  googleAuthErrorRedirect,
  isGoogleOAuthConfigured,
  verifyGoogleOAuthState,
} from "@/lib/platform/google-oauth";
import { ensurePlatformSeed } from "@/lib/platform/seed";
import { createId, readDb, updateDb } from "@/lib/platform/store";
import type { PlatformUser } from "@/lib/platform/types";

function clearStateCookie(response: NextResponse) {
  response.cookies.set(getGoogleOAuthStateCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

function canClientAccess(user: PlatformUser, db: ReturnType<typeof readDb>) {
  if (user.role !== "client") return { ok: true as const };
  if (user.archived) {
    return {
      ok: false as const,
      error:
        "Tu cuenta está archivada. Contactá a Ingenio Webs si necesitás reactivarla.",
    };
  }
  if (user.accessBlocked) {
    return {
      ok: false as const,
      error:
        "Tu acceso a la plataforma está bloqueado. Contactá a Ingenio Webs.",
    };
  }
  const project = db.projects.find((entry) => entry.id === user.projectId);
  if (!project || !project.accessEnabled || project.status === "completed") {
    return {
      ok: false as const,
      error:
        "Tu acceso al proyecto finalizó. Contactá a Ingenio Webs si necesitás reactivarlo.",
    };
  }
  return { ok: true as const };
}

export async function GET(request: NextRequest) {
  await ensurePlatformSeed();
  const baseUrl = getRequestBaseUrl(request);
  const oauthError = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state") ?? "";
  const stateCookie = request.cookies.get(getGoogleOAuthStateCookieName())?.value ?? "";

  if (!isGoogleOAuthConfigured()) {
    const response = NextResponse.redirect(
      googleAuthErrorRedirect(
        baseUrl,
        "login",
        "Google no está configurado en el servidor.",
      ),
    );
    clearStateCookie(response);
    return response;
  }

  if (oauthError) {
    const response = NextResponse.redirect(
      googleAuthErrorRedirect(
        baseUrl,
        "login",
        "Cancelaste el acceso con Google.",
      ),
    );
    clearStateCookie(response);
    return response;
  }

  const state = await verifyGoogleOAuthState(stateParam || stateCookie);
  if (!state || !stateParam || stateParam !== stateCookie) {
    const response = NextResponse.redirect(
      googleAuthErrorRedirect(
        baseUrl,
        "login",
        "La sesión de Google expiró. Intentá de nuevo.",
      ),
    );
    clearStateCookie(response);
    return response;
  }

  if (!code) {
    const response = NextResponse.redirect(
      googleAuthErrorRedirect(
        baseUrl,
        state.mode,
        "Google no devolvió un código de autorización.",
      ),
    );
    clearStateCookie(response);
    return response;
  }

  const accessToken = await exchangeGoogleCode({ code, baseUrl });
  if (!accessToken) {
    const response = NextResponse.redirect(
      googleAuthErrorRedirect(
        baseUrl,
        state.mode,
        "No pudimos validar la cuenta de Google. Intentá de nuevo.",
      ),
    );
    clearStateCookie(response);
    return response;
  }

  const profile = await fetchGoogleProfile(accessToken);
  if (!profile) {
    const response = NextResponse.redirect(
      googleAuthErrorRedirect(
        baseUrl,
        state.mode,
        "No pudimos leer tu perfil de Google.",
      ),
    );
    clearStateCookie(response);
    return response;
  }

  if (!profile.emailVerified) {
    const response = NextResponse.redirect(
      googleAuthErrorRedirect(
        baseUrl,
        state.mode,
        "Tu email de Google no está verificado.",
      ),
    );
    clearStateCookie(response);
    return response;
  }

  const db = readDb();
  let user =
    db.users.find((entry) => entry.googleId === profile.id) ??
    db.users.find((entry) => entry.email === profile.email) ??
    null;

  if (state.mode === "login") {
    if (!user) {
      const response = NextResponse.redirect(
        googleAuthErrorRedirect(
          baseUrl,
          "register",
          "No hay una cuenta con ese Google. Registrate con tu código de proyecto.",
        ),
      );
      clearStateCookie(response);
      return response;
    }

    const access = canClientAccess(user, db);
    if (!access.ok) {
      const response = NextResponse.redirect(
        googleAuthErrorRedirect(baseUrl, "login", access.error),
      );
      clearStateCookie(response);
      return response;
    }

    updateDb((next) => {
      const entry = next.users.find((item) => item.id === user!.id);
      if (!entry) return;
      entry.googleId = profile.id;
      if (!entry.name) entry.name = profile.name;
      if (profile.picture && !entry.avatarUrl) {
        entry.avatarUrl = profile.picture;
      }
      entry.updatedAt = new Date().toISOString();
    });

    const fresh = readDb().users.find((entry) => entry.id === user!.id);
    if (!fresh) {
      const response = NextResponse.redirect(
        googleAuthErrorRedirect(
          baseUrl,
          "login",
          "No se pudo iniciar sesión. Intentá de nuevo.",
        ),
      );
      clearStateCookie(response);
      return response;
    }

    await createSession(fresh);
    const response = NextResponse.redirect(`${baseUrl}/plataforma`);
    clearStateCookie(response);
    return response;
  }

  // register
  if (!state.code) {
    const response = NextResponse.redirect(
      googleAuthErrorRedirect(
        baseUrl,
        "register",
        "Ingresá el código de proyecto antes de continuar con Google.",
      ),
    );
    clearStateCookie(response);
    return response;
  }

  const project = db.projects.find(
    (entry) =>
      entry.code.toUpperCase() === state.code && entry.accessEnabled,
  );
  if (!project || project.status === "completed") {
    const response = NextResponse.redirect(
      googleAuthErrorRedirect(
        baseUrl,
        "register",
        "Código de proyecto inválido o ya finalizado.",
      ),
    );
    clearStateCookie(response);
    return response;
  }

  const expectedEmail = project.clientEmail.trim().toLowerCase();
  if (expectedEmail && profile.email !== expectedEmail) {
    const response = NextResponse.redirect(
      googleAuthErrorRedirect(
        baseUrl,
        "register",
        `Usá la cuenta Google de ${project.clientEmail} (email de la cotización).`,
        { code: state.code },
      ),
    );
    clearStateCookie(response);
    return response;
  }

  if (user) {
    if (user.role === "admin") {
      const response = NextResponse.redirect(
        googleAuthErrorRedirect(
          baseUrl,
          "login",
          "Ese email ya es una cuenta de administración. Iniciá sesión.",
        ),
      );
      clearStateCookie(response);
      return response;
    }

    if (user.projectId && user.projectId !== project.id) {
      const response = NextResponse.redirect(
        googleAuthErrorRedirect(
          baseUrl,
          "login",
          "Ese email ya está registrado. Iniciá sesión con Google.",
        ),
      );
      clearStateCookie(response);
      return response;
    }

    const access = canClientAccess(user, db);
    if (!access.ok) {
      const response = NextResponse.redirect(
        googleAuthErrorRedirect(baseUrl, "register", access.error),
      );
      clearStateCookie(response);
      return response;
    }

    updateDb((next) => {
      const entry = next.users.find((item) => item.id === user!.id);
      if (!entry) return;
      entry.googleId = profile.id;
      entry.projectId = project.id;
      entry.name = profile.name || entry.name;
      if (state.phone) entry.phone = state.phone;
      if (profile.picture && !entry.avatarUrl) {
        entry.avatarUrl = profile.picture;
      }
      entry.updatedAt = new Date().toISOString();
    });

    const fresh = readDb().users.find((entry) => entry.id === user!.id);
    if (!fresh) {
      const response = NextResponse.redirect(
        googleAuthErrorRedirect(
          baseUrl,
          "register",
          "No se pudo completar el registro. Intentá de nuevo.",
        ),
      );
      clearStateCookie(response);
      return response;
    }

    await createSession(fresh);
    const response = NextResponse.redirect(`${baseUrl}/plataforma`);
    clearStateCookie(response);
    return response;
  }

  const now = new Date().toISOString();
  const newUser: PlatformUser = {
    id: createId("user"),
    email: profile.email,
    name: profile.name,
    passwordHash: "",
    googleId: profile.id,
    role: "client",
    projectId: project.id,
    phone: state.phone,
    avatarUrl: profile.picture ?? null,
    createdAt: now,
    updatedAt: now,
  };

  updateDb((next) => {
    next.users.push(newUser);
  });

  await createSession(newUser);
  const response = NextResponse.redirect(`${baseUrl}/plataforma`);
  clearStateCookie(response);
  return response;
}
