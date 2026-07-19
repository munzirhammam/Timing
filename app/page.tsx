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
  designation: string;
  constellationEn: string;
  constellationAr: string;
  days: number;
  localNote?: string;
  localNoteAr?: string;
};

type SkyMarker = Pick<
  Mansion,
  "starEn" | "starAr" | "designation" | "constellationEn" | "constellationAr"
>;

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
  { starEn: "Sheratan–Mesarthim Pair", starAr: "زوج شيراتان وميسارثيم", designation: "β–γ Arietis", constellationEn: "Aries", constellationAr: "الحمل" },
  { starEn: "Aries Belly Stars", starAr: "نجوم بطن الحمل", designation: "δ–ε Arietis", constellationEn: "Aries", constellationAr: "الحمل" },
  { starEn: "Pleiades Cluster", starAr: "عنقود الثريا", designation: "M45", constellationEn: "Taurus", constellationAr: "الثور" },
  { starEn: "Aldebaran", starAr: "نجم الدبران", designation: "α Tauri", constellationEn: "Taurus", constellationAr: "الثور" },
  { starEn: "Meissa–Phi Orionis Group", starAr: "مجموعة ميسا وفاي الجبار", designation: "λ, φ¹, φ² Orionis", constellationEn: "Orion", constellationAr: "الجبار" },
  { starEn: "Gamma–Xi Geminorum Pair", starAr: "زوج غاما وإكساي التوأمين", designation: "γ–ξ Geminorum", constellationEn: "Gemini", constellationAr: "التوأمان" },
  { starEn: "Castor–Pollux Pair", starAr: "زوج كاستور وبولوكس", designation: "α–β Geminorum", constellationEn: "Gemini", constellationAr: "التوأمان" },
  { starEn: "Beehive Cluster", starAr: "عنقود خلية النحل", designation: "M44", constellationEn: "Cancer", constellationAr: "السرطان" },
  { starEn: "Cancer–Leo Eye Pair", starAr: "زوج عين الأسد بين السرطان والأسد", designation: "κ Cancri · λ Leonis", constellationEn: "Cancer–Leo", constellationAr: "السرطان والأسد" },
  { starEn: "Leo Forehead Asterism", starAr: "مجموعة نجوم جبهة الأسد", designation: "ζ, γ, η, α Leonis", constellationEn: "Leo", constellationAr: "الأسد" },
  { starEn: "Zosma–Chertan Pair", starAr: "زوج زوسما وشرتان", designation: "δ–θ Leonis", constellationEn: "Leo", constellationAr: "الأسد" },
  { starEn: "Denebola", starAr: "نجم ذنب الأسد", designation: "β Leonis", constellationEn: "Leo", constellationAr: "الأسد" },
  { starEn: "Virgo Arc Asterism", starAr: "قوس نجوم العذراء", designation: "β, η, γ, δ, ε Virginis", constellationEn: "Virgo", constellationAr: "العذراء" },
  { starEn: "Spica", starAr: "نجم السنبلة", designation: "α Virginis", constellationEn: "Virgo", constellationAr: "العذراء" },
  { starEn: "Virgo Veil Trio", starAr: "ثلاثي نجوم العذراء", designation: "ι, κ, λ Virginis", constellationEn: "Virgo", constellationAr: "العذراء" },
  { starEn: "Libra Balance Pair", starAr: "زوج كفتي الميزان", designation: "α–β Librae", constellationEn: "Libra", constellationAr: "الميزان" },
  { starEn: "Scorpion Crown Trio", starAr: "ثلاثي إكليل العقرب", designation: "β, δ, π Scorpii", constellationEn: "Scorpius", constellationAr: "العقرب" },
  { starEn: "Antares", starAr: "نجم قلب العقرب", designation: "α Scorpii", constellationEn: "Scorpius", constellationAr: "العقرب" },
  { starEn: "Shaula–Lesath Pair", starAr: "زوج الشولة ولسعة", designation: "λ–υ Scorpii", constellationEn: "Scorpius", constellationAr: "العقرب" },
  { starEn: "Sagittarius Eight-Star Group", starAr: "مجموعة نجوم القوس الثمانية", designation: "γ, δ, ε, η, ρ, φ, τ, ζ Sagittarii", constellationEn: "Sagittarius", constellationAr: "القوس" },
  { starEn: "Pi Sagittarii & Star-Poor Field", starAr: "باي القوس والحقل قليل النجوم", designation: "π Sagittarii · sparse field", constellationEn: "Sagittarius", constellationAr: "القوس" },
  { starEn: "Dabih Pair", starAr: "زوج الذابح", designation: "α–β Capricorni", constellationEn: "Capricornus", constellationAr: "الجدي" },
  { starEn: "Mu–Nu Aquarii Pair", starAr: "زوج ميو ونيو الدلو", designation: "μ–ν Aquarii", constellationEn: "Aquarius", constellationAr: "الدلو" },
  { starEn: "Sadalsuud–Xi Aquarii Pair", starAr: "زوج سعد السعود وإكساي الدلو", designation: "β–ξ Aquarii", constellationEn: "Aquarius", constellationAr: "الدلو" },
  { starEn: "Sadachbia Group", starAr: "مجموعة سعد الأخبية", designation: "γ, ζ, η, π Aquarii", constellationEn: "Aquarius", constellationAr: "الدلو" },
  { starEn: "Markab–Scheat Pair", starAr: "زوج المركب ومنكب الفرس", designation: "α–β Pegasi", constellationEn: "Pegasus", constellationAr: "الفرس الأعظم" },
  { starEn: "Algenib–Alpheratz Pair", starAr: "زوج الجنب وسرة الفرس", designation: "γ Pegasi · α Andromedae", constellationEn: "Pegasus–Andromeda", constellationAr: "الفرس الأعظم والمرأة المسلسلة" },
  { starEn: "Mirach", starAr: "نجم المراق", designation: "β Andromedae", constellationEn: "Andromeda", constellationAr: "المرأة المسلسلة" },
];

