import {
  Body,
  DefineStar,
  Equator,
  Horizon,
  Observer,
  SearchAltitude,
  SearchSunLongitude,
  type AstroTime,
} from "astronomy-engine";

/**
 * Annual Day 1 alignment for the seasonal star-station calendar.
 *
 * The calculation intentionally uses only the Sun and the two traditional
 * Al-Sharatain marker stars (beta and gamma Arietis). It does not calculate or
 * inspect the Moon's position.
 */

export const CIVIL_DAY_MS = 86_400_000;

export const MANSION_DAY_LENGTHS = Object.freeze(
  Array.from({ length: 28 }, (_, index) => (index === 9 ? 14 : 13)),
);

export const HELIACAL_PROXY = Object.freeze({
  id: "al-sharatain-dawn-v1",
  version: 1,
  markerAltitudeDegrees: 5,
  maximumSunAltitudeDegrees: -12,
  description:
    "After annual solar conjunction, both Al-Sharatain marker stars reach +5 degrees on the rising branch while the geometric Sun is at or below -12 degrees.",
  uncertaintyDays: 1,
});

export const FIRST_MARKER_STARS = Object.freeze({
  betaArietis: Object.freeze({
    name: "Beta Arietis",
    rightAscensionHours: 1.91065251,
    declinationDegrees: 20.80829949,
  }),
  gammaArietis: Object.freeze({
    name: "Gamma Arietis",
    rightAscensionHours: 1.892157,
    declinationDegrees: 19.29409264,
  }),
});

export type AnchorRegionId =
  | "gulf"
  | "saudi"
  | "sudan"
  | "australia_tropical"
  | "australia_central"
  | "australia_temperate"
  | "classical";

export type RegionalObserver = Readonly<{
  latitude: number;
  longitude: number;
  elevationMeters?: number;
}>;

export type HeliacalAnchorPolicy = Readonly<{
  kind: "heliacal-proxy";
  criterionId: typeof HELIACAL_PROXY.id;
}>;

export type FixedAnchorPolicy = Readonly<{
  kind: "fixed-month-day";
  month: number;
  day: number;
}>;

export type RegionalAnchorProfile<RegionId extends string = string> = Readonly<{
  id: RegionId;
  timeZone: string;
  observer: RegionalObserver;
  policy: HeliacalAnchorPolicy | FixedAnchorPolicy;
}>;

export const REGIONAL_ANCHOR_PROFILES: Readonly<
  Record<AnchorRegionId, RegionalAnchorProfile>
> = Object.freeze({
  gulf: Object.freeze({
    id: "gulf",
    timeZone: "Asia/Dubai",
    observer: Object.freeze({ latitude: 25.2048, longitude: 55.2708, elevationMeters: 0 }),
    policy: Object.freeze({
      kind: "heliacal-proxy",
      criterionId: HELIACAL_PROXY.id,
    }),
  }),
  saudi: Object.freeze({
    id: "saudi",
    timeZone: "Asia/Riyadh",
    observer: Object.freeze({ latitude: 24.7136, longitude: 46.6753, elevationMeters: 612 }),
    policy: Object.freeze({
      kind: "heliacal-proxy",
      criterionId: HELIACAL_PROXY.id,
    }),
  }),
  sudan: Object.freeze({
    id: "sudan",
    timeZone: "Africa/Khartoum",
    observer: Object.freeze({ latitude: 15.5007, longitude: 32.5599, elevationMeters: 0 }),
    policy: Object.freeze({
      kind: "heliacal-proxy",
      criterionId: HELIACAL_PROXY.id,
    }),
  }),
  australia_tropical: Object.freeze({
    id: "australia_tropical",
    timeZone: "Australia/Darwin",
    observer: Object.freeze({ latitude: -12.4634, longitude: 130.8456, elevationMeters: 0 }),
    policy: Object.freeze({
      kind: "heliacal-proxy",
      criterionId: HELIACAL_PROXY.id,
    }),
  }),
  australia_central: Object.freeze({
    id: "australia_central",
    timeZone: "Australia/Darwin",
    observer: Object.freeze({ latitude: -23.698, longitude: 133.8807, elevationMeters: 0 }),
    policy: Object.freeze({
      kind: "heliacal-proxy",
      criterionId: HELIACAL_PROXY.id,
    }),
  }),
  australia_temperate: Object.freeze({
    id: "australia_temperate",
    timeZone: "Australia/Sydney",
    observer: Object.freeze({ latitude: -33.8688, longitude: 151.2093, elevationMeters: 0 }),
    policy: Object.freeze({
      kind: "heliacal-proxy",
      criterionId: HELIACAL_PROXY.id,
    }),
  }),
  classical: Object.freeze({
    id: "classical",
    timeZone: "UTC",
    observer: Object.freeze({ latitude: 0, longitude: 0, elevationMeters: 0 }),
    policy: Object.freeze({ kind: "fixed-month-day", month: 4, day: 5 }),
  }),
});

