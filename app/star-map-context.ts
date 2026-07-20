/**
 * Compact display-only sketches for the star-group sample card.
 *
 * These normalized coordinates preserve a recognisable constellation or
 * asterism around each mansion marker. They are deliberately schematic: the
 * audited J2000 marker coordinates remain in `mansion-catalogue.ts` and are
 * the authoritative astronomy data used by the app.
 */

export type StarGroupPattern = Readonly<{
  stars: ReadonlyArray<readonly [x: number, y: number, radius?: number]>;
  links: ReadonlyArray<readonly [from: number, to: number]>;
}>;

export const STAR_GROUP_PATTERNS = {
  aries: {
    stars: [[24, 26, 2.8], [47, 20, 2.5], [73, 34, 2.2], [103, 47, 1.9], [136, 54, 1.6]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  taurus: {
    stars: [[22, 20, 1.8], [45, 34, 2], [69, 52, 3], [94, 37, 1.8], [120, 23, 1.7], [111, 57, 1.5], [121, 53, 1.8], [130, 60, 1.4], [124, 68, 1.5], [138, 67, 1.3], [143, 56, 1.2]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [5, 6], [6, 7], [6, 8], [7, 10], [8, 9]],
  },
  orion: {
    stars: [[70, 12, 2.6], [58, 21, 1.8], [81, 22, 1.8], [33, 35, 2.4], [112, 34, 2.5], [55, 49, 1.8], [75, 48, 1.9], [96, 47, 1.8], [43, 76, 2.4], [108, 75, 2.3]],
    links: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [5, 6], [6, 7], [7, 4], [5, 8], [7, 9]],
  },
  gemini: {
    stars: [[43, 16, 3], [91, 15, 3.2], [48, 34, 2], [91, 33, 2], [42, 52, 1.8], [88, 51, 1.8], [28, 75, 2.2], [57, 76, 2], [77, 75, 2], [106, 73, 2.2]],
    links: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [4, 7], [5, 8], [5, 9]],
  },
  cancer: {
    stars: [[78, 15, 2], [77, 33, 1.8], [52, 52, 1.8], [101, 51, 1.9], [65, 59, 1.2], [75, 55, 1.5], [84, 62, 1.2], [91, 56, 1.4], [119, 73, 1.8], [35, 74, 1.7]],
    links: [[0, 1], [1, 2], [1, 3], [2, 9], [3, 8], [4, 5], [5, 6], [5, 7]],
  },
  leo: {
    stars: [[29, 20, 2], [43, 30, 2.2], [35, 45, 2], [51, 55, 2.8], [71, 38, 2.3], [89, 50, 2.4], [111, 43, 1.9], [126, 57, 1.8], [144, 51, 3]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 4], [4, 5], [5, 6], [6, 7], [7, 8]],
  },
  virgo: {
    stars: [[24, 24, 1.8], [45, 17, 1.9], [64, 29, 2.2], [83, 20, 1.8], [101, 31, 2], [116, 49, 1.8], [93, 72, 3.2], [137, 63, 1.7]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [5, 7]],
  },
  libra: {
    stars: [[79, 13, 1.7], [48, 32, 3], [109, 31, 3], [58, 58, 2], [99, 58, 2], [79, 77, 1.7]],
    links: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]],
  },
  scorpius: {
    stars: [[35, 19, 2.4], [52, 28, 2.7], [70, 20, 2.3], [69, 39, 1.8], [77, 50, 3.4], [89, 57, 1.9], [104, 63, 1.8], [120, 70, 1.8], [137, 64, 2.6], [145, 51, 2.4]],
    links: [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]],
  },
  sagittarius: {
    stars: [[27, 52, 1.8], [44, 32, 2], [62, 43, 2.2], [78, 24, 2.4], [93, 42, 2.2], [113, 31, 2], [125, 51, 2.1], [103, 65, 1.9], [61, 70, 2.6]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 2], [2, 8]],
  },
  baldah: {
    stars: [[23, 23, 1.7], [53, 16, 2], [91, 19, 1.7], [133, 31, 2.1], [139, 65, 1.8], [101, 76, 2], [56, 78, 1.7], [20, 60, 1.9]],
    links: [],
  },
  capricornus: {
    stars: [[26, 25, 2.8], [46, 20, 2.5], [75, 36, 1.8], [105, 28, 1.9], [136, 42, 2.2], [112, 68, 2], [72, 73, 1.8], [41, 61, 1.9]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]],
  },
  aquarius: {
    stars: [[22, 26, 2.5], [44, 31, 2.2], [65, 22, 1.7], [82, 36, 1.8], [104, 25, 3], [126, 36, 2.1], [81, 53, 1.8], [95, 58, 1.7], [87, 70, 1.8], [106, 69, 1.6], [139, 58, 1.7]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 10], [3, 6], [6, 7], [7, 8], [7, 9]],
  },
  pegasus: {
    stars: [[30, 18, 2.8], [123, 18, 2.8], [124, 69, 2.8], [31, 69, 2.8], [77, 31, 1.5], [84, 54, 1.6]],
    links: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [4, 5], [5, 2]],
  },
  andromeda: {
    stars: [[23, 62, 2.1], [49, 49, 2.2], [77, 35, 3], [106, 26, 2], [137, 16, 1.8], [99, 57, 1.6]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]],
  },
} as const satisfies Record<string, StarGroupPattern>;

