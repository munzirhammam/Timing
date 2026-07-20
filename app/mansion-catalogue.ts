/**
 * Region-independent catalogue of the 28 traditional stellar stations.
 *
 * The friendly labels in this file are intended for display. `auditId` exists
 * only so that coordinates can be checked against the source catalogue; it is
 * deliberately not part of any display label.
 *
 * Coordinates are J2000 equatorial right ascension (hours) and declination
 * (degrees). Cluster-centre values are explicitly marked as approximate.
 */

export type LocalizedLabel = Readonly<{
  en: string;
  ar: string;
}>;

export type MarkerPatternType =
  | "single"
  | "pair"
  | "wide-pair"
  | "trio"
  | "quartet"
  | "arc"
  | "group"
  | "octet"
  | "cluster"
  | "side"
  | "empty-sector";

export type MarkerMemberRole = "marker-star" | "cluster-centre" | "fiducial";

export type MarkerMember = Readonly<{
  /** Internal catalogue identifier. Never use this as a display label. */
  auditId: string;
  raHoursJ2000: number;
  decDegreesJ2000: number;
  magnitude: number;
  role?: MarkerMemberRole;
  approximate?: boolean;
}>;

export type MansionMarker = Readonly<{
  number: number;
  marker: LocalizedLabel;
  classicalMansion: LocalizedLabel;
  classicalAliases?: readonly LocalizedLabel[];
  constellation: LocalizedLabel;
  patternType: MarkerPatternType;
  members: readonly MarkerMember[];
  /** Lines joining member indexes. They are schematic aids, not IAU boundaries. */
  links: ReadonlyArray<readonly [from: number, to: number]>;
  clusterSpreadDegrees?: number;
  durationDays: 13 | 14;
}>;

export type DisplayMansionMarker = MansionMarker &
  Readonly<{
    markerEn: string;
    markerAr: string;
    mansionEn: string;
    mansionAr: string;
    constellationEn: string;
    constellationAr: string;
  }>;

const member = (
  auditId: string,
  raHoursJ2000: number,
  decDegreesJ2000: number,
  magnitude: number,
  options: Pick<MarkerMember, "role" | "approximate"> = {},
): MarkerMember => ({
  auditId,
  raHoursJ2000,
  decDegreesJ2000,
  magnitude,
  ...options,
});

const label = (en: string, ar: string): LocalizedLabel => ({ en, ar });

const MANSION_DAYS = (number: number): 13 | 14 => (number === 10 ? 14 : 13);

/**
 * The same stellar catalogue is used in every region. Regions may provide
 * their own names, outlooks, observer coordinates and annual dawn anchor, but
 * they must not substitute a different series of stars.
 */
