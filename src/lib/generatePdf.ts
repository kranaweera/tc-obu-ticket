import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
// bwip-js is CommonJS; we import the Node.js bundle
import bwipjs from "bwip-js";

export async function generateTicketPdf(name: string, ticketNumber: string) {
  const pdfDoc = await PDFDocument.create();

  // Landscape ticket: 600 x 250 pt (roughly 8.3 x 3.5 in)
  const page = pdfDoc.addPage([600, 250]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // ── Background ──────────────────────────────────────────────────────────────
  // Main ticket body
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.97, 0.97, 0.97),
  });

  // Left color band (placeholder for your brand color)
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 160,
    height,
    color: rgb(0.13, 0.13, 0.13), // dark — replace with brand color
  });

  // Tear-off stub separator (dashed feel via thin line)
  page.drawLine({
    start: { x: 440, y: 10 },
    end: { x: 440, y: height - 10 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
    dashArray: [4, 4],
    dashPhase: 0,
  });

  // ── Left band: rotated event name placeholder ───────────────────────────────
  page.drawText("[ EVENT NAME ]", {
    x: 15,
    y: height / 2 - 40,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
    rotate: degrees(90),
  });

  // ── Main content area ────────────────────────────────────────────────────────
  const contentX = 180;

  // ── Placeholder: logo / header graphic ──────────────────────────────────────
  page.drawRectangle({
    x: contentX,
    y: height - 60,
    width: 240,
    height: 45,
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 1,
    color: rgb(0.93, 0.93, 0.93),
  });
  page.drawText("[ LOGO / HEADER ]", {
    x: contentX + 50,
    y: height - 40,
    size: 10,
    font: fontReg,
    color: rgb(0.5, 0.5, 0.5),
  });

  // ── Event details row ────────────────────────────────────────────────────────
  const detailY = height - 85;
  page.drawText("[ DATE ]", { x: contentX, y: detailY, size: 9, font: fontReg, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("[ TIME ]", { x: contentX + 90, y: detailY, size: 9, font: fontReg, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("[ VENUE ]", { x: contentX + 175, y: detailY, size: 9, font: fontReg, color: rgb(0.5, 0.5, 0.5) });

  // Divider
  page.drawLine({
    start: { x: contentX, y: detailY - 8 },
    end: { x: 420, y: detailY - 8 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  // ── Attendee name ────────────────────────────────────────────────────────────
  page.drawText("ATTENDEE", {
    x: contentX,
    y: detailY - 22,
    size: 7,
    font: fontBold,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText(name.toUpperCase(), {
    x: contentX,
    y: detailY - 38,
    size: 20,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // ── Ticket number ────────────────────────────────────────────────────────────
  page.drawText("TICKET #", {
    x: contentX,
    y: detailY - 60,
    size: 7,
    font: fontBold,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText(ticketNumber, {
    x: contentX,
    y: detailY - 74,
    size: 13,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  // ── Seat / section placeholders ───────────────────────────────────────────────
  page.drawText("SECTION", { x: contentX + 120, y: detailY - 60, size: 7, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("[ - ]", { x: contentX + 120, y: detailY - 74, size: 13, font: fontBold, color: rgb(0.5, 0.5, 0.5) });

  page.drawText("ROW", { x: contentX + 175, y: detailY - 60, size: 7, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("[ - ]", { x: contentX + 175, y: detailY - 74, size: 13, font: fontBold, color: rgb(0.5, 0.5, 0.5) });

  page.drawText("SEAT", { x: contentX + 225, y: detailY - 60, size: 7, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("[ - ]", { x: contentX + 225, y: detailY - 74, size: 13, font: fontBold, color: rgb(0.5, 0.5, 0.5) });

  // ── Barcode (stub area) ───────────────────────────────────────────────────────
  const stubX = 455;

  // Stub header
  page.drawText("ADMIT ONE", {
    x: stubX,
    y: height - 30,
    size: 8,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText(ticketNumber, {
    x: stubX,
    y: height - 44,
    size: 8,
    font: fontReg,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Generate barcode PNG with bwip-js
  const barcodePng = await bwipjs.toBuffer({
    bcid: "code128",
    text: ticketNumber,
    scale: 2,
    height: 18,
    includetext: false,
    backgroundcolor: "f5f5f5",
  });

  const barcodeImage = await pdfDoc.embedPng(barcodePng);
  const barcodeWidth = 120;
  const barcodeHeight = 50;

  page.drawImage(barcodeImage, {
    x: stubX - 5,
    y: height / 2 - barcodeHeight / 2 - 10,
    width: barcodeWidth,
    height: barcodeHeight,
  });

  // Barcode number below
  page.drawText(ticketNumber, {
    x: stubX + 10,
    y: height / 2 - barcodeHeight / 2 - 24,
    size: 7,
    font: fontReg,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Stub name
  page.drawText(name.toUpperCase(), {
    x: stubX,
    y: 30,
    size: 8,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
    maxWidth: 130,
  });

  return pdfDoc.save();
}
