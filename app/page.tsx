"use client";

import { useEffect, useMemo, useState } from "react";
import {
  REGIONAL_ANCHOR_PROFILES,
  annualAnchor,
  annualAnchorIso,
  calendarDateForIso,
  civilDaysBetween,
  cycleAnchorsForIso,
  type AnchorRegionId,
  type CalendarCycleDate,
  type RegionalAnchorProfile,
  type RegionalObserver,
} from "./annual-anchor";
import { MANSION_MARKERS } from "./mansion-catalogue";
import { OUTLOOK_ICONS, OUTLOOKS, type MansionOutlook } from "./outlooks";
import { OUTLOOKS_AR } from "./outlooks-ar";
import { starGroupSampleFor } from "./star-map-context";

type RegionId = AnchorRegionId;
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

type RegionProfile = {
  id: RegionId;
  label: string;
  labelAr: string;
  shortLabel: string;
  shortLabelAr: string;
  timeZone: string;
  referenceName: string;
  referenceNameAr: string;
  description: string;
  descriptionAr: string;
  mansions: Mansion[];
};

type MansionDate = Extract<CalendarCycleDate, { kind: "mansion" }> & {
  kind: "mansion";
  cycleDay: number;
  cycleYear: number;
  dateIso: string;
  dateMs: number;
  dayInMansion: number;
  mansion: Mansion;
  mansionIndex: number;
};

type AlignmentDate = Extract<CalendarCycleDate, { kind: "alignment" }> & {
  dateMs: number;
};

type CalendarDate = MansionDate | AlignmentDate;

type MansionRow = {
  kind: "mansion";
  cycleYear: number;
  dates: MansionDate[];
  mansion: Mansion;
  mansionIndex: number;
  startMs: number;
};

type AlignmentRow = {
  kind: "alignment";
  cycleYear: number;
  date: AlignmentDate;
};

type CalendarRow = MansionRow | AlignmentRow;

const DAY_MS = 86_400_000;
const MIN_SUPPORTED_YEAR = 1601;
const MAX_SUPPORTED_YEAR = 3999;

