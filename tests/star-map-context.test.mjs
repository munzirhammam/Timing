import assert from "node:assert/strict";
import test from "node:test";

import {
  MANSION_STAR_GROUP_SAMPLES,
  STAR_GROUP_PATTERNS,
  starGroupSampleFor,
} from "../app/star-map-context.ts";

test("all 28 mansions retain a surrounding star-group sample", () => {
  assert.equal(MANSION_STAR_GROUP_SAMPLES.length, 28);

  MANSION_STAR_GROUP_SAMPLES.forEach((sample, mansionIndex) => {
    const { pattern } = starGroupSampleFor(mansionIndex);
    assert.equal(pattern, STAR_GROUP_PATTERNS[sample.pattern]);
    assert.ok(pattern.stars.length >= 5, `mansion ${mansionIndex + 1} has visible context stars`);

    for (const [x, y, radius = 1.8] of pattern.stars) {
      assert.ok(Number.isFinite(x) && x >= 0 && x <= 160);
      assert.ok(Number.isFinite(y) && y >= 0 && y <= 94);
      assert.ok(Number.isFinite(radius) && radius > 0);
    }

    for (const [from, to] of pattern.links) {
      assert.ok(Number.isInteger(from) && from >= 0 && from < pattern.stars.length);
      assert.ok(Number.isInteger(to) && to >= 0 && to < pattern.stars.length);
    }

    for (const highlighted of sample.highlighted) {
      assert.ok(Number.isInteger(highlighted));
      assert.ok(highlighted >= 0 && highlighted < pattern.stars.length);
    }
  });
});

test("only Al-Baldah uses an empty field instead of shining marker stars", () => {
  MANSION_STAR_GROUP_SAMPLES.forEach((sample, mansionIndex) => {
    if (mansionIndex === 20) {
      assert.deepEqual(sample.highlighted, []);
      assert.deepEqual(sample.emptyCentre, [79, 47]);
    } else {
      assert.ok(sample.highlighted.length > 0, `mansion ${mansionIndex + 1} has a shining marker`);
      assert.equal("emptyCentre" in sample, false);
    }
  });
});

test("the display sketches contain no scientific catalogue identifiers", () => {
  const serialized = JSON.stringify({ STAR_GROUP_PATTERNS, MANSION_STAR_GROUP_SAMPLES });
  assert.doesNotMatch(serialized, /HIP|rightAscension|declination|auditId/);
});
