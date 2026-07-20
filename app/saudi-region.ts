import type { MansionOutlook, OutlookTone } from "./outlooks";

export const SAUDI_TRADITIONAL_NAMES_AR = Object.freeze([
  "الشرطان",
  "البطين",
  "الثريا",
  "الدبران",
  "الهقعة",
  "الهنعة",
  "الذراع",
  "النثرة",
  "الطرف",
  "الجبهة",
  "الزبرة",
  "الصرفة",
  "العواء",
  "السماك الأعزل",
  "الغفر",
  "الزبانا",
  "الإكليل",
  "القلب",
  "الشولة",
  "النعائم",
  "البلدة",
  "سعد الذابح",
  "سعد بلع",
  "سعد السعود",
  "سعد الأخبية",
  "الفرغ المقدم",
  "الفرغ المؤخر",
  "الرشاء",
] as const);

export type SaudiOutlookAreaId =
  | "saudi_central"
  | "saudi_eastern"
  | "saudi_northern"
  | "saudi_red_sea"
  | "saudi_southwest_highlands"
  | "saudi_jazan_coast";

export type SaudiOutlookArea = Readonly<{
  id: SaudiOutlookAreaId;
  label: string;
  labelAr: string;
}>;

export const SAUDI_OUTLOOK_AREA_IDS = Object.freeze([
  "saudi_central",
  "saudi_eastern",
  "saudi_northern",
  "saudi_red_sea",
  "saudi_southwest_highlands",
  "saudi_jazan_coast",
] as const satisfies readonly SaudiOutlookAreaId[]);

export const DEFAULT_SAUDI_OUTLOOK_AREA: SaudiOutlookAreaId = "saudi_central";

export const SAUDI_OUTLOOK_AREAS: Readonly<Record<SaudiOutlookAreaId, SaudiOutlookArea>> =
  Object.freeze({
    saudi_central: Object.freeze({
      id: "saudi_central",
      label: "Najd & Central Plateau",
      labelAr: "نجد والهضبة الوسطى",
    }),
    saudi_eastern: Object.freeze({
      id: "saudi_eastern",
      label: "Eastern Gulf",
      labelAr: "الساحل الشرقي والخليج",
    }),
    saudi_northern: Object.freeze({
      id: "saudi_northern",
      label: "Northern Interior",
      labelAr: "الشمال الداخلي",
    }),
    saudi_red_sea: Object.freeze({
      id: "saudi_red_sea",
      label: "Hejaz & Red Sea",
      labelAr: "الحجاز وساحل البحر الأحمر",
    }),
    saudi_southwest_highlands: Object.freeze({
      id: "saudi_southwest_highlands",
      label: "Southwest Highlands",
      labelAr: "مرتفعات الجنوب الغربي",
    }),
    saudi_jazan_coast: Object.freeze({
      id: "saudi_jazan_coast",
      label: "Tihamah & Jazan Coast",
      labelAr: "تهامة وساحل جازان",
    }),
  });

export function isSaudiOutlookAreaId(value: string | null): value is SaudiOutlookAreaId {
  return value !== null && (SAUDI_OUTLOOK_AREA_IDS as readonly string[]).includes(value);
}

type Coordinate = readonly [longitude: number, latitude: number];

/**
 * A deliberately simplified offline outline used only to select the Saudi
 * cultural profile. It is not presented as an administrative boundary map.
 */
const SAUDI_OUTLINE: readonly Coordinate[] = Object.freeze([
  [34.62, 29.5],
  [35.0, 27.9],
  [36.2, 24.5],
  [37.4, 21.7],
  [39.0, 18.5],
  [41.7, 16.35],
  [43.2, 16.0],
  [46.8, 16.9],
  [50.2, 18.0],
  [52.2, 19.2],
  [55.7, 22.7],
  [54.7, 24.1],
  [51.6, 24.3],
  [50.8, 25.9],
  [48.6, 28.2],
  [47.5, 29.6],
  [44.5, 31.7],
  [39.0, 32.15],
  [37.0, 31.5],
]);

export function isSaudiCoordinate(latitude: number, longitude: number): boolean {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;

  let inside = false;
  for (let index = 0, previous = SAUDI_OUTLINE.length - 1; index < SAUDI_OUTLINE.length; previous = index, index += 1) {
    const [x1, y1] = SAUDI_OUTLINE[index];
    const [x2, y2] = SAUDI_OUTLINE[previous];
    const crossesLatitude = (y1 > latitude) !== (y2 > latitude);
    const edgeLongitude = ((x2 - x1) * (latitude - y1)) / (y2 - y1) + x1;
    if (crossesLatitude && longitude < edgeLongitude) inside = !inside;
  }
  return inside;
}