function mansionSet(names: Array<[string, string, string?, string?]>): Mansion[] {
  if (names.length !== MANSION_MARKERS.length) {
    throw new Error(`Every regional name set must contain ${MANSION_MARKERS.length} mansions.`);
  }

  return names.map(([en, ar, localNote, localNoteAr], index) => {
    const marker = MANSION_MARKERS[index];
    return {
      en,
      ar,
      starEn: marker.markerEn,
      starAr: marker.markerAr,
      constellationEn: marker.constellationEn,
      constellationAr: marker.constellationAr,
      localNote,
      localNoteAr,
      days: marker.durationDays,
    };
  });
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
    timeZone: REGIONAL_ANCHOR_PROFILES.gulf.timeZone,
    referenceName: "Dubai",
    referenceNameAr: "دبي",
    description: "The annual Day 1 dawn calculation uses Dubai as the Arabian Gulf reference point.",
    descriptionAr: "يستخدم حساب فجر اليوم الأول السنوي دبي نقطةً مرجعية للخليج العربي.",
    mansions: GULF_MANSIONS,
  },
  sudan: {
    id: "sudan",
    label: "Sudan & Upper Nile",
    labelAr: "السودان وأعالي النيل",
    shortLabel: "Sudan",
    shortLabelAr: "السودان",
    timeZone: REGIONAL_ANCHOR_PROFILES.sudan.timeZone,
    referenceName: "Khartoum",
    referenceNameAr: "الخرطوم",
    description: "Sudanese ainat names with an annually calculated Khartoum dawn reference.",
    descriptionAr: "أسماء العِينات السودانية مع مرجع فجر الخرطوم المحسوب سنويًا.",
    mansions: SUDAN_MANSIONS,
  },
  australia_tropical: {
    id: "australia_tropical",
    label: "Australia · Tropical North",
    labelAr: "أستراليا · الشمال المداري",
    shortLabel: "Tropical North",
    shortLabelAr: "الشمال المداري",
    timeZone: REGIONAL_ANCHOR_PROFILES.australia_tropical.timeZone,
    referenceName: "Darwin",
    referenceNameAr: "داروين",
    description: "Tropical North Day 1 is recalculated annually from the Aries Horns dawn proxy at Darwin.",
    descriptionAr: "يُعاد حساب اليوم الأول سنويًا للشمال المداري من ظهور قرني الحمل عند الفجر في داروين.",
    mansions: AUSTRALIA_TROPICAL_MANSIONS,
  },
  australia_central: {
    id: "australia_central",
    label: "Australia · Subtropical & Central",
    labelAr: "أستراليا · الوسط وشبه المداري",
    shortLabel: "Central Australia",
    shortLabelAr: "وسط أستراليا",
    timeZone: REGIONAL_ANCHOR_PROFILES.australia_central.timeZone,
    referenceName: "Alice Springs",
    referenceNameAr: "أليس سبرينغز",
    description: "Central Australia Day 1 is recalculated annually from the Aries Horns dawn proxy at Alice Springs.",
    descriptionAr: "يُعاد حساب اليوم الأول سنويًا لوسط أستراليا من ظهور قرني الحمل عند الفجر في أليس سبرينغز.",
    mansions: AUSTRALIA_CENTRAL_MANSIONS,
  },
  australia_temperate: {
    id: "australia_temperate",
    label: "Australia · Temperate South",
    labelAr: "أستراليا · الجنوب المعتدل",
    shortLabel: "Temperate South",
    shortLabelAr: "الجنوب المعتدل",
    timeZone: REGIONAL_ANCHOR_PROFILES.australia_temperate.timeZone,
    referenceName: "Sydney",
    referenceNameAr: "سيدني",
    description: "Temperate South Day 1 is recalculated annually from the Aries Horns dawn proxy at Sydney.",
    descriptionAr: "يُعاد حساب اليوم الأول سنويًا للجنوب المعتدل من ظهور قرني الحمل عند الفجر في سيدني.",
    mansions: AUSTRALIA_TEMPERATE_MANSIONS,
  },
  classical: {
    id: "classical",
    label: "Classical Arabic",
    labelAr: "العربية الكلاسيكية",
    shortLabel: "Classical",
    shortLabelAr: "الكلاسيكي",
    timeZone: REGIONAL_ANCHOR_PROFILES.classical.timeZone,
    referenceName: "Fixed classical reference",
    referenceNameAr: "مرجع كلاسيكي ثابت",
    description: "Classical Arabic names use a fixed 5 April reference until a geographical observer is selected.",
    descriptionAr: "تستخدم الأسماء العربية التراثية مرجعًا ثابتًا في 5 أبريل إلى أن يُحدَّد موقع جغرافي للرصد.",
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
    dayOneReference: "Calculated Day 1",
    annualAnchor: "Annual dawn anchor",
    referencePoint: "Reference point",
    dayCorrection: "day correction",
    correctionNote: "Changing this date saves a regional day correction; the app still recalculates the base anchor every year.",
    runningOffline: "Running offline",
    offlineReady: "Offline ready",
    preparingOffline: "Preparing offline use",
    offlineHelp: "After one online visit, the calendar and regional outlook can reopen without a connection.",
    resetAlignment: "Reset dawn alignment",
    annualAlignmentDay: "Annual alignment day",
    alignmentDayShort: "Alignment",
    alignmentExplanation: "This unnumbered date keeps the next calculated Day 1 aligned after a 366-day interval. It belongs to no mansion, so every 13-day period and Al‑Jabha's 14 days remain unchanged.",
    noMansion: "No mansion assigned",
    nextDayOne: "Next calculated Day 1",
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
    cycleExplanation: "The selected observer recalculates Day 1 each year. The following stations then keep the fixed 13-day sequence, with Al‑Jabha at 14 days.",
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
    schematicMap: "Star-group sample · marker stars shine",
    visibilityNote: "The same 28 traditional markers are used in every region and identify successive ecliptic stations; some reference stars lie away from the narrow path. The annual dawn calculation is an offline geometric proxy and actual visibility may differ by about one day.",
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
    dayOneReference: "اليوم الأول المحسوب",
    annualAnchor: "مرساة الفجر السنوية",
    referencePoint: "النقطة المرجعية",
    dayCorrection: "تصحيح الأيام",
    correctionNote: "عند تغيير التاريخ يُحفظ تصحيح بالأيام للمنطقة، مع استمرار إعادة حساب المرساة الأساسية كل سنة.",
    runningOffline: "يعمل دون اتصال",
    offlineReady: "جاهز دون اتصال",
    preparingOffline: "جارٍ التجهيز للعمل دون اتصال",
    offlineHelp: "بعد زيارة واحدة عبر الإنترنت، يمكن فتح التقويم والدلالة الإقليمية دون اتصال.",
    resetAlignment: "إعادة ضبط محاذاة الفجر",
    annualAlignmentDay: "يوم ضبط الدورة السنوي",
    alignmentDayShort: "ضبط الدورة",
    alignmentExplanation: "تاريخ غير مرقّم يحافظ على محاذاة اليوم الأول المحسوب التالي عندما تبلغ المسافة بين المرستين 366 يومًا. ولا ينتمي إلى أي منزلة، لذلك تبقى جميع الفترات 13 يومًا والجبهة 14 يومًا.",
    noMansion: "لا تُنسب إليه منزلة",
    nextDayOne: "اليوم الأول المحسوب التالي",
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
    cycleExplanation: "يُعاد حساب اليوم الأول سنويًا وفق موقع الراصد المختار، ثم تتبع المحطات تسلسلها الثابت من 13 يومًا، مع 14 يومًا للجبهة.",
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
    schematicMap: "نموذج مجموعة النجوم · العلامات مضيئة",
    visibilityNote: "تُستخدم العلامات التقليدية الثماني والعشرون نفسها في جميع المناطق لتحديد محطات متتابعة على مسار البروج، وقد تقع بعض النجوم المرجعية بعيدًا عن المسار الضيق. حساب الفجر نموذج هندسي يعمل دون اتصال، وقد تختلف الرؤية الفعلية بنحو يوم.",
  },
} as const;

