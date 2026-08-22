import fs from "fs";
import path from "path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import type { PlatformQuote } from "./types";
import { CONTACT_EMAIL } from "@/lib/site-config";
import {
  QUOTE_PAYMENT_CHANNELS,
  QUOTE_PAYMENT_SCHEDULES,
} from "./quote-commerce";

const BLUE = rgb(0x1b / 255, 0x75 / 255, 0xbb / 255);
const NAVY = rgb(0x0e / 255, 0x33 / 255, 0x5f / 255);
const MUTED = rgb(0x6e / 255, 0x6e / 255, 0x73 / 255);
const TEXT = rgb(0x1d / 255, 0x1d / 255, 0x1f / 255);
const BORDER = rgb(0xd2 / 255, 0xd2 / 255, 0xd7 / 255);
const SOFT = rgb(0xe8 / 255, 0xf4 / 255, 0xfc / 255);
const WHITE = rgb(1, 1, 1);

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_ZONE = 52;

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

function drawFooters(
  doc: PDFDocument,
  font: PDFFont,
  bold: PDFFont,
  quoteCode: string,
) {
  const pages = doc.getPages();
  const total = pages.length;
  const contact = safeText(
    `Ingenio Webs  |  ${CONTACT_EMAIL}  |  +54 9 11 2710-6417  |  www.ingeniowebs.com  |  Argentina`,
  );
  const validity = safeText(
    `Validez: 15 dias corridos. Cancelacion: 15 dias corridos; devolucion 50% de lo abonado (${quoteCode}).`,
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
      y: 34,
      size: 7.5,
      font: bold,
      color: NAVY,
    });
    page.drawText(validity, {
      x: MARGIN,
      y: 20,
      size: 7,
      font,
      color: MUTED,
    });
    const pageLabel = safeText(`Pagina ${index + 1} de ${total}`);
    const pageWidth = font.widthOfTextAtSize(pageLabel, 7.5);
    page.drawText(pageLabel, {
      x: PAGE_WIDTH - MARGIN - pageWidth,
      y: 26,
      size: 7.5,
      font,
      color: MUTED,
    });
  });
}

function drawText(
  cursor: Cursor,
  text: string,
  options: {
    size?: number;
    font?: PDFFont;
    color?: ReturnType<typeof rgb>;
    x?: number;
    maxWidth?: number;
    lineHeight?: number;
    align?: "left" | "justify";
  } = {},
) {
  const size = options.size ?? 10;
  const font = options.font ?? cursor.font;
  const color = options.color ?? TEXT;
  const x = options.x ?? MARGIN;
  const maxWidth = options.maxWidth ?? CONTENT_WIDTH;
  const lineHeight = options.lineHeight ?? size * 1.45;
  const align = options.align ?? "justify";
  const lines = wrapText(safeText(text), font, size, maxWidth);

  for (const line of lines) {
    ensureSpace(cursor, lineHeight + 8);
    const y = cursor.y - size;
    if (align === "justify" && line.justify) {
      drawJustifiedLine(cursor.page, line.text, {
        x,
        y,
        size,
        font,
        color,
        maxWidth,
      });
    } else {
      cursor.page.drawText(line.text, {
        x,
        y,
        size,
        font,
        color,
      });
    }
    cursor.y -= lineHeight;
  }
}

function drawJustifiedLine(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    size: number;
    font: PDFFont;
    color: ReturnType<typeof rgb>;
    maxWidth: number;
  },
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    page.drawText(text, {
      x: options.x,
      y: options.y,
      size: options.size,
      font: options.font,
      color: options.color,
    });
    return;
  }

  const spaceWidth = options.font.widthOfTextAtSize(" ", options.size);
  const wordsWidth = words.reduce(
    (sum, word) => sum + options.font.widthOfTextAtSize(word, options.size),
    0,
  );
  const gaps = words.length - 1;
  const naturalWidth = wordsWidth + spaceWidth * gaps;
  const extra = Math.max(0, options.maxWidth - naturalWidth);
  const gap = spaceWidth + extra / gaps;

  let cursorX = options.x;
  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    page.drawText(word, {
      x: cursorX,
      y: options.y,
      size: options.size,
      font: options.font,
      color: options.color,
    });
    if (index < gaps) {
      cursorX += options.font.widthOfTextAtSize(word, options.size) + gap;
    }
  }
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const paragraphs = text.split(/\n/).map((part) => part.trimEnd());
  const lines: { text: string; justify: boolean }[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push({ text: "", justify: false });
      continue;
    }
    const words = paragraph.split(/\s+/);
    const paragraphLines: string[] = [];
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        current = next;
      } else {
        if (current) paragraphLines.push(current);
        current = word;
      }
    }
    if (current) paragraphLines.push(current);

    paragraphLines.forEach((line, index) => {
      lines.push({
        text: line,
        justify:
          index < paragraphLines.length - 1 && line.trim().includes(" "),
      });
    });
  }

  return lines.length ? lines : [{ text: "", justify: false }];
}

