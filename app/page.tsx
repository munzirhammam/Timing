"use client";

import { useEffect, useMemo, useState } from "react";
import { OUTLOOK_ICONS, OUTLOOKS } from "./outlooks";

type RegionId = "gulf" | "sudan" | "classical";

type Mansion = {
  en: string;
  ar: string;
  days: number;
  localNote?: string;
};

type RegionProfile = {
  id: RegionId;
  label: string;
  shortLabel: string;
  anchorIso: string;
  timeZone: string;
  description: string;
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

function mansionSet(names: Array<[string, string, string?]>): Mansion[] {
  return names.map(([en, ar, localNote], index) => ({
    en,
    ar,
    localNote,
    days: MANSION_LENGTHS[index],
  }));
}

const GULF_MANSIONS = mansionSet([
  ["Al-Sharatain", "الشرطان", "Al-Thurayya season"],
  ["Al-Butain", "البطين", "Al-Thurayya season"],
  ["Al-Thurayya", "الثريا", "Al-Thurayya season"],
  ["Al-Dabaran", "الدبران", "Al-Tuwaibi'"],
  ["Al-Haq'ah", "الهقعة", "Al-Jawza'"],
  ["Al-Han'ah", "الهنعة", "Al-Jawza'"],
  ["Al-Dhira'", "الذراع", "Al-Mirzam"],
  ["Al-Nathrah", "النثرة", "Al-Kulaibain"],
  ["Al-Tarfah", "الطرفة", "Suhail"],
  ["Al-Jabha", "الجبهة", "Suhail · 14 days"],
  ["Al-Zubrah", "الزبرة", "Suhail"],
  ["Al-Sarfah", "الصرفة", "Suhail"],
  ["Al-Awwa", "العواء", "Al-Wasm"],
  ["Al-Simak", "السماك", "Al-Wasm"],
  ["Al-Ghafr", "الغفر", "Al-Wasm"],
  ["Al-Zabana", "الزبانا", "Al-Wasm"],
  ["Al-Iklil", "الإكليل", "Al-Murabba'aniyah"],
  ["Al-Qalb", "القلب", "Al-Murabba'aniyah"],
  ["Al-Shaula", "الشولة", "Al-Murabba'aniyah"],
  ["Al-Na'ayim", "النعايم", "Al-Shabat"],
  ["Al-Baldah", "البلدة", "Al-Shabat"],
  ["Sa'd Al-Dhabih", "سعد الذابح", "Al-Aqarib"],
  ["Sa'd Bula'", "سعد بلع", "Al-Aqarib"],
  ["Sa'd Al-Su'ud", "سعد السعود", "Al-Aqarib"],
  ["Sa'd Al-Akhbiyah", "سعد الأخبية", "Al-Hamimain"],
  ["Al-Muqaddam", "المقدم", "Al-Hamimain"],
  ["Al-Mu'akhkhar", "المؤخر", "Al-Dhira'ain"],
  ["Al-Risha'", "الرشاء", "Al-Dhira'ain"],
]);

const SUDAN_MANSIONS = mansionSet([
  ["Al-Nath", "النطح", "Sudanese name for Al-Sharatain"],
  ["Al-Butain", "البطين"],
  ["Al-Turayya", "التريا", "Sudanese pronunciation"],
  ["Al-Dabaran", "الدبران"],
  ["Al-Haka'ah", "الهكعة", "Also Al-'Asa Al-'Atshana"],
  ["Al-Han'ah", "الهنعة", "Also Al-'Asa Al-Rayyana"],
  ["Al-Dhira'", "الذراع"],
  ["Al-Natrah", "النترة", "Regional spelling"],
  ["Al-Tarf", "الطرف"],
  ["Al-Jabha", "الجبهة", "14 days"],
  ["Al-Khirsan", "الخرسان", "Regional name"],
  ["Al-Sarfah", "الصرفة"],
  ["Al-Awa", "العوا", "Regional spelling"],
  ["Al-Simak", "السماك"],
  ["Al-Ghafr", "الغفر"],
  ["Al-Zabnan", "الزبنان", "Regional name"],
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
  ["Al-Hut", "الحوت", "Regional name"],
]);

const CLASSICAL_MANSIONS = mansionSet([
  ["Al-Sharatain", "الشرطان"], ["Al-Butain", "البطين"], ["Al-Thurayya", "الثريا"],
  ["Al-Dabaran", "الدبران"], ["Al-Haq'ah", "الهقعة"], ["Al-Han'ah", "الهنعة"],
  ["Al-Dhira'", "الذراع"], ["Al-Nathrah", "النثرة"], ["Al-Tarf", "الطرف"],
  ["Al-Jabha", "الجبهة", "14 days"], ["Al-Zubrah", "الزبرة"], ["Al-Sarfah", "الصرفة"],
  ["Al-Awwa", "العواء"], ["Al-Simak", "السماك الأعزل"], ["Al-Ghafr", "الغفر"],
  ["Al-Zubana", "الزباني"], ["Al-Iklil", "الإكليل"], ["Al-Qalb", "القلب"],
  ["Al-Shaula", "الشولة"], ["Al-Na'a'im", "النعائم"], ["Al-Baldah", "البلدة"],
  ["Sa'd Al-Dhabih", "سعد الذابح"], ["Sa'd Bula'", "سعد بلع"], ["Sa'd Al-Su'ud", "سعد السعود"],
  ["Sa'd Al-Akhbiyah", "سعد الأخبية"], ["Al-Fargh Al-Muqaddam", "الفرغ المقدم"],
  ["Al-Fargh Al-Mu'akhkhar", "الفرغ المؤخر"], ["Al-Risha'", "الرشاء"],
]);

const REGION_PROFILES: Record<RegionId, RegionProfile> = {
  gulf: {
    id: "gulf",
    label: "Arabian Gulf",
    shortLabel: "Gulf",
    anchorIso: "2026-05-12",
    timeZone: "Asia/Dubai",
    description: "UAE and Arabian Gulf seasonal mansion names and alignment.",
    mansions: GULF_MANSIONS,
  },
  sudan: {
    id: "sudan",
    label: "Sudan & Upper Nile",
    shortLabel: "Sudan",
    anchorIso: "2026-04-20",
    timeZone: "Africa/Khartoum",
    description: "Sudanese ainat names with the regional seasonal alignment.",
    mansions: SUDAN_MANSIONS,
  },
  classical: {
    id: "classical",
    label: "Classical Arabic",
    shortLabel: "Classical",
    anchorIso: "2026-04-05",
    timeZone: "UTC",
    description: "Classical Arabic names and a neutral reference alignment.",
    mansions: CLASSICAL_MANSIONS,
  },
};

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
  return "classical";
}