type OutlookReference = Readonly<{
  areaId: SaudiOutlookAreaId;
  latitude: number;
  longitude: number;
}>;

const SAUDI_OUTLOOK_REFERENCES: readonly OutlookReference[] = Object.freeze([
  { areaId: "saudi_central", latitude: 24.7136, longitude: 46.6753 }, // Riyadh
  { areaId: "saudi_central", latitude: 26.3592, longitude: 43.9818 }, // Buraydah
  { areaId: "saudi_eastern", latitude: 26.4207, longitude: 50.0888 }, // Dammam
  { areaId: "saudi_eastern", latitude: 25.383, longitude: 49.586 }, // Al-Ahsa
  { areaId: "saudi_eastern", latitude: 27.0174, longitude: 49.6225 }, // Jubail
  { areaId: "saudi_northern", latitude: 28.3838, longitude: 36.555 }, // Tabuk
  { areaId: "saudi_northern", latitude: 29.9697, longitude: 40.2064 }, // Sakaka
  { areaId: "saudi_northern", latitude: 30.9753, longitude: 41.0381 }, // Arar
  { areaId: "saudi_northern", latitude: 27.5114, longitude: 41.7208 }, // Hail
  { areaId: "saudi_red_sea", latitude: 21.4858, longitude: 39.1925 }, // Jeddah
  { areaId: "saudi_red_sea", latitude: 24.0895, longitude: 38.0618 }, // Yanbu
  { areaId: "saudi_red_sea", latitude: 24.5247, longitude: 39.5692 }, // Medina
  { areaId: "saudi_red_sea", latitude: 21.3891, longitude: 39.8579 }, // Makkah
  { areaId: "saudi_southwest_highlands", latitude: 21.2703, longitude: 40.4158 }, // Taif
  { areaId: "saudi_southwest_highlands", latitude: 20.0129, longitude: 41.4677 }, // Al-Baha
  { areaId: "saudi_southwest_highlands", latitude: 18.2164, longitude: 42.5053 }, // Abha
  { areaId: "saudi_southwest_highlands", latitude: 17.5656, longitude: 44.2289 }, // Najran
  { areaId: "saudi_jazan_coast", latitude: 16.8892, longitude: 42.5511 }, // Jazan
  { areaId: "saudi_jazan_coast", latitude: 17.1495, longitude: 42.6254 }, // Sabya
]);

function distanceSquared(latitude: number, longitude: number, reference: OutlookReference) {
  const latitudeRadians = latitude * Math.PI / 180;
  const longitudeScale = Math.cos(latitudeRadians);
  const northSouth = latitude - reference.latitude;
  const eastWest = (longitude - reference.longitude) * longitudeScale;
  return northSouth * northSouth + eastWest * eastWest;
}

/** Exact coordinates choose a coarse Saudi outlook area, never a new Day 1 anchor. */
export function saudiOutlookAreaForCoordinates(
  latitude: number,
  longitude: number,
): SaudiOutlookAreaId {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return DEFAULT_SAUDI_OUTLOOK_AREA;
  }

  return SAUDI_OUTLOOK_REFERENCES.reduce((nearest, candidate) =>
    distanceSquared(latitude, longitude, candidate) < distanceSquared(latitude, longitude, nearest)
      ? candidate
      : nearest,
  ).areaId;
}

type SaudiSeasonPhase = "summer" | "autumn" | "winter" | "spring";
type LocalOutlookCopy = Readonly<{
  air: string;
  airAr: string;
  land: string;
  landAr: string;
  guidance: string;
  guidanceAr: string;
  tone: OutlookTone;
}>;

