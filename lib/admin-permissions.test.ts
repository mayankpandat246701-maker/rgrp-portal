import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canManageKaryakarta,
  canManageOfficialLink,
  officialLinkManagementWhere,
  canViewApplications,
  hasKaryakartaScope,
  karyakartaScopeWhere,
} from "./auth/admin-permissions";
import type { AdminSessionPayload } from "./auth/admin-session";

const stateAdmin: AdminSessionPayload = {
  id: "admin",
  name: "State Admin",
  email: "state-admin@example.test",
  role: "STATE_ADMIN",
  assignedState: "Rajasthan",
  assignedDistrict: null,
};

test("applies state and district scopes from the authenticated admin", () => {
  assert.equal(hasKaryakartaScope(stateAdmin, "Rajasthan", "Jaipur"), true);
  assert.equal(hasKaryakartaScope(stateAdmin, "Gujarat", "Jaipur"), false);
  assert.deepEqual(karyakartaScopeWhere(stateAdmin), { state: "Rajasthan" });
});

test("fails closed when a scoped role has no assigned territory", () => {
  const unassigned = { ...stateAdmin, assignedState: null };
  assert.equal(hasKaryakartaScope(unassigned, "Rajasthan", "Jaipur"), false);
  assert.deepEqual(karyakartaScopeWhere(unassigned), { id: { in: [] } });
});

test("does not grant member management to viewer or content roles", () => {
  assert.equal(canManageKaryakarta("VIEWER"), false);
  assert.equal(canManageKaryakarta("CONTENT_EDITOR"), false);
  assert.equal(canManageKaryakarta("DISTRICT_ADMIN"), true);
  assert.equal(canViewApplications("VIEWER"), true);
  assert.equal(canViewApplications("STATE_ADMIN"), false);
});

test("limits official-link management to the authenticated territory", () => {
  const districtAdmin = {
    id: "admin-1",
    email: "admin@example.test",
    name: "Test Admin",
    role: "DISTRICT_ADMIN" as const,
    assignedState: "Rajasthan",
    assignedDistrict: "Jaipur",
  };
  assert.equal(
    canManageOfficialLink(districtAdmin, "DISTRICT", "Rajasthan", "Jaipur"),
    true,
  );
  assert.equal(
    canManageOfficialLink(districtAdmin, "DISTRICT", "Rajasthan", "Jodhpur"),
    false,
  );
  assert.equal(
    canManageOfficialLink(districtAdmin, "NATIONAL", null, null),
    false,
  );
  assert.deepEqual(officialLinkManagementWhere(districtAdmin), {
    state: "Rajasthan",
    district: "Jaipur",
    level: "DISTRICT",
  });
});
