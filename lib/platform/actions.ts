"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  getSession,
  hashPassword,
  requireSession,
  verifyPassword,
} from "./auth";
import {
  addProjectService,
  createProject,
  getMetrics,
  updateProjectHours,
  updateProjectPaymentStatus,
  updateProjectProgressAndStatus,
  updateProjectStatus,
} from "./projects";
import { isProjectStatus } from "./project-status";
import {
  isProjectPaymentStatus,
} from "./quote-commerce";
import {
  notifyGoogleContact,
  notifyNewsletterWelcomeEmail,
  notifyPasswordResetEmail,
} from "@/lib/notify-google";
import { maintainLiveChats } from "./live-chat-maintenance";
import { passwordStrengthError } from "./password";
import { createId, readDb, updateDb } from "./store";
import { ensurePlatformSeed } from "./seed";
import { upsertNewsletterSubscriber, setNewsletterSubscriberStatus, deleteNewsletterSubscriber, unsubscribeNewsletterByEmail } from "./newsletter";
import {
  buildNewsletterWelcomeHtmlBody,
  buildNewsletterWelcomeSubject,
  buildNewsletterWelcomeTextBody,
  getNewsletterWelcomePromo,
} from "./newsletter-welcome-email";
import { createQuote, markQuoteSent, approveQuote, rejectQuote, cancelApprovedQuote } from "./quotes";
import { parseQuoteJson } from "./quote-schema";
import { toQuoteGmailUrl } from "./quote-email";
import {
  buildProjectRegisteredEmailBody,
  toProjectRegisteredGmailUrl,
} from "./project-email";
import {
  cancelWindowInfo,
  computeRefundAmount,
  expectedAmountPaid,
  isQuotePaymentChannel,
  isQuotePaymentSchedule,
  QUOTE_CANCEL_WITHIN_DAYS,
  QUOTE_REFUND_PERCENT,
} from "./quote-commerce";
import type {
  ClientProjectUpdate,
  PricingType,
  ProjectStatus,
  ProposalStatus,
  SupportTicketPriority,
  SupportTicketStatus,
} from "./types";

type ActionFail = { ok: false; error: string };
type ActionOk<T extends object = object> = { ok: true } & T;

function fail(message: string): ActionFail {
  return { ok: false, error: message };
}

function ok(): ActionOk;
function ok<T extends object>(data: T): ActionOk<T>;
function ok<T extends object>(data?: T): ActionOk | ActionOk<T> {
  return { ok: true, ...(data ?? {}) } as ActionOk<T>;
}

export async function loginAction(formData: FormData) {
  await ensurePlatformSeed();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  // Prefer the form field value; trim so pasted passwords don't fail.
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) return fail("Completá email y contraseña.");

  const db = readDb();
  const user = db.users.find((entry) => entry.email === email);
  if (!user) return fail("Credenciales incorrectas.");

  if (!user.passwordHash) {
    return fail(
      "Esta cuenta usa Google. Tocá “Continuar con Google” para ingresar.",
    );
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return fail("Credenciales incorrectas.");
  }

  if (user.role === "client") {
    if (user.archived) {
      return fail(
        "Tu cuenta está archivada. Contactá a Ingenio Webs si necesitás reactivarla.",
      );
    }
    if (user.accessBlocked) {
      return fail(
        "Tu acceso a la plataforma está bloqueado. Contactá a Ingenio Webs.",
      );
    }
    const project = db.projects.find((entry) => entry.id === user.projectId);
    if (!project || !project.accessEnabled || project.status === "completed") {
      return fail(
        "Tu acceso al proyecto finalizó. Contactá a Ingenio Webs si necesitás reactivarlo.",
      );
    }
  }

  await createSession(user, {
    remember: String(formData.get("remember") ?? "") === "on",
  });
  redirect("/plataforma");
}

export async function registerAction(formData: FormData) {
  await ensurePlatformSeed();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();

  if (!code || !name || !email) {
    return fail("Completá todos los campos.");
  }

  const passwordError = passwordStrengthError(password);
  if (passwordError) return fail(passwordError);

  const db = readDb();
  const project = db.projects.find(
    (entry) => entry.code.toUpperCase() === code && entry.accessEnabled,
  );
  if (!project || project.status === "completed") {
    return fail("Código de proyecto inválido o ya finalizado.");
  }

  const expectedEmail = project.clientEmail.trim().toLowerCase();
  if (expectedEmail && email !== expectedEmail) {
    return fail(
      `Registrate con el email de la cotización (${project.clientEmail}).`,
    );
  }

  if (db.users.some((entry) => entry.email === email)) {
    return fail("Ese email ya está registrado.");
  }

  const now = new Date().toISOString();
  const user = {
    id: createId("user"),
    email,
    name,
    passwordHash: await hashPassword(password),
    role: "client" as const,
    projectId: project.id,
    phone: phone || undefined,
    createdAt: now,
    updatedAt: now,
  };

  updateDb((next) => {
    next.users.push(user);
  });

  await createSession(user);
  redirect("/plataforma");
}

export async function logoutAction() {
  await destroySession();
  redirect("/plataforma/login");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return fail("Ingresá tu email.");

  const token = Math.random().toString(36).slice(2, 10).toUpperCase();
  const expires = new Date(Date.now() + 1000 * 60 * 60).toISOString();
  let found = false;
  let userName = "";

  updateDb((db) => {
    const user = db.users.find((entry) => entry.email === email);
    if (!user) return;
    found = true;
    userName = user.name;
    user.resetToken = token;
    user.resetTokenExpiresAt = expires;
    user.updatedAt = new Date().toISOString();
  });

  if (!found) {
    return fail("No hay una cuenta con ese email.");
  }

  const mailed = await notifyPasswordResetEmail({
    email,
    name: userName || "Usuario",
    code: token,
  });

  if (!mailed.sent) {
    if (mailed.reason === "missing_webhook") {
      return fail(
        "El envío de emails no está configurado. Pedile al administrador que configure GOOGLE_CONTACT_WEBHOOK_URL.",
      );
    }
    return fail(
      "No pudimos enviar el email con el código. Intentá de nuevo en unos minutos.",
    );
  }

  return ok({
    message: `Te enviamos un código a ${email}. Revisá tu casilla (y spam).`,
  });
}