export type AnnualAnchorResult = Readonly<{
  regionId: string;
  year: number;
  isoDate: string;
  baseIsoDate: string;
  correctionDays: number;
  timeZone: string;
  observer: RegionalObserver;
  policy: RegionalAnchorProfile["policy"]["kind"];
  criterionId: string;
  criterionVersion: number;
  eventUtcIso?: string;
  betaMarkerUtcIso?: string;
  gammaMarkerUtcIso?: string;
  sunAltitudeDegrees?: number;
}>;

export type CycleAnchors = Readonly<{
  cycleYear: number;
  dayOneIso: string;
  nextDayOneIso: string;
  intervalDays: 365 | 366;
}>;

export type MansionCalendarDate = Readonly<{
  kind: "mansion";
  dateIso: string;
  cycleYear: number;
  cycleDay: number;
  dayOneIso: string;
  nextDayOneIso: string;
  intervalDays: 365 | 366;
  mansionIndex: number;
  mansionNumber: number;
  dayInMansion: number;
  mansionLength: number;
}>;

export type AlignmentCalendarDate = Readonly<{
  kind: "alignment";
  dateIso: string;
  cycleYear: number;
  cycleDay: 366;
  dayOneIso: string;
  nextDayOneIso: string;
  intervalDays: 366;
  alignmentDay: 1;
  mansionIndex: null;
  mansionNumber: null;
  dayInMansion: null;
  mansionLength: null;
}>;

export type CalendarCycleDate = MansionCalendarDate | AlignmentCalendarDate;

const anchorCache = new Map<string, AnnualAnchorResult>();

function assertCalendarYear(year: number) {
  if (!Number.isInteger(year) || year < 1600 || year > 4000) {
    throw new RangeError("Calendar year must be an integer from 1600 through 4000.");
  }
}

function assertObserver(observer: RegionalObserver) {
  if (!Number.isFinite(observer.latitude) || observer.latitude < -90 || observer.latitude > 90) {
    throw new RangeError("Observer latitude must be between -90 and +90 degrees.");
  }
  if (!Number.isFinite(observer.longitude) || observer.longitude < -180 || observer.longitude > 180) {
    throw new RangeError("Observer longitude must be between -180 and +180 degrees.");
  }
  if (
    observer.elevationMeters !== undefined &&
    (!Number.isFinite(observer.elevationMeters) ||
      observer.elevationMeters < -500 ||
      observer.elevationMeters > 100_000)
  ) {
    throw new RangeError("Observer elevation must be between -500 and 100000 metres.");
  }
}

function assertCorrectionDays(correctionDays: number) {
  if (!Number.isInteger(correctionDays) || correctionDays < -30 || correctionDays > 30) {
    throw new RangeError("Manual Day 1 correction must be an integer from -30 through +30 days.");
  }
}

function resolveProfile(profileOrId: RegionalAnchorProfile | AnchorRegionId) {
  return typeof profileOrId === "string"
    ? REGIONAL_ANCHOR_PROFILES[profileOrId]
    : profileOrId;
}

