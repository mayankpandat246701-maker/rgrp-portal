import assert from "node:assert/strict";
import test from "node:test";
import { publicActivityLocation } from "./public-content";

test("hides precise ground-work labels unless exact location is public", () => {
  const activity = {
    exactLocationPublic: false,
    publicLocationLabel: "विशिष्ट गौशाला",
    district: "जयपुर",
    state: "राजस्थान",
  };
  assert.equal(
    publicActivityLocation(activity),
    "विशिष्ट गौशाला, जयपुर, राजस्थान",
  );
  assert.equal(
    publicActivityLocation({ ...activity, exactLocationPublic: true }),
    "विशिष्ट गौशाला, जयपुर, राजस्थान",
  );
});
