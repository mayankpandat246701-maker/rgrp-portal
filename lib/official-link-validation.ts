import { z } from "zod";

export const officialLinkPlatforms = [
  "INSTAGRAM",
  "FACEBOOK",
  "YOUTUBE",
  "X",
  "WHATSAPP_CHANNEL",
  "WHATSAPP_GROUP",
  "WHATSAPP_CONTACT",
  "TELEGRAM",
  "WEBSITE",
  "EMAIL",
] as const;

export const officialLinkSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    platform: z.enum(officialLinkPlatforms),
    url: z.string().trim().url().max(2048),
    level: z.enum(["NATIONAL", "STATE", "DISTRICT"]),
    state: z.string().trim().max(120).nullable().optional(),
    district: z.string().trim().max(120).nullable().optional(),
    description: z.string().trim().max(500).nullable().optional(),
    contactPersonName: z.string().trim().max(120).nullable().optional(),
    isPublic: z.boolean(),
    isActive: z.boolean(),
    visibility: z.enum(["PUBLIC", "MEMBERS_ONLY", "HIDDEN"]),
    displayOrder: z.number().int().min(0).max(9999),
  })
  .superRefine((link, context) => {
    if (!URL.canParse(link.url)) {
      context.addIssue({
        code: "custom",
        path: ["url"],
        message: "मान्य आधिकारिक लिंक आवश्यक है।",
      });
      return;
    }
    const url = new URL(link.url);
    if (url.username || url.password) {
      context.addIssue({
        code: "custom",
        path: ["url"],
        message: "आधिकारिक लिंक में उपयोगकर्ता नाम या पासवर्ड शामिल नहीं होना चाहिए।",
      });
    }
    if (
      url.protocol !== "https:" &&
      !(link.platform === "EMAIL" && url.protocol === "mailto:")
    ) {
      context.addIssue({
        code: "custom",
        path: ["url"],
        message: "केवल सुरक्षित सार्वजनिक लिंक स्वीकार किए जाते हैं।",
      });
    }
    if (link.level !== "NATIONAL" && !link.state?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["state"],
        message: "राज्य और जिला स्तर के लिंक के लिए राज्य आवश्यक है।",
      });
    }
    if (link.level === "DISTRICT" && !link.district?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["district"],
        message: "जिला स्तर के लिंक के लिए जिला आवश्यक है।",
      });
    }
    if (link.platform === "WHATSAPP_GROUP" && link.visibility === "MEMBERS_ONLY") {
      return;
    }
  });

export type OfficialLinkInput = z.infer<typeof officialLinkSchema>;
