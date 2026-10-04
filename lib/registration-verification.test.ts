import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveRegistrationVerificationStatus } from "./registration-verification";

const visibleMember = {
  profileStatus: "ACTIVE",
  isPublicProfile: true,
  isEmergencyHidden: false,
  archivedAt: null,
  expiryDate: null,
  now: new Date("2026-01-01T00:00:00.000Z"),
};

test("verifies only active public profiles with an active unexpired registration", () => {
  assert.equal(
    resolveRegistrationVerificationStatus({ ...visibleMember, registrationStatus: "ACTIVE" }),
    "ACTIVE",
  );
  assert.equal(
    resolveRegistrationVerificationStatus({
      ...visibleMember,
      registrationStatus: "ACTIVE",
      expiryDate: new Date("2025-12-31T23:59:59.000Z"),
    }),
    "EXPIRED",
  );
});

test("returns neutral not-found for unknown and non-public profiles", () => {
  assert.equal(
    resolveRegistrationVerificationStatus({ ...visibleMember, registrationStatus: null }),
    "NOT_FOUND",
  );
  assert.equal(
    resolveRegistrationVerificationStatus({
      ...visibleMember,
      registrationStatus: "ACTIVE",
      isPublicProfile: false,
    }),
    "NOT_FOUND",
  );
  assert.equal(
    resolveRegistrationVerificationStatus({
      ...visibleMember,
      registrationStatus: "ACTIVE",
      isEmergencyHidden: true,
    }),
    "NOT_FOUND",
  );
});

test("provides neutral invalid statuses for public suspended or revoked registrations", () => {
  assert.equal(
    resolveRegistrationVerificationStatus({ ...visibleMember, registrationStatus: "SUSPENDED" }),
    "SUSPENDED",
  );
  assert.equal(
    resolveRegistrationVerificationStatus({ ...visibleMember, registrationStatus: "REVOKED" }),
    "REVOKED",
  );
  assert.equal(
    resolveRegistrationVerificationStatus({
      ...visibleMember,
      profileStatus: "SUSPENDED",
      registrationStatus: "ACTIVE",
    }),
    "SUSPENDED",
  );
});
