import assert from "node:assert/strict";
import test from "node:test";

import {
  MANSION_MARKERS,
  equatorialToEclipticJ2000,
  projectMarkerToSvg,
} from "../app/mansion-catalogue.ts";

function circularMean(longitudes) {
  const radians = longitudes.map((value) => value * Math.PI / 180);
  const angle = Math.atan2(
    radians.reduce((sum, value) => sum + Math.sin(value), 0),
    radians.reduce((sum, value) => sum + Math.cos(value), 0),
  );
  return (angle * 180 / Math.PI + 360) % 360;
}

test("the audited catalogue has 28 markers and the conventional 365-day lengths", () => {
  assert.equal(MANSION_MARKERS.length, 28);
  assert.equal(MANSION_MARKERS.reduce((sum, marker) => sum + marker.durationDays, 0), 365);
  assert.equal(MANSION_MARKERS[9].durationDays, 14);
  assert.equal(MANSION_MARKERS.filter((marker) => marker.durationDays === 13).length, 27);
});

test("the marker longitudes advance in the traditional station order", () => {
  const means = MANSION_MARKERS.map((marker) => circularMean(
    marker.members.map((member) => equatorialToEclipticJ2000({
      raHours: member.raHoursJ2000,
      decDegrees: member.decDegreesJ2000,
    }).longitudeDegrees),
  ));

  for (let index = 1; index < means.length; index += 1) {
    const forward = (means[index] - means[index - 1] + 360) % 360;
    assert.ok(forward > 0 && forward < 25, `marker ${index + 1} advances ${forward} degrees`);
  }
});

test("every coordinate-based map is finite and hides internal catalogue identifiers", () => {
  for (const marker of MANSION_MARKERS) {
    const projected = projectMarkerToSvg(marker);
    assert.equal(projected.stars.length, marker.members.length);
    assert.ok(Number.isFinite(projected.eclipticLineY));
    for (const star of projected.stars) {
      assert.ok(Number.isFinite(star.x));
      assert.ok(Number.isFinite(star.y));
      assert.equal("auditId" in star, false);
    }
  }
});

test("friendly display names remain the confirmed bilingual list", () => {
  assert.deepEqual(
    [MANSION_MARKERS[6].markerEn, MANSION_MARKERS[6].markerAr],
    ["Gemini Twin Stars", "ذراعا الجوزاء"],
  );
  assert.deepEqual(
    [MANSION_MARKERS[16].markerEn, MANSION_MARKERS[16].markerAr],
    ["Scorpius Head", "رأس العقرب"],
  );
  assert.deepEqual(
    [MANSION_MARKERS[27].markerEn, MANSION_MARKERS[27].markerAr],
    ["Andromeda Belt Star", "بطن الحوت"],
  );
});