function drawSectionTitle(cursor: Cursor, title: string) {
  ensureSpace(cursor, 56);
  cursor.y -= 22;
  cursor.page.drawText(safeText(title), {
    x: MARGIN,
    y: cursor.y - 12,
    size: 13,
    font: cursor.bold,
    color: NAVY,
  });
  cursor.y -= 20;
  cursor.page.drawLine({
    start: { x: MARGIN, y: cursor.y },
    end: { x: PAGE_WIDTH - MARGIN, y: cursor.y },
    thickness: 2.5,
    color: BLUE,
  });
  cursor.y -= 18;
}

function bulletList(cursor: Cursor, items: string[]) {
  if (items.length === 0) {
    drawText(cursor, "-", { color: MUTED });
    return;
  }
  for (const item of items) {
    ensureSpace(cursor, 24);
    cursor.page.drawCircle({
      x: MARGIN + 4,
      y: cursor.y - 7,
      size: 1.8,
      color: BLUE,
    });
    drawText(cursor, item, {
      x: MARGIN + 14,
      maxWidth: CONTENT_WIDTH - 14,
      size: 10,
    });
    cursor.y -= 3;
  }
}

function drawCard(
  cursor: Cursor,
  height: number,
  options: { fill?: ReturnType<typeof rgb>; border?: ReturnType<typeof rgb> } = {},
) {
  ensureSpace(cursor, height + 8);
  const top = cursor.y;
  cursor.page.drawRectangle({
    x: MARGIN,
    y: top - height,
    width: CONTENT_WIDTH,
    height,
    color: options.fill ?? SOFT,
    borderColor: options.border ?? BLUE,
    borderWidth: 1,
  });
  return top;
}

async function loadLogo(doc: PDFDocument): Promise<PDFImage | null> {
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  if (!fs.existsSync(logoPath)) return null;
  const logoBytes = fs.readFileSync(logoPath);
  try {
    return await doc.embedPng(logoBytes);
  } catch {
    try {
      return await doc.embedJpg(logoBytes);
    } catch {
      return null;
    }
  }
}

