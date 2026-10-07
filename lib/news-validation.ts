import { z } from "zod";

const optionalLocation = z.string().trim().max(120).nullable();
const dateInput = z
  .union([z.literal(""), z.string().datetime({ offset: true })])
  .transform((value) => (value ? new Date(value) : null));

export const newsCategories = [
  "राष्ट्रीय समाचार",
  "राज्य समाचार",
  "जिला समाचार",
  "महत्वपूर्ण सूचना",
  "आगामी कार्यक्रम",
  "प्रेस विज्ञप्ति",
  "अन्य",
] as const;

export const newsPostSchema = z.object({
  slug: z
  .string()
  .trim()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .optional(),
  title: z.string().trim().min(1).max(180),
  shortSummary: z.string().trim().min(1).max(600),
  fullContent: z.string().trim().min(1).max(20_000),
  category: z.enum(newsCategories),
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
  state: optionalLocation,
  district: optionalLocation,
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  homepageDisplayOrder: z.number().int().min(0).max(9999).nullable(),
  scheduledPublishAt: dateInput,
  expiresAt: dateInput,
  archivedAt: dateInput,
  coverImageAltHindi: z.string().trim().max(180).nullable(),
}).superRefine((post, context) => {
  if (post.district && !post.state) {
    context.addIssue({ code: "custom", path: ["state"], message: "राज्य चुनें।" });
  }
  if (post.isFeatured && !post.homepageDisplayOrder && post.homepageDisplayOrder !== 0) {
    context.addIssue({ code: "custom", path: ["homepageDisplayOrder"], message: "मुखपृष्ठ क्रम दर्ज करें।" });
  }
  if (post.scheduledPublishAt && post.expiresAt && post.expiresAt <= post.scheduledPublishAt) {
    context.addIssue({ code: "custom", path: ["expiresAt"], message: "समाप्ति समय प्रकाशन समय के बाद होना चाहिए।" });
  }
});

export type NewsPostInput = z.infer<typeof newsPostSchema>;
