import assert from "node:assert/strict";
import { test } from "node:test";

import { leadershipMessageSchema } from "./leadership-message-validation";

const validMessage = {
  name: "Test Leader",
  designation: "National Coordinator",
  message: "A synthetic public message for schema validation.",
  portraitUrl: "",
  sortOrder: 0,
  isPublished: false,
};

test("accepts valid leadership message fields", () => {
  const result = leadershipMessageSchema.parse(validMessage);
  assert.equal(result.portraitUrl, null);
  assert.equal(result.showOnHomepage, true);
  assert.equal(result.displayOrder, 0);
});

test("normalizes homepage ordering and optional territory fields", () => {
  const result = leadershipMessageSchema.parse({
    ...validMessage,
    sortOrder: 7,
    showOnHomepage: false,
    state: " Rajasthan ",
  });
  assert.equal(result.displayOrder, 7);
  assert.equal(result.sortOrder, 7);
  assert.equal(result.showOnHomepage, false);
  assert.equal(result.state, "Rajasthan");
  assert.equal(result.district, null);
});

test("rejects non-HTTPS portrait URLs", () => {
  const result = leadershipMessageSchema.safeParse({
    ...validMessage,
    portraitUrl: "javascript:alert(1)",
  });
  assert.equal(result.success, false);
});

test("rejects empty or excessively long message fields", () => {
  assert.equal(
    leadershipMessageSchema.safeParse({ ...validMessage, name: " " }).success,
    false,
  );
  assert.equal(
    leadershipMessageSchema.safeParse({
      ...validMessage,
      message: "x".repeat(2001),
    }).success,
    false,
  );
});

test("rejects invalid ordering and publication values", () => {
  assert.equal(
    leadershipMessageSchema.safeParse({
      ...validMessage,
      sortOrder: -1,
    }).success,
    false,
  );
  assert.equal(
    leadershipMessageSchema.safeParse({
      ...validMessage,
      isPublished: "true",
    }).success,
    false,
  );
});
