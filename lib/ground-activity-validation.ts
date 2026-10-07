import { z } from "zod";

const optionalText = z.string().trim().max(160).nullable();
const dateInput = z
  .union([z.literal(""), z.string().datetime({ offset: true })])
  .transform((value) => (value ? new Date(value) : null));

export const activityTypes = [
  "गौ सेवा",
  "गौ बचाव कार्य",
  "चिकित्सा सहायता",
  "जन-जागरूकता अभियान",
  "बैठक एवं संगठन कार्य",
  "प्रशिक्षण कार्यक्रम",
  "सामाजिक सेवा",
  "कानूनी सहायता",
  "अन्य",
] as const;

const optionalHttpsUrl = z.union([
  z.literal(""),
  z.string().trim().url().max(2048).refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  }),
]).transform((value) => (value || null));

export const groundActivitySchema = z.object({
  slug: z
  .string()
  .trim()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .optional(),
  title: z.string().trim().min(1).max(180),
  shortSummary: z.string().trim().min(1).max(600),
  fullDescription: z.string().trim().min(1).max(20_000),
  activityType: z.enum(activityTypes),
  activityDate: z.string().date().transform((value) => new Date(`${value}T00:00:00.000Z`)),
  state: z.string().trim().min(1).max(120),
  district: z.string().trim().min(1).max(120),
  tehsilOrBlock: optionalText,
  cityOrVillage: optionalText,
  publicLocationLabel: z.string().trim().max(180).nullable(),
  exactLocationPublic: z.boolean(),
  mapLink: optionalHttpsUrl,
  isPublished: z.boolean(),
  isFeaturedOnHomepage: z.boolean(),
  homepageDisplayOrder: z.number().int().min(0).max(9999).nullable(),
  scheduledPublishAt: dateInput,
  expiresAt: dateInput,
  archivedAt: dateInput,
  coverImageAltHindi: z.string().trim().max(180).nullable(),
}).superRefine((activity, context) => {
  if (activity.scheduledPublishAt && activity.expiresAt && activity.expiresAt <= activity.scheduledPublishAt) {
    context.addIssue({ code: "custom", path: ["expiresAt"], message: "समाप्ति समय प्रकाशन समय के बाद होना चाहिए।" });
  }
});

export type GroundActivityInput = z.infer<typeof groundActivitySchema>;
