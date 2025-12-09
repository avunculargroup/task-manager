import {
  addDays,
  addWeeks,
  format,
  nextDay,
  startOfWeek,
} from "date-fns";

export interface ParsedTaskInput {
  title: string;
  dueDate: string | null;
  dueTime: string | null;
}

const DATE_REGEX = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/;
const TIME_WITH_AT_REGEX = /\bat (\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/;
const TIME_WITH_SPACE_REGEX = /\b(\d{1,2}):(\d{2})\s*(am|pm)\b/;
const TIME_24H_REGEX = /\b(\d{1,2}):(\d{2})\b/;

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;
const WEEKDAY_TO_INDEX = WEEKDAYS.reduce<Record<string, number>>((acc, day, index) => {
  acc[day] = index;
  return acc;
}, {});

type Weekday = (typeof WEEKDAYS)[number];

export function parseTaskInput(input: string, referenceDate = new Date()): ParsedTaskInput {
  let lower = input.toLowerCase();
  let title = input;
  let dueDate: string | null = null;
  let dueTime: string | null = null;

  const keywordMatch = parseKeyword(lower, referenceDate);
  if (keywordMatch) {
    dueDate = keywordMatch.date;
    ({ title, lower } = stripSegment(title, lower, keywordMatch.index, keywordMatch.match));
  }

  if (!dueDate) {
    const explicitDate = DATE_REGEX.exec(lower);
    if (explicitDate) {
      const [, day, month, year] = explicitDate;
      const parsed = new Date(Number(year), Number(month) - 1, Number(day));
      if (!Number.isNaN(parsed.getTime())) {
        dueDate = format(parsed, "yyyy-MM-dd");
        ({ title, lower } = stripSegment(title, lower, explicitDate.index, explicitDate[0]));
      }
    }
  }

  const timeRegexes = [TIME_WITH_AT_REGEX, TIME_WITH_SPACE_REGEX, TIME_24H_REGEX];
  for (const regex of timeRegexes) {
    const match = regex.exec(lower);
    if (match) {
      dueTime = extractTime(match);
      ({ title, lower } = stripSegment(title, lower, match.index, match[0]));
      break;
    }
  }

  title = title.replace(/\s{2,}/g, " ").replace(/\s+,/g, ",").trim();

  return {
    title: title || input,
    dueDate,
    dueTime,
  };
}

function parseKeyword(lower: string, referenceDate: Date) {
  if (lower.includes("today")) {
    return {
      match: "today",
      index: lower.indexOf("today"),
      date: format(referenceDate, "yyyy-MM-dd"),
    };
  }

  if (lower.includes("tomorrow")) {
    return {
      match: "tomorrow",
      index: lower.indexOf("tomorrow"),
      date: format(addDays(referenceDate, 1), "yyyy-MM-dd"),
    };
  }

  if (lower.includes("next week")) {
    const nextWeekMonday = startOfWeek(addWeeks(referenceDate, 1), { weekStartsOn: 1 });
    return {
      match: "next week",
      index: lower.indexOf("next week"),
      date: format(nextWeekMonday, "yyyy-MM-dd"),
    };
  }

  const weekdayMatch = /next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/.exec(lower);
  if (weekdayMatch) {
    const weekday = weekdayMatch[1] as Weekday;
    const date = nextDay(referenceDate, WEEKDAY_TO_INDEX[weekday]);
    return {
      match: weekdayMatch[0],
      index: weekdayMatch.index,
      date: format(date, "yyyy-MM-dd"),
    };
  }

  return null;
}

function stripSegment(title: string, lower: string, index: number, segment: string) {
  const before = title.slice(0, index);
  const after = title.slice(index + segment.length);
  const nextTitle = `${before}${after}`;
  const nextLower = nextTitle.toLowerCase();
  return { title: nextTitle, lower: nextLower };
}

function extractTime(match: RegExpExecArray) {
  if (match[3]) {
    const hours = Number(match[1]);
    const minutes = Number(match[2] ?? 0);
    const meridiem = match[3]?.toLowerCase();
    return to24Hour(hours, minutes, meridiem);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return `${pad(hours)}:${pad(minutes)}`;
}

function to24Hour(hours: number, minutes: number, meridiem?: string | null) {
  let adjusted = hours % 12;
  if (meridiem === "pm") {
    adjusted += 12;
  }
  return `${pad(adjusted)}:${pad(minutes)}`;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}
