import assert from "node:assert/strict";
import test from "node:test";
import { groundActivitySchema } from "./ground-activity-validation";

const validActivity = {
  slug: "gau-seva-jaipur",
  title: "गौ सेवा शिविर",
  shortSummary: "जयपुर में सेवा शिविर।",
  fullDescription: "शिविर का पूरा विवरण।",
  activityType: "गौ सेवा",
  activityDate: "2026-10-04",
  state: "राजस्थान",
  district: "जयपुर",
  tehsilOrBlock: null,
  cityOrVillage: null,
  publicLocationLabel: "जयपुर जिला",
  exactLocationPublic: false,
  mapLink: "",
  isPublished: false,
  isFeaturedOnHomepage: false,
  homepageDisplayOrder: null,
  scheduledPublishAt: "",
  expiresAt: "",
  archivedAt: "",
  coverImageAltHindi: null,
};

test("accepts a safe draft without exposing an exact location", () => {
  assert.equal(groundActivitySchema.safeParse(validActivity).success, true);
});

test("rejects invalid slugs, dates, and non-HTTPS map links", () => {
  assert.equal(groundActivitySchema.safeParse({ ...validActivity, slug: "bad slug" }).success, false);
  assert.equal(groundActivitySchema.safeParse({ ...validActivity, activityDate: "not-a-date" }).success, false);
  assert.equal(groundActivitySchema.safeParse({ ...validActivity, mapLink: "http://maps.example.test" }).success, false);
});