const SAUDI_LOCAL_OUTLOOKS = Object.freeze({
  saudi_central: Object.freeze({
    summer: { air: "Very hot, dry afternoons dominate Najd, with dusty northwesterly winds at times.", airAr: "تسود نجد ظهيرات شديدة الحرارة والجفاف، مع رياح شمالية غربية مثيرة للغبار أحيانًا.", land: "Exposed soils, pasture and shallow water lose moisture rapidly on the central plateau.", landAr: "تفقد التربة والمراعي والمياه السطحية رطوبتها سريعًا على الهضبة الوسطى.", guidance: "Shift strenuous work toward dawn and check shade, irrigation and livestock water locally.", guidanceAr: "انقل العمل المجهد إلى الفجر وتحقق محليًا من الظل والري ومياه الماشية.", tone: "heat" },
    autumn: { air: "Nights cool across Najd while dusty changes and isolated Al-Wasm storms become possible.", airAr: "تعتدل ليالي نجد مع احتمال تقلبات مغبرة وعواصف متفرقة في الوسم.", land: "Useful rain can soften dry ground and start short-lived pasture growth very unevenly.", landAr: "قد يلين المطر النافع الأرض الجافة ويبدأ نمو المرعى بصورة شديدة التفاوت.", guidance: "Base grazing, planting and wadi decisions on measured local rain and official warnings.", guidanceAr: "ابنِ قرارات الرعي والزراعة والأودية على المطر المقاس والتحذيرات الرسمية.", tone: "transition" },
    winter: { air: "Clear nights can become cold in Najd, with frost possible in exposed and low-lying places.", airAr: "قد تشتد برودة الليالي الصافية في نجد، مع احتمال الصقيع في المواقع المكشوفة والمنخفضة.", land: "Cool soil dries slowly, but frost and cold wind can check tender growth.", landAr: "تجف التربة الباردة ببطء، لكن الصقيع والرياح الباردة قد يحدان من النمو الغض.", guidance: "Protect sensitive crops and animals when official local temperature alerts are issued.", guidanceAr: "احمِ المحاصيل والحيوانات الحساسة عند صدور تنبيهات الحرارة المحلية الرسمية.", tone: "cool" },
    spring: { air: "Najd warms quickly, with large day-night ranges, dust and occasional thunderstorms.", airAr: "ترتفع حرارة نجد سريعًا مع تفاوت كبير بين الليل والنهار وغبار وعواصف رعدية أحيانًا.", land: "Seasonal growth depends on retained winter moisture and dries rapidly as heat returns.", landAr: "يعتمد النمو الموسمي على رطوبة الشتاء المتبقية ويجف سريعًا مع عودة الحر.", guidance: "Adjust irrigation gradually and follow local dust and thunderstorm warnings.", guidanceAr: "عدّل الري تدريجيًا وتابع تحذيرات الغبار والعواصف الرعدية المحلية.", tone: "transition" },
  }),
  saudi_eastern: Object.freeze({
    summer: { air: "Extreme heat combines with high Gulf humidity, especially at night along the Eastern coast.", airAr: "يجتمع الحر الشديد مع رطوبة الخليج العالية، ولا سيما ليلًا على الساحل الشرقي.", land: "Warm saline soils and water face heavy evaporation and sustained heat stress.", landAr: "تتعرض التربة والمياه الدافئة والمالحة لتبخر مرتفع وإجهاد حراري مستمر.", guidance: "Allow extra recovery from humid heat and inspect cooling, water and stored materials.", guidanceAr: "امنح وقتًا إضافيًا للتعافي من الحر الرطب وافحص التبريد والمياه والمواد المخزنة.", tone: "humid" },
    autumn: { air: "Humidity can persist as nights slowly ease; haze, fog and isolated storms remain local.", airAr: "قد تستمر الرطوبة مع اعتدال الليل تدريجيًا، ويبقى الضباب والعوالق والعواصف محليًا.", land: "Condensation and any heavy shower can affect low coastal ground and drainage.", landAr: "قد يؤثر التكاثف وأي هطول غزير في الأراضي الساحلية المنخفضة والتصريف.", guidance: "Keep drainage open and use local visibility and rain reports for travel and field work.", guidanceAr: "أبقِ التصريف مفتوحًا واستخدم تقارير الرؤية والمطر المحلية للسفر والعمل الحقلي.", tone: "humid" },
    winter: { air: "The Eastern Province is generally mild by day, with cool humid nights, fog and occasional cold wind.", airAr: "يكون نهار المنطقة الشرقية معتدلًا غالبًا، مع ليالٍ باردة رطبة وضباب ورياح باردة أحيانًا.", land: "Slower drying and saline conditions require careful irrigation and crop observation.", landAr: "يتطلب بطء الجفاف والملوحة عناية بالري ومراقبة المحاصيل.", guidance: "Follow local fog, wind and temperature advisories rather than the calendar alone.", guidanceAr: "تابع تنبيهات الضباب والرياح والحرارة المحلية ولا تعتمد على التقويم وحده.", tone: "cool" },
    spring: { air: "Warmth rises early, with humid spells, haze and shamal-driven dust possible.", airAr: "يرتفع الدفء مبكرًا مع فترات رطبة وعوالق وغبار محتمل مع رياح الشمال.", land: "Water demand rises quickly in exposed farms and coastal soils.", landAr: "ترتفع الحاجة إلى الماء سريعًا في المزارع المكشوفة والتربة الساحلية.", guidance: "Prepare cooling and irrigation while monitoring local dust and visibility bulletins.", guidanceAr: "جهّز التبريد والري مع متابعة نشرات الغبار والرؤية المحلية.", tone: "heat" },
  }),
  saudi_northern: Object.freeze({
    summer: { air: "Hot, dry days prevail inland, but northern plateaus can cool more noticeably overnight.", airAr: "تسود أيام حارة وجافة في الداخل، وقد تبرد هضاب الشمال بصورة أوضح ليلًا.", land: "Pasture and unirrigated ground dry quickly under sun and wind.", landAr: "تجف المراعي والأرض غير المروية سريعًا تحت الشمس والرياح.", guidance: "Plan water and outdoor work for the local heat, wind and large daily temperature range.", guidanceAr: "خطط للمياه والعمل الخارجي وفق الحر والرياح والتفاوت اليومي الكبير محليًا.", tone: "heat" },
    autumn: { air: "Cooling can be rapid in the north, with wind, dust and occasional frontal rain.", airAr: "قد يحدث التبريد سريعًا في الشمال مع رياح وغبار وأمطار جبهية أحيانًا.", land: "Any useful rain can revive pasture, but coverage is often patchy.", landAr: "قد ينعش المطر النافع المراعي، لكن توزيعه يكون متفاوتًا غالبًا.", guidance: "Use measured local rainfall and prepare early for colder nights.", guidanceAr: "استخدم قياسات المطر المحلية واستعد مبكرًا لليالي الأبرد.", tone: "transition" },
    winter: { air: "Cold nights, frost and occasional severe cold are important northern-interior risks.", airAr: "تُعد الليالي الباردة والصقيع وموجات البرد الشديد أحيانًا من مخاطر الشمال الداخلي.", land: "Frost can damage tender crops and cold slows soil and plant activity.", landAr: "قد يضر الصقيع بالمحاصيل الحساسة ويبطئ البرد نشاط التربة والنبات.", guidance: "Treat official frost and cold-wave warnings as the operating reference.", guidanceAr: "اعتبر تحذيرات الصقيع وموجات البرد الرسمية المرجع العملي.", tone: "cool" },
    spring: { air: "Spring brings fast warming, strong wind, dust and occasional thunderstorms.", airAr: "يجلب الربيع ارتفاعًا سريعًا في الحرارة ورياحًا قوية وغبارًا وعواصف رعدية أحيانًا.", land: "Short seasonal growth can be followed quickly by drying and fire-weather concerns.", landAr: "قد يعقب النمو الموسمي القصير جفاف سريع وارتفاع خطر حرائق الغطاء النباتي.", guidance: "Check local wind, dust, thunderstorm and fire-weather information before field work.", guidanceAr: "تحقق من معلومات الرياح والغبار والعواصف وخطر الحرائق قبل العمل الحقلي.", tone: "transition" },
  }),
  saudi_red_sea: Object.freeze({
    summer: { air: "The Red Sea coast is very hot and humid, with warm nights and limited overnight relief.", airAr: "يكون ساحل البحر الأحمر شديد الحرارة والرطوبة مع ليالٍ دافئة وقلة التبريد الليلي.", land: "Coastal soils and water remain warm while evaporation is strong away from the immediate shore.", landAr: "تبقى التربة والمياه الساحلية دافئة ويشتد التبخر بعيدًا قليلًا عن الشاطئ.", guidance: "Use dawn work windows, hydration and local heat-stress guidance.", guidanceAr: "استفد من ساعات الفجر وحافظ على الترطيب واتبع إرشادات الإجهاد الحراري المحلية.", tone: "humid" },
    autumn: { air: "Heat and humidity ease slowly; coastal convergence can still produce local heavy showers.", airAr: "يتراجع الحر والرطوبة ببطء، وقد يسبب التقارب الساحلي زخات غزيرة محلية.", land: "Short intense rain can create rapid runoff from escarpments toward coastal plains.", landAr: "قد يصنع المطر القصير الغزير جريانًا سريعًا من السفوح نحو السهول الساحلية.", guidance: "Follow local flood and wadi warnings even when nearby districts stay dry.", guidanceAr: "تابع تحذيرات السيول والأودية المحلية حتى إذا بقيت المناطق المجاورة جافة.", tone: "transition" },
    winter: { air: "Coastal winter is generally mild, though wind, humidity and occasional rain vary by locality.", airAr: "يكون شتاء الساحل معتدلًا غالبًا، مع تفاوت محلي في الرياح والرطوبة والمطر.", land: "Cooler conditions reduce heat stress but drainage and coastal moisture still need attention.", landAr: "يخفف الاعتدال الإجهاد الحراري مع بقاء الحاجة إلى الانتباه للتصريف والرطوبة الساحلية.", guidance: "Use local marine, wind and rainfall bulletins for coastal activity.", guidanceAr: "استخدم النشرات البحرية ونشرات الرياح والمطر المحلية للنشاط الساحلي.", tone: "transition" },
    spring: { air: "Heat and humidity rebuild early along the Red Sea, with dusty inland wind at times.", airAr: "يعود الحر والرطوبة مبكرًا على البحر الأحمر مع رياح داخلية مغبرة أحيانًا.", land: "Water demand and heat stress rise first on exposed coastal ground.", landAr: "ترتفع الحاجة إلى الماء والإجهاد الحراري أولًا في الأراضي الساحلية المكشوفة.", guidance: "Prepare shade and cooling before sustained coastal heat returns.", guidanceAr: "جهّز الظل والتبريد قبل عودة الحر الساحلي المستمر.", tone: "humid" },
  }),
  saudi_southwest_highlands: Object.freeze({
    summer: { air: "High elevation moderates daytime heat, while cloud, fog and afternoon thunderstorms may develop locally.", airAr: "يخفف الارتفاع حرارة النهار، وقد تتكون السحب والضباب والعواصف الرعدية بعد الظهر محليًا.", land: "Rain can support terraces and vegetation but may also cause rapid slope runoff.", landAr: "قد يدعم المطر المدرجات والنبات، لكنه قد يسبب جريانًا سريعًا على المنحدرات.", guidance: "Check local thunderstorm, lightning and flash-flood warnings before mountain travel or field work.", guidanceAr: "تحقق من تحذيرات العواصف والبرق والسيول قبل السفر الجبلي أو العمل الحقلي.", tone: "rain" },
    autumn: { air: "Mild highland conditions continue, with patchy cloud, fog and locally heavy showers.", airAr: "تستمر أجواء المرتفعات المعتدلة مع سحب وضباب وزخات غزيرة محليًا.", land: "Moist slopes can remain productive while saturated or unstable ground needs care.", landAr: "قد تبقى السفوح الرطبة منتجة، مع الحاجة للحذر من تشبع الأرض أو عدم استقرارها.", guidance: "Use local rain gauges and road warnings because conditions change sharply with elevation.", guidanceAr: "استخدم مقاييس المطر وتحذيرات الطرق المحلية لتغير الظروف الحاد مع الارتفاع.", tone: "rain" },
    winter: { air: "Highland nights can be cold, with fog and frost possible at the highest exposed sites.", airAr: "قد تبرد ليالي المرتفعات مع ضباب واحتمال الصقيع في أعلى المواقع المكشوفة.", land: "Cool moist soil dries slowly and sensitive mountain crops may need frost protection.", landAr: "تجف التربة الباردة الرطبة ببطء وقد تحتاج المحاصيل الجبلية الحساسة إلى حماية من الصقيع.", guidance: "Follow elevation-specific temperature, fog and road advisories.", guidanceAr: "تابع تنبيهات الحرارة والضباب والطرق الخاصة بالارتفاعات.", tone: "cool" },
    spring: { air: "The highlands warm gradually, with convective cloud, wind and thunderstorms remaining possible.", airAr: "تدفأ المرتفعات تدريجيًا مع بقاء احتمال السحب الحملية والرياح والعواصف الرعدية.", land: "Terraces and vegetation respond to local moisture while exposed slopes dry faster.", landAr: "تستجيب المدرجات والنبات للرطوبة المحلية بينما تجف السفوح المكشوفة أسرع.", guidance: "Match planting and water decisions to measured soil moisture and local forecasts.", guidanceAr: "اربط قرارات الزراعة والمياه برطوبة التربة المقاسة والتوقعات المحلية.", tone: "transition" },
  }),
  saudi_jazan_coast: Object.freeze({
    summer: { air: "Tihamah and the Jazan coast are hot and very humid, with seasonal thunderstorms and heavy rain possible nearby.", airAr: "تكون تهامة وساحل جازان حارتين وشديدتي الرطوبة، مع احتمال عواصف وأمطار موسمية غزيرة قريبًا.", land: "Intense rain can quickly flood low ground and feed fast runoff from the mountains.", landAr: "قد يغمر المطر الغزير الأراضي المنخفضة سريعًا ويغذي جريانًا قويًا من الجبال.", guidance: "Treat local flood, lightning and heat warnings as essential even within the same mansion period.", guidanceAr: "اعتبر تحذيرات السيول والبرق والحر المحلية أساسية حتى داخل فترة الطالع نفسها.", tone: "rain" },
    autumn: { air: "Humidity remains high and locally active rain can continue before conditions become less unsettled.", airAr: "تبقى الرطوبة مرتفعة وقد يستمر المطر النشط محليًا قبل أن تهدأ التقلبات.", land: "Wet fields, drainage channels and mosquito habitat may need continued management.", landAr: "قد تحتاج الحقول الرطبة وقنوات التصريف ومواقع تكاثر البعوض إلى إدارة مستمرة.", guidance: "Keep drainage clear and use district-level rainfall and health guidance.", guidanceAr: "أبقِ التصريف مفتوحًا واستخدم إرشادات المطر والصحة على مستوى المحافظة.", tone: "rain" },
    winter: { air: "Winter is warm and generally less oppressive, though humidity, wind and isolated rain remain local.", airAr: "يكون الشتاء دافئًا وأقل وطأة غالبًا، مع بقاء الرطوبة والرياح والمطر المنعزل محليًا.", land: "Lower heat stress favours field activity, but irrigated and wet ground still needs drainage care.", landAr: "يساعد انخفاض الإجهاد الحراري العمل الحقلي مع استمرار الحاجة لتصريف الأرض المروية والرطبة.", guidance: "Use the milder window while checking local marine, wind and rain information.", guidanceAr: "استفد من فترة الاعتدال مع متابعة معلومات البحر والرياح والمطر المحلية.", tone: "transition" },
    spring: { air: "Heat and humidity rise early, with local convective showers possible toward the mountains.", airAr: "يرتفع الحر والرطوبة مبكرًا مع احتمال زخات حملية محلية باتجاه الجبال.", land: "Water and crop stress increase on the plain while mountain runoff can remain highly localized.", landAr: "يزداد إجهاد الماء والمحاصيل في السهل بينما يبقى جريان الجبال شديد المحلية.", guidance: "Prepare cooling and drainage together and follow local storm alerts.", guidanceAr: "جهّز التبريد والتصريف معًا وتابع تنبيهات العواصف المحلية.", tone: "humid" },
  }),
} as const satisfies Record<SaudiOutlookAreaId, Readonly<Record<SaudiSeasonPhase, LocalOutlookCopy>>>);