export async function resetPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const token = String(formData.get("token") ?? "")
    .trim()
    .toUpperCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !token) {
    return fail("Completá el código y la nueva contraseña.");
  }

  const passwordError = passwordStrengthError(password);
  if (passwordError) return fail(passwordError);

  const passwordHash = await hashPassword(password);
  let updated = false;

  updateDb((db) => {
    const user = db.users.find((entry) => entry.email === email);
    if (
      !user ||
      !user.resetToken ||
      user.resetToken.toUpperCase() !== token ||
      !user.resetTokenExpiresAt ||
      new Date(user.resetTokenExpiresAt).getTime() < Date.now()
    ) {
      return;
    }
    user.passwordHash = passwordHash;
    user.resetToken = null;
    user.resetTokenExpiresAt = null;
    user.updatedAt = new Date().toISOString();
    updated = true;
  });

  if (!updated) {
    return fail("Código inválido o expirado. Pedí uno nuevo.");
  }

  return ok({
    message: "¡Contraseña cambiada con éxito! Ya podés iniciar sesión.",
  });
}

export async function updateProfileAction(formData: FormData) {
  const session = await getSession();
  if (!session) return fail("Sesión expirada.");

  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const avatar = formData.get("avatar");

  if (!name) return fail("El nombre completo es obligatorio.");
  if (!email || !email.includes("@")) return fail("Ingresá un email válido.");

  let avatarUrl: string | undefined;
  if (avatar instanceof File && avatar.size > 0) {
    if (!avatar.type.startsWith("image/")) {
      return fail("El avatar debe ser una imagen.");
    }
    if (avatar.size > 2 * 1024 * 1024) {
      return fail("El avatar no puede superar 2 MB.");
    }
    const ext =
      avatar.type === "image/png"
        ? "png"
        : avatar.type === "image/webp"
          ? "webp"
          : "jpg";
    const dir = path.join(process.cwd(), "public", "platform", "avatars");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `${session.id}.${ext}`;
    const buffer = Buffer.from(await avatar.arrayBuffer());
    fs.writeFileSync(path.join(dir, filename), buffer);
    avatarUrl = `/platform/avatars/${filename}?v=${Date.now()}`;
  }

  let error = "";
  updateDb((db) => {
    const user = db.users.find((entry) => entry.id === session.id);
    if (!user) {
      error = "Usuario no encontrado.";
      return;
    }
    if (
      email !== user.email &&
      db.users.some((entry) => entry.email === email && entry.id !== user.id)
    ) {
      error = "Ese email ya está en uso.";
      return;
    }
    user.name = name;
    user.company = company || undefined;
    user.country = country || undefined;
    user.phone = phone || undefined;
    user.email = email;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    user.updatedAt = new Date().toISOString();
  });

  if (error) return fail(error);

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/perfil");
  return ok({ message: "Perfil actualizado." });
}

export async function changePasswordAction(formData: FormData) {
  const session = await getSession();
  if (!session) return fail("Sesión expirada.");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !password || !confirmPassword) {
    return fail("Completá todos los campos.");
  }
  if (password !== confirmPassword) {
    return fail("Las contraseñas nuevas no coinciden.");
  }
  const passwordError = passwordStrengthError(password);
  if (passwordError) return fail(passwordError);

  const db = readDb();
  const user = db.users.find((entry) => entry.id === session.id);
  if (!user) return fail("Usuario no encontrado.");
  if (!user.passwordHash) {
    return fail(
      "Esta cuenta usa Google. No tiene contraseña local para cambiar.",
    );
  }
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return fail("La contraseña actual no es correcta.");
  }

  const passwordHash = await hashPassword(password);
  updateDb((next) => {
    const entry = next.users.find((item) => item.id === session.id);
    if (!entry) return;
    entry.passwordHash = passwordHash;
    entry.updatedAt = new Date().toISOString();
  });

  revalidatePath("/plataforma/perfil");
  return ok({ message: "Contraseña actualizada." });
}

export async function deleteAccountAction(formData: FormData) {
  const session = await getSession();
  if (!session) return fail("Sesión expirada.");

  const password = String(formData.get("password") ?? "");
  const confirmText = String(formData.get("confirmText") ?? "")
    .trim()
    .toUpperCase();

  if (confirmText !== "ELIMINAR") {
    return fail('Escribí ELIMINAR para confirmar.');
  }

  const db = readDb();
  const user = db.users.find((entry) => entry.id === session.id);
  if (!user) return fail("Usuario no encontrado.");

  if (user.role === "admin") {
    const admins = db.users.filter((entry) => entry.role === "admin");
    if (admins.length <= 1) {
      return fail("No podés eliminar la única cuenta administrador.");
    }
  }

  if (user.passwordHash) {
    if (!password) return fail("Ingresá tu contraseña para confirmar.");
    if (!(await verifyPassword(password, user.passwordHash))) {
      return fail("La contraseña no es correcta.");
    }
  }

  updateDb((next) => {
    const index = next.users.findIndex((entry) => entry.id === session.id);
    if (index < 0) return;
    if (user.role === "admin") {
      next.users.splice(index, 1);
    } else {
      const entry = next.users[index];
      entry.archived = true;
      entry.accessBlocked = true;
      entry.updatedAt = new Date().toISOString();
    }
  });

  await destroySession();
  revalidatePath("/plataforma");
  redirect("/plataforma/login");
}

function revalidateClients() {
  revalidatePath("/plataforma");
  revalidatePath("/plataforma/clientes");
  revalidatePath("/plataforma/proyectos");
}

