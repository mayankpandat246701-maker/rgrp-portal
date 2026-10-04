import { z } from "zod";

export const leadershipMessageSchema = z.object({
  name: z.string().trim().min(1).max(100),
  designation: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(2000),
  portraitUrl: z
    .union([z.literal(""), z.string().trim().url().startsWith("https://")])
    .transform((value) => (value === "" ? null : value)),
  state: z.string().trim().max(120).optional().nullable(),
  district: z.string().trim().max(120).optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  displayOrder: z.number().int().min(0).max(9999).optional(),
  showOnHomepage: z.boolean().default(true),
  isPublished: z.boolean(),
}).transform((value) => ({
  ...value,
  state: value.state || null,
  district: value.district || null,
  displayOrder: value.displayOrder ?? value.sortOrder ?? 0,
  sortOrder: value.displayOrder ?? value.sortOrder ?? 0,
}));

export type LeadershipMessageInput = z.infer<
  typeof leadershipMessageSchema
>;