if (SKY_MARKERS.length !== 28 || MANSION_LENGTHS.reduce((sum, days) => sum + days, 0) !== 365) {
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
  ["Al-Zubana", "الزباني"], ["Al-Iklil", "الإكليل"], ["Al-Qalb", "القلب"],
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
    description: "Tropical North reference: the Sheratan–Mesarthim marker begins near its traditional first dawn appearance. Reference coordinates: Darwin.",
    descriptionAr: "مرجع الشمال المداري: تبدأ علامة شيراتان–ميسارثيم قرب أول ظهور تقليدي لها عند الفجر. إحداثيات المرجع: داروين.",
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
    description: "Subtropical and central reference: the Sheratan–Mesarthim marker begins near its traditional first dawn appearance. Reference coordinates: Alice Springs.",
    descriptionAr: "مرجع الوسط وشبه المداري: تبدأ علامة شيراتان–ميسارثيم قرب أول ظهور تقليدي لها عند الفجر. إحداثيات المرجع: أليس سبرينغز.",
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
    description: "Temperate South reference: the Sheratan–Mesarthim marker begins near its traditional first dawn appearance. Reference latitude: 35° south.",
    descriptionAr: "مرجع الجنوب المعتدل: تبدأ علامة شيراتان–ميسارثيم قرب أول ظهور تقليدي لها عند الفجر. خط العرض المرجعي: 35° جنوبًا.",
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
    designation: "Star designation",
    constellation: "Constellation",
    dawnReference: "Dawn alignment reference",
    visibilityNote: "The listed star or group is the traditional sky marker for this 13-day period. Dawn visibility is approximate; clouds, terrain, twilight and exact coordinates affect observation.",
  },
  ar: {
    appTitle: "تقويم النجوم الموسمية",
    appSubtitle: "دورة إقليمية لمحطات النجوم من 365 يومًا · الأشهر الميلادية",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    today: "اليوم",
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
    designation: "التعيين النجمي",
    constellation: "الكوكبة",
    dawnReference: "مرجع محاذاة الفجر",
    visibilityNote: "النجم أو المجموعة المدرجة هي علامة السماء التقليدية لهذه الفترة ذات 13 يومًا. الرؤية عند الفجر تقريبية؛ إذ تؤثر السحب والتضاريس والشفق والإحداثيات الدقيقة في الرصد.",
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
          <button className="location-pill" type="button" onClick={() => setSettingsOpen(true)}>
            <span aria-hidden="true">⌖</span>{profileLabel(profile, language, true)}
          </button>
          <button className="today-button" type="button" onClick={goToToday}>{copy.today}</button>
          <button
            className={`settings-button ${settingsOpen ? "active" : ""}`}
            type="button"
            aria-label={copy.openSettings}
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
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
                        {mansionName(row.mansion, language)} · {row.mansion.designation}
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
            <div className="mansion-card-title">
              <span>{formatNumber(selectedDay.mansionIndex + 1, language, 2)}</span>
              <div>
                <p>{profileLabel(profile, language)} {copy.regionMansion}</p>
                <h3>{skyMarkerName(selectedDay.mansion, language)}</h3>
              </div>
              <b dir="ltr">{selectedDay.mansion.designation}</b>
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