export async function updateClientAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const clientId = String(formData.get("clientId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();

  if (!name || !email) return fail("Nombre y email son obligatorios.");

  let error = "";
  updateDb((db) => {
    if (clientId) {
      const user = db.users.find(
        (entry) => entry.id === clientId && entry.role === "client",
      );
      if (!user) {
        error = "Cliente no encontrado.";
        return;
      }
      if (
        db.users.some(
          (entry) => entry.email === email && entry.id !== user.id,
        )
      ) {
        error = "Ese email ya está en uso.";
        return;
      }
      user.name = name;
      user.email = email;
      user.phone = phone || undefined;
      user.company = company || undefined;
      user.updatedAt = new Date().toISOString();

      const project = db.projects.find(
        (entry) => entry.id === (projectId || user.projectId),
      );
      if (project) {
        project.clientName = name;
        project.clientEmail = email;
        project.updatedAt = new Date().toISOString();
      }
      return;
    }

    if (!projectId) {
      error = "Cliente no encontrado.";
      return;
    }
    const project = db.projects.find((entry) => entry.id === projectId);
    if (!project) {
      error = "Proyecto no encontrado.";
      return;
    }
    project.clientName = name;
    project.clientEmail = email;
    project.updatedAt = new Date().toISOString();
  });

  if (error) return fail(error);
  revalidateClients();
  return ok({ message: "Cliente actualizado." });
}

export async function setClientAccessAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const clientId = String(formData.get("clientId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const blocked = String(formData.get("blocked") ?? "") === "1";

  if (!clientId && !projectId) {
    return fail("Cliente no encontrado.");
  }

  let error = "";
  updateDb((db) => {
    const user = clientId
      ? db.users.find(
          (entry) => entry.id === clientId && entry.role === "client",
        )
      : null;
    const seedProject = db.projects.find(
      (entry) => entry.id === (projectId || user?.projectId || ""),
    );

    if (!user && !seedProject) {
      error = "Cliente no encontrado.";
      return;
    }

    const email = (user?.email || seedProject?.clientEmail || "")
      .trim()
      .toLowerCase();
    if (!email) {
      error = "Cliente sin email.";
      return;
    }

    if (user) {
      user.accessBlocked = blocked;
      user.updatedAt = new Date().toISOString();
    }

    for (const project of db.projects) {
      if (project.clientEmail.trim().toLowerCase() !== email) continue;
      if (project.status === "cancelled" || project.status === "completed") {
        continue;
      }
      project.accessEnabled = !blocked;
      project.updatedAt = new Date().toISOString();
    }
  });

  if (error) return fail(error);
  revalidateClients();
  revalidatePath("/plataforma/proyectos");
  return ok({
    message: blocked
      ? "Acceso bloqueado: no puede entrar a la plataforma."
      : "Acceso desbloqueado: puede entrar a la plataforma.",
  });
}

export async function setClientArchivedAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const clientId = String(formData.get("clientId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const archived = String(formData.get("archived") ?? "") === "1";

  if (!clientId && !projectId) return fail("Cliente no encontrado.");

  let error = "";
  updateDb((db) => {
    const user = clientId
      ? db.users.find(
          (entry) => entry.id === clientId && entry.role === "client",
        )
      : null;
    const seedProject = db.projects.find(
      (entry) => entry.id === (projectId || user?.projectId || ""),
    );

    if (!user && !seedProject) {
      error = "Cliente no encontrado.";
      return;
    }

    const email = (
      user?.email ||
      seedProject?.clientEmail ||
      ""
    )
      .trim()
      .toLowerCase();

    if (user) {
      user.archived = archived;
      user.updatedAt = new Date().toISOString();
    }

    for (const project of db.projects) {
      if (project.clientEmail.trim().toLowerCase() !== email) continue;
      project.clientArchived = archived;
      project.updatedAt = new Date().toISOString();
    }
  });

  if (error) return fail(error);
  revalidateClients();
  return ok({
    message: archived ? "Cliente archivado." : "Cliente restaurado.",
  });
}

export async function deleteClientAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const clientId = String(formData.get("clientId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!clientId && !projectId) return fail("Cliente no encontrado.");

  let error = "";
  updateDb((db) => {
    if (clientId) {
      const index = db.users.findIndex(
        (entry) => entry.id === clientId && entry.role === "client",
      );
      if (index < 0) {
        error = "Cliente no encontrado.";
        return;
      }
      db.users.splice(index, 1);
      return;
    }

    // Cliente pendiente (sin registro): elimina todos los proyectos de ese email.
    const seed = db.projects.find((entry) => entry.id === projectId);
    if (!seed) {
      error = "Cliente no encontrado.";
      return;
    }
    const email = seed.clientEmail.trim().toLowerCase();
    db.projects = db.projects.filter(
      (entry) => entry.clientEmail.trim().toLowerCase() !== email,
    );
  });

  if (error) return fail(error);
  revalidateClients();
  revalidatePath("/plataforma/proyectos");
  return ok({ message: "Cliente eliminado." });
}

export async function createProjectAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("Solo el administrador puede crear proyectos.");

  const name = String(formData.get("name") ?? "").trim();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "").trim();
  const value = Number(formData.get("value") ?? 0);
  const currency = String(formData.get("currency") ?? "USD") as "ARS" | "USD";
  const description = String(formData.get("description") ?? "").trim();
  const pricingType = String(formData.get("pricingType") ?? "fixed") as PricingType;
  const hoursEstimated = Number(formData.get("hoursEstimated") ?? 0);
  const hoursInvested = Number(formData.get("hoursInvested") ?? 0);
  const hourlyCost = Number(formData.get("hourlyCost") ?? 0);
  const maintenancePlan = formData.get("maintenancePlan") === "on";

  if (!name || !clientName || !clientEmail) {
    return fail("Nombre del proyecto y datos del cliente son obligatorios.");
  }

  const project = createProject({
    name,
    clientName,
    clientEmail,
    value,
    currency,
    description,
    pricingType: pricingType === "hourly" ? "hourly" : "fixed",
    hoursEstimated,
    hoursInvested,
    hourlyCost,
    maintenancePlan,
  });

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/proyectos");
  return ok({ project });
}

export async function updateProjectHoursAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return fail("Proyecto inválido.");

  updateProjectHours(projectId, {
    hoursEstimated: Number(formData.get("hoursEstimated") ?? 0),
    hoursInvested: Number(formData.get("hoursInvested") ?? 0),
    hourlyCost: Number(formData.get("hourlyCost") ?? 0),
    pricingType:
      String(formData.get("pricingType") ?? "fixed") === "hourly"
        ? "hourly"
        : "fixed",
    maintenancePlan: formData.get("maintenancePlan") === "on",
  });

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/proyectos");
  return ok();
}

export async function createProposalAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const title = String(formData.get("title") ?? "").trim();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "")
    .trim()
    .toLowerCase();
  const value = Number(formData.get("value") ?? 0);
  const currency = String(formData.get("currency") ?? "USD") as "ARS" | "USD";
  const status = String(formData.get("status") ?? "sent") as ProposalStatus;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!title || !clientName || !clientEmail) {
    return fail("Título y datos del cliente son obligatorios.");
  }

  const now = new Date().toISOString();
  updateDb((db) => {
    db.proposals.unshift({
      id: createId("prop"),
      title,
      clientName,
      clientEmail,
      value,
      currency,
      status,
      notes: notes || undefined,
      createdAt: now,
      updatedAt: now,
      sentAt: status === "draft" ? null : now,
      decidedAt:
        status === "approved" || status === "rejected" ? now : null,
    });
  });

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/propuestas");
  return ok();
}

export async function updateProposalStatusAction(
  proposalId: string,
  status: ProposalStatus,
) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const now = new Date().toISOString();
  updateDb((db) => {
    const proposal = db.proposals.find((entry) => entry.id === proposalId);
    if (!proposal) return;
    proposal.status = status;
    proposal.updatedAt = now;
    if (status !== "draft" && !proposal.sentAt) proposal.sentAt = now;
    if (status === "approved" || status === "rejected" || status === "expired") {
      proposal.decidedAt = now;
    }
  });

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/propuestas");
  return ok();
}

