import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeIndianMobile } from "./karyakarta-mobile";

test("accepts plain 10-digit mobile numbers", () => {
  assert.equal(normalizeIndianMobile("9876543210"), "9876543210");
  assert.equal(normalizeIndianMobile("6123456789"), "6123456789");
});

test("accepts +91 and 91 prefixes", () => {
  assert.equal(normalizeIndianMobile("+919876543210"), "9876543210");
  assert.equal(normalizeIndianMobile("919876543210"), "9876543210");
  assert.equal(normalizeIndianMobile("+91 98765 43210"), "9876543210");
});

test("ignores spaces, dashes and brackets", () => {
  assert.equal(normalizeIndianMobile("98765 43210"), "9876543210");
  assert.equal(normalizeIndianMobile("98765-43210"), "9876543210");
  assert.equal(normalizeIndianMobile("(98765) 43210"), "9876543210");
});

test("rejects invalid mobile inputs", () => {
  assert.equal(normalizeIndianMobile("5123456789"), null);
  assert.equal(normalizeIndianMobile("987654321"), null);
  assert.equal(normalizeIndianMobile("98765432100"), null);
  assert.equal(normalizeIndianMobile("abcdefghij"), null);
});

test("rejects null, undefined and empty values", () => {
  assert.equal(normalizeIndianMobile(null), null);
  assert.equal(normalizeIndianMobile(undefined), null);
  assert.equal(normalizeIndianMobile(""), null);
  assert.equal(normalizeIndianMobile("   "), null);
});
