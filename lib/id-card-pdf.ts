import "regenerator-runtime/runtime";

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { formatHindiDate } from "@/lib/i18n/hi";

const require = createRequire(join(process.cwd(), "package.json"));
const fontPath = require.resolve(
  "@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff2",
);

/** CR80 landscape in points (85.6mm x 53.98mm). */
export const ID_CARD_WIDTH = 242.65;
export const ID_CARD_HEIGHT = 153.01;

export type IdCardPdfData = {
  name: string;
  daitva: string | null;
  state: string | null;
  district: string | null;
  registrationNumber: string;
  issueDate: Date | null;
  expiryDate: Date | null;
  photo: Buffer | null;
};

function verificationUrl(registrationNumber: string): string {
  const base = process.env.APP_BASE_URL?.trim() || "http://localhost:3000";
  const url = new URL("/verify-id", base);
  url.searchParams.set("reg", registrationNumber);
  return url.toString();
}

export async function createIdCardPdf(data: IdCardPdfData): Promise<Buffer> {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const fontBytes = await readFile(fontPath);
  const font = await document.embedFont(fontBytes, { subset: false });
  document.setTitle(`पहचान पत्र ${data.registrationNumber}`);
  document.setAuthor("राष्ट्रीय गौ रक्षा परिषद");
  document.setSubject("कार्यकर्ता पहचान पत्र");
  document.setCreator("राष्ट्रीय गौ रक्षा परिषद");

  const page = document.addPage([ID_CARD_WIDTH, ID_CARD_HEIGHT]);
  const green = rgb(0.04, 0.27, 0.19);
  const saffron = rgb(0.84, 0.38, 0.08);
  const ink = rgb(0.13, 0.17, 0.15);
  const muted = rgb(0.32, 0.37, 0.34);

  page.drawRectangle({
    x: 4,
    y: 4,
    width: ID_CARD_WIDTH - 8,
    height: ID_CARD_HEIGHT - 8,
    borderColor: green,
    borderWidth: 1.2,
  });

  const organization = "राष्ट्रीय गौ रक्षा परिषद";
  page.drawText(organization, {
    x: 12,
    y: ID_CARD_HEIGHT - 20,
    size: 10,
    font,
    color: green,
  });
  page.drawText("कार्यकर्ता पहचान पत्र", {
    x: 12,
    y: ID_CARD_HEIGHT - 33,
    size: 7.5,
    font,
    color: saffron,
  });

  // Photo box (left).
  const photoX = 12;
  const photoY = 18;
  const photoW = 52;
  const photoH = 62;
  page.drawRectangle({
    x: photoX,
    y: photoY,
    width: photoW,
    height: photoH,
    borderColor: muted,
    borderWidth: 0.6,
  });
  if (data.photo) {
    try {
      const image =
        data.photo[0] === 0x89
          ? await document.embedPng(data.photo)
          : await document.embedJpg(data.photo);
      const scale = Math.min(photoW / image.width, photoH / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      page.drawImage(image, {
        x: photoX + (photoW - w) / 2,
        y: photoY + (photoH - h) / 2,
        width: w,
        height: h,
      });
    } catch {
      page.drawText("फोटो", {
        x: photoX + 14,
        y: photoY + 28,
        size: 8,
        font,
        color: muted,
      });
    }
  } else {
    page.drawText("फोटो उपलब्ध नहीं", {
      x: photoX + 4,
      y: photoY + 28,
      size: 6,
      font,
      color: muted,
    });
  }

  // Details (right of photo).
  const textX = photoX + photoW + 10;
  let cursorY = ID_CARD_HEIGHT - 52;
  const drawLine = (text: string, size: number, color = ink, gap = 11) => {
    page.drawText(text.slice(0, 48), {
      x: textX,
      y: cursorY,
      size,
      font,
      color,
    });
    cursorY -= gap;
  };

  drawLine(data.name, 10, ink, 13);
  drawLine(`दायित्व: ${data.daitva?.trim() || "कार्यकर्ता"}`, 7, ink, 11);
  const region = [data.district, data.state].filter(Boolean).join(", ");
  drawLine(`क्षेत्र: ${region || "—"}`, 7, muted, 11);
  drawLine(`पंजीकरण संख्या: ${data.registrationNumber}`, 6.5, ink, 11);
  drawLine(
    `जारी: ${data.issueDate ? formatHindiDate(data.issueDate) : "—"}`,
    6.5,
    ink,
    11,
  );
  drawLine(
    `वैधता: ${data.expiryDate ? formatHindiDate(data.expiryDate) : "—"}`,
    6.5,
    ink,
    11,
  );

  // QR (bottom-right) linking to public verification.
  const qrDataUrl = await QRCode.toDataURL(verificationUrl(data.registrationNumber), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 160,
  });
  const qrBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
  const qrImage = await document.embedPng(qrBytes);
  page.drawImage(qrImage, {
    x: ID_CARD_WIDTH - 52,
    y: 10,
    width: 40,
    height: 40,
  });

  return Buffer.from(await document.save());
}