export async function createSupportTicketAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const title = String(formData.get("title") ?? "").trim();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "")
    .trim()
    .toLowerCase();
  const projectId = String(formData.get("projectId") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "mantenimiento").trim();
  const priority = String(
    formData.get("priority") ?? "medium",
  ) as SupportTicketPriority;
  const description = String(formData.get("description") ?? "").trim();

  if (!title || !clientName) {
    return fail("Título y cliente son obligatorios.");
  }

  const now = new Date().toISOString();
  updateDb((db) => {
    db.supportTickets.unshift({
      id: createId("tkt"),
      title,
      clientName,
      clientEmail,
      projectId,
      category,
      priority:
        priority === "high" || priority === "low" ? priority : "medium",
      status: "open",
      description,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    });
  });

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/soporte");
  return ok();
}

export async function updateSupportTicketStatusAction(
  ticketId: string,
  status: SupportTicketStatus,
) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const now = new Date().toISOString();
  updateDb((db) => {
    const ticket = db.supportTickets.find((entry) => entry.id === ticketId);
    if (!ticket) return;
    ticket.status = status;
    ticket.updatedAt = now;
    ticket.resolvedAt =
      status === "resolved" || status === "closed" ? now : null;
  });

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/soporte");
  return ok();
}

export async function createAcquisitionSpendAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const label = String(formData.get("label") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const currency = String(formData.get("currency") ?? "USD") as "ARS" | "USD";
  const spentAt = String(formData.get("spentAt") ?? "").trim() || new Date().toISOString();

  if (!label || !(amount > 0)) {
    return fail("Indicá concepto e importe del gasto.");
  }

  const now = new Date().toISOString();
  updateDb((db) => {
    db.acquisitionSpends.unshift({
      id: createId("spend"),
      label,
      amount,
      currency,
      spentAt: new Date(spentAt).toISOString(),
      createdAt: now,
    });
  });

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/ventas");
  return ok();
}

export async function finishProjectAction(projectId: string) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  updateProjectStatus(projectId, "completed", 100);
  revalidatePath("/plataforma");
  revalidatePath("/plataforma/proyectos");
  return ok({ message: "Proyecto finalizado. El cliente ya no puede ingresar." });
}

export async function setProjectProgressAction(
  projectId: string,
  progress: number,
  status?: ProjectStatus,
) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  updateProjectProgressAndStatus(projectId, {
    progress,
    status,
  });

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/proyectos");
  return ok();
}

export async function updateProjectBoardAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) return fail("Proyecto inválido.");

  const hoursRaw = Number(formData.get("hoursInvested") ?? NaN);
  const statusRaw = String(formData.get("status") ?? "").trim();
  const status = isProjectStatus(statusRaw) ? statusRaw : undefined;
  const hoursInvested = Number.isFinite(hoursRaw) ? hoursRaw : undefined;

  if (hoursInvested === undefined && !status) {
    return fail("Indicá horas o estado.");
  }

  updateProjectProgressAndStatus(projectId, { hoursInvested, status });
  revalidatePath("/plataforma");
  revalidatePath("/plataforma/proyectos");
  revalidatePath("/plataforma/vista-cliente");
  return ok({ message: "Proyecto actualizado." });
}

export async function updateProjectPaymentAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const projectId = String(formData.get("projectId") ?? "").trim();
  const paymentRaw = String(formData.get("paymentStatus") ?? "").trim();
  if (!projectId) return fail("Proyecto inválido.");
  if (!isProjectPaymentStatus(paymentRaw)) {
    return fail("Estado de pago inválido.");
  }

  updateProjectPaymentStatus(projectId, paymentRaw);
  revalidatePath("/plataforma");
  revalidatePath("/plataforma/proyectos");
  revalidatePath("/plataforma/vista-cliente");
  return ok({ message: "Estado de pago actualizado." });
}

export async function addProjectServiceAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const projectId = String(formData.get("projectId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const hours = Number(formData.get("hours") ?? 0);
  const amount = Number(formData.get("amount") ?? 0);

  if (!projectId) return fail("Proyecto inválido.");
  if (!name) return fail("Indicá el nombre del servicio.");

  const service = addProjectService(projectId, {
    name,
    description,
    hours,
    amount,
  });
  if (!service) return fail("No se pudo agregar el servicio.");

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/proyectos");
  return ok({ service, message: "Servicio agregado al proyecto." });
}

export async function captureLeadAction(input: {
  source: "contact_form" | "chat" | "meeting" | "newsletter" | "other";
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
}) {
  updateDb((db) => {
    db.leads.unshift({
      id: createId("lead"),
      source: input.source,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim(),
      company: input.company?.trim(),
      message: input.message.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    });
    upsertNewsletterSubscriber(db, {
      email: input.email,
      name: input.name,
      source:
        input.source === "newsletter"
          ? "newsletter"
          : input.source === "contact_form"
            ? "contact_form"
            : input.source === "meeting"
              ? "meeting"
              : input.source === "chat"
                ? "chat"
                : "other",
      reactivate: input.source === "newsletter",
    });
  });
  revalidatePath("/plataforma");
  revalidatePath("/plataforma/formularios");
  revalidatePath("/plataforma/inbox");
  revalidatePath("/plataforma/newsletter");
  return ok();
}

export async function captureChatMessageAction(input: {
  name: string;
  email?: string;
  phone?: string;
  body: string;
}) {
  updateDb((db) => {
    db.messages.unshift({
      id: createId("msg"),
      channel: "chat",
      name: input.name.trim(),
      email: input.email?.trim().toLowerCase(),
      phone: input.phone?.trim(),
      body: input.body.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    });
    if (input.email) {
      upsertNewsletterSubscriber(db, {
        email: input.email,
        name: input.name,
        source: "message",
        reactivate: false,
      });
    }
  });
  revalidatePath("/plataforma");
  revalidatePath("/plataforma/mensajes");
  revalidatePath("/plataforma/inbox");
  revalidatePath("/plataforma/newsletter");
  return ok();
}

export async function subscribeNewsletterAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return fail("Ingresá un email válido.");
  }

  const displayName = name || email.split("@")[0] || "Suscriptor";
  let alreadyRegistered = false;
  let shouldSendWelcome = false;

  updateDb((db) => {
    const existing = db.newsletterSubscribers.find(
      (entry) => entry.email === email,
    );
    const isNew = !existing;
    const wasUnsubscribed = existing?.status === "unsubscribed";
    alreadyRegistered = existing?.status === "active";

    upsertNewsletterSubscriber(db, {
      email,
      name: displayName,
      source: "newsletter",
      reactivate: true,
    });

    shouldSendWelcome = isNew || Boolean(wasUnsubscribed);
  });

  revalidatePath("/plataforma/newsletter");

  if (alreadyRegistered) {
    return ok({
      alreadyRegistered: true,
      welcomeSent: false,
      message: "Este email ya está registrado en la newsletter.",
    });
  }

  if (!shouldSendWelcome) {
    return ok({
      alreadyRegistered: false,
      welcomeSent: false,
      message: "¡Listo! Ya estás en la lista.",
    });
  }

  const mailed = await sendNewsletterWelcomeEmail(email, displayName);

  if (!mailed.sent) {
    console.error("[newsletter] welcome email not sent", mailed.reason);
    return ok({
      alreadyRegistered: false,
      welcomeSent: false,
      welcomeError: mailed.reason,
      message: "¡Listo! Ya estás en la lista.",
    });
  }

  return ok({
    alreadyRegistered: false,
    welcomeSent: true,
    message: "¡Listo! Ya estás en la lista. Te enviamos el email con tu descuento.",
  });
}

