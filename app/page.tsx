"use client";

import { useEffect, useMemo, useState } from "react";
import { OUTLOOK_ICONS, OUTLOOKS } from "./outlooks";
import { OUTLOOKS_AR } from "./outlooks-ar";

type RegionId =
  | "gulf"
  | "sudan"
  | "australia_tropical"
  | "australia_central"
  | "australia_temperate"
  | "classical";
type Language = "en" | "ar";
type LocationSource =
  | { kind: "default" }
  | { kind: "saved" }
  | { kind: "timezone"; value: string }
  | { kind: "coordinates"; value: string }
  | { kind: "manual" };
type LocationMessage = "" | "unavailable" | "denied";

type Mansion = {
  en: string;
  ar: string;
  starEn: string;
  starAr: string;
  constellationEn: string;
  constellationAr: string;
  days: number;
  localNote?: string;
  localNoteAr?: string;
};

type SkyMarker = Pick<
  Mansion,
  "starEn" | "starAr" | "constellationEn" | "constellationAr"
>;

type StarMapPattern = {
  stars: ReadonlyArray<readonly [x: number, y: number, radius?: number]>;
  links: ReadonlyArray<readonly [from: number, to: number]>;
};

type RegionProfile = {
  id: RegionId;
  label: string;
  labelAr: string;
  shortLabel: string;
  shortLabelAr: string;
  anchorIso: string;
  timeZone: string;
  description: string;
  descriptionAr: string;
  mansions: Mansion[];
};

type MansionDate = {
  cycleDay: number;
  cycleYear: number;
  dateIso: string;
  dateMs: number;
  dayInMansion: number;
  mansion: Mansion;
  mansionIndex: number;
};

type MansionRow = {
  cycleYear: number;
  dates: MansionDate[];
  mansion: Mansion;
  mansionIndex: number;
  startMs: number;
};

const DAY_MS = 86_400_000;
const MANSION_LENGTHS = Array.from({ length: 28 }, (_, index) => (index === 9 ? 14 : 13));
const GULF_ANCHOR_ISO = "2026-05-12";

const SKY_MARKERS: SkyMarker[] = [
  { starEn: "Aries Horns", starAr: "قرنا الحمل", constellationEn: "Aries", constellationAr: "الحمل" },
  { starEn: "Aries Belly", starAr: "بطن الحمل", constellationEn: "Aries", constellationAr: "الحمل" },
  { starEn: "Pleiades in Taurus", starAr: "الثريا", constellationEn: "Taurus", constellationAr: "الثور" },
  { starEn: "Taurus Eye", starAr: "عين الثور", constellationEn: "Taurus", constellationAr: "الثور" },
  { starEn: "Orion Head", starAr: "رأس الجبار", constellationEn: "Orion", constellationAr: "الجبار" },
  { starEn: "Gemini Feet", starAr: "قدما الجوزاء", constellationEn: "Gemini", constellationAr: "الجوزاء" },
  { starEn: "Gemini Twin Stars", starAr: "ذراعا الجوزاء", constellationEn: "Gemini", constellationAr: "الجوزاء" },
  { starEn: "Beehive in Cancer", starAr: "السرطان", constellationEn: "Cancer", constellationAr: "السرطان" },
  { starEn: "Leo Eyes", starAr: "عينا الأسد", constellationEn: "Leo", constellationAr: "الأسد" },
  { starEn: "Leo Forehead", starAr: "جبهة الأسد", constellationEn: "Leo", constellationAr: "الأسد" },
  { starEn: "Leo Mane", starAr: "لبدة الأسد", constellationEn: "Leo", constellationAr: "الأسد" },
  { starEn: "Leo Tail", starAr: "ذيل الأسد", constellationEn: "Leo", constellationAr: "الأسد" },
  { starEn: "Virgo Star Arc", starAr: "قوس العذراء", constellationEn: "Virgo", constellationAr: "العذراء" },
  { starEn: "Virgo Wheat Ear", starAr: "سنبلة العذراء", constellationEn: "Virgo", constellationAr: "العذراء" },
  { starEn: "Virgo Faint Trio", starAr: "نجوم العذراء", constellationEn: "Virgo", constellationAr: "العذراء" },
  { starEn: "Libra Scales", starAr: "الميزان", constellationEn: "Libra", constellationAr: "الميزان" },
  { starEn: "Scorpius Head", starAr: "رأس العقرب", constellationEn: "Scorpius", constellationAr: "العقرب" },
  { starEn: "Scorpius Heart", starAr: "قلب العقرب", constellationEn: "Scorpius", constellationAr: "العقرب" },
  { starEn: "Scorpius Tail", starAr: "ذيل العقرب", constellationEn: "Scorpius", constellationAr: "العقرب" },
  { starEn: "Sagittarius Teapot", starAr: "إبريق القوس", constellationEn: "Sagittarius", constellationAr: "القوس" },
  { starEn: "Sagittarius Open Field", starAr: "فسحة القوس", constellationEn: "Sagittarius", constellationAr: "القوس" },
  { starEn: "Capricorn Head", starAr: "رأس الجدي", constellationEn: "Capricorn", constellationAr: "الجدي" },
  { starEn: "Aquarius Western Pair", starAr: "نجما الدلو الغربيان", constellationEn: "Aquarius", constellationAr: "الدلو" },
  { starEn: "Aquarius Middle Pair", starAr: "نجما وسط الدلو", constellationEn: "Aquarius", constellationAr: "الدلو" },
  { starEn: "Aquarius Water Jar", starAr: "جرة الدلو", constellationEn: "Aquarius", constellationAr: "الدلو" },
  { starEn: "Pegasus West Side", starAr: "مقدم الفرس", constellationEn: "Pegasus", constellationAr: "الفرس الأعظم" },
  { starEn: "Pegasus East Side", starAr: "مؤخر الفرس", constellationEn: "Pegasus", constellationAr: "الفرس الأعظم" },
  { starEn: "Andromeda Belt Star", starAr: "بطن الحوت", constellationEn: "Andromeda", constellationAr: "المرأة المسلسلة" },
];

const STAR_MAP_PATTERNS = {
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
} satisfies Record<string, StarMapPattern>;

type StarMapPatternKey = keyof typeof STAR_MAP_PATTERNS;

const STAR_MAP_MARKERS: Array<{
  pattern: StarMapPatternKey;
  highlighted: number[];
  emptyCentre?: readonly [x: number, y: number];
}> = [
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
];

if (
  SKY_MARKERS.length !== 28 ||
  STAR_MAP_MARKERS.length !== 28 ||
  MANSION_LENGTHS.reduce((sum, days) => sum + days, 0) !== 365
) {
  throw new Error("The star-station cycle must contain 28 markers and total 365 days.");
}

function mansionSet(names: Array<[string, string, string?, string?]>): Mansion[] {
  return names.map(([en, ar, localNote, localNoteAr], index) => ({
    en,
    ar,
    ...SKY_MARKERS[index],
    localNote,
    localNoteAr,
    days: MANSION_LENGTHS[index],
  }));
}