const ABOUT_COPY = {
  en: {
    title: "Regional Lunar Mansion Calendar",
    paragraphs: [
      "This bilingual interactive calendar presents the 28 traditional lunar mansions as a continuous 365-day regional seasonal cycle. Twenty-seven periods contain 13 days, while Al‑Jabha contains 14 days.",
      "The traditional term “lunar mansions” describes 28 stellar stations along and around the ecliptic route historically associated with the Moon’s apparent path. The app uses the same audited marker sequence in every region; it does not calculate the Moon’s position or phases.",
      "Regional Day 1 is recalculated every year from an offline dawn-visibility proxy for the two Aries Horn stars. After Day 1, the calendar preserves the conventional fixed 13-day sequence and Al‑Jabha’s 14 days. If two annual anchors are 366 dates apart, the extra date is shown separately as an unnumbered Annual Alignment Day.",
      "The Gregorian monthly table shows every date with its related star group and regional mansion name, together with a schematic star-group sample whose mansion markers shine and a regional seasonal outlook. Reference profiles cover the Arabian Gulf, Sudan, and three Australian climate regions; the location option can use the observer’s coordinates.",
      "The calendar works in Arabic and English, adapts to mobile screens, and remains available offline after the first online visit.",
      "This is a traditional regional seasonal calendar—not a live weather forecast. The geometric dawn proxy can differ from actual naked-eye visibility by about one day because of haze, terrain and local horizon conditions.",
    ],
  },
  ar: {
    title: "تقويم العِينات الإقليمي",
    paragraphs: [
      "تقويم تفاعلي ثنائي اللغة يعرض المنازل القمرية التقليدية الثمانية والعشرين ضمن دورة موسمية إقليمية متصلة مدتها 365 يومًا. تمتد سبعة وعشرون منزلة لمدة 13 يومًا، بينما تمتد منزلة الجبهة وحدها لمدة 14 يومًا.",
      "يشير الاسم التراثي «المنازل القمرية» إلى ثماني وعشرين محطة نجمية تقع على امتداد مسار البروج وحوله، وهو المسار المرتبط تاريخيًا بالحركة الظاهرية للقمر. يستخدم التطبيق تسلسل العلامات النجمية المدقَّق نفسه في جميع المناطق، ولا يحسب موضع القمر أو أطواره.",
      "يُعاد حساب اليوم الأول إقليميًا كل سنة بواسطة نموذج يعمل دون اتصال لظهور نجمي قرني الحمل عند الفجر. وبعد اليوم الأول يحافظ التقويم على التسلسل التقليدي الثابت من 13 يومًا، وعلى 14 يومًا للجبهة. وإذا فصل 366 تاريخًا بين مرساتين سنويتين، يظهر التاريخ الزائد منفصلًا باسم «يوم ضبط الدورة السنوي» من دون رقم.",
      "يعرض جدول الشهر الميلادي كل تاريخ مع مجموعة النجوم المرتبطة به واسم المنزلة الإقليمي، إضافة إلى نموذج مبسط لمجموعة النجوم تتوهج فيه علامات المنزلة ودلالة موسمية. وتشمل الملفات المرجعية الخليج العربي والسودان وثلاثة أقاليم مناخية في أستراليا، ويمكن لخيار الموقع استخدام إحداثيات الراصد.",
      "يعمل التقويم باللغتين العربية والإنجليزية، ويتكيف مع شاشات الهواتف، ويمكن استخدامه دون اتصال بعد فتحه أول مرة عبر الإنترنت.",
      "هذا تقويم موسمي إقليمي تقليدي، وليس توقعًا مباشرًا للطقس. وقد تختلف الرؤية الفعلية بالعين عن نموذج الفجر الهندسي بنحو يوم بسبب الغبار والتضاريس وحالة الأفق المحلي.",
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

function regionalCalendarDateForDate(
  dateMs: number,
  anchorProfile: RegionalAnchorProfile | RegionId,
  correctionDays: number,
  observer: RegionalObserver | undefined,
  mansions: Mansion[],
): CalendarDate {
  const dateIso = toIsoDate(dateMs);
  const mapped = calendarDateForIso(dateIso, anchorProfile, correctionDays, observer);
  if (mapped.kind === "alignment") return { ...mapped, dateMs };

  return {
    ...mapped,
    dateMs,
    mansion: mansions[mapped.mansionIndex],
  };
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
  const [anchorCorrections, setAnchorCorrections] = useState<Partial<Record<RegionId, number>>>({});
  const [observerOverride, setObserverOverride] = useState<RegionalObserver>();
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
  const anchorProfile = useMemo<RegionalAnchorProfile>(() => ({
    ...REGIONAL_ANCHOR_PROFILES[regionId],
    timeZone,
  }), [regionId, timeZone]);
  const correctionDays = anchorCorrections[regionId] ?? 0;
  const todayIso = todayIsoForTimeZone(timeZone);
  const viewAnchor = useMemo(
    () => annualAnchor(anchorProfile, viewYear, correctionDays, observerOverride),
    [anchorProfile, correctionDays, observerOverride, viewYear],
  );
  const anchorIso = viewAnchor.isoDate;

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
      const storedTimeZone = window.localStorage.getItem("lunar-mansion-timezone");
      const storedCorrections = window.localStorage.getItem("seasonal-star-anchor-corrections");
      const activeZone = storedTimeZone || detectedZone;
      const nextToday = todayIsoForTimeZone(activeZone);
      const nextDate = new Date(parseIsoDate(nextToday));

      setTimeZone(activeZone);
      setLanguage(storedLanguage === "ar" || storedLanguage === "en"
        ? storedLanguage
        : navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en");
      setRegionId(detectedRegion);
      if (storedCorrections) {
        try {
          const parsed = JSON.parse(storedCorrections) as Record<string, unknown>;
          const valid = Object.fromEntries(
            Object.entries(parsed).filter(([key, value]) =>
              key in REGION_PROFILES &&
              typeof value === "number" &&
              Number.isInteger(value) &&
              value >= -30 &&
              value <= 30,
            ),
          ) as Partial<Record<RegionId, number>>;
          setAnchorCorrections(valid);
        } catch {
          window.localStorage.removeItem("seasonal-star-anchor-corrections");
        }
      }
      window.localStorage.removeItem("lunar-mansion-anchor");
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
  const monthCycleAnchors = useMemo(
    () => cycleAnchorsForIso(
      toIsoDate(monthStart),
      anchorProfile,
      correctionDays,
      observerOverride,
    ),
    [anchorProfile, correctionDays, monthStart, observerOverride],
  );

  const rows = useMemo(() => {
    const rowKeys: string[] = [];
    const rowLookup = new Map<string, CalendarDate>();

    for (let dateMs = monthStart; dateMs <= monthEnd; dateMs += DAY_MS) {
      const info = regionalCalendarDateForDate(
        dateMs,
        anchorProfile,
        correctionDays,
        observerOverride,
        mansions,
      );
      const key = info.kind === "alignment"
        ? `${info.cycleYear}-alignment`
        : `${info.cycleYear}-${info.mansionIndex}`;
      if (!rowLookup.has(key)) {
        rowKeys.push(key);
        rowLookup.set(key, info);
      }
    }

    return rowKeys.map((key): CalendarRow => {
      const rowInfo = rowLookup.get(key)!;
      if (rowInfo.kind === "alignment") {
        return { kind: "alignment", cycleYear: rowInfo.cycleYear, date: rowInfo };
      }

      const mansion = mansions[rowInfo.mansionIndex];
      const startMs =
        parseIsoDate(annualAnchorIso(anchorProfile, rowInfo.cycleYear, correctionDays, observerOverride)) +
        mansionOffsets[rowInfo.mansionIndex] * DAY_MS;
      return {
        kind: "mansion",
        cycleYear: rowInfo.cycleYear,
        dates: Array.from({ length: mansion.days }, (_, index) =>
          regionalCalendarDateForDate(
            startMs + index * DAY_MS,
            anchorProfile,
            correctionDays,
            observerOverride,
            mansions,
          ) as MansionDate,
        ),
        mansion,
        mansionIndex: rowInfo.mansionIndex,
        startMs,
      };
    });
  }, [anchorProfile, correctionDays, mansionOffsets, mansions, monthEnd, monthStart, observerOverride]);

  const selectedDateMs = parseIsoDate(selectedIso);
  const selectedDay = regionalCalendarDateForDate(
    selectedDateMs,
    anchorProfile,
    correctionDays,
    observerOverride,
    mansions,
  );
  const selectedCycleStart = parseIsoDate(selectedDay.dayOneIso);
  const selectedCycleEnd = selectedCycleStart + 364 * DAY_MS;
  const selectedAlignmentDate = selectedDay.intervalDays === 366 ? selectedCycleStart + 365 * DAY_MS : null;
  const selectedMansionStart = selectedDay.kind === "mansion"
    ? selectedCycleStart + mansionOffsets[selectedDay.mansionIndex] * DAY_MS
    : null;
  const selectedMansionEnd = selectedDay.kind === "mansion" && selectedMansionStart !== null
    ? selectedMansionStart + (selectedDay.mansion.days - 1) * DAY_MS
    : null;
  const selectedMansionIndex = selectedDay.kind === "mansion" ? selectedDay.mansionIndex : null;
  const selectedOutlookSource = selectedMansionIndex !== null
    ? OUTLOOKS[regionId][selectedMansionIndex]
    : null;
  const selectedOutlook: MansionOutlook | null = selectedOutlookSource && selectedMansionIndex !== null
    ? language === "ar"
      ? { ...selectedOutlookSource, ...OUTLOOKS_AR[regionId][selectedMansionIndex] }
      : selectedOutlookSource
    : null;
  const nextMansionIndex = selectedDay.kind === "mansion"
    ? (selectedDay.mansionIndex + 1) % mansions.length
    : 0;
  const nextMansion = mansions[nextMansionIndex];
  const nextMansionStart = selectedDay.kind === "alignment" || nextMansionIndex === 0
    ? parseIsoDate(selectedDay.nextDayOneIso)
    : (selectedMansionEnd ?? selectedDateMs) + DAY_MS;
  const nextOutlookSource = OUTLOOKS[regionId][nextMansionIndex];
  const nextOutlook = language === "ar"
    ? { ...nextOutlookSource, ...OUTLOOKS_AR[regionId][nextMansionIndex] }
    : nextOutlookSource;
  const mansionProgress = selectedDay.kind === "mansion"
    ? Math.round((selectedDay.dayInMansion / selectedDay.mansion.days) * 100)
    : 0;

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
    setObserverOverride(undefined);
    setTimeZone(activeTimeZone);
    setLocationSource(source);
    setLocationMessage("");
    window.localStorage.setItem("lunar-mansion-region", nextRegion);
    window.localStorage.setItem("lunar-mansion-timezone", activeTimeZone);
  }

  function applyAnchor(nextAnchor: string) {
    const baseAnchor = annualAnchorIso(anchorProfile, viewYear, 0, observerOverride);
    const nextCorrection = civilDaysBetween(baseAnchor, nextAnchor);
    if (!Number.isInteger(nextCorrection) || nextCorrection < -30 || nextCorrection > 30) return;
    const nextCorrections = { ...anchorCorrections, [regionId]: nextCorrection };
    setAnchorCorrections(nextCorrections);
    window.localStorage.setItem("seasonal-star-anchor-corrections", JSON.stringify(nextCorrections));
  }

  function resetAnchor() {
    const nextCorrections = { ...anchorCorrections, [regionId]: 0 };
    setAnchorCorrections(nextCorrections);
    window.localStorage.setItem("seasonal-star-anchor-corrections", JSON.stringify(nextCorrections));
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
        setObserverOverride({
          latitude: coords.latitude,
          longitude: coords.longitude,
          elevationMeters: Number.isFinite(coords.altitude) ? coords.altitude ?? 0 : 0,
        });
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
    if (next.getUTCFullYear() < MIN_SUPPORTED_YEAR || next.getUTCFullYear() > MAX_SUPPORTED_YEAR) return;
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
    if (year < MIN_SUPPORTED_YEAR || year > MAX_SUPPORTED_YEAR) return;
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
          <button
            className={`location-pill ${settingsOpen ? "active" : ""}`}
            type="button"
            aria-label={copy.openSettings}
            aria-expanded={settingsOpen}
            aria-controls="regional-settings"
            onClick={() => { setAboutOpen(false); setSettingsOpen((open) => !open); }}
          >
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
        </div>

        {settingsOpen && (
          <section className="settings-popover" id="regional-settings" aria-label={copy.settingsLabel}>
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
              <span>
                {skyMarkerName(mansions[0], language)} · {copy.dayOneReference} · {formatNumber(viewYear, language)}
              </span>
              <input
                type="date"
                value={anchorIso}
                min={toIsoDate(parseIsoDate(viewAnchor.baseIsoDate) - 30 * DAY_MS)}
                max={toIsoDate(parseIsoDate(viewAnchor.baseIsoDate) + 30 * DAY_MS)}
                onChange={(event) => event.currentTarget.value && applyAnchor(event.currentTarget.value)}
              />
            </label>
            <p>
              <strong>{copy.referencePoint}: {observerOverride
                ? `${observerOverride.latitude.toFixed(2)}°, ${observerOverride.longitude.toFixed(2)}°`
                : language === "ar" ? profile.referenceNameAr : profile.referenceName}</strong>
              <br />
              {language === "ar" ? profile.descriptionAr : profile.description} {copy.correctionNote}
            </p>
            <div className={`offline-status ${!isOnline ? "offline" : offlineReady ? "ready" : "preparing"}`}>
              <span aria-hidden="true">{!isOnline ? "◉" : offlineReady ? "✓" : "↓"}</span>
              <div>
                <strong>{!isOnline ? copy.runningOffline : offlineReady ? copy.offlineReady : copy.preparingOffline}</strong>
                <small>{copy.offlineHelp}</small>
              </div>
            </div>
            <button className="reset-button" type="button" onClick={resetAnchor}>
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
              <span>
                {mansionWeeksLabel(rows.filter((row) => row.kind === "mansion").length, language)}
                {rows.some((row) => row.kind === "alignment") ? ` · ${copy.annualAlignmentDay}` : ""}
              </span>
            </div>
            <button type="button" className="month-arrow" aria-label={copy.nextMonth} onClick={() => moveMonth(1)}>{language === "ar" ? "‹" : "›"}</button>
            <label className="month-picker">
              <span>{copy.jumpToMonth}</span>
              <input
                type="month"
                value={monthValue(viewYear, viewMonth)}
                min={`${MIN_SUPPORTED_YEAR}-01`}
                max={`${MAX_SUPPORTED_YEAR}-12`}
                onChange={(event) => setMonthFromValue(event.currentTarget.value)}
              />
            </label>
          </div>

          <div className="alignment-strip">
            <span><b>⌖</b>{profileLabel(profile, language)}</span>
            <span><b>◷</b>{timeZone}</span>
            <span>
              <b>◇</b>{copy.annualAnchor}: {skyMarkerName(mansions[0], language)} {copy.dayOne} · {formatShortDate(parseIsoDate(monthCycleAnchors.dayOneIso), language)}
              {correctionDays !== 0 ? ` · ${copy.dayCorrection} ${formatNumber(correctionDays, language)}` : ""}
            </span>
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

              {rows.map((row) => row.kind === "alignment" ? (
                <div
                  className="mansion-row alignment-row"
                  role="row"
                  key={row.date.dateIso}
                >
                  <div className="mansion-name-cell" role="rowheader">
                    <span className="mansion-index">✦</span>
                    <div>
                      <strong>{copy.annualAlignmentDay}</strong>
                      <span className="traditional-name">{copy.noMansion}</span>
                    </div>
                  </div>
                  <button
                    className={`alignment-date-cell ${row.date.dateIso === selectedIso ? "selected" : ""} ${row.date.dateIso === todayIso ? "today" : ""}`}
                    type="button"
                    role="cell"
                    onClick={() => selectDate(row.date.dateIso)}
                  >
                    <strong>{formatFullDate(row.date.dateMs, language)}</strong>
                    <span>{copy.alignmentDayShort}</span>
                  </button>
                </div>
              ) : (
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
                min={`${MIN_SUPPORTED_YEAR}-01-01`}
                max={`${MAX_SUPPORTED_YEAR}-12-31`}
                onChange={(event) => event.currentTarget.value && selectDate(event.currentTarget.value)}
              />
            </label>
          </article>

          {selectedDay.kind === "mansion" ? (
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
                    {formatShortDate(selectedMansionStart ?? selectedDateMs, language)}
                    <small> {copy.to} </small>
                    {formatShortDate(selectedMansionEnd ?? selectedDateMs, language)}
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
          ) : (
            <article className="mansion-card alignment-detail-card">
              <div className="mansion-card-title">
                <span aria-hidden="true">✦</span>
                <div>
                  <p>{profileLabel(profile, language)} · {copy.regionalCycle}</p>
                  <h3>{copy.annualAlignmentDay}</h3>
                </div>
              </div>
              <p className="alignment-note">{copy.alignmentExplanation}</p>
              <dl>
                <div>
                  <dt>{copy.traditionalMansion}</dt>
                  <dd className="range-value">{copy.noMansion}</dd>
                </div>
                <div>
                  <dt>{copy.nextDayOne}</dt>
                  <dd className="range-value">{formatShortDate(parseIsoDate(selectedDay.nextDayOneIso), language)}</dd>
                </div>
              </dl>
            </article>
          )}

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
            <p>
              {copy.cycleExplanation}
              {selectedAlignmentDate !== null && (
                <><br /><strong>{copy.annualAlignmentDay}: {formatShortDate(selectedAlignmentDate, language)}</strong></>
              )}
            </p>
          </article>
        </section>

        <p className="visibility-note"><span aria-hidden="true">✦</span>{copy.visibilityNote}</p>

        {selectedDay.kind === "mansion" && selectedOutlook ? (
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
              <span>{formatShortDate(nextMansionStart, language)}</span>
              <p>{nextOutlook.title}</p>
            </aside>
          </div>

          <p className="outlook-disclaimer">
            {copy.disclaimer}
          </p>
        </section>
        ) : (
          <section className="outlook-card tone-neutral" aria-label={copy.annualAlignmentDay} aria-live="polite">
            <div className="outlook-heading">
              <div>
                <p className="eyebrow">{copy.regionalCycle} · {profileLabel(profile, language)}</p>
                <h2>{copy.annualAlignmentDay}</h2>
              </div>
              <div className="outlook-badges"><span>{copy.noMansion}</span></div>
            </div>
            <div className="outlook-grid alignment-outlook-grid">
              <div className="outlook-lead">
                <div className="outlook-signal" aria-hidden="true">✦</div>
                <div>
                  <span>{copy.alignmentDayShort}</span>
                  <h3>{copy.nextDayOne}</h3>
                  <p>{copy.alignmentExplanation}</p>
                </div>
              </div>
              <aside className="next-outlook">
                <small>{copy.nextMansion}</small>
                <div>
                  <strong>{skyMarkerName(nextMansion, language)}</strong>
                  <b>{mansionName(nextMansion, language)}</b>
                </div>
                <span>{formatShortDate(nextMansionStart, language)}</span>
                <p>{nextOutlook.title}</p>
              </aside>
            </div>
          </section>
        )}

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
  const { sample, pattern } = starGroupSampleFor(mansionIndex);
  const highlighted = new Set<number>(sample.highlighted);
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
          {pattern.links.map(([from, to]) => {
            const start = pattern.stars[from];
            const end = pattern.stars[to];
            if (!start || !end) return null;
            return (
              <line
                key={`${from}-${to}`}
                x1={start[0]}
                y1={start[1]}
                x2={end[0]}
                y2={end[1]}
              />
            );
          })}
        </g>
        <g aria-hidden="true">
          {pattern.stars.map(([x, y, radius = 1.8], index) => {
            const active = highlighted.has(index);
            return (
              <g
                key={`${x}-${y}`}
                className={active ? "related-star active" : "related-star"}
              >
                {active && (
                  <circle className="related-star-halo" cx={x} cy={y} r={radius + 5} />
                )}
                <circle
                  className="related-star-point"
                  cx={x}
                  cy={y}
                  r={active ? radius + 1.25 : radius}
                />
              </g>
            );
          })}
          {sample.emptyCentre && (
            <g className="empty-field-marker">
              <circle cx={sample.emptyCentre[0]} cy={sample.emptyCentre[1]} r="9" />
              <path
                d={`M ${sample.emptyCentre[0] - 4} ${sample.emptyCentre[1]} h 8 M ${sample.emptyCentre[0]} ${sample.emptyCentre[1] - 4} v 8`}
              />
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
