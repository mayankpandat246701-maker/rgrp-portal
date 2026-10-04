import { z } from "zod";

const textField = (maxLength: number) =>
  z.string().trim().min(1).max(maxLength);

const optionalTextField = (maxLength: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maxLength).optional(),
  );

const normalizePhone = (value: unknown) => {
  if (typeof value !== "string") return value;

  let digits = value.trim().replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }
  return digits;
};

const phoneField = z.preprocess(
  normalizePhone,
  z.string().regex(/^[6-9]\d{9}$/),
);

const optionalPhoneField = z.preprocess(
  (value) => {
    if (typeof value !== "string" || value.trim() === "") return undefined;
    return normalizePhone(value);
  },
  z.string().regex(/^[6-9]\d{9}$/).optional(),
);

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  });

const optionalSocialMediaLinks = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .trim()
    .max(4000)
    .refine((value) => {
      try {
        const parsed: unknown = JSON.parse(value);
        return (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        );
      } catch {
        return false;
      }
    })
    .optional(),
);

export const karyakartaApplicationSchema = z
  .object({
    fullName: textField(150),
    fatherName: textField(150),
    motherName: textField(150),
    dateOfBirth: dateField,
    gender: textField(40),
    category: textField(80),
    mobile: phoneField,
    alternateMobile: optionalPhoneField,
    email: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === ""
          ? undefined
          : typeof value === "string"
            ? value.trim().toLowerCase()
            : value,
      z.string().email().max(254).optional(),
    ),
    address: textField(1000),
    pincode: z.string().trim().regex(/^[1-9]\d{5}$/),
    district: textField(120),
    state: textField(120),
    constituency: textField(120),
    education: textField(120),
    occupation: textField(120),
    organizationName: optionalTextField(200),
    designation: optionalTextField(120),
    joiningReason: optionalTextField(2000),
    socialMediaLinks: optionalSocialMediaLinks,
    referenceBy: optionalTextField(150),
    consent: z.literal(true),
    website: z.string().max(200).optional().default(""),
  })
  .strict();

export type KaryakartaApplicationInput = z.infer<
  typeof karyakartaApplicationSchema
>;