async function sendNewsletterWelcomeEmail(email: string, name: string) {
  const promo = getNewsletterWelcomePromo();
  return notifyNewsletterWelcomeEmail({
    email,
    name,
    subject: buildNewsletterWelcomeSubject(promo.percent),
    textBody: buildNewsletterWelcomeTextBody({
      name,
      email,
      percent: promo.percent,
      code: promo.code,
    }),
    htmlBody: buildNewsletterWelcomeHtmlBody({
      name,
      email,
      percent: promo.percent,
      code: promo.code,
    }),
  });
}

export async function resendNewsletterWelcomeAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Contacto inválido.");

  const db = readDb();
  const entry = db.newsletterSubscribers.find((item) => item.id === id);
  if (!entry) return fail("No encontramos ese contacto.");
  if (entry.status !== "active") {
    return fail("Solo se puede reenviar el descuento a contactos activos.");
  }

  const mailed = await sendNewsletterWelcomeEmail(entry.email, entry.name);
  if (!mailed.sent) {
    console.error("[newsletter] resend welcome failed", mailed.reason);
    if (mailed.reason === "outdated_script") {
      return fail(
        "El script de Google está desactualizado. Pegá scripts/google-apps-script-contact.js y publicá una nueva versión.",
      );
    }
    if (mailed.reason === "missing_webhook") {
      return fail("Falta configurar GOOGLE_CONTACT_WEBHOOK_URL.");
    }
    return fail("No se pudo enviar el email. Probá de nuevo en unos minutos.");
  }

  return ok({ message: `Email de descuento reenviado a ${entry.email}.` });
}

export async function addNewsletterSubscriberAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return fail("Ingresá un email válido.");
  }

  updateDb((db) => {
    upsertNewsletterSubscriber(db, {
      email,
      name: name || email.split("@")[0] || "Suscriptor",
      source: "manual",
      reactivate: true,
    });
  });

  revalidatePath("/plataforma/newsletter");
  return ok();
}

export async function setNewsletterStatusAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as
    | "active"
    | "unsubscribed";

  if (!id) return fail("Contacto inválido.");
  if (status !== "active" && status !== "unsubscribed") {
    return fail("Estado inválido.");
  }

  let found = false;
  updateDb((db) => {
    found = Boolean(setNewsletterSubscriberStatus(db, id, status));
  });

  if (!found) return fail("No encontramos ese contacto.");
  revalidatePath("/plataforma/newsletter");
  return ok();
}

export async function deleteNewsletterSubscriberAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Contacto inválido.");

  let removed = false;
  updateDb((db) => {
    removed = deleteNewsletterSubscriber(db, id);
  });

  if (!removed) return fail("No encontramos ese contacto.");
  revalidatePath("/plataforma/newsletter");
  return ok();
}

export async function unsubscribeNewsletterPublicAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return fail("Ingresá un email válido.");
  }

  const state = { ok: false, missing: false };
  updateDb((db) => {
    const result = unsubscribeNewsletterByEmail(db, email);
    if (result.ok) {
      state.ok = true;
    } else if (result.reason === "missing") {
      state.missing = true;
    }
  });

  if (state.missing) {
    return fail("Ese email no está en nuestra lista.");
  }
  if (!state.ok) {
    return fail("Ingresá un email válido.");
  }

  revalidatePath("/plataforma/newsletter");
  return ok({ message: "Te diste de baja. No te vamos a escribir más." });
}

export async function markLeadReadAction(id: string) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");
  updateDb((db) => {
    const lead = db.leads.find((entry) => entry.id === id);
    if (lead) lead.read = true;
  });
  revalidatePath("/plataforma");
  revalidatePath("/plataforma/formularios");
  revalidatePath("/plataforma/inbox");
  return ok();
}

export async function markLeadUnreadAction(id: string) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");
  updateDb((db) => {
    const lead = db.leads.find((entry) => entry.id === id);
    if (lead) lead.read = false;
  });
  revalidatePath("/plataforma");
  revalidatePath("/plataforma/formularios");
  revalidatePath("/plataforma/inbox");
  return ok();
}

export async function deleteLeadAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const leadId = String(formData.get("leadId") ?? "").trim();
  if (!leadId) return fail("Formulario no encontrado.");

  let error = "";
  updateDb((db) => {
    const index = db.leads.findIndex((entry) => entry.id === leadId);
    if (index < 0) {
      error = "Formulario no encontrado.";
      return;
    }
    db.leads.splice(index, 1);
  });

  if (error) return fail(error);
  revalidatePath("/plataforma");
  revalidatePath("/plataforma/formularios");
  revalidatePath("/plataforma/inbox");
  return ok({ message: "Formulario eliminado." });
}

export async function markMessageReadAction(id: string) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");
  updateDb((db) => {
    const message = db.messages.find((entry) => entry.id === id);
    if (message) message.read = true;
  });
  revalidatePath("/plataforma");
  revalidatePath("/plataforma/mensajes");
  revalidatePath("/plataforma/inbox");
  return ok();
}

export async function markMessageUnreadAction(id: string) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");
  updateDb((db) => {
    const message = db.messages.find((entry) => entry.id === id);
    if (message) message.read = false;
  });
  revalidatePath("/plataforma");
  revalidatePath("/plataforma/mensajes");
  revalidatePath("/plataforma/inbox");
  return ok();
}

