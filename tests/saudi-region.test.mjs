import assert from "node:assert/strict";
import test from "node:test";

import {
  SAUDI_OUTLOOK_AREA_IDS,
  SAUDI_TRADITIONAL_NAMES_AR,
  isSaudiCoordinate,
  localizeSaudiOutlook,
  saudiOutlookAreaForCoordinates,
} from "../app/saudi-region.ts";

test("Saudi Arabia keeps the confirmed centuries-old Arabic mansion names", () => {
  assert.deepEqual([...SAUDI_TRADITIONAL_NAMES_AR], [
    "الشرطان", "البطين", "الثريا", "الدبران", "الهقعة", "الهنعة", "الذراع",
    "النثرة", "الطرف", "الجبهة", "الزبرة", "الصرفة", "العواء", "السماك الأعزل",
    "الغفر", "الزبانا", "الإكليل", "القلب", "الشولة", "النعائم", "البلدة",
    "سعد الذابح", "سعد بلع", "سعد السعود", "سعد الأخبية", "الفرغ المقدم",
    "الفرغ المؤخر", "الرشاء",
  ]);
});

test("the offline Saudi outline recognises representative cities without absorbing neighbours", () => {
  for (const [name, latitude, longitude] of [
    ["Riyadh", 24.7136, 46.6753],
    ["Dammam", 26.4207, 50.0888],
    ["Jeddah", 21.4858, 39.1925],
    ["Tabuk", 28.3838, 36.555],
    ["Abha", 18.2164, 42.5053],
    ["Jazan", 16.8892, 42.5511],
  ]) {
    assert.equal(isSaudiCoordinate(latitude, longitude), true, name);
  }

  for (const [name, latitude, longitude] of [
    ["Amman", 31.9539, 35.9106],
    ["Dubai", 25.2048, 55.2708],
    ["Sanaa", 15.3694, 44.191],
    ["Khartoum", 15.5007, 32.5599],
  ]) {
    assert.equal(isSaudiCoordinate(latitude, longitude), false, name);
  }
});

test("exact Saudi coordinates select outlook areas rather than new alignment regions", () => {
  assert.equal(saudiOutlookAreaForCoordinates(24.7136, 46.6753), "saudi_central");
  assert.equal(saudiOutlookAreaForCoordinates(26.4207, 50.0888), "saudi_eastern");
  assert.equal(saudiOutlookAreaForCoordinates(28.3838, 36.555), "saudi_northern");
  assert.equal(saudiOutlookAreaForCoordinates(21.4858, 39.1925), "saudi_red_sea");
  assert.equal(saudiOutlookAreaForCoordinates(18.2164, 42.5053), "saudi_southwest_highlands");
  assert.equal(saudiOutlookAreaForCoordinates(16.8892, 42.5511), "saudi_jazan_coast");
});

test("every Saudi outlook area resolves localized copy for all 28 periods", () => {
  const base = {
    season: "Base season",
    title: "Base title",
    air: "Base air",
    land: "Base land",
    guidance: "Base guidance",
    tone: "neutral",
  };

  for (const areaId of SAUDI_OUTLOOK_AREA_IDS) {
    for (let mansionIndex = 0; mansionIndex < 28; mansionIndex += 1) {
      for (const language of ["en", "ar"]) {
        const localized = localizeSaudiOutlook(base, mansionIndex, areaId, language);
        assert.notEqual(localized.air, base.air);
        assert.notEqual(localized.land, base.land);
        assert.notEqual(localized.guidance, base.guidance);
        assert.match(localized.season, /Base season/);
      }
    }
  }
});