export async function buildQuotePdfBuffer(quote: PlatformQuote): Promise<Buffer> {
  const payload = quote.normalized;
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

  // Header: logo + meta card (no dark band)
  const logo = await loadLogo(doc);
  const logoHeight = 72;
  let logoWidth = 0;
  if (logo) {
    logoWidth = Math.min((logo.width / logo.height) * logoHeight, 280);
    cursor.page.drawImage(logo, {
      x: MARGIN,
      y: cursor.y - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
  } else {
    cursor.page.drawText(safeText("Ingenio Webs"), {
      x: MARGIN,
      y: cursor.y - 36,
      size: 24,
      font: bold,
      color: NAVY,
    });
    logoWidth = 180;
  }

  const metaWidth = 168;
  const metaHeight = 72;
  const metaX = PAGE_WIDTH - MARGIN - metaWidth;
  const metaTop = cursor.y;
  cursor.page.drawRectangle({
    x: metaX,
    y: metaTop - metaHeight,
    width: metaWidth,
    height: metaHeight,
    color: WHITE,
    borderColor: BORDER,
    borderWidth: 1,
  });
  cursor.page.drawRectangle({
    x: metaX,
    y: metaTop - 4,
    width: metaWidth,
    height: 4,
    color: BLUE,
  });
  cursor.page.drawText(safeText("Cotizacion"), {
    x: metaX + 14,
    y: metaTop - 22,
    size: 9,
    font: bold,
    color: MUTED,
  });
  cursor.page.drawText(safeText(quote.code), {
    x: metaX + 14,
    y: metaTop - 40,
    size: 12,
    font: bold,
    color: NAVY,
  });
  cursor.page.drawText(safeText(formatDate(quote.createdAt)), {
    x: metaX + 14,
    y: metaTop - 56,
    size: 8,
    font,
    color: MUTED,
  });

  cursor.y -= Math.max(logoHeight, metaHeight) + 28;

  // Client card
  const clientTop = drawCard(cursor, 64);
  cursor.page.drawText(safeText("Cliente"), {
    x: MARGIN + 16,
    y: clientTop - 18,
    size: 8,
    font: bold,
    color: BLUE,
  });
  cursor.page.drawText(
    safeText(quote.clientName || payload.client.name || "-"),
    {
      x: MARGIN + 16,
      y: clientTop - 36,
      size: 13,
      font: bold,
      color: NAVY,
    },
  );
  const clientMeta = [
    payload.client.company,
    quote.clientEmail || payload.client.email,
  ]
    .filter(Boolean)
    .join("  |  ");
  cursor.page.drawText(safeText(clientMeta || "-"), {
    x: MARGIN + 16,
    y: clientTop - 52,
    size: 9,
    font,
    color: MUTED,
  });
  cursor.y = clientTop - 64 - 10;

  drawSectionTitle(cursor, "Proyecto");
  drawText(cursor, payload.project.title, {
    font: bold,
    size: 13,
    color: NAVY,
    lineHeight: 18,
  });
  if (payload.project.summary) {
    cursor.y -= 6;
    drawText(cursor, payload.project.summary, { size: 10 });
  }

  if (payload.project.objectives.length) {
    drawSectionTitle(cursor, "Objetivos");
    bulletList(cursor, payload.project.objectives);
  }
  if (payload.project.scope.length) {
    drawSectionTitle(cursor, "Alcance");
    bulletList(cursor, payload.project.scope);
  }
  if (payload.project.outOfScope.length) {
    drawSectionTitle(cursor, "Fuera de alcance");
    bulletList(cursor, payload.project.outOfScope);
  }

  drawSectionTitle(cursor, "Plan de trabajo");
  for (const [index, phase] of payload.project.phases.entries()) {
    ensureSpace(cursor, 56);
    cursor.y -= index === 0 ? 0 : 10;
    const label = `${String(index + 1).padStart(2, "0")}`;
    cursor.page.drawText(label, {
      x: MARGIN,
      y: cursor.y - 11,
      size: 11,
      font: bold,
      color: BLUE,
    });
    cursor.page.drawText(safeText(phase.name), {
      x: MARGIN + 28,
      y: cursor.y - 11,
      size: 11,
      font: bold,
      color: NAVY,
    });
    const hoursLabel = `${phase.estimatedHours || 0} h`;
    const hoursWidth = bold.widthOfTextAtSize(hoursLabel, 10);
    cursor.page.drawText(hoursLabel, {
      x: PAGE_WIDTH - MARGIN - hoursWidth,
      y: cursor.y - 11,
      size: 10,
      font: bold,
      color: BLUE,
    });
    cursor.y -= 22;
    if (phase.description) {
      drawText(cursor, phase.description, { size: 9.5 });
      cursor.y -= 4;
    }
    if (phase.deliverables.length) {
      drawText(cursor, "Entregables", {
        size: 8.5,
        font: bold,
        color: MUTED,
      });
      cursor.y -= 2;
      for (const item of phase.deliverables) {
        drawText(cursor, `- ${item}`, {
          size: 9.5,
          x: MARGIN + 8,
          maxWidth: CONTENT_WIDTH - 8,
        });
      }
    }
    cursor.y -= 6;
  }

  if (payload.project.timelineNote) {
    cursor.y -= 4;
    drawText(cursor, payload.project.timelineNote, { size: 9, color: MUTED });
  }

  // Investment — light card, not dark block
  const hasDiscount = (quote.discountPercent || 0) > 0;
  const investHeight = hasDiscount ? 116 : 92;
  drawSectionTitle(cursor, "Inversion");
  const investTop = drawCard(cursor, investHeight, {
    fill: WHITE,
    border: BORDER,
  });
  cursor.page.drawRectangle({
    x: MARGIN,
    y: investTop - 4,
    width: CONTENT_WIDTH,
    height: 4,
    color: BLUE,
  });

  const investLines: { label: string; value: string; emphasis?: boolean }[] = [
    { label: "Horas", value: `${quote.hours} h` },
    {
      label: "Tarifa",
      value: `${money(quote.hourlyRate, quote.currency)} / h`,
    },
    {
      label: "Subtotal",
      value: money(quote.subtotal || quote.total, quote.currency),
    },
  ];
  if (hasDiscount) {
    investLines.push({
      label: `Descuento (${quote.discountPercent}%)`,
      value: `-${money(quote.discountAmount, quote.currency)}`,
    });
  }
  investLines.push({
    label: "Total",
    value: money(quote.total, quote.currency),
    emphasis: true,
  });

  let lineY = investTop - 24;
  for (const line of investLines) {
    cursor.page.drawText(safeText(line.label), {
      x: MARGIN + 18,
      y: lineY,
      size: line.emphasis ? 11 : 10,
      font: line.emphasis ? bold : font,
      color: line.emphasis ? NAVY : MUTED,
    });
    const valueWidth = (line.emphasis ? bold : font).widthOfTextAtSize(
      safeText(line.value),
      line.emphasis ? 14 : 10,
    );
    cursor.page.drawText(safeText(line.value), {
      x: PAGE_WIDTH - MARGIN - 18 - valueWidth,
      y: lineY,
      size: line.emphasis ? 14 : 10,
      font: line.emphasis ? bold : font,
      color: line.emphasis ? BLUE : TEXT,
    });
    lineY -= line.emphasis ? 22 : 16;
  }
  cursor.y = investTop - investHeight - 8;

  // Payment terms — clean text, no filled box
  const schedule =
    QUOTE_PAYMENT_SCHEDULES.find((entry) => entry.id === quote.paymentSchedule) ??
    QUOTE_PAYMENT_SCHEDULES[1];
  const channel =
    QUOTE_PAYMENT_CHANNELS.find((entry) => entry.id === quote.paymentChannel) ??
    QUOTE_PAYMENT_CHANNELS[0];

  drawSectionTitle(cursor, "Condiciones comerciales");
  drawText(cursor, "Esquema de pago", {
    font: bold,
    size: 10,
    color: NAVY,
  });
  cursor.y -= 4;
  bulletList(cursor, schedule.pdfLines);
  cursor.y -= 8;
  drawText(cursor, "Medio de pago", {
    font: bold,
    size: 10,
    color: NAVY,
  });
  cursor.y -= 4;
  bulletList(cursor, [channel.pdfLabel]);
  if (quote.paymentNote?.trim()) {
    cursor.y -= 4;
    drawText(cursor, `Detalle: ${quote.paymentNote.trim()}`, {
      size: 9.5,
      color: MUTED,
    });
  }

  cursor.y -= 8;
  drawText(cursor, "Cancelacion y devolucion", {
    font: bold,
    size: 10,
    color: NAVY,
  });
  cursor.y -= 4;
  bulletList(cursor, [
    "La cancelacion del proyecto puede solicitarse dentro de los 15 dias corridos desde la aceptacion de la propuesta.",
    "Politica de devolucion: se reintegra el 50% de lo abonado (pago total o parcial, segun el esquema acordado).",
  ]);

  if (payload.project.assumptions.length) {
    drawSectionTitle(cursor, "Supuestos");
    bulletList(cursor, payload.project.assumptions);
  }
  if (payload.project.notes) {
    drawSectionTitle(cursor, "Notas");
    drawText(cursor, payload.project.notes, { size: 10 });
  }

  // Signature
  ensureSpace(cursor, 110);
  cursor.y -= 28;
  drawText(cursor, "Quedo a disposicion ante cualquier consulta.", {
    size: 10,
  });
  cursor.y -= 6;
  drawText(cursor, "Saludos cordiales,", { size: 10 });
  cursor.y -= 22;
  drawText(cursor, "Marco Bretschneider", {
    font: bold,
    size: 12,
    color: NAVY,
  });
  cursor.y -= 2;
  drawText(cursor, "CEO Ingenio Webs", {
    size: 9.5,
    color: MUTED,
  });

  drawFooters(doc, font, bold, quote.code);

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