export function parseCivilIsoDate(isoDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new RangeError(`Invalid civil ISO date: ${isoDate}`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcMs = Date.UTC(year, month - 1, day);
  const check = new Date(utcMs);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid civil ISO date: ${isoDate}`);
  }
  return utcMs;
}

export function civilIsoFromUtcMs(utcMs: number): string {
  if (!Number.isFinite(utcMs)) throw new RangeError("Date value must be finite.");
  return new Date(utcMs).toISOString().slice(0, 10);
}

export function addCivilDays(isoDate: string, days: number): string {
  if (!Number.isInteger(days)) throw new RangeError("Civil-day offset must be an integer.");
  return civilIsoFromUtcMs(parseCivilIsoDate(isoDate) + days * CIVIL_DAY_MS);
}

export function civilDaysBetween(startIso: string, endIso: string): number {
  return (parseCivilIsoDate(endIso) - parseCivilIsoDate(startIso)) / CIVIL_DAY_MS;
}

export function civilIsoInTimeZone(date: Date, timeZone: string): string {
  if (!Number.isFinite(date.getTime())) throw new RangeError("Date must be valid.");

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  if (!values.year || !values.month || !values.day) {
    throw new Error(`Could not convert the event to civil time in ${timeZone}.`);
  }
  return `${values.year}-${values.month}-${values.day}`;
}

export function manualDayOffsetForRegion(
  offsets: Readonly<Partial<Record<string, number>>>,
  regionId: string,
): number {
  const correctionDays = offsets[regionId] ?? 0;
  assertCorrectionDays(correctionDays);
  return correctionDays;
}

function midpointEclipticLongitudeDegrees(): number {
  const rightAscensionDegrees =
    ((FIRST_MARKER_STARS.betaArietis.rightAscensionHours +
      FIRST_MARKER_STARS.gammaArietis.rightAscensionHours) /
      2) *
    15;
  const declinationDegrees =
    (FIRST_MARKER_STARS.betaArietis.declinationDegrees +
      FIRST_MARKER_STARS.gammaArietis.declinationDegrees) /
    2;
  const obliquityDegrees = 23.4392911;
  const toRadians = Math.PI / 180;
  const rightAscension = rightAscensionDegrees * toRadians;
  const declination = declinationDegrees * toRadians;
  const obliquity = obliquityDegrees * toRadians;
  const x = Math.cos(declination) * Math.cos(rightAscension);
  const y = Math.cos(declination) * Math.sin(rightAscension);
  const z = Math.sin(declination);
  const eclipticY = y * Math.cos(obliquity) + z * Math.sin(obliquity);
  return (Math.atan2(eclipticY, x) / toRadians + 360) % 360;
}

const FIRST_MARKER_MIDPOINT_ECLIPTIC_LONGITUDE = midpointEclipticLongitudeDegrees();

function defineFirstMarkerStars() {
  // Re-define on each uncached calculation because Astronomy Engine's Star slots
  // are global and another feature may have reused them between calls.
  DefineStar(
    Body.Star1,
    FIRST_MARKER_STARS.betaArietis.rightAscensionHours,
    FIRST_MARKER_STARS.betaArietis.declinationDegrees,
    1000,
  );
  DefineStar(
    Body.Star2,
    FIRST_MARKER_STARS.gammaArietis.rightAscensionHours,
    FIRST_MARKER_STARS.gammaArietis.declinationDegrees,
    1000,
  );
}

function sunGeometricAltitude(time: AstroTime, observer: Observer): number {
  const equatorial = Equator(Body.Sun, time, observer, true, true);
  return Horizon(time, observer, equatorial.ra, equatorial.dec).altitude;
}

function observerCachePart(observer: RegionalObserver): string {
  return [
    observer.latitude.toFixed(6),
    observer.longitude.toFixed(6),
    (observer.elevationMeters ?? 0).toFixed(1),
  ].join(":");
}

function baseAnchorCacheKey(
  profile: RegionalAnchorProfile,
  year: number,
  observer: RegionalObserver,
): string {
  return [
    HELIACAL_PROXY.id,
    HELIACAL_PROXY.version,
    profile.id,
    year,
    profile.timeZone,
    JSON.stringify(profile.policy),
    observerCachePart(observer),
  ].join("|");
}

function calculateFixedAnchor(
  profile: RegionalAnchorProfile,
  year: number,
  observer: RegionalObserver,
): AnnualAnchorResult {
  if (profile.policy.kind !== "fixed-month-day") {
    throw new Error("Fixed anchor calculation requires a fixed-month-day policy.");
  }
  const isoDate = `${String(year).padStart(4, "0")}-${String(profile.policy.month).padStart(2, "0")}-${String(profile.policy.day).padStart(2, "0")}`;
  parseCivilIsoDate(isoDate);
  return Object.freeze({
    regionId: profile.id,
    year,
    isoDate,
    baseIsoDate: isoDate,
    correctionDays: 0,
    timeZone: profile.timeZone,
    observer,
    policy: profile.policy.kind,
    criterionId: "fixed-month-day",
    criterionVersion: 1,
  });
}

function calculateHeliacalAnchor(
  profile: RegionalAnchorProfile,
  year: number,
  observerInput: RegionalObserver,
): AnnualAnchorResult {
  defineFirstMarkerStars();
  const observer = new Observer(
    observerInput.latitude,
    observerInput.longitude,
    observerInput.elevationMeters ?? 0,
  );
  const conjunction = SearchSunLongitude(
    FIRST_MARKER_MIDPOINT_ECLIPTIC_LONGITUDE,
    new Date(Date.UTC(year, 3, 1)),
    60,
  );
  if (!conjunction) {
    throw new Error(`Could not find the ${year} solar conjunction for Al-Sharatain.`);
  }

  let cursor = new Date(conjunction.date.getTime() + 3_600_000);
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const betaEvent = SearchAltitude(
      Body.Star1,
      observer,
      +1,
      cursor,
      1.2,
      HELIACAL_PROXY.markerAltitudeDegrees,
    );
    const gammaEvent = SearchAltitude(
      Body.Star2,
      observer,
      +1,
      cursor,
      1.2,
      HELIACAL_PROXY.markerAltitudeDegrees,
    );
    if (!betaEvent || !gammaEvent) {
      throw new Error(
        `Could not find both Al-Sharatain rising-altitude events for ${profile.id} in ${year}.`,
      );
    }

    const event = betaEvent.date.getTime() >= gammaEvent.date.getTime() ? betaEvent : gammaEvent;
    const sunAltitudeDegrees = sunGeometricAltitude(event, observer);
    if (sunAltitudeDegrees <= HELIACAL_PROXY.maximumSunAltitudeDegrees) {
      const isoDate = civilIsoInTimeZone(event.date, profile.timeZone);
      return Object.freeze({
        regionId: profile.id,
        year,
        isoDate,
        baseIsoDate: isoDate,
        correctionDays: 0,
        timeZone: profile.timeZone,
        observer: Object.freeze({ ...observerInput }),
        policy: "heliacal-proxy",
        criterionId: HELIACAL_PROXY.id,
        criterionVersion: HELIACAL_PROXY.version,
        eventUtcIso: event.date.toISOString(),
        betaMarkerUtcIso: betaEvent.date.toISOString(),
        gammaMarkerUtcIso: gammaEvent.date.toISOString(),
        sunAltitudeDegrees,
      });
    }
    cursor = new Date(event.date.getTime() + 3_600_000);
  }

  throw new Error(
    `No Al-Sharatain dawn event satisfied ${HELIACAL_PROXY.id} for ${profile.id} in ${year}.`,
  );
}

function baseAnnualAnchor(
  profile: RegionalAnchorProfile,
  year: number,
  observerOverride?: RegionalObserver,
): AnnualAnchorResult {
  assertCalendarYear(year);
  const observer = observerOverride ?? profile.observer;
  assertObserver(observer);
  const cacheKey = baseAnchorCacheKey(profile, year, observer);
  const cached = anchorCache.get(cacheKey);
  if (cached) return cached;

  const calculated =
    profile.policy.kind === "fixed-month-day"
      ? calculateFixedAnchor(profile, year, observer)
      : calculateHeliacalAnchor(profile, year, observer);
  anchorCache.set(cacheKey, calculated);
  return calculated;
}

export function annualAnchor(
  profileOrId: RegionalAnchorProfile | AnchorRegionId,
  year: number,
  correctionDays = 0,
  observerOverride?: RegionalObserver,
): AnnualAnchorResult {
  assertCorrectionDays(correctionDays);
  const profile = resolveProfile(profileOrId);
  const base = baseAnnualAnchor(profile, year, observerOverride);
  if (correctionDays === 0) return base;
  return Object.freeze({
    ...base,
    isoDate: addCivilDays(base.baseIsoDate, correctionDays),
    correctionDays,
  });
}

export function annualAnchorIso(
  profileOrId: RegionalAnchorProfile | AnchorRegionId,
  year: number,
  correctionDays = 0,
  observerOverride?: RegionalObserver,
): string {
  return annualAnchor(profileOrId, year, correctionDays, observerOverride).isoDate;
}

export function clearAnnualAnchorCache(): void {
  anchorCache.clear();
}

export function cycleAnchorsForIso(
  dateIso: string,
  profileOrId: RegionalAnchorProfile | AnchorRegionId,
  correctionDays = 0,
  observerOverride?: RegionalObserver,
): CycleAnchors {
  const dateMs = parseCivilIsoDate(dateIso);
  const dateYear = Number(dateIso.slice(0, 4));
  const thisYearAnchor = annualAnchorIso(
    profileOrId,
    dateYear,
    correctionDays,
    observerOverride,
  );
  const cycleYear = dateMs < parseCivilIsoDate(thisYearAnchor) ? dateYear - 1 : dateYear;
  const dayOneIso = annualAnchorIso(
    profileOrId,
    cycleYear,
    correctionDays,
    observerOverride,
  );
  const nextDayOneIso = annualAnchorIso(
    profileOrId,
    cycleYear + 1,
    correctionDays,
    observerOverride,
  );
  const intervalDays = civilDaysBetween(dayOneIso, nextDayOneIso);
  if (intervalDays !== 365 && intervalDays !== 366) {
    throw new Error(
      `Annual anchors must be 365 or 366 civil days apart; got ${intervalDays} days for ${cycleYear}.`,
    );
  }
  return Object.freeze({
    cycleYear,
    dayOneIso,
    nextDayOneIso,
    intervalDays,
  }) as CycleAnchors;
}

export function calendarDateBetweenAnchors(
  dateIso: string,
  anchors: CycleAnchors,
  mansionLengths: readonly number[] = MANSION_DAY_LENGTHS,
): CalendarCycleDate {
  const cycleLength = mansionLengths.reduce((sum, length) => sum + length, 0);
  if (
    mansionLengths.length !== 28 ||
    mansionLengths.some((length) => !Number.isInteger(length) || length < 1) ||
    cycleLength !== 365
  ) {
    throw new Error("The mansion sequence must contain 28 positive integer lengths totalling 365 days.");
  }

  const offset = civilDaysBetween(anchors.dayOneIso, dateIso);
  if (offset < 0 || offset >= anchors.intervalDays) {
    throw new RangeError("Date must be on or after Day 1 and before the next annual Day 1.");
  }
  if (offset === 365) {
    if (anchors.intervalDays !== 366) {
      throw new Error("An alignment day is valid only between anchors that are 366 days apart.");
    }
    return Object.freeze({
      kind: "alignment",
      dateIso,
      cycleYear: anchors.cycleYear,
      cycleDay: 366,
      dayOneIso: anchors.dayOneIso,
      nextDayOneIso: anchors.nextDayOneIso,
      intervalDays: 366,
      alignmentDay: 1,
      mansionIndex: null,
      mansionNumber: null,
      dayInMansion: null,
      mansionLength: null,
    });
  }

  let remaining = offset;
  for (let mansionIndex = 0; mansionIndex < mansionLengths.length; mansionIndex += 1) {
    const mansionLength = mansionLengths[mansionIndex];
    if (remaining < mansionLength) {
      return Object.freeze({
        kind: "mansion",
        dateIso,
        cycleYear: anchors.cycleYear,
        cycleDay: offset + 1,
        dayOneIso: anchors.dayOneIso,
        nextDayOneIso: anchors.nextDayOneIso,
        intervalDays: anchors.intervalDays,
        mansionIndex,
        mansionNumber: mansionIndex + 1,
        dayInMansion: remaining + 1,
        mansionLength,
      });
    }
    remaining -= mansionLength;
  }

  throw new Error("Could not map the date into the 365-day mansion sequence.");
}

export function calendarDateForIso(
  dateIso: string,
  profileOrId: RegionalAnchorProfile | AnchorRegionId,
  correctionDays = 0,
  observerOverride?: RegionalObserver,
): CalendarCycleDate {
  return calendarDateBetweenAnchors(
    dateIso,
    cycleAnchorsForIso(dateIso, profileOrId, correctionDays, observerOverride),
  );
}

export function calendarDateForDate(
  date: Date,
  profileOrId: RegionalAnchorProfile | AnchorRegionId,
  correctionDays = 0,
  observerOverride?: RegionalObserver,
): CalendarCycleDate {
  if (!Number.isFinite(date.getTime())) throw new RangeError("Date must be valid.");
  const profile = resolveProfile(profileOrId);
  return calendarDateForIso(
    civilIsoInTimeZone(date, profile.timeZone),
    profile,
    correctionDays,
    observerOverride,
  );
}
