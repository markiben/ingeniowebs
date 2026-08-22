import { SignJWT, jwtVerify } from "jose";

const STATE_COOKIE = "iw_google_oauth_state";
const STATE_MINUTES = 10;

export type GoogleOAuthMode = "login" | "register";

export type GoogleOAuthState = {
  mode: GoogleOAuthMode;
  code?: string;
  phone?: string;
  nonce: string;
};

export type GoogleProfile = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
};

function getStateSecret() {
  const secret =
    process.env.PLATFORM_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    "ingenio-webs-dev-secret-change-me";
  return new TextEncoder().encode(`google-oauth:${secret}`);
}

export function isGoogleOAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim(),
  );
}

export function getGoogleOAuthClientId() {
  return process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() || "";
}

export function getGoogleOAuthClientSecret() {
  return process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() || "";
}

export function getGoogleOAuthStateCookieName() {
  return STATE_COOKIE;
}

export function getRequestBaseUrl(request: Request) {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.PLATFORM_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    url.host;
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (url.protocol === "https:" ? "https" : "http");
  return `${proto}://${host}`;
}

export function getGoogleRedirectUri(baseUrl: string) {
  return `${baseUrl.replace(/\/$/, "")}/api/plataforma/auth/google/callback`;
}

export async function createGoogleOAuthState(payload: Omit<GoogleOAuthState, "nonce">) {
  const nonce = crypto.randomUUID();
  const token = await new SignJWT({
    mode: payload.mode,
    code: payload.code ?? "",
    phone: payload.phone ?? "",
    nonce,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${STATE_MINUTES}m`)
    .sign(getStateSecret());

  return { token, nonce };
}

export async function verifyGoogleOAuthState(token: string) {
  try {
    const { payload } = await jwtVerify(token, getStateSecret());
    const mode = payload.mode === "register" ? "register" : "login";
    return {
      mode,
      code: String(payload.code ?? "").trim().toUpperCase() || undefined,
      phone: String(payload.phone ?? "").trim() || undefined,
      nonce: String(payload.nonce ?? ""),
    } satisfies GoogleOAuthState;
  } catch {
    return null;
  }
}

export function buildGoogleAuthUrl(input: {
  baseUrl: string;
  state: string;
}) {
  const params = new URLSearchParams({
    client_id: getGoogleOAuthClientId(),
    redirect_uri: getGoogleRedirectUri(input.baseUrl),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state: input.state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(input: {
  code: string;
  baseUrl: string;
}) {
  const body = new URLSearchParams({
    code: input.code,
    client_id: getGoogleOAuthClientId(),
    client_secret: getGoogleOAuthClientSecret(),
    redirect_uri: getGoogleRedirectUri(input.baseUrl),
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[google-oauth] token exchange failed", response.status, text.slice(0, 300));
    return null;
  }

  const json = (await response.json()) as { access_token?: string };
  if (!json.access_token) return null;
  return json.access_token;
}

export async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("[google-oauth] userinfo failed", response.status);
    return null;
  }

  const json = (await response.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
    email_verified?: boolean | string;
  };

  const id = String(json.sub ?? "").trim();
  const email = String(json.email ?? "").trim().toLowerCase();
  const name = String(json.name ?? "").trim();
  if (!id || !email) return null;

  return {
    id,
    email,
    name: name || email.split("@")[0] || "Cliente",
    picture: json.picture ? String(json.picture) : undefined,
    emailVerified:
      json.email_verified === true || json.email_verified === "true",
  } satisfies GoogleProfile;
}

export function googleAuthErrorRedirect(
  baseUrl: string,
  mode: GoogleOAuthMode,
  error: string,
  extras?: { code?: string },
) {
  const path = mode === "register" ? "/plataforma/registro" : "/plataforma/login";
  const url = new URL(path, `${baseUrl}/`);
  url.searchParams.set("error", error);
  if (extras?.code) url.searchParams.set("code", extras.code);
  return url.toString();
}