export async function setNotificationStatusAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as
    | "new"
    | "read"
    | "archived";
  if (!id) return fail("Notificación no encontrada.");
  if (status !== "new" && status !== "read" && status !== "archived") {
    return fail("Estado inválido.");
  }

  const now = new Date().toISOString();
  updateDb((db) => {
    if (!Array.isArray(db.notificationStates)) db.notificationStates = [];

    if (status === "new") {
      db.notificationStates = db.notificationStates.filter(
        (entry) => entry.id !== id,
      );
    } else {
      const existing = db.notificationStates.find((entry) => entry.id === id);
      if (existing) {
        existing.status = status;
        existing.updatedAt = now;
      } else {
        db.notificationStates.push({ id, status, updatedAt: now });
      }
    }

    // Sincronizar origen (formularios / mensajes / webchat).
    if (id.startsWith("form_")) {
      const lead = db.leads.find((entry) => entry.id === id.slice(5));
      if (lead) lead.read = status !== "new";
    }
    if (id.startsWith("message_")) {
      const message = db.messages.find((entry) => entry.id === id.slice(8));
      if (message) message.read = status !== "new";
    }
    if (id.startsWith("livechat_")) {
      const chat = db.liveChats.find((entry) => entry.id === id.slice(9));
      if (chat && status !== "new") {
        chat.adminLastReadAt = now;
        chat.adminLastSeenAt = now;
      }
    }
  });

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/inbox");
  revalidatePath("/plataforma/formularios");
  revalidatePath("/plataforma/mensajes");
  return ok();
}

export async function deleteMessageAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const messageId = String(formData.get("messageId") ?? "").trim();
  if (!messageId) return fail("Mensaje no encontrado.");

  let error = "";
  updateDb((db) => {
    const index = db.messages.findIndex((entry) => entry.id === messageId);
    if (index < 0) {
      error = "Mensaje no encontrado.";
      return;
    }
    db.messages.splice(index, 1);
  });

  if (error) return fail(error);
  revalidatePath("/plataforma");
  revalidatePath("/plataforma/mensajes");
  revalidatePath("/plataforma/inbox");
  return ok({ message: "Mensaje eliminado." });
}

