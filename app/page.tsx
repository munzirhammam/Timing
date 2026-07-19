"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useMemo, useRef, useState } from "react";

type Mansion = {
  en: string;
  ar: string;
  days: number;
};

type CylinderDay = {
  angle: number;
  cycleDay: number;
  dateIso: string;
  dateMs: number;
  dayInMansion: number;
  isMonthStart: boolean;
  mansion: Mansion;
  mansionIndex: number;
  month: number;
  rowY: number;
};

const DAY_MS = 86_400_000;
const ROW_HEIGHT = 19;
const CYLINDER_RADIUS = 252;
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

const MONTH_COLORS = [
  "rgba(111, 139, 167, .17)",
  "rgba(146, 158, 181, .13)",
  "rgba(91, 128, 148, .17)",
  "rgba(148, 138, 116, .14)",
  "rgba(99, 139, 128, .16)",
  "rgba(151, 127, 96, .15)",
  "rgba(111, 132, 160, .18)",
  "rgba(121, 116, 152, .15)",
  "rgba(145, 123, 104, .16)",
  "rgba(95, 128, 145, .17)",
  "rgba(121, 131, 155, .14)",
  "rgba(153, 153, 162, .13)",
];

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

function formatDate(value: number, compact = false) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: compact ? "short" : "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

function formatRange(start: number) {
  const end = start + 364 * DAY_MS;
  return `${formatDate(start, true)} — ${formatDate(end, true)}`;
}

function cycleStartForYear(cycleYear: number, anchorIso: string) {
  const anchorYear = Number(anchorIso.slice(0, 4));
  return parseIsoDate(anchorIso) + (cycleYear - anchorYear) * 365 * DAY_MS;
}

function cycleYearForDate(dateMs: number, anchorIso: string) {
  const anchorYear = Number(anchorIso.slice(0, 4));
  return anchorYear + Math.floor((dateMs - parseIsoDate(anchorIso)) / (365 * DAY_MS));
}

function dayPlacement(dayOffset: number) {
  let remaining = dayOffset;
  for (let index = 0; index < MANSIONS.length; index += 1) {
    if (remaining < MANSIONS[index].days) {
      return {
        angle: (remaining / MANSIONS[index].days) * 360,
        dayInMansion: remaining + 1,
        mansionIndex: index,
      };
    }
    remaining -= MANSIONS[index].days;
  }
  return { angle: 0, dayInMansion: 1, mansionIndex: 0 };
}

const INITIAL_TODAY_ISO = localTodayIso();
const INITIAL_TODAY_MS = parseIsoDate(INITIAL_TODAY_ISO);
const INITIAL_CYCLE_YEAR = cycleYearForDate(INITIAL_TODAY_MS, DEFAULT_ANCHOR);
const INITIAL_CYCLE_START = cycleStartForYear(INITIAL_CYCLE_YEAR, DEFAULT_ANCHOR);
const INITIAL_PLACEMENT = dayPlacement(
  Math.floor((INITIAL_TODAY_MS - INITIAL_CYCLE_START) / DAY_MS),
);