export type StarGroupPatternKey = keyof typeof STAR_GROUP_PATTERNS;

export type MansionStarGroupSample = Readonly<{
  pattern: StarGroupPatternKey;
  highlighted: readonly number[];
  emptyCentre?: readonly [x: number, y: number];
}>;

/** One visual context sample for each of the 28 mansion markers. */
export const MANSION_STAR_GROUP_SAMPLES = [
  { pattern: "aries", highlighted: [0, 1] },
  { pattern: "aries", highlighted: [2, 3, 4] },
  { pattern: "taurus", highlighted: [5, 6, 7, 8, 9, 10] },
  { pattern: "taurus", highlighted: [2] },
  { pattern: "orion", highlighted: [0, 1, 2] },
  { pattern: "gemini", highlighted: [6, 7] },
  { pattern: "gemini", highlighted: [0, 1] },
  { pattern: "cancer", highlighted: [4, 5, 6, 7] },
  { pattern: "leo", highlighted: [1] },
  { pattern: "leo", highlighted: [0, 1, 2, 3] },
  { pattern: "leo", highlighted: [4, 5] },
  { pattern: "leo", highlighted: [8] },
  { pattern: "virgo", highlighted: [0, 1, 2, 3, 4] },
  { pattern: "virgo", highlighted: [6] },
  { pattern: "virgo", highlighted: [5, 6, 7] },
  { pattern: "libra", highlighted: [1, 2] },
  { pattern: "scorpius", highlighted: [0, 1, 2] },
  { pattern: "scorpius", highlighted: [4] },
  { pattern: "scorpius", highlighted: [8, 9] },
  { pattern: "sagittarius", highlighted: [0, 1, 2, 3, 4, 5, 6, 7] },
  { pattern: "baldah", highlighted: [], emptyCentre: [79, 47] },
  { pattern: "capricornus", highlighted: [0, 1] },
  { pattern: "aquarius", highlighted: [0, 1] },
  { pattern: "aquarius", highlighted: [4, 5] },
  { pattern: "aquarius", highlighted: [6, 7, 8, 9] },
  { pattern: "pegasus", highlighted: [0, 3] },
  { pattern: "pegasus", highlighted: [1, 2] },
  { pattern: "andromeda", highlighted: [2] },
] as const satisfies readonly MansionStarGroupSample[];

if (MANSION_STAR_GROUP_SAMPLES.length !== 28) {
  throw new Error("The star-group sample catalogue must contain 28 entries.");
}

MANSION_STAR_GROUP_SAMPLES.forEach((sample, mansionIndex) => {
  const pattern = STAR_GROUP_PATTERNS[sample.pattern];
  const indexes = [
    ...sample.highlighted,
    ...pattern.links.flatMap(([from, to]) => [from, to]),
  ];
  if (indexes.some((index) => index < 0 || index >= pattern.stars.length)) {
    throw new RangeError(`Invalid star-group sample index for mansion ${mansionIndex + 1}.`);
  }
});

export function starGroupSampleFor(mansionIndex: number): Readonly<{
  sample: MansionStarGroupSample;
  pattern: StarGroupPattern;
}> {
  const sample = MANSION_STAR_GROUP_SAMPLES[mansionIndex];
  if (!sample) throw new RangeError(`Invalid mansion index: ${mansionIndex}.`);
  return { sample, pattern: STAR_GROUP_PATTERNS[sample.pattern] };
}