export const MANSION_MARKER_CATALOGUE = [
  {
    number: 1,
    marker: label("Aries Horns", "قرنا الحمل"),
    classicalMansion: label("Al-Sharatain", "الشرطان"),
    constellation: label("Aries", "الحمل"),
    patternType: "pair",
    members: [
      member("beta Ari · HIP 8903", 1.91065251, 20.80829949, 2.64),
      member("gamma Ari · HIP 8832", 1.892157, 19.29409264, 3.88),
    ],
    links: [[0, 1]],
    durationDays: MANSION_DAYS(1),
  },
  {
    number: 2,
    marker: label("Aries Belly", "بطن الحمل"),
    classicalMansion: label("Al-Butain", "البطين"),
    constellation: label("Aries", "الحمل"),
    patternType: "pair",
    members: [
      member("delta Ari · HIP 14838", 3.19379712, 19.72669777, 4.35),
      member("epsilon Ari · HIP 13914", 2.98687051, 21.34044477, 4.63),
    ],
    links: [[0, 1]],
    durationDays: MANSION_DAYS(2),
  },
  {
    number: 3,
    marker: label("Pleiades in Taurus", "الثريا"),
    classicalMansion: label("Al-Thurayya", "الثريا"),
    constellation: label("Taurus", "الثور"),
    patternType: "cluster",
    members: [
      member("M45 centre", 3.78305556, 24.1, 1.6, {
        role: "cluster-centre",
        approximate: true,
      }),
    ],
    links: [],
    clusterSpreadDegrees: 1.1,
    durationDays: MANSION_DAYS(3),
  },
  {
    number: 4,
    marker: label("Taurus Eye", "عين الثور"),
    classicalMansion: label("Al-Dabaran", "الدبران"),
    constellation: label("Taurus", "الثور"),
    patternType: "single",
    members: [member("alpha Tau · HIP 21421", 4.59866679, 16.50976164, 0.87)],
    links: [],
    durationDays: MANSION_DAYS(4),
  },
  {
    number: 5,
    marker: label("Orion Head", "رأس الجبار"),
    classicalMansion: label("Al-Haq'ah", "الهقعة"),
    constellation: label("Orion", "الجبار"),
    patternType: "trio",
    members: [
      member("lambda Ori · HIP 26207", 5.58563269, 9.93416294, 3.39),
      member("phi1 Ori · HIP 26176", 5.58034384, 9.48958528, 4.39),
      member("phi2 Ori · HIP 26366", 5.61509185, 9.291412, 4.09),
    ],
    links: [[0, 1], [0, 2]],
    durationDays: MANSION_DAYS(5),
  },
  {
    number: 6,
    marker: label("Gemini Feet", "قدما الجوزاء"),
    classicalMansion: label("Al-Han'ah", "الهنعة"),
    constellation: label("Gemini", "الجوزاء"),
    patternType: "pair",
    members: [
      member("gamma Gem · HIP 31681", 6.62852842, 16.39941482, 1.93),
      member("xi Gem · HIP 32362", 6.75484265, 12.89605513, 3.35),
    ],
    links: [[0, 1]],
    durationDays: MANSION_DAYS(6),
  },
  {
    number: 7,
    marker: label("Gemini Twin Stars", "ذراعا الجوزاء"),
    classicalMansion: label("Al-Dhira'", "الذراع"),
    constellation: label("Gemini", "الجوزاء"),
    patternType: "pair",
    members: [
      member("alpha Gem · HIP 36850", 7.57666793, 31.88863645, 1.58),
      member("beta Gem · HIP 37826", 7.75537884, 28.02631031, 1.16),
    ],
    links: [[0, 1]],
    durationDays: MANSION_DAYS(7),
  },
  {
    number: 8,
    marker: label("Beehive in Cancer", "السرطان"),
    classicalMansion: label("Al-Nathrah", "النثرة"),
    constellation: label("Cancer", "السرطان"),
    patternType: "cluster",
    members: [
      member("M44 centre", 8.6669, 19.67, 3.7, {
        role: "cluster-centre",
        approximate: true,
      }),
      member("epsilon Cnc · HIP 42556", 8.67417569, 19.54484056, 6.29),
    ],
    links: [],
    clusterSpreadDegrees: 1.5,
    durationDays: MANSION_DAYS(8),
  },
  {
    number: 9,
    marker: label("Leo Eyes", "عينا الأسد"),
    classicalMansion: label("Al-Tarf", "الطرف"),
    constellation: label("Cancer and Leo", "السرطان والأسد"),
    patternType: "wide-pair",
    members: [
      member("kappa Cnc · HIP 44798", 9.12911787, 10.66821521, 5.23),
      member("lambda Leo · HIP 46750", 9.52867787, 22.96806545, 4.32),
    ],
    links: [[0, 1]],
    durationDays: MANSION_DAYS(9),
  },
  {
    number: 10,
    marker: label("Leo Forehead", "جبهة الأسد"),
    classicalMansion: label("Al-Jabha", "الجبهة"),
    constellation: label("Leo", "الأسد"),
    patternType: "group",
    members: [
      member("zeta Leo · HIP 50335", 10.27816787, 23.4173284, 3.43),
      member("gamma1 Leo · HIP 50583", 10.3328227, 19.84186032, 2.01),
      member("eta Leo · HIP 49583", 10.12220929, 16.76266572, 3.48),
      member("alpha Leo · HIP 49669", 10.13957205, 11.96719513, 1.36),
    ],
    links: [[0, 1], [1, 2], [2, 3]],
    durationDays: MANSION_DAYS(10),
  },
  {
    number: 11,
    marker: label("Leo Mane", "لبدة الأسد"),
    classicalMansion: label("Al-Zubrah", "الزبرة"),
    constellation: label("Leo", "الأسد"),
    patternType: "pair",
    members: [
      member("delta Leo · HIP 54872", 11.23511447, 20.52403384, 2.56),
      member("theta Leo · HIP 54879", 11.23734469, 15.4297631, 3.33),
    ],
    links: [[0, 1]],
    durationDays: MANSION_DAYS(11),
  },
  {
    number: 12,
    marker: label("Leo Tail", "ذيل الأسد"),
    classicalMansion: label("Al-Sarfah", "الصرفة"),
    constellation: label("Leo", "الأسد"),
    patternType: "single",
    members: [member("beta Leo · HIP 57632", 11.81774398, 14.57233687, 2.14)],
    links: [],
    durationDays: MANSION_DAYS(12),
  },
  {
    number: 13,
    marker: label("Virgo Star Arc", "قوس العذراء"),
    classicalMansion: label("Al-Awwa", "العواء"),
    constellation: label("Virgo", "العذراء"),
    patternType: "arc",
    members: [
      member("beta Vir · HIP 57757", 11.8448017, 1.76537705, 3.59),
      member("eta Vir · HIP 60129", 12.33177539, -0.66674709, 3.89),
      member("gamma Vir · HIP 61941", 12.69444503, -1.44952231, 2.74),
      member("delta Vir · HIP 63090", 12.92680091, 3.39759862, 3.39),
      member("epsilon Vir · HIP 63608", 13.03632237, 10.95910186, 2.85),
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4]],
    durationDays: MANSION_DAYS(13),
  },
  {
    number: 14,
    marker: label("Virgo Wheat Ear", "سنبلة العذراء"),
    classicalMansion: label("Al-Simak", "السماك الأعزل"),
    constellation: label("Virgo", "العذراء"),
    patternType: "single",
    members: [member("alpha Vir · HIP 65474", 13.41989015, -11.16124491, 0.98)],
    links: [],
    durationDays: MANSION_DAYS(14),
  },
  {
    number: 15,
    marker: label("Virgo Faint Trio", "نجوم العذراء"),
    classicalMansion: label("Al-Ghafr", "الغفر"),
    constellation: label("Virgo", "العذراء"),
    patternType: "trio",
    members: [
      member("iota Vir · HIP 69701", 14.26691247, -5.99952622, 4.07),
      member("kappa Vir · HIP 69427", 14.21492805, -10.274044, 4.18),
      member("lambda Vir · HIP 69974", 14.31850051, -13.37116634, 4.52),
    ],
    links: [[0, 1], [1, 2]],
    durationDays: MANSION_DAYS(15),
  },
  {
    number: 16,
    marker: label("Libra Scales", "الميزان"),
    classicalMansion: label("Al-Zubana", "الزبانا"),
    constellation: label("Libra", "الميزان"),
    patternType: "pair",
    members: [
      member("alpha2 Lib · HIP 72622", 14.84799369, -16.04161047, 2.75),
      member("beta Lib · HIP 74785", 15.28346439, -9.38286694, 2.61),
    ],
    links: [[0, 1]],
    durationDays: MANSION_DAYS(16),
  },
  {
    number: 17,
    marker: label("Scorpius Head", "رأس العقرب"),
    classicalMansion: label("Al-Iklil", "الإكليل"),
    constellation: label("Scorpius", "العقرب"),
    patternType: "trio",
    members: [
      member("beta1 Sco · HIP 78820", 16.0906208, -19.80539286, 2.56),
      member("delta Sco · HIP 78401", 16.00555881, -22.62162024, 2.29),
      member("pi Sco · HIP 78265", 15.98086685, -26.1140428, 2.89),
    ],
    links: [[0, 1], [1, 2]],
    durationDays: MANSION_DAYS(17),
  },
  {
    number: 18,
    marker: label("Scorpius Heart", "قلب العقرب"),
    classicalMansion: label("Al-Qalb", "القلب"),
    constellation: label("Scorpius", "العقرب"),
    patternType: "single",
    members: [member("alpha Sco · HIP 80763", 16.49012986, -26.43194608, 1.06)],
    links: [],
    durationDays: MANSION_DAYS(18),
  },
  {
    number: 19,
    marker: label("Scorpius Tail", "ذيل العقرب"),
    classicalMansion: label("Al-Shaula", "الشولة"),
    constellation: label("Scorpius", "العقرب"),
    patternType: "pair",
    members: [
      member("lambda Sco · HIP 85927", 17.56014624, -37.10374835, 1.62),
      member("upsilon Sco · HIP 85696", 17.512733, -37.29574016, 2.7),
    ],
    links: [[0, 1]],
    durationDays: MANSION_DAYS(19),
  },
  {
    number: 20,
    marker: label("Sagittarius Teapot", "إبريق القوس"),
    classicalMansion: label("Al-Na'a'im", "النعائم"),
    constellation: label("Sagittarius", "القوس"),
    patternType: "octet",
    members: [
      member("gamma2 Sgr · HIP 88635", 18.09681239, -30.42365007, 2.98),
      member("delta Sgr · HIP 89931", 18.34989489, -29.82803914, 2.72),
      member("epsilon Sgr · HIP 90185", 18.40287397, -34.3843146, 1.79),
      member("eta Sgr · HIP 89642", 18.29381366, -36.76128103, 3.1),
      member("sigma Sgr · HIP 92855", 18.92108797, -26.29659428, 2.05),
      member("phi Sgr · HIP 92041", 18.76093138, -26.9907794, 3.17),
      member("tau Sgr · HIP 93864", 19.11567841, -27.66981416, 3.32),
      member("zeta Sgr · HIP 93506", 19.04353428, -29.88011429, 2.6),
    ],
    links: [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 7]],
    durationDays: MANSION_DAYS(20),
  },
  {
    number: 21,
    marker: label("Sagittarius Open Field", "فسحة القوس"),
    classicalMansion: label("Al-Baldah", "البلدة"),
    constellation: label("Sagittarius", "القوس"),
    patternType: "empty-sector",
    members: [
      member("pi Sgr · HIP 94141", 19.1627316, -21.02352534, 2.88, {
        role: "fiducial",
      }),
    ],
    links: [],
    durationDays: MANSION_DAYS(21),
  },
  {
    number: 22,
    marker: label("Capricorn Head", "رأس الجدي"),
    classicalMansion: label("Sa'd Al-Dhabih", "سعد الذابح"),
    constellation: label("Capricornus", "الجدي"),
    patternType: "group",
    members: [
      member("alpha1 Cap · HIP 100027", 20.29412669, -12.50821403, 4.3),
      member("alpha2 Cap · HIP 100064", 20.30089401, -12.54485877, 3.58),
      member("beta Cap · HIP 100345", 20.35017956, -14.78140119, 3.05),
    ],
    links: [[0, 1], [1, 2]],
    durationDays: MANSION_DAYS(22),
  },
  {
    number: 23,
    marker: label("Aquarius Western Pair", "نجما الدلو الغربيان"),
    classicalMansion: label("Sa'd Bula'", "سعد بلع"),
    constellation: label("Aquarius", "الدلو"),
    patternType: "trio",
    members: [
      member("epsilon Aqr · HIP 102618", 20.79459238, -9.49568988, 3.78),
      member("mu Aqr · HIP 103045", 20.87755716, -8.98323782, 4.73),
      member("nu Aqr · HIP 104459", 21.15988689, -11.37165474, 4.5),
    ],
    links: [[0, 1], [1, 2]],
    durationDays: MANSION_DAYS(23),
  },
  {
    number: 24,
    marker: label("Aquarius Middle Pair", "نجما وسط الدلو"),
    classicalMansion: label("Sa'd Al-Su'ud", "سعد السعود"),
    constellation: label("Aquarius", "الدلو"),
    patternType: "pair",
    members: [
      member("beta Aqr · HIP 106278", 21.52597796, -5.57115593, 2.9),
      member("xi Aqr · HIP 106786", 21.62917834, -7.85414212, 4.68),
    ],
    links: [[0, 1]],
    durationDays: MANSION_DAYS(24),
  },
  {
    number: 25,
    marker: label("Aquarius Water Jar", "جرة الدلو"),
    classicalMansion: label("Sa'd Al-Akhbiyah", "سعد الأخبية"),
    constellation: label("Aquarius", "الدلو"),
    patternType: "quartet",
    members: [
      member("gamma Aqr · HIP 110395", 22.36091665, -1.38735315, 3.86),
      member("zeta Aqr · HIP 110960", 22.48050015, -0.02006304, 3.65),
      member("eta Aqr · HIP 111497", 22.58925803, -0.11736123, 4.04),
      member("pi Aqr · HIP 110672", 22.42128123, 1.37739245, 4.8),
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 0]],
    durationDays: MANSION_DAYS(25),
  },
  {
    number: 26,
    marker: label("Pegasus West Side", "مقدم الفرس"),
    classicalMansion: label("Al-Fargh Al-Muqaddam", "الفرغ المقدم"),
    constellation: label("Pegasus", "الفرس الأعظم"),
    patternType: "side",
    members: [
      member("alpha Peg · HIP 113963", 23.07933801, 15.20536786, 2.49),
      member("beta Peg · HIP 113881", 23.06287038, 28.08245462, 2.44),
    ],
    links: [[0, 1]],
    durationDays: MANSION_DAYS(26),
  },
  {
    number: 27,
    marker: label("Pegasus East Side", "مؤخر الفرس"),
    classicalMansion: label("Al-Fargh Al-Mu'akhkhar", "الفرغ المؤخر"),
    constellation: label("Pegasus and Andromeda", "الفرس الأعظم والمرأة المسلسلة"),
    patternType: "side",
    members: [
      member("gamma Peg · HIP 1067", 0.22059721, 15.18361593, 2.83),
      member("alpha And · HIP 677", 0.13976888, 29.09082805, 2.07),
    ],
    links: [[0, 1]],
    durationDays: MANSION_DAYS(27),
  },
  {
    number: 28,
    marker: label(
      "Andromeda Belt Star",
      "بطن الحوت",
    ),
    classicalMansion: label("Al-Risha'", "الرشاء"),
    classicalAliases: [label("Batn Al-Hut", "بطن الحوت")],
    constellation: label("Andromeda", "المرأة المسلسلة"),
    patternType: "single",
    members: [member("beta And · HIP 5447", 1.16216599, 35.62083048, 2.07)],
    links: [],
    durationDays: MANSION_DAYS(28),
  },
] as const satisfies readonly MansionMarker[];

