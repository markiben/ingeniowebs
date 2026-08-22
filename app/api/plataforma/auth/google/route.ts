import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  createGoogleOAuthState,
  getGoogleOAuthStateCookieName,
  getRequestBaseUrl,
  googleAuthErrorRedirect,
  isGoogleOAuthConfigured,
} from "@/lib/platform/google-oauth";
import { ensurePlatformSeed } from "@/lib/platform/seed";
import { readDb } from "@/lib/platform/store";

export async function GET(request: NextRequest) {
  await ensurePlatformSeed();
  const baseUrl = getRequestBaseUrl(request);
  const modeParam = request.nextUrl.searchParams.get("mode");
  const mode = modeParam === "register" ? "register" : "login";
  const code = String(request.nextUrl.searchParams.get("code") ?? "")
    .trim()
    .toUpperCase();
  const phone = String(request.nextUrl.searchParams.get("phone") ?? "").trim();

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      googleAuthErrorRedirect(
        baseUrl,
        mode,
        "Google no está configurado. Pedile al administrador que agregue GOOGLE_OAUTH_CLIENT_ID y GOOGLE_OAUTH_CLIENT_SECRET.",
      ),
    );
  }

  if (mode === "register") {
    if (!code) {
      return NextResponse.redirect(
        googleAuthErrorRedirect(
          baseUrl,
          "register",
          "Ingresá el código de proyecto antes de continuar con Google.",
        ),
      );
    }

    const db = readDb();
    const project = db.projects.find(
      (entry) => entry.code.toUpperCase() === code && entry.accessEnabled,
    );

    if (!project) {
      return NextResponse.redirect(
        googleAuthErrorRedirect(
          baseUrl,
          "register",
          "Ese código de proyecto no existe o no tiene acceso habilitado.",
          { code },
        ),
      );
    }

    if (project.status === "completed") {
      return NextResponse.redirect(
        googleAuthErrorRedirect(
          baseUrl,
          "register",
          "Ese proyecto ya está finalizado. Contactá a Ingenio Webs.",
          { code },
        ),
      );
    }
  }

  const { token } = await createGoogleOAuthState({
    mode,
    code: mode === "register" ? code : undefined,
    phone: mode === "register" ? phone || undefined : undefined,
  });

  const authUrl = buildGoogleAuthUrl({ baseUrl, state: token });
  const response = NextResponse.redirect(authUrl);
  response.cookies.set(getGoogleOAuthStateCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