const GULF_MANSIONS = mansionSet([
  ["Al-Sharatain", "الشرطان", "Al-Thurayya season", "موسم الثريا"],
  ["Al-Butain", "البطين", "Al-Thurayya season", "موسم الثريا"],
  ["Al-Thurayya", "الثريا", "Al-Thurayya season", "موسم الثريا"],
  ["Al-Dabaran", "الدبران", "Al-Tuwaibi'", "التويبع"],
  ["Al-Haq'ah", "الهقعة", "Al-Jawza'", "الجوزاء"],
  ["Al-Han'ah", "الهنعة", "Al-Jawza'", "الجوزاء"],
  ["Al-Dhira'", "الذراع", "Al-Mirzam", "المرزم"],
  ["Al-Nathrah", "النثرة", "Al-Kulaibain", "الكليبين"],
  ["Al-Tarfah", "الطرفة", "Suhail", "سهيل"],
  ["Al-Jabha", "الجبهة", "Suhail · 14 days", "سهيل · 14 يومًا"],
  ["Al-Zubrah", "الزبرة", "Suhail", "سهيل"],
  ["Al-Sarfah", "الصرفة", "Suhail", "سهيل"],
  ["Al-Awwa", "العواء", "Al-Wasm", "الوسم"],
  ["Al-Simak", "السماك", "Al-Wasm", "الوسم"],
  ["Al-Ghafr", "الغفر", "Al-Wasm", "الوسم"],
  ["Al-Zabana", "الزبانا", "Al-Wasm", "الوسم"],
  ["Al-Iklil", "الإكليل", "Al-Murabba'aniyah", "المربعانية"],
  ["Al-Qalb", "القلب", "Al-Murabba'aniyah", "المربعانية"],
  ["Al-Shaula", "الشولة", "Al-Murabba'aniyah", "المربعانية"],
  ["Al-Na'ayim", "النعايم", "Al-Shabat", "الشبط"],
  ["Al-Baldah", "البلدة", "Al-Shabat", "الشبط"],
  ["Sa'd Al-Dhabih", "سعد الذابح", "Al-Aqarib", "العقارب"],
  ["Sa'd Bula'", "سعد بلع", "Al-Aqarib", "العقارب"],
  ["Sa'd Al-Su'ud", "سعد السعود", "Al-Aqarib", "العقارب"],
  ["Sa'd Al-Akhbiyah", "سعد الأخبية", "Al-Hamimain", "الحميمين"],
  ["Al-Muqaddam", "المقدم", "Al-Hamimain", "الحميمين"],
  ["Al-Mu'akhkhar", "المؤخر", "Al-Dhira'ain", "الذراعين"],
  ["Al-Risha'", "الرشاء", "Al-Dhira'ain", "الذراعين"],
]);

const SUDAN_MANSIONS = mansionSet([
  ["Al-Nath", "النطح", "Sudanese name for Al-Sharatain", "الاسم السوداني للشرطان"],
  ["Al-Butain", "البطين"],
  ["Al-Turayya", "التريا", "Sudanese pronunciation", "النطق السوداني"],
  ["Al-Dabaran", "الدبران"],
  ["Al-Haka'ah", "الهكعة", "Also Al-'Asa Al-'Atshana", "وتُسمى العصا العطشانة"],
  ["Al-Han'ah", "الهنعة", "Also Al-'Asa Al-Rayyana", "وتُسمى العصا الريانة"],
  ["Al-Dhira'", "الذراع"],
  ["Al-Natrah", "النترة", "Regional spelling", "كتابة إقليمية"],
  ["Al-Tarf", "الطرف"],
  ["Al-Jabha", "الجبهة", "14 days", "14 يومًا"],
  ["Al-Khirsan", "الخرسان", "Regional name", "اسم إقليمي"],
  ["Al-Sarfah", "الصرفة"],
  ["Al-Awa", "العوا", "Regional spelling", "كتابة إقليمية"],
  ["Al-Simak", "السماك"],
  ["Al-Ghafr", "الغفر"],
  ["Al-Zabnan", "الزبنان", "Regional name", "اسم إقليمي"],
  ["Al-Iklil", "الإكليل"],
  ["Al-Qalb", "القلب"],
  ["Al-Shaula", "الشولة"],
  ["Al-Na'ayim", "النعايم"],
  ["Al-Baldah", "البلدة"],
  ["Sa'd Dhabih", "سعد ذابح"],
  ["Sa'd Bala'", "سعد بلع"],
  ["Sa'd Al-Su'ud", "سعد السعود"],
  ["Sa'd Al-Akhbiya'", "سعد الأخبياء"],
  ["Al-Farq Al-Muqaddam", "الفرق المقدم"],
  ["Al-Farq Al-Mu'akhkhar", "الفرق المؤخر"],
  ["Al-Hut", "الحوت", "Regional name", "اسم إقليمي"],
]);

const CLASSICAL_MANSIONS = mansionSet([
  ["Al-Sharatain", "الشرطان"], ["Al-Butain", "البطين"], ["Al-Thurayya", "الثريا"],
  ["Al-Dabaran", "الدبران"], ["Al-Haq'ah", "الهقعة"], ["Al-Han'ah", "الهنعة"],
  ["Al-Dhira'", "الذراع"], ["Al-Nathrah", "النثرة"], ["Al-Tarf", "الطرف"],
  ["Al-Jabha", "الجبهة", "14 days", "14 يومًا"], ["Al-Zubrah", "الزبرة"], ["Al-Sarfah", "الصرفة"],
  ["Al-Awwa", "العواء"], ["Al-Simak", "السماك الأعزل"], ["Al-Ghafr", "الغفر"],
  ["Al-Zubana", "الزبانا"], ["Al-Iklil", "الإكليل"], ["Al-Qalb", "القلب"],
  ["Al-Shaula", "الشولة"], ["Al-Na'a'im", "النعائم"], ["Al-Baldah", "البلدة"],
  ["Sa'd Al-Dhabih", "سعد الذابح"], ["Sa'd Bula'", "سعد بلع"], ["Sa'd Al-Su'ud", "سعد السعود"],
  ["Sa'd Al-Akhbiyah", "سعد الأخبية"], ["Al-Fargh Al-Muqaddam", "الفرغ المقدم"],
  ["Al-Fargh Al-Mu'akhkhar", "الفرغ المؤخر"], ["Al-Risha'", "الرشاء"],
]);

function australiaMansions(zone: string, zoneAr: string): Mansion[] {
  return CLASSICAL_MANSIONS.map((mansion, index) => ({
    ...mansion,
    localNote: `${zone} dawn alignment${index === 9 ? " · 14 days" : ""}`,
    localNoteAr: `محاذاة الفجر في ${zoneAr}${index === 9 ? " · 14 يومًا" : ""}`,
  }));
}

const AUSTRALIA_TROPICAL_MANSIONS = australiaMansions("Tropical North", "الشمال المداري");
const AUSTRALIA_CENTRAL_MANSIONS = australiaMansions("Subtropical & Central", "الوسط وشبه المداري");
const AUSTRALIA_TEMPERATE_MANSIONS = australiaMansions("Temperate South", "الجنوب المعتدل");