export async function saveBlogPostAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "Novedades").trim();
  const cover = String(formData.get("cover") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const publish = String(formData.get("publish") ?? "0") === "1";

  if (!title || !content) return fail("Título y contenido son obligatorios.");

  const makeSlug = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);

  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  let savedId = id;
  let savedSlug = "";
  let error = "";

  updateDb((db) => {
    const existing = id
      ? db.blogDrafts.find((entry) => entry.id === id)
      : null;

    const slug = existing?.slug || makeSlug(title) || `post-${Date.now()}`;
    savedSlug = slug;

    // Evitar colisión de slug con otro post.
    const clash = db.blogDrafts.find(
      (entry) => entry.slug === slug && entry.id !== (existing?.id ?? ""),
    );
    if (clash) {
      error = "Ya existe un artículo con un slug similar. Cambiá el título.";
      return;
    }

    if (existing) {
      existing.title = title;
      existing.description = description;
      existing.category = category;
      existing.cover = cover || undefined;
      existing.content = content;
      existing.status = publish ? "published" : "draft";
      existing.publishedAt = publish
        ? existing.publishedAt || now.toISOString()
        : null;
      existing.updatedAt = now.toISOString();
      savedId = existing.id;
    } else {
      const draft = {
        id: createId("post"),
        slug,
        title,
        description,
        category,
        cover: cover || undefined,
        content,
        status: publish ? ("published" as const) : ("draft" as const),
        publishedAt: publish ? now.toISOString() : null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      db.blogDrafts.unshift(draft);
      savedId = draft.id;
    }
  });

  if (error) return fail(error);

  const blogDir = path.join(process.cwd(), "content", "blog");
  const file = path.join(blogDir, `${savedSlug}.md`);

  if (publish) {
    if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });
    const frontmatter = [
      "---",
      `title: ${JSON.stringify(title)}`,
      `description: ${JSON.stringify(description)}`,
      `date: ${JSON.stringify(date)}`,
      `category: ${JSON.stringify(category)}`,
      cover ? `cover: ${JSON.stringify(cover)}` : null,
      "draft: false",
      "---",
      "",
      content,
      "",
    ]
      .filter(Boolean)
      .join("\n");
    fs.writeFileSync(file, frontmatter, "utf8");
  } else if (fs.existsSync(file)) {
    // Si pasa a borrador, sacarlo de la web pública.
    fs.unlinkSync(file);
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${savedSlug}`);
  revalidatePath("/plataforma/blog");
  return ok({
    message: publish
      ? "Artículo publicado en el blog."
      : "Borrador guardado.",
    id: savedId,
    slug: savedSlug,
  });
}

/** @deprecated Usar saveBlogPostAction */
export async function publishBlogPostAction(formData: FormData) {
  return saveBlogPostAction(formData);
}

export async function deleteBlogPostAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Artículo inválido.");

  let slug = "";
  let removed = false;
  updateDb((db) => {
    const index = db.blogDrafts.findIndex((entry) => entry.id === id);
    if (index < 0) return;
    slug = db.blogDrafts[index].slug;
    db.blogDrafts.splice(index, 1);
    removed = true;
  });

  if (!removed) return fail("No encontramos ese artículo.");

  if (slug) {
    const file = path.join(process.cwd(), "content", "blog", `${slug}.md`);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }

  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/plataforma/blog");
  return ok({ message: "Artículo eliminado." });
}

export async function createQuoteAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const sourceJson = String(formData.get("sourceJson") ?? "");
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "")
    .trim()
    .toLowerCase();
  const hours = Number(formData.get("hours") ?? 0);
  const hourlyRate = Number(formData.get("hourlyRate") ?? 0);
  const currency =
    String(formData.get("currency") ?? "USD") === "ARS" ? "ARS" : "USD";
  const discountPercent = Number(formData.get("discountPercent") ?? 0);
  const paymentScheduleRaw = String(formData.get("paymentSchedule") ?? "");
  const paymentChannelRaw = String(formData.get("paymentChannel") ?? "");
  const paymentNote = String(formData.get("paymentNote") ?? "").trim();
  const saveToNewsletter = String(formData.get("saveToNewsletter") ?? "") === "1";

  if (!clientName) return fail("Ingresá el nombre del destinatario.");
  if (!clientEmail || !clientEmail.includes("@")) {
    return fail("Ingresá un email válido.");
  }
  if (!Number.isFinite(hours) || hours <= 0) {
    return fail("Definí las horas de trabajo (mayor a 0).");
  }
  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
    return fail("Definí el costo por hora (mayor a 0).");
  }
  if (
    Number.isFinite(discountPercent) &&
    (discountPercent < 0 || discountPercent > 100)
  ) {
    return fail("El descuento debe estar entre 0 y 100%.");
  }
  if (!isQuotePaymentSchedule(paymentScheduleRaw)) {
    return fail("Elegí un esquema de pago válido.");
  }
  if (!isQuotePaymentChannel(paymentChannelRaw)) {
    return fail("Elegí un medio de pago válido.");
  }

  const parsed = parseQuoteJson(sourceJson);
  if (!parsed.ok) return fail(parsed.error);

  // Preferir datos del destinatario elegidos en UI sobre el JSON.
  parsed.payload.client.name = clientName;
  parsed.payload.client.email = clientEmail;

  const quote = createQuote({
    clientName,
    clientEmail,
    hours,
    hourlyRate,
    currency,
    discountPercent,
    paymentSchedule: paymentScheduleRaw,
    paymentChannel: paymentChannelRaw,
    paymentNote,
    sourceJson: parsed.sourceJson,
    normalized: parsed.payload,
  });

  if (saveToNewsletter) {
    updateDb((db) => {
      upsertNewsletterSubscriber(db, {
        email: clientEmail,
        name: clientName,
        source: "manual",
        reactivate: true,
      });
    });
    revalidatePath("/plataforma/newsletter");
  }

  const totalLabel = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(quote.total);

  const gmail = toQuoteGmailUrl({
    email: clientEmail,
    clientName,
    code: quote.code,
    projectTitle: quote.normalized.project.title,
    totalLabel,
    pdfFileName: quote.pdfFileName,
  });

  revalidatePath("/plataforma/cotizador");
  return ok({
    quote,
    gmailUrl: gmail?.url ?? null,
    gmailBody: gmail?.body ?? "",
    pdfPath: `/api/plataforma/quotes/${quote.id}/pdf`,
  });
}

export async function markQuoteSentAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");
  const quoteId = String(formData.get("quoteId") ?? "").trim();
  if (!quoteId) return fail("Cotización no encontrada.");
  markQuoteSent(quoteId);
  revalidatePath("/plataforma/cotizador");
  return ok();
}

export async function approveQuoteAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const quoteId = String(formData.get("quoteId") ?? "").trim();
  if (!quoteId) return fail("Cotización no encontrada.");

  const result = approveQuote(quoteId);
  if (!result) return fail("No se pudo aprobar la cotización.");

  revalidatePath("/plataforma/cotizador");
  revalidatePath("/plataforma/proyectos");
  revalidatePath("/plataforma/clientes");
  revalidatePath("/plataforma");

  const gmailBody = buildProjectRegisteredEmailBody(
    result.project.clientName,
    result.project.code,
  );
  const gmailUrl = toProjectRegisteredGmailUrl(
    result.project.clientEmail,
    result.project.code,
  );

  return ok({
    quote: result.quote,
    project: result.project,
    gmailBody,
    gmailUrl,
    message: `Cotización ${result.quote.code} aprobada. Proyecto ${result.project.code} listo para registro del cliente.`,
  });
}

export async function rejectQuoteAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const quoteId = String(formData.get("quoteId") ?? "").trim();
  if (!quoteId) return fail("Cotización no encontrada.");

  const quote = rejectQuote(quoteId);
  if (!quote) return fail("No se pudo rechazar la cotización.");
  if (quote.status === "approved") {
    return fail("Esta cotización ya está aprobada y tiene proyecto.");
  }
  if (quote.status === "cancelled") {
    return fail("Esta cotización ya está cancelada.");
  }

  revalidatePath("/plataforma/cotizador");
  return ok({
    quote,
    message: `Cotización ${quote.code} rechazada.`,
  });
}

export async function cancelQuoteProjectAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const quoteId = String(formData.get("quoteId") ?? "").trim();
  if (!quoteId) return fail("Cotización no encontrada.");

  const amountRaw = String(formData.get("amountPaid") ?? "").trim();
  const amountPaid = amountRaw === "" ? undefined : Number(amountRaw);
  if (amountPaid !== undefined && (!Number.isFinite(amountPaid) || amountPaid < 0)) {
    return fail("Indicá un monto abonado válido.");
  }

  const result = cancelApprovedQuote(quoteId, amountPaid);
  if (!result) {
    return fail("Solo se pueden cancelar cotizaciones aprobadas con proyecto.");
  }

  revalidatePath("/plataforma/cotizador");
  revalidatePath("/plataforma/proyectos");
  revalidatePath("/plataforma/clientes");
  revalidatePath("/plataforma");

  const money = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: result.quote.currency,
    maximumFractionDigits: 0,
  }).format(result.refundAmount);

  return ok({
    quote: result.quote,
    project: result.project,
    amountPaid: result.amountPaid,
    refundAmount: result.refundAmount,
    message: `Proyecto cancelado. Devolución del 50% registrada: ${money}.`,
  });
}

export async function resendProjectInviteAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) return fail("Proyecto inválido.");

  const project = readDb().projects.find((entry) => entry.id === projectId);
  if (!project) return fail("Proyecto no encontrado.");
  if (project.status === "cancelled" || project.status === "completed") {
    return fail("Este proyecto ya no admite invitación de registro.");
  }

  const gmailBody = buildProjectRegisteredEmailBody(
    project.clientName,
    project.code,
  );
  const gmailUrl = toProjectRegisteredGmailUrl(
    project.clientEmail,
    project.code,
  );
  if (!gmailUrl) return fail("El proyecto no tiene email de cliente.");

  return ok({
    project,
    gmailBody,
    gmailUrl,
    message: `Invitación lista para ${project.code}. Pegá el cuerpo en Gmail (Ctrl+V).`,
  });
}

export async function cancelProjectFromBoardAction(formData: FormData) {
  const session = await requireSession("admin");
  if (!session) return fail("No autorizado.");

  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) return fail("Proyecto inválido.");

  const amountRaw = String(formData.get("amountPaid") ?? "").trim();
  const amountPaid = amountRaw === "" ? undefined : Number(amountRaw);
  if (amountPaid !== undefined && (!Number.isFinite(amountPaid) || amountPaid < 0)) {
    return fail("Indicá un monto abonado válido.");
  }

  const project = readDb().projects.find((entry) => entry.id === projectId);
  if (!project) return fail("Proyecto no encontrado.");

  if (project.quoteId) {
    const result = cancelApprovedQuote(project.quoteId, amountPaid);
    if (!result) {
      return fail("No se pudo cancelar el proyecto vinculado a la cotización.");
    }
    revalidatePath("/plataforma/cotizador");
    revalidatePath("/plataforma/proyectos");
    revalidatePath("/plataforma/clientes");
    revalidatePath("/plataforma");
    const money = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: result.quote.currency,
      maximumFractionDigits: 0,
    }).format(result.refundAmount);
    return ok({
      quote: result.quote,
      project: result.project,
      message: `Proyecto cancelado. Devolución del 50% registrada: ${money}.`,
    });
  }

  updateProjectStatus(projectId, "cancelled");
  revalidatePath("/plataforma/proyectos");
  revalidatePath("/plataforma/clientes");
  revalidatePath("/plataforma");
  return ok({ message: `Proyecto ${project.code} cancelado.` });
}

export async function getDashboardData() {
  await ensurePlatformSeed();
  const session = await getSession();
  if (!session) return null;

  if (session.role === "admin") {
    updateDb((db) => {
      maintainLiveChats(db);
    });
  }
  const db = readDb();
  const metrics = session.role === "admin" ? getMetrics() : null;
  const project =
    session.role === "client" && session.projectId
      ? db.projects.find((entry) => entry.id === session.projectId) ?? null
      : null;
  const clientQuote =
    session.role === "client" && project?.quoteId
      ? (db.quotes ?? []).find((entry) => entry.id === project.quoteId) ?? null
      : null;

  return {
    session,
    metrics,
    project,
    clientQuote,
    projects: session.role === "admin" ? db.projects : project ? [project] : [],
    clients:
      session.role === "admin"
        ? db.users.filter((user) => user.role === "client")
        : [],
    leads: session.role === "admin" ? db.leads : [],
    messages: session.role === "admin" ? db.messages : [],
    blogDrafts: session.role === "admin" ? db.blogDrafts : [],
    proposals: session.role === "admin" ? db.proposals : [],
    supportTickets: session.role === "admin" ? db.supportTickets : [],
    acquisitionSpends: session.role === "admin" ? db.acquisitionSpends : [],
    liveChats:
      session.role === "admin"
        ? readDb().liveChats.map((chat) => ({ ...chat, visitorToken: "" }))
        : [],
    liveChatBotMode:
      session.role === "admin" ? Boolean(db.liveChatBotMode) : false,
    newsletterSubscribers:
      session.role === "admin" ? db.newsletterSubscribers : [],
    quotes: session.role === "admin" ? db.quotes ?? [] : [],
    notificationStates:
      session.role === "admin" ? db.notificationStates ?? [] : [],
  };
}

function requireClientProject() {
  return requireSession("client").then(async (session) => {
    if (!session) return { error: "No autorizado." as const, session: null, projectId: null };
    if (!session.projectId) {
      return { error: "No tenés un proyecto asociado." as const, session, projectId: null };
    }
    const project = readDb().projects.find((entry) => entry.id === session.projectId);
    if (!project) {
      return { error: "Proyecto no encontrado." as const, session, projectId: null };
    }
    if (project.status === "cancelled" || project.status === "completed") {
      return {
        error: "Este proyecto ya no admite cambios.",
        session,
        projectId: project.id,
        project,
      };
    }
    return { error: null, session, projectId: project.id, project };
  });
}

/** Cliente: deja una observación sobre el proyecto. */
export async function submitClientObservationAction(formData: FormData) {
  const gate = await requireClientProject();
  if (gate.error || !gate.projectId) return fail(gate.error || "No autorizado.");

  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 5) return fail("Escribí una observación un poco más detallada.");
  if (body.length > 2000) return fail("La observación es demasiado larga.");

  const now = new Date().toISOString();
  const update: ClientProjectUpdate = {
    id: createId("cup"),
    kind: "observation",
    body,
    createdAt: now,
    status: "open",
  };

  updateDb((db) => {
    const project = db.projects.find((entry) => entry.id === gate.projectId);
    if (!project) return;
    if (!Array.isArray(project.clientUpdates)) project.clientUpdates = [];
    project.clientUpdates.unshift(update);
    project.updatedAt = now;
  });

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/proyectos");
  return ok({ message: "Observación enviada al equipo." });
}

/** Cliente: pide un servicio / cambio adicional. */
export async function submitClientExtraRequestAction(formData: FormData) {
  const gate = await requireClientProject();
  if (gate.error || !gate.projectId) return fail(gate.error || "No autorizado.");

  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 8) return fail("Contanos qué adicional necesitás.");
  if (body.length > 2000) return fail("El pedido es demasiado largo.");

  const now = new Date().toISOString();
  const update: ClientProjectUpdate = {
    id: createId("cup"),
    kind: "extra_request",
    body,
    createdAt: now,
    status: "open",
  };

  updateDb((db) => {
    const project = db.projects.find((entry) => entry.id === gate.projectId);
    if (!project) return;
    if (!Array.isArray(project.clientUpdates)) project.clientUpdates = [];
    project.clientUpdates.unshift(update);
    project.updatedAt = now;
  });

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/proyectos");
  return ok({ message: "Pedido adicional enviado. El equipo lo revisará." });
}

/** Cliente: solicita cancelación + devolución 50% si está en plazo. */
export async function requestClientProjectCancelAction(formData: FormData) {
  const session = await requireSession("client");
  if (!session) return fail("No autorizado.");
  if (!session.projectId) return fail("No tenés un proyecto asociado.");

  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 8) {
    return fail("Contanos el motivo de la cancelación (mínimo unas líneas).");
  }

  const db = readDb();
  const project = db.projects.find((entry) => entry.id === session.projectId);
  if (!project) return fail("Proyecto no encontrado.");
  if (project.status === "cancelled") {
    return fail("Este proyecto ya está cancelado.");
  }
  if (project.status === "completed") {
    return fail("Un proyecto entregado no puede cancelarse por esta vía.");
  }
  if (project.cancelRequest?.status === "pending") {
    return fail("Ya tenés una solicitud de cancelación pendiente.");
  }

  const quote = project.quoteId
    ? (db.quotes ?? []).find((entry) => entry.id === project.quoteId) ?? null
    : null;
  const acceptedAt = quote?.approvedAt || project.createdAt;
  const window = cancelWindowInfo(acceptedAt);
  if (!window.eligible) {
    return fail(
      `El plazo de ${QUOTE_CANCEL_WITHIN_DAYS} días para solicitar cancelación con devolución ya venció.`,
    );
  }

  const amountPaid =
    Number(project.amountPaid) > 0
      ? Number(project.amountPaid)
      : quote
        ? expectedAmountPaid({
            total: quote.total,
            paymentSchedule: quote.paymentSchedule,
          })
        : Number(project.value) || 0;
  const refundEstimate = computeRefundAmount(amountPaid, QUOTE_REFUND_PERCENT);
  const now = new Date().toISOString();

  updateDb((next) => {
    const entry = next.projects.find((item) => item.id === project.id);
    if (!entry) return;
    entry.cancelRequest = {
      requestedAt: now,
      reason,
      status: "pending",
      resolvedAt: null,
    };
    entry.updatedAt = now;
  });

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/proyectos");
  return ok({
    message:
      "Solicitud de cancelación enviada. El equipo la revisará y coordinará la devolución.",
    refundEstimate,
    daysRemaining: window.daysRemaining,
  });
}
