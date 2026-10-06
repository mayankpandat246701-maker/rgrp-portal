import assert from "node:assert/strict";
import { test } from "node:test";

import { isIdCardEligible } from "./id-card-eligibility";

const now = new Date("2026-10-06T00:00:00.000Z");

const eligible = {
  profileStatus: "ACTIVE",
  archivedAt: null,
  registrationStatus: "ACTIVE",
  registrationExpiryDate: new Date("2027-01-01T00:00:00.000Z"),
  now,
};

test("accepts an active unexpired unarchived member", () => {
  assert.equal(isIdCardEligible(eligible), true);
});

test("rejects archived or inactive members", () => {
  assert.equal(
    isIdCardEligible({ ...eligible, archivedAt: new Date("2026-01-01T00:00:00.000Z") }),
    false,
  );
  assert.equal(isIdCardEligible({ ...eligible, profileStatus: "PENDING" }), false);
});

test("rejects inactive or expired registrations", () => {
  assert.equal(
    isIdCardEligible({ ...eligible, registrationStatus: "REVOKED" }),
    false,
  );
  assert.equal(
    isIdCardEligible({
      ...eligible,
      registrationExpiryDate: new Date("2026-02-28T00:00:00.000Z"),
    }),
    false,
  );
});