const REGION_PROFILES: Record<RegionId, RegionProfile> = {
  gulf: {
    id: "gulf",
    label: "Arabian Gulf",
    labelAr: "الخليج العربي",
    shortLabel: "Gulf",
    shortLabelAr: "الخليج",
    anchorIso: GULF_ANCHOR_ISO,
    timeZone: "Asia/Dubai",
    description: "UAE and Arabian Gulf seasonal mansion names and alignment.",
    descriptionAr: "أسماء المنازل الموسمية ومحاذاتها في الإمارات والخليج العربي.",
    mansions: GULF_MANSIONS,
  },
  sudan: {
    id: "sudan",
    label: "Sudan & Upper Nile",
    labelAr: "السودان وأعالي النيل",
    shortLabel: "Sudan",
    shortLabelAr: "السودان",
    anchorIso: "2026-04-20",
    timeZone: "Africa/Khartoum",
    description: "Sudanese ainat names with the regional seasonal alignment.",
    descriptionAr: "أسماء العِينات السودانية مع المحاذاة الموسمية الإقليمية.",
    mansions: SUDAN_MANSIONS,
  },
  australia_tropical: {
    id: "australia_tropical",
    label: "Australia · Tropical North",
    labelAr: "أستراليا · الشمال المداري",
    shortLabel: "Tropical North",
    shortLabelAr: "الشمال المداري",
    anchorIso: "2026-05-13",
    timeZone: "Australia/Darwin",
    description: "Tropical North reference: Aries Horns begins near its traditional first dawn appearance. Reference coordinates: Darwin.",
    descriptionAr: "مرجع الشمال المداري: تبدأ علامة قرني الحمل قرب أول ظهور تقليدي لها عند الفجر. إحداثيات المرجع: داروين.",
    mansions: AUSTRALIA_TROPICAL_MANSIONS,
  },
  australia_central: {
    id: "australia_central",
    label: "Australia · Subtropical & Central",
    labelAr: "أستراليا · الوسط وشبه المداري",
    shortLabel: "Central Australia",
    shortLabelAr: "وسط أستراليا",
    anchorIso: "2026-05-14",
    timeZone: "Australia/Darwin",
    description: "Subtropical and central reference: Aries Horns begins near its traditional first dawn appearance. Reference coordinates: Alice Springs.",
    descriptionAr: "مرجع الوسط وشبه المداري: تبدأ علامة قرني الحمل قرب أول ظهور تقليدي لها عند الفجر. إحداثيات المرجع: أليس سبرينغز.",
    mansions: AUSTRALIA_CENTRAL_MANSIONS,
  },
  australia_temperate: {
    id: "australia_temperate",
    label: "Australia · Temperate South",
    labelAr: "أستراليا · الجنوب المعتدل",
    shortLabel: "Temperate South",
    shortLabelAr: "الجنوب المعتدل",
    anchorIso: "2026-05-17",
    timeZone: "Australia/Sydney",
    description: "Temperate South reference: Aries Horns begins near its traditional first dawn appearance. Reference latitude: 35° south.",
    descriptionAr: "مرجع الجنوب المعتدل: تبدأ علامة قرني الحمل قرب أول ظهور تقليدي لها عند الفجر. خط العرض المرجعي: 35° جنوبًا.",
    mansions: AUSTRALIA_TEMPERATE_MANSIONS,
  },
  classical: {
    id: "classical",
    label: "Classical Arabic",
    labelAr: "العربية الكلاسيكية",
    shortLabel: "Classical",
    shortLabelAr: "الكلاسيكي",
    anchorIso: "2026-04-05",
    timeZone: "UTC",
    description: "Classical Arabic names and a neutral reference alignment.",
    descriptionAr: "الأسماء العربية التراثية مع محاذاة مرجعية محايدة.",
    mansions: CLASSICAL_MANSIONS,
  },
};

const COPY = {
  en: {
    appTitle: "Seasonal Star Calendar",
    appSubtitle: "Regional 365-day star-station cycle · Gregorian months",
    language: "Language",
    english: "English",
    arabic: "العربية",
    today: "Today",
    about: "About",
    openAbout: "Open app description",
    closeAbout: "Close app description",
    aboutLabel: "About this calendar",
    openSettings: "Open regional cycle settings",
    closeSettings: "Close settings",
    settingsLabel: "Regional cycle settings",
    locationTradition: "Location & tradition",
    regionalAlignment: "Dawn alignment",
    useMyLocation: "Use my regional location",
    locating: "Locating…",
    regionalTradition: "Regional tradition",
    dayOneReference: "Day 1 reference",
    correctionNote: "The date can be corrected for a more specific horizon or local observation.",
    runningOffline: "Running offline",
    offlineReady: "Offline ready",
    preparingOffline: "Preparing offline use",
    offlineHelp: "After one online visit, the calendar and regional outlook can reopen without a connection.",
    resetAlignment: "Reset dawn alignment",
    unavailableLocation: "Location is unavailable in this browser. Choose a region below.",
    deniedLocation: "Location permission was not available. The time-zone profile is still active.",
    regionalDefault: "Regional default",
    savedSelection: "Saved regional selection",
    timeZoneSource: "Time zone",
    locationSource: "Location",
    manualSelection: "Manual regional selection",
    gregorianMonth: "Gregorian month",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    jumpToMonth: "Jump to month",
    dayOne: "day 1",
    offlineMode: "Offline mode",
    online: "Online",
    regionalWeek: "13-day period",
    mansion: "Sky marker",
    day: "Day",
    jabha: "14th",
    noFourteenthDay: "No fourteenth day",
    calendarFit: "All 13 star-period day columns resize to fit this view",
    selectedDate: "Selected date",
    chooseDate: "Choose any date",
    regionMansion: "sky marker",
    dayInMansion: "Day in period",
    mansionSpan: "Period span",
    to: "to",
    cycleDay: "Cycle day",
    jabhaOnly: "The Leo Forehead period—traditional Al‑Jabha—is the only 14-day station.",
    regionalCycle: "Regional cycle",
    cycleExplanation: "Location selects the dawn reference, regional seasonal outlook and local day boundary. You can override the detected region in settings.",
    traditionalIndication: "Regional seasonal indication",
    outlookTitle: "REGIONAL STAR-STATION OUTLOOK",
    landWater: "Land & water",
    practicalNote: "Practical note",
    nextMansion: "Next sky marker",
    disclaimer: "This is a traditional regional climatological outlook, not a live weather forecast or safety warning. Conditions vary by coast, desert, elevation and local rainfall; use official forecasts for decisions.",
    throughMansion: "through this period",
    calendarLabel: "Interactive seasonal star calendar",
    dateByMansionDay: "by star-period day",
    traditionalMansion: "Traditional mansion",
    constellation: "Constellation",
    dawnReference: "Dawn alignment reference",
    schematicMap: "Related stars · schematic view",
    visibilityNote: "The listed star or group is the traditional sky marker for this 13-day period. Dawn visibility is approximate; clouds, terrain, twilight and exact coordinates affect observation.",
  },
  ar: {
    appTitle: "تقويم النجوم الموسمية",
    appSubtitle: "دورة إقليمية لمحطات النجوم من 365 يومًا · الأشهر الميلادية",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    today: "اليوم",
    about: "حول",
    openAbout: "فتح وصف التطبيق",
    closeAbout: "إغلاق وصف التطبيق",
    aboutLabel: "عن هذا التقويم",
    openSettings: "فتح إعدادات الدورة الإقليمية",
    closeSettings: "إغلاق الإعدادات",
    settingsLabel: "إعدادات الدورة الإقليمية",
    locationTradition: "الموقع والتقليد",
    regionalAlignment: "محاذاة الفجر",
    useMyLocation: "استخدام موقعي الإقليمي",
    locating: "جارٍ تحديد الموقع…",
    regionalTradition: "التقليد الإقليمي",
    dayOneReference: "مرجع اليوم الأول",
    correctionNote: "يمكن تصحيح التاريخ ليتوافق مع أفق أو رصد محلي أكثر تحديدًا.",
    runningOffline: "يعمل دون اتصال",
    offlineReady: "جاهز دون اتصال",
    preparingOffline: "جارٍ التجهيز للعمل دون اتصال",
    offlineHelp: "بعد زيارة واحدة عبر الإنترنت، يمكن فتح التقويم والدلالة الإقليمية دون اتصال.",
    resetAlignment: "إعادة ضبط محاذاة الفجر",
    unavailableLocation: "الموقع غير متاح في هذا المتصفح. اختر منطقة أدناه.",
    deniedLocation: "لم يتوفر إذن الموقع. ما زال ملف المنطقة الزمنية فعالًا.",
    regionalDefault: "الإعداد الإقليمي الافتراضي",
    savedSelection: "اختيار إقليمي محفوظ",
    timeZoneSource: "المنطقة الزمنية",
    locationSource: "الموقع",
    manualSelection: "اختيار إقليمي يدوي",
    gregorianMonth: "الشهر الميلادي",
    previousMonth: "الشهر السابق",
    nextMonth: "الشهر التالي",
    jumpToMonth: "الانتقال إلى شهر",
    dayOne: "اليوم 1",
    offlineMode: "وضع عدم الاتصال",
    online: "متصل",
    regionalWeek: "فترة 13 يومًا",
    mansion: "علامة السماء",
    day: "اليوم",
    jabha: "اليوم 14",
    noFourteenthDay: "لا يوجد يوم رابع عشر",
    calendarFit: "تتغير أحجام أعمدة الأيام الثلاثة عشر لتلائم هذا العرض",
    selectedDate: "التاريخ المحدد",
    chooseDate: "اختر أي تاريخ",
    regionMansion: "علامة سماء",
    dayInMansion: "اليوم في الفترة",
    mansionSpan: "مدة الفترة",
    to: "إلى",
    cycleDay: "يوم الدورة",
    jabhaOnly: "فترة مجموعة جبهة الأسد — الجبهة تقليديًا — هي المحطة الوحيدة الممتدة 14 يومًا.",
    regionalCycle: "الدورة الإقليمية",
    cycleExplanation: "يحدد الموقع مرجع الفجر والدلالة الموسمية الإقليمية وحدود اليوم المحلي. ويمكنك تغيير المنطقة المكتشفة من الإعدادات.",
    traditionalIndication: "الدلالة الموسمية الإقليمية",
    outlookTitle: "الدلالة الإقليمية لمحطات النجوم",
    landWater: "الأرض والمياه",
    practicalNote: "ملاحظة عملية",
    nextMansion: "علامة السماء التالية",
    disclaimer: "هذه دلالة مناخية إقليمية تقليدية، وليست توقعًا مباشرًا للطقس أو تحذيرًا للسلامة. تختلف الظروف بحسب الساحل والصحراء والارتفاع والمطر المحلي؛ استخدم التوقعات الرسمية لاتخاذ القرارات.",
    throughMansion: "من هذه الفترة",
    calendarLabel: "تقويم تفاعلي للنجوم الموسمية",
    dateByMansionDay: "بحسب يوم فترة النجم",
    traditionalMansion: "المنزل التقليدي",
    constellation: "الكوكبة",
    dawnReference: "مرجع محاذاة الفجر",
    schematicMap: "النجوم المرتبطة · رسم توضيحي",
    visibilityNote: "النجم أو المجموعة المدرجة هي علامة السماء التقليدية لهذه الفترة ذات 13 يومًا. الرؤية عند الفجر تقريبية؛ إذ تؤثر السحب والتضاريس والشفق والإحداثيات الدقيقة في الرصد.",
  },
} as const;

