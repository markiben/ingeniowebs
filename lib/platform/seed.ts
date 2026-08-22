import { hashPassword } from "./auth";
import { createId, readDb, writeDb } from "./store";

/** Ensures a master admin exists (first boot). */
export async function ensurePlatformSeed() {
  const db = readDb();
  const hasAdmin = db.users.some((user) => user.role === "admin");
  if (hasAdmin) return;

  const email =
    process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase() ||
    "info@ingeniowebs.com";
  const password = process.env.PLATFORM_ADMIN_PASSWORD || "Benjamin2026";
  const now = new Date().toISOString();

  db.users.push({
    id: createId("user"),
    email,
    name: "Ingenio Webs",
    passwordHash: await hashPassword(password),
    role: "admin",
    projectId: null,
    createdAt: now,
    updatedAt: now,
  });

  writeDb(db);
}
