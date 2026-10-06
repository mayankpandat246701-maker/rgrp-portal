import test from "node:test";
import assert from "node:assert/strict";
import { isSakshamKaryakartaEligible } from "@/lib/saksham-karyakarta-eligibility";

const future = new Date("2030-01-01T00:00:00.000Z");
const past = new Date("2020-01-01T00:00:00.000Z");

const base = {
  profileStatus: "ACTIVE",
  memberStatus: "APPROVED",
  isPublicProfile: true,
  isEmergencyHidden: false,
  archivedAt: null,
  registrationStatus: "ACTIVE",
  registrationExpiryDate: future,
  now: new Date("2026-10-06T00:00:00.000Z"),
};

test("allows only an active visible Saksham Karyakarta", () => {
  assert.equal(isSakshamKaryakartaEligible(base), true);
});

test("rejects a member missing from the public Saksham list", () => {
  assert.equal(
    isSakshamKaryakartaEligible({ ...base, isPublicProfile: false }),
    false,
  );
});

test("rejects emergency-hidden, unapproved, archived, or expired members", () => {
  assert.equal(
    isSakshamKaryakartaEligible({ ...base, isEmergencyHidden: true }),
    false,
  );
  assert.equal(
    isSakshamKaryakartaEligible({ ...base, memberStatus: "PENDING" }),
    false,
  );
  assert.equal(
    isSakshamKaryakartaEligible({ ...base, archivedAt: new Date() }),
    false,
  );
  assert.equal(
    isSakshamKaryakartaEligible({ ...base, registrationExpiryDate: past }),
    false,
  );
});
