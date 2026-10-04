import "regenerator-runtime/runtime";

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PageSizes, rgb } from "pdf-lib";
import { formatHindiDate } from "@/lib/i18n/hi";

const require = createRequire(join(process.cwd(), "package.json"));
const fontPath = require.resolve(
  "@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff2",
);

export type JoiningCertificateData = {
  certificateNumber: string;
  name: string;
  daitva: string;
  state: string;
  district: string;
  registrationNumber: string;
  issueDate: Date;
  expiryDate: Date | null;
};

function centerX(text: string, size: number, width: number, font: Awaited<ReturnType<PDFDocument["embedFont"]>>) {
  return Math.max(36, (width - font.widthOfTextAtSize(text, size)) / 2);
}

export async function createJoiningCertificatePdf(
  data: JoiningCertificateData,
): Promise<Buffer> {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const fontBytes = await readFile(fontPath);
  const font = await document.embedFont(fontBytes, { subset: false });
  document.setTitle(`कार्यकर्ता नियुक्ति प्रमाणपत्र ${data.certificateNumber}`);
  document.setAuthor("राष्ट्रीय गौ रक्षा परिषद");
  document.setSubject("कार्यकर्ता नियुक्ति प्रमाणपत्र");
  document.setCreator("राष्ट्रीय गौ रक्षा परिषद");

  const page = document.addPage([PageSizes.A4[1], PageSizes.A4[0]]);
  const { width, height } = page.getSize();
  const green = rgb(0.04, 0.27, 0.19);
  const saffron = rgb(0.84, 0.38, 0.08);
  const ink = rgb(0.13, 0.17, 0.15);
  const muted = rgb(0.32, 0.37, 0.34);
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: green,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 32,
    y: 32,
    width: width - 64,
    height: height - 64,
    borderColor: saffron,
    borderWidth: 0.8,
  });

  const organization = "राष्ट्रीय गौ रक्षा परिषद";
  const title = "कार्यकर्ता नियुक्ति प्रमाणपत्र";
  page.drawText(organization, {
    x: centerX(organization, 26, width, font),
    y: height - 106,
    size: 26,
    font,
    color: green,
  });
  page.drawText(title, {
    x: centerX(title, 22, width, font),
    y: height - 151,
    size: 22,
    font,
    color: saffron,
  });

  const intro = "यह प्रमाणित किया जाता है कि";
  page.drawText(intro, {
    x: centerX(intro, 15, width, font),
    y: height - 211,
    size: 15,
    font,
    color: muted,
  });
  page.drawText(data.name, {
    x: centerX(data.name, 29, width, font),
    y: height - 260,
    size: 29,
    font,
    color: ink,
  });

  const responsibility = `को ${data.daitva} के दायित्व हेतु नियुक्त किया गया है।`;
  page.drawText(responsibility, {
    x: centerX(responsibility, 16, width, font),
    y: height - 305,
    size: 16,
    font,
    color: ink,
  });
  const territory = `क्षेत्र: ${data.district}, ${data.state}`;
  page.drawText(territory, {
    x: centerX(territory, 14, width, font),
    y: height - 340,
    size: 14,
    font,
    color: muted,
  });

  const leftX = 90;
  const rightX = width / 2 + 24;
  const rowY = height - 406;
  page.drawText(`पंजीकरण संख्या: ${data.registrationNumber}`, {
    x: leftX,
    y: rowY,
    size: 12,
    font,
    color: ink,
  });
  page.drawText(`प्रमाणपत्र संख्या: ${data.certificateNumber}`, {
    x: rightX,
    y: rowY,
    size: 12,
    font,
    color: ink,
  });
  page.drawText(`जारी तिथि: ${formatHindiDate(data.issueDate)}`, {
    x: leftX,
    y: rowY - 28,
    size: 12,
    font,
    color: ink,
  });
  if (data.expiryDate) {
    page.drawText(`वैधता समाप्ति: ${formatHindiDate(data.expiryDate)}`, {
      x: rightX,
      y: rowY - 28,
      size: 12,
      font,
      color: ink,
    });
  }

  const verification = "राष्ट्रीय गौ रक्षा परिषद द्वारा सत्यापित";
  page.drawText(verification, {
    x: centerX(verification, 12, width, font),
    y: 104,
    size: 12,
    font,
    color: green,
  });
  const signatureX = width - 252;
  page.drawLine({
    start: { x: signatureX, y: 79 },
    end: { x: signatureX + 160, y: 79 },
    thickness: 0.8,
    color: muted,
  });
  page.drawText("अधिकृत प्रशासन", {
    x: signatureX + 41,
    y: 58,
    size: 11,
    font,
    color: muted,
  });

  return Buffer.from(await document.save());
}