const ABOUT_COPY = {
  en: {
    title: "Regional Lunar Mansion Calendar",
    paragraphs: [
      "This bilingual interactive calendar presents the 28 traditional lunar mansions as a continuous 365-day regional seasonal cycle. Twenty-seven periods contain 13 days, while Al‑Jabha contains 14 days.",
      "The Gregorian monthly table shows every date with its related star group and regional mansion name. Cycle alignment follows the selected location and regional dawn reference, covering the Arabian Gulf, Sudan, and three Australian climate regions. Each period includes a simple star map and a regional seasonal outlook.",
      "The calendar works in Arabic and English, adapts to mobile screens, and remains available offline after the first online visit.",
      "This is a traditional regional seasonal calendar—not a live weather forecast or a calculation of the Moon’s current astronomical position.",
    ],
  },
  ar: {
    title: "تقويم العِنات الإقليمي",
    paragraphs: [
      "تقويم تفاعلي ثنائي اللغة يعرض المنازل القمرية التقليدية الثمانية والعشرين ضمن دورة موسمية إقليمية متصلة مدتها 365 يومًا. تمتد سبعة وعشرون منزلة لمدة 13 يومًا، بينما تمتد منزلة الجبهة وحدها لمدة 14 يومًا.",
      "يعرض جدول الشهر الميلادي كل تاريخ مع مجموعة النجوم المرتبطة به واسم المنزلة المستخدم في المنطقة المختارة. وتتبع محاذاة الدورة الموقع ومرجع ظهور النجوم عند الفجر، وتشمل الخليج العربي والسودان وثلاثة أقاليم مناخية في أستراليا. كما تتضمن كل فترة خريطة نجوم مبسطة ودلالة موسمية إقليمية.",
      "يعمل التقويم باللغتين العربية والإنجليزية، ويتكيف مع شاشات الهواتف، ويمكن استخدامه دون اتصال بعد فتحه أول مرة عبر الإنترنت.",
      "هذا تقويم موسمي إقليمي تقليدي، وليس توقعًا مباشرًا للطقس أو حسابًا للموقع الفلكي الآني للقمر.",
    ],
  },
} as const;

function localeFor(language: Language) {
  return language === "ar" ? "ar-AE" : "en-GB";
}

function profileLabel(profile: RegionProfile, language: Language, short = false) {
  if (language === "ar") return short ? profile.shortLabelAr : profile.labelAr;
  return short ? profile.shortLabel : profile.label;
}

function mansionName(mansion: Mansion, language: Language) {
  return language === "ar" ? mansion.ar : mansion.en;
}

function skyMarkerName(mansion: Mansion, language: Language) {
  return language === "ar" ? mansion.starAr : mansion.starEn;
}

function constellationName(mansion: Mansion, language: Language) {
  return language === "ar" ? mansion.constellationAr : mansion.constellationEn;
}

function formatNumber(value: number, language: Language, minimumIntegerDigits = 1) {
  return new Intl.NumberFormat(localeFor(language), {
    minimumIntegerDigits,
    useGrouping: false,
  }).format(value);
}

function mansionWeeksLabel(count: number, language: Language) {
  return language === "ar"
    ? `${formatNumber(count, language)} فترات نجمية تتقاطع مع هذا الشهر`
    : `${count} star periods intersect this month`;
}

