import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createKaryakartaSlug,
  generateRegistrationNumber,
  karyakartaInputSchema,
} from "./karyakarta-validation";
import { officialLinkSchema } from "./official-link-validation";

const validKaryakarta = {
  name: "Synthetic Member",
  phone: "9990001111",
  email: "",
  daitva: "District Volunteer",
  state: "Rajasthan",
  district: "Jaipur",
  joiningDate: "",
  appointmentStartDate: "",
  appointmentEndDate: "",
  isPublicProfile: true,
  isEmergencyHidden: false,
  isFeatured: false,
  profileStatus: "PENDING",
  displayOrder: 0,
  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
  whatsappContactUrl: "",
  registrationNumber: "",
  issueDate: "",
  expiryDate: "",
  registrationStatus: "PENDING",
};

test("validates member input and normalizes an empty optional email", () => {
  const result = karyakartaInputSchema.safeParse(validKaryakarta);
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.email, "");
});

test("rejects public member details with unsafe URLs", () => {
  assert.equal(
    karyakartaInputSchema.safeParse({
      ...validKaryakarta,
      instagramUrl: "javascript:alert(1)",
    }).success,
    false,
  );
  assert.equal(
    karyakartaInputSchema.safeParse({
      ...validKaryakarta,
      joiningDate: "2026-02-31",
    }).success,
    false,
  );
  assert.equal(
    karyakartaInputSchema.safeParse({
      ...validKaryakarta,
      appointmentStartDate: "2026-03-01",
      appointmentEndDate: "2026-02-28",
    }).success,
    false,
  );
});

test("generates readable registration numbers and stable slugs", () => {
  const registrationNumber = generateRegistrationNumber(
    "Rajasthan",
    "Jaipur",
    2026,
  );
  assert.match(registrationNumber, /^RGRP-RAJA-JAIPUR-2026-\d{8}$/);
  assert.equal(
    createKaryakartaSlug("Synthetic Member", "RGRP-RAJA-JAIPUR-2026-12345678"),
    "synthetic-member-12345678",
  );
});

test("requires territory fields appropriate to official-link scope", () => {
  const link = {
    title: "Official channel",
    platform: "WHATSAPP_CHANNEL",
    url: "https://example.test/channel",
    level: "DISTRICT",
    state: "Rajasthan",
    district: "",
    isPublic: true,
    isActive: true,
    visibility: "PUBLIC",
    displayOrder: 0,
  };
  assert.equal(officialLinkSchema.safeParse(link).success, false);
});
