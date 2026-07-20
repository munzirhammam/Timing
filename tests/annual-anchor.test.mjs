import assert from "node:assert/strict";
import test from "node:test";

import {
  HELIACAL_PROXY,
  MANSION_DAY_LENGTHS,
  annualAnchor,
  annualAnchorIso,
  calendarDateForIso,
  civilDaysBetween,
  cycleAnchorsForIso,
} from "../app/annual-anchor.ts";

test("2026 regional Day 1 anchors match the versioned dawn proxy", () => {
  assert.deepEqual(
    Object.fromEntries(
      [
        "gulf",
        "sudan",
        "australia_tropical",
        "australia_central",
        "australia_temperate",
      ].map((regionId) => [regionId, annualAnchorIso(regionId, 2026)]),
    ),
    {
      gulf: "2026-05-12",
      sudan: "2026-05-10",
      australia_tropical: "2026-05-12",
      australia_central: "2026-05-14",
      australia_temperate: "2026-05-16",
    },
  );
});

test("heliacal result exposes auditable Sun-and-star event metadata", () => {
  const result = annualAnchor("gulf", 2026);
  assert.equal(result.policy, "heliacal-proxy");
  assert.equal(result.criterionId, "al-sharatain-dawn-v1");
  assert.ok(result.betaMarkerUtcIso);
  assert.ok(result.gammaMarkerUtcIso);
  assert.ok(result.eventUtcIso);
  assert.ok(result.sunAltitudeDegrees <= -12);
});

test("manual regional correction moves Day 1 without changing the computed base", () => {
  const corrected = annualAnchor("sudan", 2026, 2);
  assert.equal(corrected.baseIsoDate, "2026-05-10");
  assert.equal(corrected.isoDate, "2026-05-12");
  assert.equal(corrected.correctionDays, 2);
});

test("the conventional mansion sequence is 27 x 13 days plus Al-Jabhah at 14", () => {
  assert.equal(MANSION_DAY_LENGTHS.length, 28);
  assert.equal(MANSION_DAY_LENGTHS[9], 14);
  assert.equal(MANSION_DAY_LENGTHS.filter((days) => days === 13).length, 27);
  assert.equal(MANSION_DAY_LENGTHS.reduce((sum, days) => sum + days, 0), 365);

  const alJabhahDay14 = calendarDateForIso("2026-09-19", "gulf");
  assert.equal(alJabhahDay14.kind, "mansion");
  assert.equal(alJabhahDay14.mansionIndex, 9);
  assert.equal(alJabhahDay14.dayInMansion, 14);
});

test("a 366-day anchor interval has one unnumbered alignment day", () => {
  const anchors = cycleAnchorsForIso("2025-05-11", "gulf");
  assert.deepEqual(anchors, {
    cycleYear: 2024,
    dayOneIso: "2024-05-11",
    nextDayOneIso: "2025-05-12",
    intervalDays: 366,
  });
  assert.equal(civilDaysBetween(anchors.dayOneIso, anchors.nextDayOneIso), 366);

  const lastMansionDay = calendarDateForIso("2025-05-10", "gulf");
  assert.equal(lastMansionDay.kind, "mansion");
  assert.equal(lastMansionDay.cycleDay, 365);
  assert.equal(lastMansionDay.mansionIndex, 27);
  assert.equal(lastMansionDay.dayInMansion, 13);

  const alignment = calendarDateForIso("2025-05-11", "gulf");
  assert.deepEqual(alignment, {
    kind: "alignment",
    dateIso: "2025-05-11",
    cycleYear: 2024,
    cycleDay: 366,
    dayOneIso: "2024-05-11",
    nextDayOneIso: "2025-05-12",
    intervalDays: 366,
    alignmentDay: 1,
    mansionIndex: null,
    mansionNumber: null,
    dayInMansion: null,
    mansionLength: null,
  });
});

test("the neutral classical profile keeps its explicitly fixed reference date", () => {
  assert.equal(annualAnchorIso("classical", 2026), "2026-04-05");
  assert.equal(annualAnchor("classical", 2026).policy, "fixed-month-day");
});

test("all regional annual intervals remain representable from 2020 through 2030", () => {
  for (const regionId of [
    "gulf",
    "sudan",
    "australia_tropical",
    "australia_central",
    "australia_temperate",
  ]) {
    for (let year = 2020; year <= 2030; year += 1) {
      const interval = civilDaysBetween(
        annualAnchorIso(regionId, year),
        annualAnchorIso(regionId, year + 1),
      );
      assert.ok(interval === 365 || interval === 366, `${regionId} ${year}: ${interval}`);
    }
  }
});

test("future regions can reuse the same policy with only a local observer and time zone", () => {
  const futureRegion = {
    id: "future_region_example",
    timeZone: "Australia/Perth",
    observer: { latitude: -31.9523, longitude: 115.8613, elevationMeters: 0 },
    policy: { kind: "heliacal-proxy", criterionId: HELIACAL_PROXY.id },
  };
  const result = annualAnchor(futureRegion, 2026);
  assert.equal(result.regionId, "future_region_example");
  assert.equal(result.isoDate, "2026-05-16");
  assert.equal(result.criterionId, HELIACAL_PROXY.id);
});