/** Flat display fields make the catalogue easy to consume from the calendar UI. */
export const MANSION_MARKERS: readonly DisplayMansionMarker[] =
  MANSION_MARKER_CATALOGUE.map((marker) => ({
    ...marker,
    markerEn: marker.marker.en,
    markerAr: marker.marker.ar,
    mansionEn: marker.classicalMansion.en,
    mansionAr: marker.classicalMansion.ar,
    constellationEn: marker.constellation.en,
    constellationAr: marker.constellation.ar,
  }));

if (
  MANSION_MARKERS.length !== 28 ||
  MANSION_MARKERS.reduce((total, marker) => total + marker.durationDays, 0) !== 365
) {
  throw new Error("The mansion marker catalogue must contain 28 markers and total 365 days.");
}

export function getMansionMarker(number: number): MansionMarker {
  if (!Number.isInteger(number) || number < 1 || number > MANSION_MARKERS.length) {
    throw new RangeError(`Mansion number must be between 1 and ${MANSION_MARKERS.length}.`);
  }

  return MANSION_MARKERS[number - 1];
}

export type EquatorialJ2000 = Readonly<{
  raHours: number;
  decDegrees: number;
}>;

export type EclipticJ2000 = Readonly<{
  longitudeDegrees: number;
  latitudeDegrees: number;
}>;

