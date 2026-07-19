"use client";

import { useMemo, useState } from "react";

type Mansion = {
  en: string;
  ar: string;
  days: number;
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
const DEFAULT_ANCHOR = "2026-04-05";

const MANSIONS: Mansion[] = [
  { en: "Al-Sharatain", ar: "الشرطان", days: 13 },
  { en: "Al-Butain", ar: "البطين", days: 13 },
  { en: "Al-Thurayya", ar: "الثريا", days: 13 },
  { en: "Al-Dabaran", ar: "الدبران", days: 13 },
  { en: "Al-Haq'ah", ar: "الهقعة", days: 13 },
  { en: "Al-Han'ah", ar: "الهنعة", days: 13 },
  { en: "Al-Dhira'", ar: "الذراع", days: 13 },
  { en: "Al-Nathrah", ar: "النثرة", days: 13 },
  { en: "Al-Tarf", ar: "الطرف", days: 13 },
  { en: "Al-Jabha", ar: "الجبهة", days: 14 },
  { en: "Al-Zubrah", ar: "الزبرة", days: 13 },
  { en: "Al-Sarfah", ar: "الصرفة", days: 13 },
  { en: "Al-Awwa", ar: "العواء", days: 13 },
  { en: "Al-Simak", ar: "السماك", days: 13 },
  { en: "Al-Ghafr", ar: "الغفر", days: 13 },
  { en: "Al-Zubana", ar: "الزبانا", days: 13 },
  { en: "Al-Iklil", ar: "الإكليل", days: 13 },
  { en: "Al-Qalb", ar: "القلب", days: 13 },
  { en: "Al-Shaula", ar: "الشولة", days: 13 },
  { en: "Al-Na'a'im", ar: "النعائم", days: 13 },
  { en: "Al-Baldah", ar: "البلدة", days: 13 },
  { en: "Sa'd Al-Dhabih", ar: "سعد الذابح", days: 13 },
  { en: "Sa'd Bula'", ar: "سعد بلع", days: 13 },
  { en: "Sa'd Al-Su'ud", ar: "سعد السعود", days: 13 },
  { en: "Sa'd Al-Akhbiyah", ar: "سعد الأخبية", days: 13 },
  { en: "Al-Fargh Al-Muqaddam", ar: "الفرغ المقدم", days: 13 },
  { en: "Al-Fargh Al-Mu'akhkhar", ar: "الفرغ المؤخر", days: 13 },
  { en: "Batn Al-Hut", ar: "بطن الحوت", days: 13 },
];

const MANSION_OFFSETS = MANSIONS.map((_, mansionIndex) =>
  MANSIONS.slice(0, mansionIndex).reduce((sum, mansion) => sum + mansion.days, 0),
);

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function toIsoDate(value: number) {
  return new Date(value).toISOString().slice(0, 10);
}

function localTodayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function cycleStartForYear(cycleYear: number, anchorIso: string) {
  const anchorYear = Number(anchorIso.slice(0, 4));
  return parseIsoDate(anchorIso) + (cycleYear - anchorYear) * 365 * DAY_MS;
}

function cycleYearForDate(dateMs: number, anchorIso: string) {
  const anchorYear = Number(anchorIso.slice(0, 4));
  return anchorYear + Math.floor((dateMs - parseIsoDate(anchorIso)) / (365 * DAY_MS));
}

function mansionDateForDate(dateMs: number, anchorIso: string): MansionDate {
  const cycleYear = cycleYearForDate(dateMs, anchorIso);
  const cycleStart = cycleStartForYear(cycleYear, anchorIso);
  const cycleDay = Math.floor((dateMs - cycleStart) / DAY_MS) + 1;
  let remaining = cycleDay - 1;

  for (let mansionIndex = 0; mansionIndex < MANSIONS.length; mansionIndex += 1) {
    const mansion = MANSIONS[mansionIndex];
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

  return {
    cycleDay: 1,
    cycleYear,
    dateIso: toIsoDate(dateMs),
    dateMs,
    dayInMansion: 1,
    mansion: MANSIONS[0],
    mansionIndex: 0,
  };
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

const INITIAL_TODAY_ISO = localTodayIso();
const INITIAL_TODAY_MS = parseIsoDate(INITIAL_TODAY_ISO);
const INITIAL_TODAY = new Date(INITIAL_TODAY_MS);

export default function Home() {
  const [anchorIso, setAnchorIso] = useState(DEFAULT_ANCHOR);
  const [todayIso] = useState(INITIAL_TODAY_ISO);
  const [selectedIso, setSelectedIso] = useState(INITIAL_TODAY_ISO);
  const [viewYear, setViewYear] = useState(INITIAL_TODAY.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(INITIAL_TODAY.getUTCMonth());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const monthStart = Date.UTC(viewYear, viewMonth, 1);
  const monthEnd = Date.UTC(viewYear, viewMonth + 1, 0);

  const rows = useMemo(() => {
    const rowKeys: string[] = [];
    const rowLookup = new Map<string, { cycleYear: number; mansionIndex: number }>();

    for (let dateMs = monthStart; dateMs <= monthEnd; dateMs += DAY_MS) {
      const info = mansionDateForDate(dateMs, anchorIso);
      const key = `${info.cycleYear}-${info.mansionIndex}`;
      if (!rowLookup.has(key)) {
        rowKeys.push(key);
        rowLookup.set(key, { cycleYear: info.cycleYear, mansionIndex: info.mansionIndex });
      }
    }

    return rowKeys.map((key): MansionRow => {
      const rowInfo = rowLookup.get(key)!;
      const mansion = MANSIONS[rowInfo.mansionIndex];
      const startMs =
        cycleStartForYear(rowInfo.cycleYear, anchorIso) +
        MANSION_OFFSETS[rowInfo.mansionIndex] * DAY_MS;
      return {
        cycleYear: rowInfo.cycleYear,
        dates: Array.from({ length: mansion.days }, (_, index) =>
          mansionDateForDate(startMs + index * DAY_MS, anchorIso),
        ),
        mansion,
        mansionIndex: rowInfo.mansionIndex,
        startMs,
      };
    });
  }, [anchorIso, monthEnd, monthStart]);

  const selectedDateMs = parseIsoDate(selectedIso);
  const selectedDay = mansionDateForDate(selectedDateMs, anchorIso);
  const selectedMansionStart =
    cycleStartForYear(selectedDay.cycleYear, anchorIso) +
    MANSION_OFFSETS[selectedDay.mansionIndex] * DAY_MS;
  const selectedMansionEnd =
    selectedMansionStart + (selectedDay.mansion.days - 1) * DAY_MS;
  const selectedCycleStart = cycleStartForYear(selectedDay.cycleYear, anchorIso);
  const selectedCycleEnd = selectedCycleStart + 364 * DAY_MS;

  const monthTitle = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(monthStart));

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
            <p>13-day mansion weeks · Gregorian calendar months</p>
          </div>
        </div>

        <div className="top-actions">
          <button className="today-button" type="button" onClick={goToToday}>Today</button>
          <button
            className={`settings-button ${settingsOpen ? "active" : ""}`}
            type="button"
            aria-label="Open cycle settings"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <span aria-hidden="true">⚙</span>
          </button>
        </div>

        {settingsOpen && (
          <section className="settings-popover" aria-label="Cycle settings">
            <div className="settings-heading">
              <div>
                <p className="eyebrow">Reference point</p>
                <h2>Cycle alignment</h2>
              </div>
              <button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close settings">×</button>
            </div>
            <label>
              <span>Al‑Sharatain · Day 1</span>
              <input
                type="date"
                value={anchorIso}
                onChange={(event) => {
                  if (event.currentTarget.value) setAnchorIso(event.currentTarget.value);
                }}
                onInput={(event) => {
                  if (event.currentTarget.value) setAnchorIso(event.currentTarget.value);
                }}
              />
            </label>
            <p>
              The mansion cycle remains exactly 365 days. Gregorian leap days shift the month overlay;
              they are not added to a mansion week.
            </p>
            <button className="reset-button" type="button" onClick={() => setAnchorIso(DEFAULT_ANCHOR)}>
              Reset reference
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
                onInput={(event) => setMonthFromValue(event.currentTarget.value)}
              />
            </label>
          </div>

          <div className="calendar-scroll">
            <div className="mansion-calendar" role="table" aria-label={`${monthTitle} by mansion day`}>
              <div className="calendar-header" role="row">
                <div className="mansion-column-head" role="columnheader">
                  <span>Week</span>
                  <strong>Lunar mansion</strong>
                </div>
                {Array.from({ length: 13 }, (_, index) => (
                  <div className="day-column-head" role="columnheader" key={index + 1}>
                    <span>Mansion day</span>
                    <strong>{index + 1}</strong>
                  </div>
                ))}
                <div className="day-column-head extra-column-head" role="columnheader">
                  <span>Al‑Jabha only</span>
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

          <div className="scroll-hint"><span>↔</span> Swipe horizontally to see all 13 mansion days</div>
        </section>

        <section className="detail-grid" aria-live="polite">
          <article className="selected-card">
            <p className="eyebrow">{selectedIso === todayIso ? "Today" : "Selected date"}</p>
            <h2>{formatFullDate(selectedDateMs)}</h2>
            <label className="date-jump">
              <span>Choose any date</span>
              <input
                type="date"
                value={selectedIso}
                onChange={(event) => event.currentTarget.value && selectDate(event.currentTarget.value)}
                onInput={(event) => event.currentTarget.value && selectDate(event.currentTarget.value)}
              />
            </label>
          </article>

          <article className="mansion-card">
            <div className="mansion-card-title">
              <span>{String(selectedDay.mansionIndex + 1).padStart(2, "0")}</span>
              <div>
                <p>Mansion week</p>
                <h3>{selectedDay.mansion.en}</h3>
              </div>
              <b lang="ar" dir="rtl">{selectedDay.mansion.ar}</b>
            </div>
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
            <p className="eyebrow">Continuous mansion cycle {selectedDay.cycleYear}</p>
            <h3>{formatShortDate(selectedCycleStart)} — {formatShortDate(selectedCycleEnd)}</h3>
            <div className="equation"><span>27 × 13</span><b>+</b><span>Al‑Jabha 14</span><b>=</b><strong>365 days</strong></div>
            <p>Calendar months are an overlay and may cross several mansion weeks.</p>
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
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" })
    .format(date)
    .toUpperCase();
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" })
    .format(date)
    .toUpperCase();

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