function formatLocationSource(source: LocationSource, language: Language) {
  const copy = COPY[language];
  if (source.kind === "saved") return copy.savedSelection;
  if (source.kind === "timezone") return `${copy.timeZoneSource} · ${source.value}`;
  if (source.kind === "coordinates") return `${copy.locationSource} · ${source.value}`;
  if (source.kind === "manual") return copy.manualSelection;
  return copy.regionalDefault;
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function toIsoDate(value: number) {
  return new Date(value).toISOString().slice(0, 10);
}

function todayIsoForTimeZone(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function regionFromTimeZone(timeZone: string): RegionId {
  if (/Khartoum|Juba/i.test(timeZone)) return "sudan";
  if (/Dubai|Muscat|Riyadh|Bahrain|Qatar|Kuwait|Aden/i.test(timeZone)) return "gulf";
  if (/Australia\/(Darwin)|Indian\/(Christmas|Cocos)/i.test(timeZone)) return "australia_tropical";
  if (/Australia\/(Brisbane|Broken_Hill|Eucla)|Pacific\/Norfolk/i.test(timeZone)) return "australia_central";
  if (/Australia\/(Sydney|Melbourne|Hobart|Adelaide|Perth|Lord_Howe)|Antarctica\/Macquarie/i.test(timeZone)) {
    return "australia_temperate";
  }
  return "classical";
}

function regionFromCoordinates(latitude: number, longitude: number): RegionId {
  if (latitude >= 4 && latitude <= 23.5 && longitude >= 21 && longitude <= 39.5) return "sudan";
  if (latitude >= 12 && latitude <= 34 && longitude >= 34 && longitude <= 60) return "gulf";
  const isAustralianArea =
    (latitude >= -44.5 && latitude <= -9 && longitude >= 112 && longitude <= 154.5) ||
    (latitude >= -30.5 && latitude <= -28.5 && longitude >= 167 && longitude <= 169) ||
    (latitude >= -13 && latitude <= -10 && longitude >= 95 && longitude <= 106);
  if (isAustralianArea) {
    if (latitude > -23.5) return "australia_tropical";
    if (latitude <= -30.5) return "australia_temperate";
    return "australia_central";
  }
  return "classical";
}

function offsetsFor(mansions: Mansion[]) {
  return mansions.map((_, mansionIndex) =>
    mansions.slice(0, mansionIndex).reduce((sum, mansion) => sum + mansion.days, 0),
  );
}

function cycleStartForYear(cycleYear: number, anchorIso: string) {
  const anchorYear = Number(anchorIso.slice(0, 4));
  return parseIsoDate(anchorIso) + (cycleYear - anchorYear) * 365 * DAY_MS;
}

function cycleYearForDate(dateMs: number, anchorIso: string) {
  const anchorYear = Number(anchorIso.slice(0, 4));
  return anchorYear + Math.floor((dateMs - parseIsoDate(anchorIso)) / (365 * DAY_MS));
}

function mansionDateForDate(dateMs: number, anchorIso: string, mansions: Mansion[]): MansionDate {
  const cycleYear = cycleYearForDate(dateMs, anchorIso);
  const cycleStart = cycleStartForYear(cycleYear, anchorIso);
  const cycleDay = Math.floor((dateMs - cycleStart) / DAY_MS) + 1;
  let remaining = cycleDay - 1;

  for (let mansionIndex = 0; mansionIndex < mansions.length; mansionIndex += 1) {
    const mansion = mansions[mansionIndex];
    if (remaining < mansion.days) {
      return {
        cycleDay,
        cycleYear,
        dateIso: toIsoDate(dateMs),
        dateMs,
        dayInMansion: remaining + 1,
        mansion,
        mansionIndex,
      };
    }
    remaining -= mansion.days;
  }

  throw new Error("Mansion cycle must total 365 days.");
}

function formatFullDate(dateMs: number, language: Language) {
  return new Intl.DateTimeFormat(localeFor(language), {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(dateMs));
}

function formatShortDate(dateMs: number, language: Language) {
  return new Intl.DateTimeFormat(localeFor(language), {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(dateMs));
}

function monthValue(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

const INITIAL_TODAY_ISO = todayIsoForTimeZone(REGION_PROFILES.gulf.timeZone);
const INITIAL_TODAY = new Date(parseIsoDate(INITIAL_TODAY_ISO));

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [regionId, setRegionId] = useState<RegionId>("gulf");
  const [anchorIso, setAnchorIso] = useState(REGION_PROFILES.gulf.anchorIso);
  const [timeZone, setTimeZone] = useState(REGION_PROFILES.gulf.timeZone);
  const [locationSource, setLocationSource] = useState<LocationSource>({ kind: "default" });
  const [locationMessage, setLocationMessage] = useState<LocationMessage>("");
  const [locating, setLocating] = useState(false);
  const [selectedIso, setSelectedIso] = useState(INITIAL_TODAY_ISO);
  const [viewYear, setViewYear] = useState(INITIAL_TODAY.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(INITIAL_TODAY.getUTCMonth());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineReady, setOfflineReady] = useState(false);

  const profile = REGION_PROFILES[regionId];
  const copy = COPY[language];
  const mansions = profile.mansions;
  const mansionOffsets = useMemo(() => offsetsFor(mansions), [mansions]);
  const todayIso = todayIsoForTimeZone(timeZone);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const detectedZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const storedLanguage = window.localStorage.getItem("lunar-mansion-language") as Language | null;
      const storedRegionValue = window.localStorage.getItem("lunar-mansion-region");
      const zoneRegion = regionFromTimeZone(detectedZone);
      const isLegacyAustralia = storedRegionValue === "australia";
      const detectedRegion: RegionId = isLegacyAustralia
        ? zoneRegion.startsWith("australia_") ? zoneRegion : "australia_temperate"
        : storedRegionValue && storedRegionValue in REGION_PROFILES
          ? storedRegionValue as RegionId
          : zoneRegion;
      const storedAnchor = window.localStorage.getItem("lunar-mansion-anchor");
      const storedTimeZone = window.localStorage.getItem("lunar-mansion-timezone");
      const activeZone = storedTimeZone || detectedZone;
      const nextToday = todayIsoForTimeZone(activeZone);
      const nextDate = new Date(parseIsoDate(nextToday));

      setTimeZone(activeZone);
      setLanguage(storedLanguage === "ar" || storedLanguage === "en"
        ? storedLanguage
        : navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en");
      setRegionId(detectedRegion);
      setAnchorIso(!isLegacyAustralia && storedAnchor ? storedAnchor : REGION_PROFILES[detectedRegion].anchorIso);
      setLocationSource(storedRegionValue ? { kind: "saved" } : { kind: "timezone", value: detectedZone });
      setSelectedIso(nextToday);
      setViewYear(nextDate.getUTCFullYear());
      setViewMonth(nextDate.getUTCMonth());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.title = COPY[language].appTitle;
  }, [language]);

  useEffect(() => {
    if (!aboutOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAboutOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [aboutOpen]);

  useEffect(() => {
    let cancelled = false;
    const updateConnection = () => setIsOnline(window.navigator.onLine);
    const timer = window.setTimeout(updateConnection, 0);

    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);

    if ("serviceWorker" in navigator && window.isSecureContext) {
      const appBaseUrl = new URL(".", document.baseURI);

      navigator.serviceWorker.register(new URL("sw.js", appBaseUrl).href, {
        scope: appBaseUrl.pathname,
      })
        .then(() => navigator.serviceWorker.ready)
        .then((registration) => {
          if (cancelled) return;

          const assetUrls = Array.from(
            document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>("script[src], link[href]"),
          )
            .map((element) => element instanceof HTMLScriptElement ? element.src : element.href)
            .filter((url) => url.startsWith(window.location.origin));

          const channel = new MessageChannel();
          channel.port1.onmessage = () => {
            if (cancelled) return;
            setOfflineReady(true);
            window.localStorage.setItem("lunar-mansion-offline-ready", "true");
          };

          registration.active?.postMessage(
            {
              type: "CACHE_URLS",
              urls: [
                window.location.href,
                appBaseUrl.href,
                new URL("manifest.webmanifest", appBaseUrl).href,
                new URL("favicon.svg", appBaseUrl).href,
                ...assetUrls,
              ],
            },
            [channel.port2],
          );
        })
        .catch(() => {
          if (!cancelled) setOfflineReady(false);
        });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  const monthStart = Date.UTC(viewYear, viewMonth, 1);
  const monthEnd = Date.UTC(viewYear, viewMonth + 1, 0);

  const rows = useMemo(() => {
    const rowKeys: string[] = [];
    const rowLookup = new Map<string, { cycleYear: number; mansionIndex: number }>();

    for (let dateMs = monthStart; dateMs <= monthEnd; dateMs += DAY_MS) {
      const info = mansionDateForDate(dateMs, anchorIso, mansions);
      const key = `${info.cycleYear}-${info.mansionIndex}`;
      if (!rowLookup.has(key)) {
        rowKeys.push(key);
        rowLookup.set(key, { cycleYear: info.cycleYear, mansionIndex: info.mansionIndex });
      }
    }

    return rowKeys.map((key): MansionRow => {
      const rowInfo = rowLookup.get(key)!;
      const mansion = mansions[rowInfo.mansionIndex];
      const startMs =
        cycleStartForYear(rowInfo.cycleYear, anchorIso) +
        mansionOffsets[rowInfo.mansionIndex] * DAY_MS;
      return {
        cycleYear: rowInfo.cycleYear,
        dates: Array.from({ length: mansion.days }, (_, index) =>
          mansionDateForDate(startMs + index * DAY_MS, anchorIso, mansions),
        ),
        mansion,
        mansionIndex: rowInfo.mansionIndex,
        startMs,
      };
    });
  }, [anchorIso, mansionOffsets, mansions, monthEnd, monthStart]);

  const selectedDateMs = parseIsoDate(selectedIso);
  const selectedDay = mansionDateForDate(selectedDateMs, anchorIso, mansions);
  const selectedMansionStart =
    cycleStartForYear(selectedDay.cycleYear, anchorIso) +
    mansionOffsets[selectedDay.mansionIndex] * DAY_MS;
  const selectedMansionEnd = selectedMansionStart + (selectedDay.mansion.days - 1) * DAY_MS;
  const selectedCycleStart = cycleStartForYear(selectedDay.cycleYear, anchorIso);
  const selectedCycleEnd = selectedCycleStart + 364 * DAY_MS;
  const selectedOutlookSource = OUTLOOKS[regionId][selectedDay.mansionIndex];
  const selectedOutlook = language === "ar"
    ? { ...selectedOutlookSource, ...OUTLOOKS_AR[regionId][selectedDay.mansionIndex] }
    : selectedOutlookSource;
  const nextMansionIndex = (selectedDay.mansionIndex + 1) % mansions.length;
  const nextMansion = mansions[nextMansionIndex];
  const nextOutlookSource = OUTLOOKS[regionId][nextMansionIndex];
  const nextOutlook = language === "ar"
    ? { ...nextOutlookSource, ...OUTLOOKS_AR[regionId][nextMansionIndex] }
    : nextOutlookSource;
  const mansionProgress = Math.round((selectedDay.dayInMansion / selectedDay.mansion.days) * 100);

  const monthTitle = new Intl.DateTimeFormat(localeFor(language), {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(monthStart));

  function applyLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    window.localStorage.setItem("lunar-mansion-language", nextLanguage);
  }

  function applyRegion(nextRegion: RegionId, source: LocationSource, nextTimeZone?: string) {
    const nextProfile = REGION_PROFILES[nextRegion];
    const activeTimeZone = nextTimeZone || nextProfile.timeZone;
    setRegionId(nextRegion);
    setAnchorIso(nextProfile.anchorIso);
    setTimeZone(activeTimeZone);
    setLocationSource(source);
    setLocationMessage("");
    window.localStorage.setItem("lunar-mansion-region", nextRegion);
    window.localStorage.setItem("lunar-mansion-anchor", nextProfile.anchorIso);
    window.localStorage.setItem("lunar-mansion-timezone", activeTimeZone);
  }

  function applyAnchor(nextAnchor: string) {
    setAnchorIso(nextAnchor);
    window.localStorage.setItem("lunar-mansion-anchor", nextAnchor);
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocationMessage("unavailable");
      return;
    }

    setLocating(true);
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextRegion = regionFromCoordinates(coords.latitude, coords.longitude);
        const nextProfile = REGION_PROFILES[nextRegion];
        const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || nextProfile.timeZone;
        const activeTimeZone = regionFromTimeZone(detectedTimeZone) === nextRegion
          ? detectedTimeZone
          : nextProfile.timeZone;
        applyRegion(
          nextRegion,
          { kind: "coordinates", value: `${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°` },
          activeTimeZone,
        );
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationMessage("denied");
      },
      { enableHighAccuracy: false, maximumAge: 86_400_000, timeout: 10_000 },
    );
  }

  function selectDate(dateIso: string) {
    const date = new Date(parseIsoDate(dateIso));
    setSelectedIso(dateIso);
    if (date.getUTCFullYear() !== viewYear || date.getUTCMonth() !== viewMonth) {
      setViewYear(date.getUTCFullYear());
      setViewMonth(date.getUTCMonth());
    }
  }

  function moveMonth(amount: number) {
    const next = new Date(Date.UTC(viewYear, viewMonth + amount, 1));
    setViewYear(next.getUTCFullYear());
    setViewMonth(next.getUTCMonth());
    setSelectedIso(toIsoDate(next.getTime()));
  }

  function goToToday() {
    const today = new Date(parseIsoDate(todayIso));
    setViewYear(today.getUTCFullYear());
    setViewMonth(today.getUTCMonth());
    setSelectedIso(todayIso);
  }

  function setMonthFromValue(value: string) {
    if (!value) return;
    const [year, month] = value.split("-").map(Number);
    setViewYear(year);
    setViewMonth(month - 1);
    setSelectedIso(`${value}-01`);
  }

  return (
    <main className="app-shell" lang={language} dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="star-field" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <div className="moon-mark" aria-hidden="true"><span /></div>
          <div>
            <h1>{copy.appTitle}</h1>
            <p>{copy.appSubtitle}</p>
          </div>
        </div>

        <div className="top-actions">
          <div className="language-switcher" role="group" aria-label={copy.language}>
            <button
              type="button"
              className={language === "en" ? "active" : ""}
              aria-pressed={language === "en"}
              onClick={() => applyLanguage("en")}
            >
              EN
            </button>
            <button
              type="button"
              className={language === "ar" ? "active" : ""}
              aria-pressed={language === "ar"}
              onClick={() => applyLanguage("ar")}
            >
              عربي
            </button>
          </div>
          <button className="location-pill" type="button" onClick={() => { setAboutOpen(false); setSettingsOpen(true); }}>
            <span aria-hidden="true">⌖</span>{profileLabel(profile, language, true)}
          </button>
          <button
            className={`about-button ${aboutOpen ? "active" : ""}`}
            type="button"
            aria-label={copy.openAbout}
            aria-expanded={aboutOpen}
            aria-controls="about-dialog"
            onClick={() => {
              setSettingsOpen(false);
              setAboutOpen((open) => !open);
            }}
          >
            <span aria-hidden="true">ⓘ</span>{copy.about}
          </button>
          <button className="today-button" type="button" onClick={goToToday}>{copy.today}</button>
          <button
            className={`settings-button ${settingsOpen ? "active" : ""}`}
            type="button"
            aria-label={copy.openSettings}
            aria-expanded={settingsOpen}
            onClick={() => {
              setAboutOpen(false);
              setSettingsOpen((open) => !open);
            }}
          >
            <span aria-hidden="true">⚙</span>
          </button>
        </div>

        {settingsOpen && (
          <section className="settings-popover" aria-label={copy.settingsLabel}>
            <div className="settings-heading">
              <div>
                <p className="eyebrow">{copy.locationTradition}</p>
                <h2>{copy.regionalAlignment}</h2>
              </div>
              <button type="button" onClick={() => setSettingsOpen(false)} aria-label={copy.closeSettings}>×</button>
            </div>

            <div className="detected-location">
              <span aria-hidden="true">⌖</span>
              <div><strong>{profileLabel(profile, language)}</strong><small>{formatLocationSource(locationSource, language)}</small></div>
            </div>

            <button className="locate-button" type="button" onClick={useMyLocation} disabled={locating}>
              {locating ? copy.locating : copy.useMyLocation}
            </button>
            {locationMessage && (
              <p className="location-message">
                {locationMessage === "unavailable" ? copy.unavailableLocation : copy.deniedLocation}
              </p>
            )}

            <label>
              <span>{copy.regionalTradition}</span>
              <select
                value={regionId}
                onChange={(event) => {
                  const nextRegion = event.currentTarget.value as RegionId;
                  applyRegion(nextRegion, { kind: "manual" });
                }}
              >
                {Object.values(REGION_PROFILES).map((item) => (
                  <option value={item.id} key={item.id}>{profileLabel(item, language)}</option>
                ))}
              </select>
            </label>

            <label>
              <span>{skyMarkerName(mansions[0], language)} · {copy.dayOneReference}</span>
              <input
                type="date"
                value={anchorIso}
                onChange={(event) => event.currentTarget.value && applyAnchor(event.currentTarget.value)}
              />
            </label>
            <p>{language === "ar" ? profile.descriptionAr : profile.description} {copy.correctionNote}</p>
            <div className={`offline-status ${!isOnline ? "offline" : offlineReady ? "ready" : "preparing"}`}>
              <span aria-hidden="true">{!isOnline ? "◉" : offlineReady ? "✓" : "↓"}</span>
              <div>
                <strong>{!isOnline ? copy.runningOffline : offlineReady ? copy.offlineReady : copy.preparingOffline}</strong>
                <small>{copy.offlineHelp}</small>
              </div>
            </div>
            <button className="reset-button" type="button" onClick={() => applyAnchor(profile.anchorIso)}>
              {copy.resetAlignment}
            </button>
          </section>
        )}
      </header>

      {aboutOpen && (
        <div className="about-layer">
          <button
            className="about-backdrop"
            type="button"
            aria-label={copy.closeAbout}
            onClick={() => setAboutOpen(false)}
          />
          <section
            className="about-dialog"
            id="about-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-dialog-title"
          >
            <div className="about-heading">
              <div>
                <p className="eyebrow">{copy.aboutLabel}</p>
                <h2 id="about-dialog-title">{ABOUT_COPY[language].title}</h2>
              </div>
              <button type="button" onClick={() => setAboutOpen(false)} aria-label={copy.closeAbout}>×</button>
            </div>
            <div className="about-content">
              {ABOUT_COPY[language].paragraphs.map((paragraph, index) => (
                <p className={index === ABOUT_COPY[language].paragraphs.length - 1 ? "about-note" : ""} key={paragraph}>
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        </div>
      )}

      <section className="workspace">
        <section className="calendar-card" aria-label={copy.calendarLabel}>
          <div className="calendar-toolbar">
            <button type="button" className="month-arrow" aria-label={copy.previousMonth} onClick={() => moveMonth(-1)}>{language === "ar" ? "›" : "‹"}</button>
            <div className="month-heading">
              <p className="eyebrow">{copy.gregorianMonth}</p>
              <h2>{monthTitle}</h2>
              <span>{mansionWeeksLabel(rows.length, language)}</span>
            </div>
            <button type="button" className="month-arrow" aria-label={copy.nextMonth} onClick={() => moveMonth(1)}>{language === "ar" ? "‹" : "›"}</button>
            <label className="month-picker">
              <span>{copy.jumpToMonth}</span>
              <input
                type="month"
                value={monthValue(viewYear, viewMonth)}
                onChange={(event) => setMonthFromValue(event.currentTarget.value)}
              />
            </label>
          </div>

          <div className="alignment-strip">
            <span><b>⌖</b>{profileLabel(profile, language)}</span>
            <span><b>◷</b>{timeZone}</span>
            <span><b>◇</b>{copy.dawnReference}: {skyMarkerName(mansions[0], language)} {copy.dayOne} · {formatShortDate(parseIsoDate(anchorIso), language)}</span>
            <span className={`connection-indicator ${!isOnline ? "offline" : offlineReady ? "ready" : ""}`}>
              <b>●</b>{!isOnline ? copy.offlineMode : offlineReady ? copy.offlineReady : copy.online}
            </span>
          </div>

          <div className="calendar-frame">
            <div className="mansion-calendar" role="table" aria-label={`${monthTitle} ${copy.dateByMansionDay}`}>
              <div className="calendar-header" role="row">
                <div className="mansion-column-head" role="columnheader">
                  <span>{copy.regionalWeek}</span>
                  <strong>{copy.mansion}</strong>
                </div>
                {Array.from({ length: 13 }, (_, index) => (
                  <div className="day-column-head" role="columnheader" key={index + 1}>
                    <span>{copy.day}</span>
                    <strong>{formatNumber(index + 1, language)}</strong>
                  </div>
                ))}
                <div className="day-column-head extra-column-head" role="columnheader">
                  <span>{copy.jabha}</span>
                  <strong>{formatNumber(14, language)}</strong>
                </div>
              </div>

              {rows.map((row) => (
                <div
                  className={`mansion-row ${row.mansion.days === 14 ? "jabha-row" : ""}`}
                  role="row"
                  key={`${row.cycleYear}-${row.mansionIndex}`}
                >
                  <div className="mansion-name-cell" role="rowheader">
                    <span className="mansion-index">{formatNumber(row.mansionIndex + 1, language, 2)}</span>
                    <div>
                      <strong>{skyMarkerName(row.mansion, language)}</strong>
                      <span className="traditional-name">
                        {mansionName(row.mansion, language)}
                      </span>
                      <small>{formatShortDate(row.startMs, language)} – {formatShortDate(row.startMs + (row.mansion.days - 1) * DAY_MS, language)}</small>
                    </div>
                  </div>

                  {Array.from({ length: 13 }, (_, index) => {
                    const day = row.dates[index];
                    return (
                      <DateCell
                        day={day}
                        key={day.dateIso}
                        selectedIso={selectedIso}
                        todayIso={todayIso}
                        viewMonth={viewMonth}
                        viewYear={viewYear}
                        onSelect={selectDate}
                        language={language}
                      />
                    );
                  })}

                  {row.mansion.days === 14 ? (
                    <DateCell
                      day={row.dates[13]}
                      selectedIso={selectedIso}
                      todayIso={todayIso}
                      viewMonth={viewMonth}
                      viewYear={viewYear}
                      onSelect={selectDate}
                      language={language}
                      extra
                    />
                  ) : (
                    <div className="empty-extra-cell" role="cell" aria-label={copy.noFourteenthDay}><span>—</span></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="fit-note"><span>↔</span>{copy.calendarFit}</div>
        </section>

        <section className="detail-grid" aria-live="polite">
          <article className="selected-card">
            <p className="eyebrow">
              {selectedIso === todayIso
                ? `${copy.today} · ${profileLabel(profile, language, true)}`
                : copy.selectedDate}
            </p>
            <h2>{formatFullDate(selectedDateMs, language)}</h2>
            <label className="date-jump">
              <span>{copy.chooseDate}</span>
              <input
                type="date"
                value={selectedIso}
                onChange={(event) => event.currentTarget.value && selectDate(event.currentTarget.value)}
              />
            </label>
          </article>

          <article className="mansion-card">
            <div className="mansion-card-overview">
              <div className="mansion-card-copy">
                <div className="mansion-card-title">
                  <span>{formatNumber(selectedDay.mansionIndex + 1, language, 2)}</span>
                  <div>
                    <p>{profileLabel(profile, language)} {copy.regionMansion}</p>
                    <h3>{skyMarkerName(selectedDay.mansion, language)}</h3>
                  </div>
                </div>
                <p className="sky-marker-meta">
                  <span><b>{copy.traditionalMansion}</b>{mansionName(selectedDay.mansion, language)}</span>
                  <span><b>{copy.constellation}</b>{constellationName(selectedDay.mansion, language)}</span>
                </p>
                {selectedDay.mansion.localNote && (
                  <p className="local-name-note">
                    {language === "ar" ? selectedDay.mansion.localNoteAr || selectedDay.mansion.localNote : selectedDay.mansion.localNote}
                  </p>
                )}
              </div>
              <StarMarkerMap
                mansion={selectedDay.mansion}
                mansionIndex={selectedDay.mansionIndex}
                language={language}
              />
            </div>
            <dl>
              <div>
                <dt>{copy.dayInMansion}</dt>
                <dd>{formatNumber(selectedDay.dayInMansion, language)}<small> / {formatNumber(selectedDay.mansion.days, language)}</small></dd>
              </div>
              <div>
                <dt>{copy.mansionSpan}</dt>
                <dd className="range-value">
                  {formatShortDate(selectedMansionStart, language)}<small> {copy.to} </small>{formatShortDate(selectedMansionEnd, language)}
                </dd>
              </div>
              <div>
                <dt>{copy.cycleDay}</dt>
                <dd>{formatNumber(selectedDay.cycleDay, language)}<small> / {formatNumber(365, language)}</small></dd>
              </div>
            </dl>
            {selectedDay.mansion.days === 14 && (
              <div className="jabha-note">
                <strong>{formatNumber(14, language)}</strong><span>{copy.jabhaOnly}</span>
              </div>
            )}
          </article>

          <article className="cycle-card">
            <p className="eyebrow">{copy.regionalCycle} · {profileLabel(profile, language)}</p>
            <h3>{formatShortDate(selectedCycleStart, language)} — {formatShortDate(selectedCycleEnd, language)}</h3>
            <div className="equation">
              <span>{formatNumber(27, language)} × {formatNumber(13, language)}</span>
              <b>+</b>
              <span>{language === "ar" ? "جبهة الأسد · الجبهة" : "Leo Forehead · Al‑Jabha"} {formatNumber(14, language)}</span>
              <b>=</b>
              <strong>{formatNumber(365, language)} {language === "ar" ? "يومًا" : "days"}</strong>
            </div>
            <p>{copy.cycleExplanation}</p>
          </article>
        </section>

        <p className="visibility-note"><span aria-hidden="true">✦</span>{copy.visibilityNote}</p>

        <section className={`outlook-card tone-${selectedOutlook.tone}`} aria-label={copy.outlookTitle} aria-live="polite">
          <div className="outlook-heading">
            <div>
              <p className="eyebrow">{copy.traditionalIndication} · {profileLabel(profile, language)}</p>
              <h2>{copy.outlookTitle}</h2>
            </div>
            <div className="outlook-badges">
              <span>{skyMarkerName(selectedDay.mansion, language)}</span>
              <span>{copy.day} {formatNumber(selectedDay.dayInMansion, language)}/{formatNumber(selectedDay.mansion.days, language)}</span>
            </div>
          </div>

          <div className="outlook-grid">
            <div className="outlook-lead">
              <div className="outlook-signal" aria-hidden="true">{OUTLOOK_ICONS[selectedOutlook.tone]}</div>
              <div>
                <span>{selectedOutlook.season}</span>
                <h3>{selectedOutlook.title}</h3>
                <p>{selectedOutlook.air}</p>
              </div>
              <div className="mansion-progress" aria-label={`${formatNumber(mansionProgress, language)}% ${copy.throughMansion}`}>
                <span style={{ width: `${mansionProgress}%` }} />
              </div>
            </div>

            <div className="outlook-details">
              <article>
                <span aria-hidden="true">◌</span>
                <div><small>{copy.landWater}</small><p>{selectedOutlook.land}</p></div>
              </article>
              <article>
                <span aria-hidden="true">△</span>
                <div><small>{copy.practicalNote}</small><p>{selectedOutlook.guidance}</p></div>
              </article>
            </div>

            <aside className="next-outlook">
              <small>{copy.nextMansion}</small>
              <div>
                <strong>{skyMarkerName(nextMansion, language)}</strong>
                <b>{mansionName(nextMansion, language)}</b>
              </div>
              <span>{formatShortDate(selectedMansionEnd + DAY_MS, language)}</span>
              <p>{nextOutlook.title}</p>
            </aside>
          </div>

          <p className="outlook-disclaimer">
            {copy.disclaimer}
          </p>
        </section>

      </section>
    </main>
  );
}

function StarMarkerMap({
  language,
  mansion,
  mansionIndex,
}: {
  language: Language;
  mansion: Mansion;
  mansionIndex: number;
}) {
  const marker = STAR_MAP_MARKERS[mansionIndex];
  const pattern = STAR_MAP_PATTERNS[marker.pattern];
  const highlighted = new Set(marker.highlighted);
  const titleId = `star-map-title-${mansionIndex}`;

  return (
    <figure className="mini-star-map">
      <svg viewBox="0 0 160 94" role="img" aria-labelledby={titleId}>
        <title id={titleId}>
          {skyMarkerName(mansion, language)} · {COPY[language].schematicMap}
        </title>
        <rect className="mini-star-map-bg" x="0.5" y="0.5" width="159" height="93" rx="9" />
        <g className="mini-star-map-dust" aria-hidden="true">
          <circle cx="14" cy="16" r="0.8" /><circle cx="147" cy="13" r="0.6" />
          <circle cx="17" cy="75" r="0.6" /><circle cx="145" cy="79" r="0.8" />
          <circle cx="128" cy="11" r="0.45" /><circle cx="92" cy="82" r="0.55" />
          <circle cx="11" cy="45" r="0.45" /><circle cx="151" cy="43" r="0.5" />
        </g>
        <g className="mini-star-map-links" aria-hidden="true">
          {pattern.links.map(([from, to]) => (
            <line
              key={`${from}-${to}`}
              x1={pattern.stars[from][0]}
              y1={pattern.stars[from][1]}
              x2={pattern.stars[to][0]}
              y2={pattern.stars[to][1]}
            />
          ))}
        </g>
        <g aria-hidden="true">
          {pattern.stars.map(([x, y, radius = 1.8], index) => {
            const active = highlighted.has(index);
            return (
              <g key={`${x}-${y}`} className={active ? "related-star active" : "related-star"}>
                {active && <circle className="related-star-halo" cx={x} cy={y} r={radius + 5} />}
                <circle className="related-star-point" cx={x} cy={y} r={active ? radius + 1.25 : radius} />
              </g>
            );
          })}
          {marker.emptyCentre && (
            <g className="empty-field-marker">
              <circle cx={marker.emptyCentre[0]} cy={marker.emptyCentre[1]} r="9" />
              <path d={`M ${marker.emptyCentre[0] - 4} ${marker.emptyCentre[1]} h 8 M ${marker.emptyCentre[0]} ${marker.emptyCentre[1] - 4} v 8`} />
            </g>
          )}
        </g>
      </svg>
      <figcaption>
        <strong>{constellationName(mansion, language)}</strong>
        <span>{COPY[language].schematicMap}</span>
      </figcaption>
    </figure>
  );
}

function DateCell({
  day,
  extra = false,
  language,
  onSelect,
  selectedIso,
  todayIso,
  viewMonth,
  viewYear,
}: {
  day: MansionDate;
  extra?: boolean;
  language: Language;
  onSelect: (dateIso: string) => void;
  selectedIso: string;
  todayIso: string;
  viewMonth: number;
  viewYear: number;
}) {
  const date = new Date(day.dateMs);
  const inMonth = date.getUTCFullYear() === viewYear && date.getUTCMonth() === viewMonth;
  const weekday = new Intl.DateTimeFormat(localeFor(language), { weekday: "short", timeZone: "UTC" }).format(date).toUpperCase();
  const month = new Intl.DateTimeFormat(localeFor(language), { month: "short", timeZone: "UTC" }).format(date).toUpperCase();
  const ariaLabel = language === "ar"
    ? `${formatFullDate(day.dateMs, language)}، ${day.mansion.starAr}، المنزل التقليدي ${day.mansion.ar}، اليوم ${formatNumber(day.dayInMansion, language)} من الفترة`
    : `${formatFullDate(day.dateMs, language)}, ${day.mansion.starEn}, traditional mansion ${day.mansion.en}, period day ${day.dayInMansion}`;

  return (
    <button
      type="button"
      role="cell"
      className={`date-cell ${inMonth ? "in-month" : "outside-month"} ${
        day.dateIso === selectedIso ? "selected" : ""
      } ${day.dateIso === todayIso ? "today" : ""} ${extra ? "extra-day" : ""}`}
      aria-label={ariaLabel}
      onClick={() => onSelect(day.dateIso)}
    >
      <span className="weekday">{weekday}</span>
      <strong>{formatNumber(date.getUTCDate(), language)}</strong>
      <span className="cell-month">{month}</span>
      {day.dateIso === todayIso && <i>{COPY[language].today}</i>}
    </button>
  );
}
