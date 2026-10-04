import { randomInt } from "node:crypto";
import { z } from "zod";

export const karyakartaProfileStatuses = [
  "DRAFT",
  "PENDING",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "REVOKED",
  "REJECTED",
  "EXPIRED",
  "ARCHIVED",
] as const;

const optionalHttpsUrl = z
  .union([
    z.literal(""),
    z.string().trim().url().startsWith("https://").refine((value) => {
      const parsed = new URL(value);
      return !parsed.username && !parsed.password;
    }),
  ])
  .transform((value) => (value === "" ? null : value));
const dateInput = z
  .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
  .refine((value) => {
    if (!value) return true;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  })
  .transform((value) => (value ? new Date(`${value}T00:00:00.000Z`) : null));

export const karyakartaInputSchema = z.object({
  name: z.string().trim().min(1).max(150),
  phone: z.string().trim().regex(/^[0-9+()\-\s]{7,24}$/),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]),
  daitva: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120),
  district: z.string().trim().min(1).max(120),
  tehsil: z.string().trim().max(120).nullable().optional(),
  cityOrVillage: z.string().trim().max(120).nullable().optional(),
  publicBio: z.string().trim().max(1000).nullable().optional(),
  joiningDate: dateInput,
  appointmentStartDate: dateInput,
  appointmentEndDate: dateInput,
  isPublicProfile: z.boolean(),
  isEmergencyHidden: z.boolean(),
  isFeatured: z.boolean(),
  profileStatus: z.enum(karyakartaProfileStatuses),
  displayOrder: z.number().int().min(0).max(9999),
  instagramUrl: optionalHttpsUrl,
  facebookUrl: optionalHttpsUrl,
  youtubeUrl: optionalHttpsUrl,
  whatsappContactUrl: z.union([
    z.literal(""),
    z.string().trim().url().refine((url) => {
      if (!URL.canParse(url)) return false;
      const parsed = new URL(url);
      return (
        parsed.protocol === "https:" &&
        ["wa.me", "api.whatsapp.com", "whatsapp.com"].includes(parsed.hostname)
      );
    }),
  ]).transform((value) => (value === "" ? null : value)),
  adminNotes: z.string().trim().max(2000).nullable().optional(),
  registrationNumber: z
    .union([
      z.literal(""),
      z.string().trim().toUpperCase().regex(/^RGRP-[A-Z0-9-]{6,45}$/),
    ])
    .optional(),
  issueDate: dateInput,
  expiryDate: dateInput,
  registrationStatus: z.enum([
    "PENDING",
    "ACTIVE",
    "INACTIVE",
    "EXPIRED",
    "SUSPENDED",
    "REVOKED",
  ]),
  registrationAdminReason: z.string().trim().max(500).nullable().optional(),
}).superRefine((value, context) => {
  if (
    ["SUSPENDED", "REVOKED"].includes(value.registrationStatus) &&
    !value.registrationAdminReason?.trim()
  ) {
    context.addIssue({
      code: "custom",
      path: ["registrationAdminReason"],
      message: "इस पंजीकरण स्थिति के लिए केवल प्रशासक हेतु कारण आवश्यक है।",
    });
  }
  if (
    value.expiryDate &&
    value.issueDate &&
    value.expiryDate <= value.issueDate
  ) {
    context.addIssue({
      code: "custom",
      path: ["expiryDate"],
      message: "समाप्ति तिथि, जारी करने की तिथि के बाद होनी चाहिए।",
    });
  }
  if (
    value.appointmentStartDate &&
    value.appointmentEndDate &&
    value.appointmentEndDate <= value.appointmentStartDate
  ) {
    context.addIssue({
      code: "custom",
      path: ["appointmentEndDate"],
      message: "नियुक्ति समाप्ति तिथि, आरंभ तिथि के बाद होनी चाहिए।",
    });
  }
});

export type KaryakartaInput = z.infer<typeof karyakartaInputSchema>;

function codeFromLocation(value: string, minimum: number): string {
  const code = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return code.length >= minimum ? code : code.padEnd(minimum, "X");
}

export function generateRegistrationNumber(
  state: string,
  district: string,
  year = new Date().getFullYear(),
): string {
  const stateCode = codeFromLocation(state, 2).slice(0, 4);
  const districtCode = codeFromLocation(district, 3).slice(0, 6);
  const suffix = randomInt(10_000_000, 100_000_000);
  return `RGRP-${stateCode}-${districtCode}-${year}-${suffix}`;
}

export function createKaryakartaSlug(name: string, registrationNumber: string) {
  const safeName =
    name
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "karyakarta";
  const suffix = registrationNumber.toLowerCase().split("-").at(-1);
  return `${safeName}-${suffix}`;
}
