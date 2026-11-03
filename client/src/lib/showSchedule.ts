import { useEffect, useMemo, useState } from "react";
import showData from "@/content/shows.json";

export const SYDNEY_TIME_ZONE = "Australia/Sydney";
export const DEFAULT_SHOW_DURATION_MINUTES = 120;

export interface ShowEntry {
  title: string;
  date: string;
  startTime: string;
  durationMinutes?: number;
  ebayShowLink?: string;
  coverImage?: string;
  note?: string;
}

export interface ScheduledShow {
  title: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  ebayShowLink: string;
  coverImage: string;
  note: string;
  startAt: Date;
  endAt: Date;
  timeZoneName: string;
}

interface PublicShowsResponse {
  shows?: ShowEntry[];
}

const sourceShows = showData.shows as ShowEntry[];
const sourceSantaShows = showData.santaShows as ShowEntry[];

function localParts(date: Date) {
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone: SYDNEY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce<Record<string, string>>((result, part) => {
    if (part.type !== "literal") result[part.type] = part.value;
    return result;
  }, {});

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function timeZoneName(date: Date) {
  const part = new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY_TIME_ZONE,
    timeZoneName: "short",
  }).formatToParts(date).find(value => value.type === "timeZoneName");
  return part?.value ?? "AEST";
}

function validTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
}

function normaliseEventLink(value: string) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.toLowerCase();
  } catch {
    return "";
  }
}

export function sydneyLocalToUtc(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const intended = Date.UTC(year, month - 1, day, hour, minute, 0);
  let timestamp = intended;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = localParts(new Date(timestamp));
    const renderedAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    timestamp += intended - renderedAsUtc;
  }

  return new Date(timestamp);
}

export function resolveShow(entry: ShowEntry): ScheduledShow | null {
  const startTime = entry.startTime?.trim() ?? "";
  if (!entry.title?.trim() || !validDate(entry.date) || !validTime(startTime)) return null;

  const durationMinutes = Number.isFinite(entry.durationMinutes) && (entry.durationMinutes ?? 0) > 0
    ? Math.round(entry.durationMinutes!)
    : DEFAULT_SHOW_DURATION_MINUTES;
  const startAt = sydneyLocalToUtc(entry.date, startTime);

  return {
    title: entry.title.trim(),
    date: entry.date,
    startTime,
    durationMinutes,
    ebayShowLink: entry.ebayShowLink?.trim() ?? "",
    coverImage: entry.coverImage?.trim() ?? "",
    note: entry.note?.trim() ?? "",
    startAt,
    endAt: new Date(startAt.getTime() + durationMinutes * 60_000),
    timeZoneName: timeZoneName(startAt),
  };
}

export function mergeShowEntries(manualEntries: ShowEntry[], publicEntries: ShowEntry[]) {
  const publicByLink = new Map(publicEntries.map(entry => [normaliseEventLink(entry.ebayShowLink ?? ""), entry]));
  const mergedManual = manualEntries.map(entry => {
    const automated = publicByLink.get(normaliseEventLink(entry.ebayShowLink ?? ""));
    if (!automated) return entry;
    return {
      ...automated,
      ...entry,
      date: entry.date || automated.date,
      startTime: entry.startTime || automated.startTime,
      title: entry.title || automated.title,
      coverImage: entry.coverImage || automated.coverImage,
      note: entry.note || automated.note,
      durationMinutes: entry.durationMinutes || automated.durationMinutes,
    };
  });

  const manualLinks = new Set(manualEntries.map(entry => normaliseEventLink(entry.ebayShowLink ?? "")).filter(Boolean));
  const automatedOnly = publicEntries.filter(entry => !manualLinks.has(normaliseEventLink(entry.ebayShowLink ?? "")));
  return [...mergedManual, ...automatedOnly];
}

export const scheduledShows = sourceShows.map(resolveShow).filter((show): show is ScheduledShow => Boolean(show));
export const santaShows = sourceSantaShows.map(resolveShow).filter((show): show is ScheduledShow => Boolean(show));

