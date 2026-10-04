import assert from "node:assert/strict";
import test from "node:test";
import { newsPostSchema } from "./news-validation";

const validPost = {
  slug: "gau-seva-program",
  title: "गौ सेवा कार्यक्रम",
  shortSummary: "सेवा कार्यक्रम का संक्षिप्त विवरण।",
  fullContent: "कार्यक्रम का पूरा विवरण।",
  category: "राष्ट्रीय समाचार",
  tags: ["गौ सेवा"],
  state: null,
  district: null,
  isPublished: false,
  isFeatured: false,
  homepageDisplayOrder: null,
  scheduledPublishAt: "",
  expiresAt: "",
  archivedAt: "",
  coverImageAltHindi: null,
};

test("accepts a safe Hindi news draft", () => {
  assert.equal(newsPostSchema.safeParse(validPost).success, true);
});

test("rejects unsafe slugs and district content without a state", () => {
  assert.equal(newsPostSchema.safeParse({ ...validPost, slug: "../private" }).success, false);
  assert.equal(newsPostSchema.safeParse({ ...validPost, district: "जयपुर" }).success, false);
});

test("rejects malformed schedules and excessive content", () => {
  assert.equal(newsPostSchema.safeParse({ ...validPost, scheduledPublishAt: "tomorrow" }).success, false);
  assert.equal(newsPostSchema.safeParse({ ...validPost, fullContent: "क".repeat(20_001) }).success, false);
});
