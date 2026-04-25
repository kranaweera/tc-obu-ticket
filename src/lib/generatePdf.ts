import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import bwipjs from "bwip-js";
import fs from "fs/promises";
import path from "path";

export async function generateTicketPdf(name: string, ticketNumber: string) {
  const pdfDoc = await PDFDocument.create();

  const page = pdfDoc.addPage([600, 250]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // ── Background image ─────────────────────────────────────────────────────────
  const bgBytes = await fs.readFile(
    path.join(process.cwd(), "public", "ticket-design.png")
  );
  const bgImage = await pdfDoc.embedPng(bgBytes);
  page.drawImage(bgImage, { x: 0, y: 0, width, height });

  // ── Main content area (left/centre) — dark warm text ─────────────────────────
  const contentX = 180;
  const detailY = height - 85; // 165

  page.drawText("ATTENDEE", {
    x: contentX,
    y: detailY - 7,  // shifted up ~15pt
    size: 7,
    font: fontBold,
    color: rgb(0.4, 0.35, 0.2),
  });
  page.drawText(name.toUpperCase(), {
    x: contentX,
    y: detailY - 23, // shifted up ~15pt
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.08, 0.05),
  });

  page.drawText("TICKET #", {
    x: contentX,
    y: detailY - 45, // shifted up ~15pt
    size: 7,
    font: fontBold,
    color: rgb(0.4, 0.35, 0.2),
  });
  page.drawText(ticketNumber, {
    x: contentX,
    y: detailY - 59, // shifted up ~15pt
    size: 13,
    font: fontBold,
    color: rgb(0.15, 0.12, 0.08),
  });

  // ── Stub area (right side) — white text on dark background ───────────────────
  const stubX = 455;
  const barcodeWidth = 120;
  const barcodeHeight = 50;
  const barcodeX = stubX - 5;
  const barcodeY = height / 2 - barcodeHeight / 2 - 10; // 90

  // White background behind barcode so bars are readable on dark stub
  page.drawRectangle({
    x: barcodeX - 3,
    y: barcodeY - 3,
    width: barcodeWidth + 6,
    height: barcodeHeight + 6,
    color: rgb(1, 1, 1),
  });

  const barcodePng = await bwipjs.toBuffer({
    bcid: "code128",
    text: ticketNumber,
    scale: 2,
    height: 18,
    includetext: false,
  });

  const barcodeImage = await pdfDoc.embedPng(barcodePng);
  page.drawImage(barcodeImage, {
    x: barcodeX,
    y: barcodeY,
    width: barcodeWidth,
    height: barcodeHeight,
  });

  // Ticket number below barcode — white
  page.drawText(ticketNumber, {
    x: stubX + 5,
    y: barcodeY - 14, // just below the white rect
    size: 7,
    font: fontReg,
    color: rgb(1, 1, 1),
  });

  return pdfDoc.save();
}
