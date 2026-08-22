import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { readDb } from "./store";
import type { PlatformUser, SessionUser } from "./types";

const COOKIE_NAME = "iw_platform_session";
const SESSION_DAYS = 14;

function getSecret() {
  const secret =
    process.env.PLATFORM_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    "ingenio-webs-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(
  user: PlatformUser,
  options?: { remember?: boolean },
) {
  const days = options?.remember ? 30 : SESSION_DAYS;
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    projectId: user.projectId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(getSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: days * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = String(payload.id ?? "");
    if (!id) return null;

    const db = readDb();
    const user = db.users.find((entry) => entry.id === id);
    if (!user) return null;

    if (user.role === "client") {
      if (!user.projectId || user.accessBlocked || user.archived) return null;
      const project = db.projects.find((entry) => entry.id === user.projectId);
      if (!project || !project.accessEnabled || project.status === "completed") {
        return null;
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      projectId: user.projectId,
      avatarUrl: user.avatarUrl ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireSession(role?: "admin" | "client") {
  const session = await getSession();
  if (!session) return null;
  if (role && session.role !== role) return null;
  return session;
}
