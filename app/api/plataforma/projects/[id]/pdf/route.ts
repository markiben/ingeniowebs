import { NextResponse } from "next/server";
import { requireSession } from "@/lib/platform/auth";
import { buildProjectPdfBuffer } from "@/lib/platform/project-pdf";
import { getProjectById } from "@/lib/platform/projects";
import { getQuoteById } from "@/lib/platform/quotes";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const project = getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  if (session.role === "client" && session.projectId !== project.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (session.role !== "admin" && session.role !== "client") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const quote = project.quoteId ? getQuoteById(project.quoteId) : null;

  try {
    const buffer = await buildProjectPdfBuffer(project, quote);
    const fileName = `proyecto-${project.code.toLowerCase()}.pdf`;
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[project-pdf]", error);
    return NextResponse.json(
      { error: "No se pudo generar el PDF." },
      { status: 500 },
    );
  }
}
