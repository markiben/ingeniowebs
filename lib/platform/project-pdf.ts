import fs from "fs";
import path from "path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { PlatformProject, PlatformQuote } from "./types";
import { PROJECT_STATUS_LABELS } from "./project-status";
import { CONTACT_EMAIL } from "@/lib/site-config";

const BLUE = rgb(0x1b / 255, 0x75 / 255, 0xbb / 255);
const NAVY = rgb(0x0e / 255, 0x33 / 255, 0x5f / 255);
const MUTED = rgb(0x6e / 255, 0x6e / 255, 0x73 / 255);
const TEXT = rgb(0x1d / 255, 0x1d / 255, 0x1f / 255);
const BORDER = rgb(0xd2 / 255, 0xd2 / 255, 0xd7 / 255);
const WHITE = rgb(1, 1, 1);

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_ZONE = 48;

function safeText(value: string) {
  return value
    .replace(/\u2022/g, "-")
    .replace(/[–—]/g, "-")
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/·/g, "|")
    .replace(/…/g, "...")
    .replace(/[^\u0000-\u00FF]/g, "?");
}

function money(value: number, currency: "ARS" | "USD") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

type Cursor = {
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;
  doc: PDFDocument;
};

function ensureSpace(cursor: Cursor, needed: number) {
  if (cursor.y - needed < MARGIN + FOOTER_ZONE) {
    cursor.page = cursor.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawPageChrome(cursor.page);
    cursor.y = PAGE_HEIGHT - MARGIN - 12;
  }
}

function drawPageChrome(page: PDFPage) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: WHITE,
  });
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 5,
    height: PAGE_HEIGHT,
    color: BLUE,
  });
}

function drawFooters(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
  const pages = doc.getPages();
  const total = pages.length;
  const contact = safeText(
    `Ingenio Webs  |  ${CONTACT_EMAIL}  |  +54 9 11 2710-6417  |  www.ingeniowebs.com`,
  );

  pages.forEach((page, index) => {
    page.drawLine({
      start: { x: MARGIN, y: FOOTER_ZONE },
      end: { x: PAGE_WIDTH - MARGIN, y: FOOTER_ZONE },
      thickness: 1,
      color: BORDER,
    });
    page.drawText(contact, {
      x: MARGIN,
      y: 28,
      size: 7.5,
      font: bold,
      color: NAVY,
    });
    const pageLabel = safeText(`Pagina ${index + 1} de ${total}`);
    const pageWidth = font.widthOfTextAtSize(pageLabel, 7.5);
    page.drawText(pageLabel, {
      x: PAGE_WIDTH - MARGIN - pageWidth,
      y: 28,
      size: 7.5,
      font,
      color: MUTED,
    });
  });
}

function drawLine(
  cursor: Cursor,
  text: string,
  options: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {},
) {
  const size = options.size ?? 10;
  const font = options.bold ? cursor.bold : cursor.font;
  const color = options.color ?? TEXT;
  ensureSpace(cursor, size * 1.5);
  cursor.page.drawText(safeText(text), {
    x: MARGIN,
    y: cursor.y,
    size,
    font,
    color,
  });
  cursor.y -= size * 1.55;
}

function sectionTitle(cursor: Cursor, title: string) {
  ensureSpace(cursor, 28);
  cursor.y -= 6;
  cursor.page.drawText(safeText(title), {
    x: MARGIN,
    y: cursor.y,
    size: 11,
    font: cursor.bold,
    color: NAVY,
  });
  cursor.y -= 4;
  cursor.page.drawLine({
    start: { x: MARGIN, y: cursor.y },
    end: { x: PAGE_WIDTH - MARGIN, y: cursor.y },
    thickness: 1,
    color: BLUE,
  });
  cursor.y -= 16;
}

export async function buildProjectPdfBuffer(
  project: PlatformProject,
  quote: PlatformQuote | null,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageChrome(page);

  const cursor: Cursor = {
    page,
    y: PAGE_HEIGHT - MARGIN,
    font,
    bold,
    doc,
  };

  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logo = await doc.embedPng(logoBytes);
      const logoW = 120;
      const logoH = (logo.height / logo.width) * logoW;
      cursor.page.drawImage(logo, {
        x: MARGIN,
        y: cursor.y - logoH,
        width: logoW,
        height: logoH,
      });
      cursor.y -= logoH + 18;
    }
  } catch {
    // sin logo
  }

  drawLine(cursor, "Resumen de proyecto", { size: 18, bold: true, color: NAVY });
  drawLine(cursor, project.code, { size: 12, bold: true, color: BLUE });
  cursor.y -= 8;

  drawLine(cursor, project.name, { size: 13, bold: true });
  drawLine(cursor, `Cliente: ${project.clientName}  |  ${project.clientEmail}`, {
    size: 9,
    color: MUTED,
  });
  drawLine(
    cursor,
    `Inicio: ${formatDate(project.createdAt)}  |  Estado: ${PROJECT_STATUS_LABELS[project.status]}  |  Avance: ${project.progress}%`,
    { size: 9, color: MUTED },
  );
  if (project.quoteCode) {
    drawLine(cursor, `Cotizacion de origen: ${project.quoteCode}`, {
      size: 9,
      color: MUTED,
    });
  }
  cursor.y -= 4;

  sectionTitle(cursor, "Economico");
  drawLine(
    cursor,
    `Valor total: ${money(project.value, project.currency)}`,
    { size: 10, bold: true },
  );
  drawLine(
    cursor,
    `Horas estimadas: ${project.hoursEstimated || 0}h  |  Invertidas: ${project.hoursInvested || 0}h`,
    { size: 9, color: MUTED },
  );

  const phases = quote?.normalized?.project?.phases ?? [];
  if (phases.length > 0) {
    sectionTitle(cursor, "Alcance de la cotizacion");
    for (const phase of phases) {
      drawLine(cursor, `${phase.name} (${phase.estimatedHours || 0}h)`, {
        size: 10,
        bold: true,
      });
      if (phase.description) {
        drawLine(cursor, phase.description, { size: 9, color: MUTED });
      }
      for (const item of phase.deliverables.slice(0, 6)) {
        drawLine(cursor, `- ${item}`, { size: 9 });
      }
      cursor.y -= 4;
    }
  } else if (project.description.trim()) {
    sectionTitle(cursor, "Descripcion");
    for (const line of project.description.split("\n").filter(Boolean)) {
      drawLine(cursor, line, { size: 9 });
    }
  }

  const services = project.services ?? [];
  sectionTitle(cursor, "Servicios adicionales");
  if (services.length === 0) {
    drawLine(cursor, "Sin servicios adicionales por ahora.", {
      size: 9,
      color: MUTED,
    });
  } else {
    for (const service of services) {
      drawLine(
        cursor,
        `${service.name}  |  ${service.hours}h  |  ${money(service.amount, project.currency)}`,
        { size: 10, bold: true },
      );
      if (service.description) {
        drawLine(cursor, service.description, { size: 9, color: MUTED });
      }
      cursor.y -= 2;
    }
  }

  drawFooters(doc, font, bold);
  return doc.save();
}
