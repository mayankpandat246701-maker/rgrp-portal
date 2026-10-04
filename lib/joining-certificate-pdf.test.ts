import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { createJoiningCertificatePdf } from "./joining-certificate-pdf";

test("generates a single-page PDF with the Hindi font embedded", async () => {
  const pdf = await createJoiningCertificatePdf({
    certificateNumber: "RGRP-CERT-2026-A1B2C3D4",
    name: "परीक्षण कार्यकर्ता",
    daitva: "जिला संयोजक",
    state: "राजस्थान",
    district: "जयपुर",
    registrationNumber: "RGRP-RA-JAI-2026-12345678",
    issueDate: new Date("2026-03-01T00:00:00.000Z"),
    expiryDate: new Date("2027-03-01T00:00:00.000Z"),
  });
  assert.equal(pdf.subarray(0, 5).toString("ascii"), "%PDF-");
  const document = await PDFDocument.load(pdf);
  assert.equal(document.getPageCount(), 1);
  assert.ok(pdf.length > 10_000);
});
