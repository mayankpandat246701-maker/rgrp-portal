import assert from "node:assert/strict";
import { test } from "node:test";
import { officialLinkSchema } from "./official-link-validation";

const nationalLink = {
  title: "Official channel",
  platform: "WHATSAPP_CHANNEL",
  url: "https://example.test/channel",
  level: "NATIONAL",
  isPublic: true,
  isActive: true,
  visibility: "PUBLIC",
  displayOrder: 0,
};

test("accepts a secure national social link", () => {
  assert.equal(officialLinkSchema.safeParse(nationalLink).success, true);
});

test("rejects non-HTTPS social URLs and missing district", () => {
  assert.equal(officialLinkSchema.safeParse({ ...nationalLink, url: "http://example.test" }).success, false);
  assert.equal(
    officialLinkSchema.safeParse({
      ...nationalLink,
      level: "DISTRICT",
      state: "Rajasthan",
      district: "",
    }).success,
    false,
  );
});

test("keeps members-only groups outside public visibility", () => {
  const parsed = officialLinkSchema.safeParse({
    ...nationalLink,
    platform: "WHATSAPP_GROUP",
    visibility: "MEMBERS_ONLY",
  });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.visibility, "MEMBERS_ONLY");
});
