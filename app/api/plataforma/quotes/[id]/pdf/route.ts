import { NextResponse } from "next/server";
import { requireSession } from "@/lib/platform/auth";
import { buildQuotePdfBuffer } from "@/lib/platform/quote-pdf";
import { getQuoteById } from "@/lib/platform/quotes";
import { readDb } from "@/lib/platform/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const quote = getQuoteById(id);
  if (!quote) {
    return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
  }

  if (session.role === "client") {
    const project = session.projectId
      ? readDb().projects.find((entry) => entry.id === session.projectId)
      : null;
    const owns =
      project &&
      (project.quoteId === quote.id ||
        project.clientEmail.toLowerCase() === quote.clientEmail.toLowerCase());
    if (!owns) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  } else if (session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const buffer = await buildQuotePdfBuffer(quote);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${quote.pdfFileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[quote-pdf]", error);
    return NextResponse.json(
      { error: "No se pudo generar el PDF." },
      { status: 500 },
    );
  }
}