const J2000_MEAN_OBLIQUITY_DEGREES = 23.439291111;
const LUNAR_LATITUDE_LIMIT_DEGREES = 5.15;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;
const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

export function normalizeDegrees(degrees: number): number {
  const normalized = degrees % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

/** Convert a J2000 equatorial position to mean J2000 ecliptic coordinates. */
export function equatorialToEclipticJ2000(position: EquatorialJ2000): EclipticJ2000 {
  const rightAscension = toRadians(position.raHours * 15);
  const declination = toRadians(position.decDegrees);
  const obliquity = toRadians(J2000_MEAN_OBLIQUITY_DEGREES);

  const cosDeclination = Math.cos(declination);
  const equatorialX = cosDeclination * Math.cos(rightAscension);
  const equatorialY = cosDeclination * Math.sin(rightAscension);
  const equatorialZ = Math.sin(declination);

  const eclipticX = equatorialX;
  const eclipticY = equatorialY * Math.cos(obliquity) + equatorialZ * Math.sin(obliquity);
  const eclipticZ = -equatorialY * Math.sin(obliquity) + equatorialZ * Math.cos(obliquity);

  return {
    longitudeDegrees: normalizeDegrees(toDegrees(Math.atan2(eclipticY, eclipticX))),
    latitudeDegrees: toDegrees(Math.asin(clamp(eclipticZ, -1, 1))),
  };
}

function circularMeanDegrees(values: readonly number[]): number {
  const vector = values.reduce(
    (sum, value) => {
      const radians = toRadians(value);
      return {
        x: sum.x + Math.cos(radians),
        y: sum.y + Math.sin(radians),
      };
    },
    { x: 0, y: 0 },
  );

  if (Math.abs(vector.x) < Number.EPSILON && Math.abs(vector.y) < Number.EPSILON) {
    return normalizeDegrees(values[0] ?? 0);
  }

  return normalizeDegrees(toDegrees(Math.atan2(vector.y, vector.x)));
}

/** Return the equivalent longitude nearest to a reference longitude. */
export function unwrapLongitudeDegrees(longitude: number, reference: number): number {
  let delta = normalizeDegrees(longitude) - normalizeDegrees(reference);
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return reference + delta;
}

export type MarkerProjectionOptions = Readonly<{
  width?: number;
  height?: number;
  padding?: number;
  minimumLongitudeSpanDegrees?: number;
  minimumLatitudeSpanDegrees?: number;
  angularMarginDegrees?: number;
  lunarLatitudeLimitDegrees?: number;
}>;

export type ProjectedMarkerMember = Readonly<{
  memberIndex: number;
  x: number;
  y: number;
  radius: number;
  magnitude: number;
  role: MarkerMemberRole;
  approximate: boolean;
  eclipticLongitudeDegrees: number;
  eclipticLatitudeDegrees: number;
}>;

export type ProjectedMarkerLink = Readonly<{
  from: number;
  to: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}>;

export type ProjectedMarkerMap = Readonly<{
  width: number;
  height: number;
  /** SVG-ready stars; contains no Bayer, HIP or other audit identifiers. */
  stars: readonly ProjectedMarkerMember[];
  /** Backwards-compatible semantic alias for `stars`. */
  members: readonly ProjectedMarkerMember[];
  links: readonly ProjectedMarkerLink[];
  eclipticLineY: number;
  eclipticBand: Readonly<{ topY: number; bottomY: number }>;
  lunarBandTopY: number;
  lunarBandBottomY: number;
  emptySectorCentre?: Readonly<{ x: number; y: number }>;
  longitudeDomainDegrees: readonly [minimum: number, maximum: number];
  latitudeDomainDegrees: readonly [minimum: number, maximum: number];
}>;

/** A compact, monotonic brightness scale for SVG star dots. */
export function markerMagnitudeToRadius(magnitude: number): number {
  return clamp(4.35 - magnitude * 0.52, 1.15, 3.85);
}

/**
 * Project one marker into an SVG viewport while preserving angular scale.
 *
 * The result includes the ecliptic centre line and the Moon's approximate
 * maximum latitude band (±5.15°) for historical context. It does not calculate
 * or display the Moon's current position.
 */
export function projectMansionMarkerToSvg(
  marker: MansionMarker,
  options: MarkerProjectionOptions = {},
): ProjectedMarkerMap {
  const width = options.width ?? 160;
  const height = options.height ?? 94;
  const padding = options.padding ?? 10;
  const minimumLongitudeSpan = options.minimumLongitudeSpanDegrees ?? 14;
  const minimumLatitudeSpan = options.minimumLatitudeSpanDegrees ?? 14;
  const angularMargin = options.angularMarginDegrees ?? 2;
  const lunarLimit = options.lunarLatitudeLimitDegrees ?? LUNAR_LATITUDE_LIMIT_DEGREES;

  if (width <= padding * 2 || height <= padding * 2) {
    throw new RangeError("Projection width and height must be greater than twice the padding.");
  }

  const eclipticPositions = marker.members.map((star) =>
    equatorialToEclipticJ2000({
      raHours: star.raHoursJ2000,
      decDegrees: star.decDegreesJ2000,
    }),
  );
  const longitudeReference = circularMeanDegrees(
    eclipticPositions.map((position) => position.longitudeDegrees),
  );
  const unwrappedLongitudes = eclipticPositions.map((position) =>
    unwrapLongitudeDegrees(position.longitudeDegrees, longitudeReference),
  );
  const latitudes = eclipticPositions.map((position) => position.latitudeDegrees);

  const rawLongitudeMinimum = Math.min(...unwrappedLongitudes);
  const rawLongitudeMaximum = Math.max(...unwrappedLongitudes);
  const rawLatitudeMinimum = Math.min(-lunarLimit, ...latitudes);
  const rawLatitudeMaximum = Math.max(lunarLimit, ...latitudes);

  let longitudeSpan = Math.max(
    minimumLongitudeSpan,
    rawLongitudeMaximum - rawLongitudeMinimum + angularMargin * 2,
  );
  let latitudeSpan = Math.max(
    minimumLatitudeSpan,
    rawLatitudeMaximum - rawLatitudeMinimum + angularMargin * 2,
  );

  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const viewportRatio = innerWidth / innerHeight;

  if (longitudeSpan / latitudeSpan < viewportRatio) {
    longitudeSpan = latitudeSpan * viewportRatio;
  } else {
    latitudeSpan = longitudeSpan / viewportRatio;
  }

  const longitudeCentre = (rawLongitudeMinimum + rawLongitudeMaximum) / 2;
  const latitudeCentre = (rawLatitudeMinimum + rawLatitudeMaximum) / 2;
  const longitudeMinimum = longitudeCentre - longitudeSpan / 2;
  const longitudeMaximum = longitudeCentre + longitudeSpan / 2;
  const latitudeMinimum = latitudeCentre - latitudeSpan / 2;
  const latitudeMaximum = latitudeCentre + latitudeSpan / 2;

  const projectX = (longitude: number): number =>
    padding + ((longitude - longitudeMinimum) / longitudeSpan) * innerWidth;
  const projectY = (latitude: number): number =>
    padding + ((latitudeMaximum - latitude) / latitudeSpan) * innerHeight;

  const projectedMembers = marker.members.map((star, memberIndex) => {
    const position = eclipticPositions[memberIndex];
    const role = star.role ?? "marker-star";
    return {
      memberIndex,
      x: projectX(unwrappedLongitudes[memberIndex]),
      y: projectY(position.latitudeDegrees),
      radius: markerMagnitudeToRadius(star.magnitude),
      magnitude: star.magnitude,
      role,
      approximate: star.approximate ?? false,
      eclipticLongitudeDegrees: position.longitudeDegrees,
      eclipticLatitudeDegrees: position.latitudeDegrees,
    } satisfies ProjectedMarkerMember;
  });

  const projectedLinks = marker.links.map(([from, to]) => {
    const start = projectedMembers[from];
    const end = projectedMembers[to];
    if (!start || !end) {
      throw new RangeError(`Marker ${marker.number} has an invalid link: ${from}-${to}.`);
    }
    return {
      from,
      to,
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
    } satisfies ProjectedMarkerLink;
  });

  return {
    width,
    height,
    stars: projectedMembers,
    members: projectedMembers,
    links: projectedLinks,
    eclipticLineY: projectY(0),
    eclipticBand: {
      topY: projectY(lunarLimit),
      bottomY: projectY(-lunarLimit),
    },
    lunarBandTopY: projectY(lunarLimit),
    lunarBandBottomY: projectY(-lunarLimit),
    ...(marker.patternType === "empty-sector"
      ? { emptySectorCentre: { x: projectX(longitudeCentre), y: projectY(0) } }
      : {}),
    longitudeDomainDegrees: [longitudeMinimum, longitudeMaximum],
    latitudeDomainDegrees: [latitudeMinimum, latitudeMaximum],
  };
}

/** Short integration-friendly alias. */
export const projectMarkerToSvg = projectMansionMarkerToSvg;
