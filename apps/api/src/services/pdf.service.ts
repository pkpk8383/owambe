import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { logger } from '../utils/logger';

interface PdfContractData {
  reference: string;
  title: string;
  bodyHtml: string;
  plannerName: string;
  plannerEmail: string;
  vendorName: string;
  vendorEmail: string;
  eventDate?: Date;
  eventVenue?: string;
  totalAmount?: number;
  currency?: string;
  signerName?: string;
  signerRole?: string;
  signedAt?: Date;
  signerIp?: string;
  plannerSignedAt?: Date;
  vendorSignedAt?: Date;
  plannerSignatureData?: string;
  vendorSignatureData?: string;
}

// Strip HTML tags for plain text extraction
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Wrap text to max width
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateContractPdf(data: PdfContractData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const timesRoman = await doc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 56;
  const pageW = 595; // A4
  const pageH = 842;
  const contentW = pageW - margin * 2;
  const brandGreen = rgb(0.176, 0.416, 0.31);
  const brandOrange = rgb(0.906, 0.435, 0.165);
  const textDark = rgb(0.102, 0.086, 0.071);
  const textMuted = rgb(0.604, 0.565, 0.502);
  const borderColor = rgb(0.886, 0.867, 0.835);
  const bgGreen = rgb(0.933, 0.969, 0.941);
  const bgAmber = rgb(0.996, 0.953, 0.78);

  let page = doc.addPage([pageW, pageH]);
  let y = pageH - margin;

  function checkNewPage(needed = 60) {
    if (y < margin + needed) {
      page = doc.addPage([pageW, pageH]);
      y = pageH - margin;
      drawFooter();
    }
  }

  function drawFooter() {
    page.drawLine({
      start: { x: margin, y: margin + 20 },
      end: { x: pageW - margin, y: margin + 20 },
      thickness: 0.5,
      color: borderColor,
    });
    page.drawText(`owambe.com · ${data.reference} · Confidential`, {
      x: margin,
      y: margin + 6,
      size: 8,
      font: helvetica,
      color: textMuted,
    });
    page.drawText(`Page ${doc.getPageCount()}`, {
      x: pageW - margin - 40,
      y: margin + 6,
      size: 8,
      font: helvetica,
      color: textMuted,
    });
  }

  // ── COVER HEADER ──────────────────────────────────
  // Green header bar
  page.drawRectangle({ x: 0, y: pageH - 90, width: pageW, height: 90, color: brandGreen });

  page.drawText('owambe.com', {
    x: margin,
    y: pageH - 30,
    size: 10,
    font: helveticaBold,
    color: rgb(1, 1, 1),
    opacity: 0.7,
  });

  page.drawText(data.title, {
    x: margin,
    y: pageH - 54,
    size: 20,
    font: timesBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Reference: ${data.reference}   ·   Generated: ${format(new Date(), 'MMMM d, yyyy')}`, {
    x: margin,
    y: pageH - 74,
    size: 9,
    font: helvetica,
    color: rgb(1, 1, 1),
    opacity: 0.75,
  });

  y = pageH - 110;

  // ── PARTIES ───────────────────────────────────────
  const boxH = 64;
  const halfW = (contentW - 12) / 2;

  // Client box
  page.drawRectangle({ x: margin, y: y - boxH, width: halfW, height: boxH, color: bgGreen });
  page.drawText('CLIENT (PLANNER)', { x: margin + 10, y: y - 14, size: 8, font: helveticaBold, color: brandGreen });
  page.drawText(data.plannerName, { x: margin + 10, y: y - 28, size: 12, font: timesBold, color: textDark });
  page.drawText(data.plannerEmail, { x: margin + 10, y: y - 42, size: 9, font: helvetica, color: textMuted });
  page.drawText('"the Client"', { x: margin + 10, y: y - 55, size: 8, font: timesRoman, color: textMuted, opacity: 0.8 });

  // Vendor box
  const vx = margin + halfW + 12;
  page.drawRectangle({ x: vx, y: y - boxH, width: halfW, height: boxH, color: bgAmber });
  page.drawText('SERVICE PROVIDER (VENDOR)', { x: vx + 10, y: y - 14, size: 8, font: helveticaBold, color: brandOrange });
  page.drawText(data.vendorName, { x: vx + 10, y: y - 28, size: 12, font: timesBold, color: textDark });
  page.drawText(data.vendorEmail, { x: vx + 10, y: y - 42, size: 9, font: helvetica, color: textMuted });
  page.drawText('"the Service Provider"', { x: vx + 10, y: y - 55, size: 8, font: timesRoman, color: textMuted, opacity: 0.8 });

  y -= boxH + 20;

  // ── EVENT DETAILS ─────────────────────────────────
  if (data.eventDate || data.eventVenue || data.totalAmount) {
    page.drawRectangle({ x: margin, y: y - 56, width: contentW, height: 56, color: rgb(0.961, 0.949, 0.922) });

    const details = [
      data.eventDate && `Event Date: ${format(data.eventDate, 'EEEE, MMMM d, yyyy')}`,
      data.eventVenue && `Venue: ${data.eventVenue}`,
      data.totalAmount && `Total Amount: ${data.currency === 'NGN' ? '₦' : data.currency}${data.totalAmount.toLocaleString('en-NG')}`,
    ].filter(Boolean) as string[];

    details.forEach((detail, i) => {
      const col = i % 2 === 0;
      page.drawText(detail, {
        x: margin + (col ? 10 : contentW / 2 + 10),
        y: y - 18 - Math.floor(i / 2) * 20,
        size: 10,
        font: i === 0 ? helveticaBold : helvetica,
        color: textDark,
      });
    });
    y -= 70;
  }

  // ── CONTRACT BODY (from stripped HTML) ────────────
  page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.5, color: borderColor });
  y -= 16;

  // Extract sections from HTML
  const bodyText = stripHtml(data.bodyHtml);
  const paragraphs = bodyText.split(/\s{2,}/).filter(p => p.trim().length > 10);

  for (const para of paragraphs.slice(0, 50)) { // cap to avoid infinite loop
    checkNewPage(40);
    const lines = wrapText(para, 90);
    for (const line of lines) {
      checkNewPage(14);
      page.drawText(line, { x: margin, y, size: 10, font: timesRoman, color: textDark });
      y -= 14;
    }
    y -= 6;
  }

  // ── SIGNATURE PAGE ────────────────────────────────
  checkNewPage(200);
  y -= 20;

  page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 1.5, color: borderColor });
  y -= 16;

  page.drawText('SIGNATURES', { x: margin, y, size: 9, font: helveticaBold, color: textMuted });
  y -= 24;

  const sigW = (contentW - 24) / 2;

  // Client signature box
  page.drawRectangle({ x: margin, y: y - 80, width: sigW, height: 80, color: rgb(0.98, 0.98, 0.97) });
  page.drawRectangle({ x: margin, y: y - 80, width: sigW, height: 80, borderColor, borderWidth: 0.5 });
  page.drawText('CLIENT', { x: margin + 10, y: y - 14, size: 8, font: helveticaBold, color: textMuted });

  if (data.plannerSignedAt) {
    page.drawText(data.plannerName, { x: margin + 10, y: y - 34, size: 14, font: timesBold, color: brandGreen });
    page.drawText(`Signed: ${format(data.plannerSignedAt, 'MMM d, yyyy · HH:mm')}`, {
      x: margin + 10, y: y - 52, size: 9, font: helvetica, color: textMuted,
    });
    if (data.signerIp) {
      page.drawText(`IP: ${data.signerIp}`, { x: margin + 10, y: y - 64, size: 8, font: helvetica, color: textMuted });
    }
  } else {
    page.drawText('Awaiting signature', { x: margin + 10, y: y - 40, size: 10, font: timesRoman, color: textMuted, opacity: 0.6 });
  }

  // Vendor signature box
  const vsx = margin + sigW + 24;
  page.drawRectangle({ x: vsx, y: y - 80, width: sigW, height: 80, color: rgb(0.98, 0.98, 0.97) });
  page.drawRectangle({ x: vsx, y: y - 80, width: sigW, height: 80, borderColor, borderWidth: 0.5 });
  page.drawText('SERVICE PROVIDER', { x: vsx + 10, y: y - 14, size: 8, font: helveticaBold, color: textMuted });

  if (data.vendorSignedAt) {
    page.drawText(data.vendorName, { x: vsx + 10, y: y - 34, size: 14, font: timesBold, color: brandOrange });
    page.drawText(`Signed: ${format(data.vendorSignedAt, 'MMM d, yyyy · HH:mm')}`, {
      x: vsx + 10, y: y - 52, size: 9, font: helvetica, color: textMuted,
    });
  } else {
    page.drawText('Awaiting signature', { x: vsx + 10, y: y - 40, size: 10, font: timesRoman, color: textMuted, opacity: 0.6 });
  }

  y -= 100;

  // Legal notice
  const notice = 'This document was executed electronically via owambe.com. Electronic signatures are legally binding under Nigerian law. A tamper-evident audit trail is maintained by Owambe for 7 years.';
  const noticeLines = wrapText(notice, 100);
  for (const line of noticeLines) {
    page.drawText(line, { x: margin, y, size: 8, font: helvetica, color: textMuted });
    y -= 11;
  }

  drawFooter();

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
