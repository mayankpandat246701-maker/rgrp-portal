import assert from "node:assert/strict";
import test from "node:test";
import { karyakartaApplicationSchema } from "./karyakarta-application";

const application = {
  fullName: "परीक्षण आवेदक",
  fatherName: "परीक्षण पिता",
  motherName: "परीक्षण माता",
  dateOfBirth: "1990-01-01",
  gender: "अन्य",
  category: "सामान्य",
  mobile: "9876543210",
  address: "परीक्षण पता",
  pincode: "302001",
  district: "जयपुर",
  state: "राजस्थान",
  constituency: "जयपुर",
  education: "स्नातक",
  occupation: "सेवा",
  consent: true,
  website: "",
};

test("requires explicit applicant consent", () => {
  assert.equal(karyakartaApplicationSchema.safeParse(application).success, true);
  assert.equal(
    karyakartaApplicationSchema.safeParse({ ...application, consent: false })
      .success,
    false,
  );
});

test("accepts the honeypot field for server-side spam rejection", () => {
  assert.equal(
    karyakartaApplicationSchema.safeParse({ ...application, website: "spam" })
      .success,
    true,
  );
});
