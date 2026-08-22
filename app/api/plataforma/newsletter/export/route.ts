import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/platform/auth";
import {
  newsletterToCsv,
  syncNewsletterFromSources,
} from "@/lib/platform/newsletter";
import type { NewsletterStatus } from "@/lib/platform/types";
import { updateDb, readDb } from "@/lib/platform/store";

export async function GET(request: NextRequest) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  updateDb((db) => {
    syncNewsletterFromSources(db);
  });

  const statusParam = request.nextUrl.searchParams.get("status");
  const formatParam = request.nextUrl.searchParams.get("format");
  const statusFilter =
    statusParam === "active" || statusParam === "unsubscribed"
      ? (statusParam as NewsletterStatus)
      : null;
  const sheetsMode = formatParam === "sheets";

  let subscribers = [...readDb().newsletterSubscribers].sort((a, b) =>
    a.email.localeCompare(b.email),
  );
  if (statusFilter) {
    subscribers = subscribers.filter((entry) => entry.status === statusFilter);
  } else if (sheetsMode) {
    // Para campañas en Google Workspace: solo activos.
    subscribers = subscribers.filter((entry) => entry.status === "active");
  }

  const csv = newsletterToCsv(subscribers, sheetsMode ? "sheets" : "full");
  const body = `\uFEFF${csv}`;
  const stamp = new Date().toISOString().slice(0, 10);
  const suffix = sheetsMode
    ? "-sheets"
    : statusFilter
      ? `-${statusFilter}`
      : "";

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ingenio-newsletter${suffix}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