function regionFromCoordinates(latitude: number, longitude: number): RegionId {
  if (latitude >= 4 && latitude <= 23.5 && longitude >= 21 && longitude <= 39.5) return "sudan";
  if (latitude >= 12 && latitude <= 34 && longitude >= 34 && longitude <= 60) return "gulf";
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

function formatFullDate(dateMs: number) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(dateMs));
}

function formatShortDate(dateMs: number) {
  return new Intl.DateTimeFormat("en-GB", {
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
  const [regionId, setRegionId] = useState<RegionId>("gulf");
  const [anchorIso, setAnchorIso] = useState(REGION_PROFILES.gulf.anchorIso);
  const [timeZone, setTimeZone] = useState(REGION_PROFILES.gulf.timeZone);
  const [locationSource, setLocationSource] = useState("Regional default");
  const [locationMessage, setLocationMessage] = useState("");
  const [locating, setLocating] = useState(false);
  const [selectedIso, setSelectedIso] = useState(INITIAL_TODAY_ISO);
  const [viewYear, setViewYear] = useState(INITIAL_TODAY.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(INITIAL_TODAY.getUTCMonth());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineReady, setOfflineReady] = useState(false);

  const profile = REGION_PROFILES[regionId];
  const mansions = profile.mansions;
  const mansionOffsets = useMemo(() => offsetsFor(mansions), [mansions]);
  const todayIso = todayIsoForTimeZone(timeZone);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const detectedZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const storedRegion = window.localStorage.getItem("lunar-mansion-region") as RegionId | null;
      const detectedRegion = storedRegion && storedRegion in REGION_PROFILES
        ? storedRegion
        : regionFromTimeZone(detectedZone);
      const storedAnchor = window.localStorage.getItem("lunar-mansion-anchor");
      const storedTimeZone = window.localStorage.getItem("lunar-mansion-timezone");
      const activeZone = storedTimeZone || detectedZone;
      const nextToday = todayIsoForTimeZone(activeZone);
      const nextDate = new Date(parseIsoDate(nextToday));

      setTimeZone(activeZone);
      setRegionId(detectedRegion);
      setAnchorIso(storedAnchor || REGION_PROFILES[detectedRegion].anchorIso);
      setLocationSource(storedRegion ? "Saved regional selection" : `Time zone · ${detectedZone}`);
      setSelectedIso(nextToday);
      setViewYear(nextDate.getUTCFullYear());
      setViewMonth(nextDate.getUTCMonth());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const updateConnection = () => setIsOnline(window.navigator.onLine);
    const timer = window.setTimeout(updateConnection, 0);

    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);

    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("/sw.js")
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
              urls: [window.location.href, "/", "/manifest.webmanifest", "/favicon.svg", ...assetUrls],
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
  const selectedOutlook = OUTLOOKS[regionId][selectedDay.mansionIndex];
  const nextMansionIndex = (selectedDay.mansionIndex + 1) % mansions.length;
  const nextMansion = mansions[nextMansionIndex];
  const nextOutlook = OUTLOOKS[regionId][nextMansionIndex];
  const mansionProgress = Math.round((selectedDay.dayInMansion / selectedDay.mansion.days) * 100);

  const monthTitle = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(monthStart));

  function applyRegion(nextRegion: RegionId, source: string, nextTimeZone?: string) {
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
      setLocationMessage("Location is unavailable in this browser. Choose a region below.");
      return;
    }

    setLocating(true);
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextRegion = regionFromCoordinates(coords.latitude, coords.longitude);
        const nextProfile = REGION_PROFILES[nextRegion];
        applyRegion(nextRegion, `Location · ${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°`, nextProfile.timeZone);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationMessage("Location permission was not available. The time-zone profile is still active.");
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
    <main className="app-shell">
      <div className="star-field" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <div className="moon-mark" aria-hidden="true"><span /></div>
          <div>
            <h1>Lunar Mansion Calendar</h1>
            <p>Regional 365-day mansion cycle · Gregorian months</p>
          </div>
        </div>

        <div className="top-actions">
          <button className="location-pill" type="button" onClick={() => setSettingsOpen(true)}>
            <span aria-hidden="true">⌖</span>{profile.shortLabel}
          </button>
          <button className="today-button" type="button" onClick={goToToday}>Today</button>
          <button
            className={`settings-button ${settingsOpen ? "active" : ""}`}
            type="button"
            aria-label="Open regional cycle settings"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <span aria-hidden="true">⚙</span>
          </button>
        </div>

        {settingsOpen && (
          <section className="settings-popover" aria-label="Regional cycle settings">
            <div className="settings-heading">
              <div>
                <p className="eyebrow">Location & tradition</p>
                <h2>Regional alignment</h2>
              </div>
              <button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close settings">×</button>
            </div>

            <div className="detected-location">
              <span aria-hidden="true">⌖</span>
              <div><strong>{profile.label}</strong><small>{locationSource}</small></div>
            </div>

            <button className="locate-button" type="button" onClick={useMyLocation} disabled={locating}>
              {locating ? "Locating…" : "Use my regional location"}
            </button>
            {locationMessage && <p className="location-message">{locationMessage}</p>}

            <label>
              <span>Regional tradition</span>
              <select
                value={regionId}
                onChange={(event) => {
                  const nextRegion = event.currentTarget.value as RegionId;
                  applyRegion(nextRegion, "Manual regional selection");
                }}
              >
                {Object.values(REGION_PROFILES).map((item) => (
                  <option value={item.id} key={item.id}>{item.label}</option>
                ))}
              </select>
            </label>

            <label>
              <span>{mansions[0].en} · Day 1 reference</span>
              <input
                type="date"
                value={anchorIso}
                onChange={(event) => event.currentTarget.value && applyAnchor(event.currentTarget.value)}
              />
            </label>
            <p>{profile.description} The date can be corrected for a more specific local tradition.</p>
            <div className={`offline-status ${!isOnline ? "offline" : offlineReady ? "ready" : "preparing"}`}>
              <span aria-hidden="true">{!isOnline ? "◉" : offlineReady ? "✓" : "↓"}</span>
              <div>
                <strong>{!isOnline ? "Running offline" : offlineReady ? "Offline ready" : "Preparing offline use"}</strong>
                <small>After one online visit, the calendar and regional outlook can reopen without a connection.</small>
              </div>
            </div>
            <button className="reset-button" type="button" onClick={() => applyAnchor(profile.anchorIso)}>
              Reset regional alignment
            </button>
          </section>
        )}
      </header>

      <section className="workspace">
        <section className="calendar-card" aria-label="Interactive lunar mansion calendar">
          <div className="calendar-toolbar">
            <button type="button" className="month-arrow" aria-label="Previous month" onClick={() => moveMonth(-1)}>‹</button>
            <div className="month-heading">
              <p className="eyebrow">Gregorian month</p>
              <h2>{monthTitle}</h2>
              <span>{rows.length} mansion weeks intersect this month</span>
            </div>
            <button type="button" className="month-arrow" aria-label="Next month" onClick={() => moveMonth(1)}>›</button>
            <label className="month-picker">
              <span>Jump to month</span>
              <input
                type="month"
                value={monthValue(viewYear, viewMonth)}
                onChange={(event) => setMonthFromValue(event.currentTarget.value)}
              />
            </label>
          </div>

          <div className="alignment-strip">
            <span><b>⌖</b>{profile.label}</span>
            <span><b>◷</b>{timeZone}</span>
            <span><b>◇</b>{mansions[0].en} day 1 · {formatShortDate(parseIsoDate(anchorIso))}</span>
            <span className={`connection-indicator ${!isOnline ? "offline" : offlineReady ? "ready" : ""}`}>
              <b>●</b>{!isOnline ? "Offline mode" : offlineReady ? "Offline ready" : "Online"}
            </span>
          </div>

          <div className="calendar-frame">
            <div className="mansion-calendar" role="table" aria-label={`${monthTitle} by mansion day`}>
              <div className="calendar-header" role="row">
                <div className="mansion-column-head" role="columnheader">
                  <span>Regional week</span>
                  <strong>Mansion</strong>
                </div>
                {Array.from({ length: 13 }, (_, index) => (
                  <div className="day-column-head" role="columnheader" key={index + 1}>
                    <span>Day</span>
                    <strong>{index + 1}</strong>
                  </div>
                ))}
                <div className="day-column-head extra-column-head" role="columnheader">
                  <span>Jabha</span>
                  <strong>14</strong>
                </div>
              </div>

              {rows.map((row) => (
                <div
                  className={`mansion-row ${row.mansion.days === 14 ? "jabha-row" : ""}`}
                  role="row"
                  key={`${row.cycleYear}-${row.mansionIndex}`}
                >
                  <div className="mansion-name-cell" role="rowheader">
                    <span className="mansion-index">{String(row.mansionIndex + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{row.mansion.en}</strong>
                      <span className="arabic" lang="ar" dir="rtl">{row.mansion.ar}</span>
                      <small>{formatShortDate(row.startMs)} – {formatShortDate(row.startMs + (row.mansion.days - 1) * DAY_MS)}</small>
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
                      extra
                    />
                  ) : (
                    <div className="empty-extra-cell" role="cell" aria-label="No fourteenth day"><span>—</span></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="fit-note"><span>↔</span> All mansion-day columns resize to fit this view</div>
        </section>

        <section className={`outlook-card tone-${selectedOutlook.tone}`} aria-label="Regional lunar-mansion outlook" aria-live="polite">
          <div className="outlook-heading">
            <div>
              <p className="eyebrow">Traditional seasonal indication · {profile.label}</p>
              <h2>REGIONAL LUNAR-MANSION OUTLOOK</h2>
            </div>
            <div className="outlook-badges">
              <span>{selectedDay.mansion.en}</span>
              <span>Day {selectedDay.dayInMansion}/{selectedDay.mansion.days}</span>
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
              <div className="mansion-progress" aria-label={`${mansionProgress}% through this mansion`}>
                <span style={{ width: `${mansionProgress}%` }} />
              </div>
            </div>

            <div className="outlook-details">
              <article>
                <span aria-hidden="true">◌</span>
                <div><small>Land & water</small><p>{selectedOutlook.land}</p></div>
              </article>
              <article>
                <span aria-hidden="true">△</span>
                <div><small>Practical note</small><p>{selectedOutlook.guidance}</p></div>
              </article>
            </div>

            <aside className="next-outlook">
              <small>Next mansion</small>
              <div><strong>{nextMansion.en}</strong><b lang="ar" dir="rtl">{nextMansion.ar}</b></div>
              <span>{formatShortDate(selectedMansionEnd + DAY_MS)}</span>
              <p>{nextOutlook.title}</p>
            </aside>
          </div>

          <p className="outlook-disclaimer">
            This is a traditional regional climatological outlook, not a live weather forecast or safety warning. Conditions vary by coast, desert, elevation and local rainfall; use official forecasts for decisions.
          </p>
        </section>

        <section className="detail-grid" aria-live="polite">
          <article className="selected-card">
            <p className="eyebrow">{selectedIso === todayIso ? `Today · ${profile.shortLabel}` : "Selected date"}</p>
            <h2>{formatFullDate(selectedDateMs)}</h2>
            <label className="date-jump">
              <span>Choose any date</span>
              <input
                type="date"
                value={selectedIso}
                onChange={(event) => event.currentTarget.value && selectDate(event.currentTarget.value)}
              />
            </label>
          </article>

          <article className="mansion-card">
            <div className="mansion-card-title">
              <span>{String(selectedDay.mansionIndex + 1).padStart(2, "0")}</span>
              <div>
                <p>{profile.label} mansion</p>
                <h3>{selectedDay.mansion.en}</h3>
              </div>
              <b lang="ar" dir="rtl">{selectedDay.mansion.ar}</b>
            </div>
            {selectedDay.mansion.localNote && <p className="local-name-note">{selectedDay.mansion.localNote}</p>}
            <dl>
              <div><dt>Day in mansion</dt><dd>{selectedDay.dayInMansion}<small> / {selectedDay.mansion.days}</small></dd></div>
              <div><dt>Mansion span</dt><dd className="range-value">{formatShortDate(selectedMansionStart)}<small> to </small>{formatShortDate(selectedMansionEnd)}</dd></div>
              <div><dt>Cycle day</dt><dd>{selectedDay.cycleDay}<small> / 365</small></dd></div>
            </dl>
            {selectedDay.mansion.days === 14 && (
              <div className="jabha-note"><strong>14</strong><span>Al‑Jabha is the only 14-day mansion.</span></div>
            )}
          </article>

          <article className="cycle-card">
            <p className="eyebrow">Regional cycle · {profile.label}</p>
            <h3>{formatShortDate(selectedCycleStart)} — {formatShortDate(selectedCycleEnd)}</h3>
            <div className="equation"><span>27 × 13</span><b>+</b><span>Al‑Jabha 14</span><b>=</b><strong>365 days</strong></div>
            <p>Location selects the regional names, reference alignment and local day boundary. You can override the detected region in settings.</p>
          </article>
        </section>
      </section>
    </main>
  );
}

function DateCell({
  day,
  extra = false,
  onSelect,
  selectedIso,
  todayIso,
  viewMonth,
  viewYear,
}: {
  day: MansionDate;
  extra?: boolean;
  onSelect: (dateIso: string) => void;
  selectedIso: string;
  todayIso: string;
  viewMonth: number;
  viewYear: number;
}) {
  const date = new Date(day.dateMs);
  const inMonth = date.getUTCFullYear() === viewYear && date.getUTCMonth() === viewMonth;
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(date).toUpperCase();
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(date).toUpperCase();

  return (
    <button
      type="button"
      role="cell"
      className={`date-cell ${inMonth ? "in-month" : "outside-month"} ${
        day.dateIso === selectedIso ? "selected" : ""
      } ${day.dateIso === todayIso ? "today" : ""} ${extra ? "extra-day" : ""}`}
      aria-label={`${formatFullDate(day.dateMs)}, ${day.mansion.en}, mansion day ${day.dayInMansion}`}
      onClick={() => onSelect(day.dateIso)}
    >
      <span className="weekday">{weekday}</span>
      <strong>{date.getUTCDate()}</strong>
      <span className="cell-month">{month}</span>
      {day.dateIso === todayIso && <i>Today</i>}
    </button>
  );
}