function phaseForMansion(mansionIndex: number): SaudiSeasonPhase {
  if (mansionIndex <= 8) return "summer";
  if (mansionIndex <= 15) return "autumn";
  if (mansionIndex <= 21) return "winter";
  return "spring";
}

function localOutlookTitle(
  phase: SaudiSeasonPhase,
  areaLabel: string,
  language: "en" | "ar",
) {
  if (language === "ar") {
    const phaseTitle = {
      summer: "أحوال موسم الحر",
      autumn: "أحوال الانتقال الخريفي",
      winter: "أحوال الشتاء",
      spring: "أحوال الانتقال الربيعي",
    }[phase];
    return `${phaseTitle} في ${areaLabel}`;
  }

  const phaseTitle = {
    summer: "Hot-season conditions",
    autumn: "Autumn transition",
    winter: "Winter conditions",
    spring: "Spring transition",
  }[phase];
  return `${phaseTitle} in ${areaLabel}`;
}

export function localizeSaudiOutlook(
  base: MansionOutlook,
  mansionIndex: number,
  areaId: SaudiOutlookAreaId,
  language: "en" | "ar",
): MansionOutlook {
  const area = SAUDI_OUTLOOK_AREAS[areaId];
  const phase = phaseForMansion(mansionIndex);
  const local = SAUDI_LOCAL_OUTLOOKS[areaId][phase];
  const areaLabel = language === "ar" ? area.labelAr : area.label;

  return {
    ...base,
    season: `${base.season} · ${areaLabel}`,
    title: localOutlookTitle(phase, areaLabel, language),
    air: language === "ar" ? local.airAr : local.air,
    land: language === "ar" ? local.landAr : local.land,
    guidance: language === "ar" ? local.guidanceAr : local.guidance,
    tone: local.tone,
  };
}
