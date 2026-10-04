import assert from "node:assert/strict";
import test from "node:test";
import {
  isCertificateRegistrationEligible,
  isJoiningCertificateEligible,
} from "./joining-certificate";

const now = new Date("2026-03-01T00:00:00.000Z");
const active = {
  profileStatus: "ACTIVE",
  registrationStatus: "ACTIVE",
  registrationExpiryDate: new Date("2027-01-01T00:00:00.000Z"),
  now,
};

test("allows a certificate only for active, unexpired registrations", () => {
  assert.equal(isJoiningCertificateEligible(active), true);
  assert.equal(
    isJoiningCertificateEligible({
      ...active,
      registrationExpiryDate: new Date("2026-02-28T00:00:00.000Z"),
    }),
    false,
  );
  assert.equal(isJoiningCertificateEligible({ ...active, profileStatus: "SUSPENDED" }), false);
  assert.equal(isJoiningCertificateEligible({ ...active, registrationStatus: "REVOKED" }), false);
});

test("public verification additionally requires the certificate to remain active", () => {
  assert.equal(
    isCertificateRegistrationEligible({ ...active, certificateStatus: "ACTIVE" }),
    true,
  );
  assert.equal(
    isCertificateRegistrationEligible({ ...active, certificateStatus: "SUPERSEDED" }),
    false,
  );
});