export function useShowFeed() {
  const [publicEntries, setPublicEntries] = useState<ShowEntry[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/shows", { headers: { Accept: "application/json" } });
        if (!response.ok) return;
        const payload = await response.json() as PublicShowsResponse;
        if (active && Array.isArray(payload.shows)) setPublicEntries(payload.shows);
      } catch {
        // Manual rows stay visible when the optional public source is unavailable.
      }
    };

    void load();
    const interval = window.setInterval(() => { void load(); }, 60_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  return useMemo(() => mergeShowEntries(sourceShows, publicEntries).map(resolveShow).filter((show): show is ScheduledShow => Boolean(show)), [publicEntries]);
}

export function getUpcomingShows(shows: ScheduledShow[], now = new Date()) {
  return shows.filter(show => show.startAt.getTime() > now.getTime()).sort((first, second) => first.startAt.getTime() - second.startAt.getTime());
}

export function getThisWeeksShows(shows: ScheduledShow[], now = new Date()) {
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60_000);
  const current = shows.filter(show => show.startAt.getTime() > now.getTime() && show.startAt.getTime() <= weekEnd.getTime());

  return current.sort((first, second) => first.startAt.getTime() - second.startAt.getTime());
}

export function formatShowDate(show: ScheduledShow) {
  return new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: SYDNEY_TIME_ZONE }).format(show.startAt);
}

export function formatShowTime(show: ScheduledShow) {
  return new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: SYDNEY_TIME_ZONE }).format(show.startAt);
}

function calendarStamp(date: Date) {
  const parts = localParts(date);
  return `${parts.year}${String(parts.month).padStart(2, "0")}${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}${String(parts.minute).padStart(2, "0")}00`;
}

function utcStamp(date: Date) {
  return date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}/, "");
}

function escapeIcs(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replace(/\r?\n/g, "\\n");
}

export function googleCalendarUrl(show: ScheduledShow) {
  const parameters = new URLSearchParams({
    action: "TEMPLATE",
    text: show.title,
    dates: `${calendarStamp(show.startAt)}/${calendarStamp(show.endAt)}`,
    ctz: SYDNEY_TIME_ZONE,
    details: `Ripz Club on eBay Live: ${show.ebayShowLink || "https://www.ebay.com.au/ebaylive/sellers/uyrpxfoktc2"}`,
  });
  return `https://calendar.google.com/calendar/render?${parameters.toString()}`;
}

export function outlookCalendarUrl(show: ScheduledShow) {
  const parameters = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: show.title,
    startdt: show.startAt.toISOString(),
    enddt: show.endAt.toISOString(),
    body: `Ripz Club on eBay Live: ${show.ebayShowLink || "https://www.ebay.com.au/ebaylive/sellers/uyrpxfoktc2"}`,
  });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${parameters.toString()}`;
}

export function calendarFile(show: ScheduledShow) {
  const url = show.ebayShowLink || "https://www.ebay.com.au/ebaylive/sellers/uyrpxfoktc2";
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ripz Club//Shows//EN", "CALSCALE:GREGORIAN", "BEGIN:VTIMEZONE", "TZID:Australia/Sydney", "X-LIC-LOCATION:Australia/Sydney", "BEGIN:DAYLIGHT", "TZOFFSETFROM:+1000", "TZOFFSETTO:+1100", "TZNAME:AEDT", "DTSTART:19701004T020000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=1SU", "END:DAYLIGHT", "BEGIN:STANDARD", "TZOFFSETFROM:+1100", "TZOFFSETTO:+1000", "TZNAME:AEST", "DTSTART:19700405T030000", "RRULE:FREQ=YEARLY;BYMONTH=4;BYDAY=1SU", "END:STANDARD", "END:VTIMEZONE", "BEGIN:VEVENT",
    `UID:ripz-club-${show.date}-${show.startTime.replace(":", "")}@ripz.club`, `DTSTAMP:${utcStamp(new Date())}`, `DTSTART;TZID=Australia/Sydney:${calendarStamp(show.startAt)}`, `DTEND;TZID=Australia/Sydney:${calendarStamp(show.endAt)}`, `SUMMARY:${escapeIcs(show.title)}`, `DESCRIPTION:${escapeIcs(`Ripz Club on eBay Live: ${url}`)}`, `URL:${escapeIcs(url)}`, "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}

export function downloadCalendarFile(show: ScheduledShow) {
  const blob = new Blob([calendarFile(show)], { type: "text/calendar;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `ripz-club-${show.date}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