export default function Home() {
  const [anchorIso, setAnchorIso] = useState(DEFAULT_ANCHOR);
  const [cycleYear, setCycleYear] = useState(INITIAL_CYCLE_YEAR);
  const [rotation, setRotation] = useState(-INITIAL_PLACEMENT.angle);
  const [selectedIso, setSelectedIso] = useState(INITIAL_TODAY_ISO);
  const [todayIso] = useState(INITIAL_TODAY_ISO);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef({
    moved: false,
    pointerId: 0,
    startDate: "",
    startRotation: 0,
    startX: 0,
  });

  const cycleStart = useMemo(
    () => cycleStartForYear(cycleYear, anchorIso),
    [anchorIso, cycleYear],
  );

  const days = useMemo(() => {
    const result: CylinderDay[] = [];
    let cycleDay = 1;

    MANSIONS.forEach((mansion, mansionIndex) => {
      const rowY = (mansionIndex - (MANSIONS.length - 1) / 2) * ROW_HEIGHT;
      for (let dayInMansion = 1; dayInMansion <= mansion.days; dayInMansion += 1) {
        const dateMs = cycleStart + (cycleDay - 1) * DAY_MS;
        const date = new Date(dateMs);
        result.push({
          angle: ((dayInMansion - 1) / mansion.days) * 360,
          cycleDay,
          dateIso: toIsoDate(dateMs),
          dateMs,
          dayInMansion,
          isMonthStart: date.getUTCDate() === 1 || cycleDay === 1,
          mansion,
          mansionIndex,
          month: date.getUTCMonth(),
          rowY,
        });
        cycleDay += 1;
      }
    });
    return result;
  }, [cycleStart]);

  const selectedDay = useMemo(
    () => days.find((day) => day.dateIso === selectedIso) ?? days[0],
    [days, selectedIso],
  );

  function selectDay(day: CylinderDay) {
    setSelectedIso(day.dateIso);
    setRotation(-day.angle);
  }

  function goToToday() {
    if (!todayIso) return;
    const todayMs = parseIsoDate(todayIso);
    const nextCycleYear = cycleYearForDate(todayMs, anchorIso);
    const nextStart = cycleStartForYear(nextCycleYear, anchorIso);
    const offset = Math.floor((todayMs - nextStart) / DAY_MS);
    const placement = dayPlacement(offset);
    setCycleYear(nextCycleYear);
    setSelectedIso(todayIso);
    setRotation(-placement.angle);
  }

  function changeCycleYear(nextYear: number) {
    setCycleYear(nextYear);
    setSelectedIso(toIsoDate(cycleStartForYear(nextYear, anchorIso)));
    setRotation(0);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const dateButton = target.closest<HTMLButtonElement>("[data-cylinder-date]");
    dragState.current = {
      moved: false,
      pointerId: event.pointerId,
      startDate: dateButton?.dataset.cylinderDate ?? "",
      startX: event.clientX,
      startRotation: rotation,
    };
    setDragging(true);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging || dragState.current.pointerId !== event.pointerId) return;
    const distance = event.clientX - dragState.current.startX;
    if (Math.abs(distance) > 4) dragState.current.moved = true;
    setRotation(dragState.current.startRotation + distance * 0.42);
  }

  function stopDragging(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragState.current.pointerId !== event.pointerId) return;
    if (!dragState.current.moved && dragState.current.startDate) {
      const day = days.find((item) => item.dateIso === dragState.current.startDate);
      if (day) selectDay(day);
    }
    setDragging(false);
  }

  const selectedMonth = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(selectedDay.dateMs));

  return (
    <main className="app-shell">
      <div className="star-field" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <div className="moon-mark" aria-hidden="true">
            <span />
          </div>
          <div>
            <h1>Lunar Mansion Cylinder</h1>
            <p>28 stellar mansions · one continuous solar cycle</p>
          </div>
        </div>

        <div className="top-actions">
          <label className="year-control">
            <span>Cycle</span>
            <select
              aria-label="Mansion cycle year"
              value={cycleYear}
              onChange={(event) => changeCycleYear(Number(event.target.value))}
            >
              {Array.from({ length: 21 }, (_, index) => 2016 + index).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <button className="today-button" type="button" onClick={goToToday}>
            Today
          </button>
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
              <button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close settings">
                ×
              </button>
            </div>
            <label>
              <span>Al‑Sharatain · Day 1</span>
              <input
                type="date"
                value={anchorIso}
                onChange={(event) => {
                  if (!event.currentTarget.value) return;
                  setAnchorIso(event.currentTarget.value);
                  setCycleYear(Number(event.currentTarget.value.slice(0, 4)));
                  setSelectedIso(event.currentTarget.value);
                  setRotation(0);
                }}
                onInput={(event) => {
                  if (!event.currentTarget.value) return;
                  setAnchorIso(event.currentTarget.value);
                  setCycleYear(Number(event.currentTarget.value.slice(0, 4)));
                  setSelectedIso(event.currentTarget.value);
                  setRotation(0);
                }}
              />
            </label>
            <p>
              This reference anchors the stellar cycle. Every following cycle is exactly 365 days;
              Gregorian leap days are not inserted into the mansion count.
            </p>
            <button
              className="reset-button"
              type="button"
              onClick={() => {
                setAnchorIso(DEFAULT_ANCHOR);
                setCycleYear(2026);
                setSelectedIso(DEFAULT_ANCHOR);
                setRotation(0);
              }}
            >
              Reset reference
            </button>
          </section>
        )}
      </header>

      <section className="workspace">
        <section className="instrument-panel" aria-label="Interactive lunar mansion cylinder">
          <div className="instrument-heading">
            <div>
              <p className="eyebrow">Mansion cycle {cycleYear}</p>
              <h2>{formatRange(cycleStart)}</h2>
            </div>
            <div className="cycle-count">
              <strong>365</strong>
              <span>days</span>
            </div>
          </div>

          <div
            className={`cylinder-stage ${dragging ? "dragging" : ""}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
          >
            <div className="celestial-orbit orbit-one" aria-hidden="true" />
            <div className="celestial-orbit orbit-two" aria-hidden="true" />
            <div
              className="cylinder-rotor"
              style={{ "--rotation": `${rotation}deg` } as CSSProperties}
            >
              <div className="cylinder-cap top-cap" aria-hidden="true">
                <span>28 Mansions</span>
              </div>
              <div className="cylinder-cap bottom-cap" aria-hidden="true" />

              {days.map((day) => {
                const width = (2 * Math.PI * CYLINDER_RADIUS) / day.mansion.days - 2.4;
                const isSelected = selectedIso === day.dateIso;
                const isToday = todayIso === day.dateIso;
                const monthName = new Intl.DateTimeFormat("en-GB", {
                  month: "short",
                  timeZone: "UTC",
                })
                  .format(new Date(day.dateMs))
                  .toUpperCase();
                const style = {
                  "--angle": `${day.angle}deg`,
                  "--cell-width": `${width}px`,
                  "--month-color": MONTH_COLORS[day.month],
                  "--radius": `${CYLINDER_RADIUS}px`,
                  "--row-y": `${day.rowY}px`,
                } as CSSProperties;

                return (
                  <button
                    className={`cylinder-cell ${day.isMonthStart ? "month-start" : ""} ${
                      day.mansion.days === 14 ? "jabha-cell" : ""
                    } ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
                    key={day.dateIso}
                    data-cylinder-date={day.dateIso}
                    style={style}
                    type="button"
                    title={`${formatDate(day.dateMs)} · ${day.mansion.en} · day ${day.dayInMansion}`}
                    aria-label={`${formatDate(day.dateMs)}, ${day.mansion.en}, day ${day.dayInMansion} of ${day.mansion.days}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      selectDay(day);
                    }}
                  >
                    {day.dayInMansion === 1 && (
                      <span className="mansion-tag">
                        <b>{String(day.mansionIndex + 1).padStart(2, "0")}</b>
                        {day.mansion.en}
                      </span>
                    )}
                    {day.isMonthStart && <span className="month-tag">{monthName}</span>}
                    <span className="day-number">{day.dayInMansion}</span>
                    {isToday && <span className="today-star" aria-hidden="true">✦</span>}
                  </button>
                );
              })}
            </div>

            <div className="front-indicator" aria-hidden="true">
              <span />
            </div>
            <p className="drag-hint"><span>↔</span> Drag the cylinder to rotate</p>
          </div>

          <div className="instrument-footer">
            <span>Stellar year · 365 days</span>
            <i />
            <strong>27 × 13 + Al‑Jabha 14 = 365</strong>
            <i />
            <span>Gregorian months overlaid</span>
          </div>
        </section>

        <aside className="detail-panel" aria-live="polite">
          <section className="selected-date">
            <p className="eyebrow">{selectedIso === todayIso ? "Today" : "Selected date"}</p>
            <h2>{formatDate(selectedDay.dateMs)}</h2>
            <label className="date-jump">
              <span>Choose date in this cycle</span>
              <input
                type="date"
                min={toIsoDate(cycleStart)}
                max={toIsoDate(cycleStart + 364 * DAY_MS)}
                value={selectedIso}
                onChange={(event) => {
                  const day = days.find((item) => item.dateIso === event.currentTarget.value);
                  if (day) selectDay(day);
                }}
                onInput={(event) => {
                  const day = days.find((item) => item.dateIso === event.currentTarget.value);
                  if (day) selectDay(day);
                }}
              />
            </label>
          </section>

          <section className="mansion-detail">
            <p>Mansion week</p>
            <div className="mansion-title-row">
              <span>{String(selectedDay.mansionIndex + 1).padStart(2, "0")}</span>
              <h3>{selectedDay.mansion.en}</h3>
            </div>
            <p className="arabic-name" lang="ar" dir="rtl">{selectedDay.mansion.ar}</p>
            <dl>
              <div>
                <dt>Day in mansion</dt>
                <dd>{selectedDay.dayInMansion} <small>/ {selectedDay.mansion.days}</small></dd>
              </div>
              <div>
                <dt>Cycle day</dt>
                <dd>{selectedDay.cycleDay} <small>/ 365</small></dd>
              </div>
              <div>
                <dt>Calendar month</dt>
                <dd className="month-value">{selectedMonth}</dd>
              </div>
            </dl>
            {selectedDay.mansion.en === "Al-Jabha" && (
              <div className="jabha-note">
                <span>14</span>
                <p><strong>Al‑Jabha exception</strong>The only 14-day mansion in the cycle.</p>
              </div>
            )}
          </section>

          <section className="legend">
            <p className="eyebrow">Layers</p>
            <div><span className="legend-mansion" />Mansion week · 13 days</div>
            <div><span className="legend-jabha" />Al‑Jabha · 14 days</div>
            <div><span className="legend-month" />Gregorian calendar month</div>
            <div><span className="legend-today">✦</span>Today</div>
          </section>
        </aside>
      </section>
    </main>
  );
}
