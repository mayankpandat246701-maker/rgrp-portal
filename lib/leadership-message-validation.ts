import { z } from "zod";

export const leadershipMessageSchema = z.object({
  name: z.string().trim().min(1).max(100),
  designation: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(2000),
  portraitUrl: z
    .union([z.literal(""), z.string().trim().url().startsWith("https://")])
    .transform((value) => (value === "" ? null : value)),
  sortOrder: z.number().int().min(0).max(9999),
  isPublished: z.boolean(),
});

export type LeadershipMessageInput = z.infer<
  typeof leadershipMessageSchema
>;
