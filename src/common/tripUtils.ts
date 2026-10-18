import dayjs from "dayjs";
import type { Trip, TripType } from "../services/tripService";

export type TripStatus = "upcoming" | "ongoing" | "completed";

// Dates are yyyy-MM-dd strings, so comparing them as strings is also chronological.
export function getTripStatus(trip: Pick<Trip, "startDate" | "endDate">, today = dayjs().format("YYYY-MM-DD")): TripStatus {
  if (trip.endDate < today) return "completed";
  if (trip.startDate > today) return "upcoming";
  return "ongoing";
}

// "Dec 12 – Dec 22", adding the year when it isn't the current one.
export function formatDateRange(startDate: string, endDate: string): string {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const thisYear = dayjs().year();
  const format = (date: dayjs.Dayjs) => date.format(date.year() === thisYear ? "MMM D" : "MMM D, YYYY");
  return `${format(start)} – ${format(end)}`;
}

// Inclusive: a trip from the 12th to the 22nd lasts 11 days.
export function tripLengthInDays(startDate: string, endDate: string): number {
  return dayjs(endDate).diff(dayjs(startDate), "day") + 1;
}

// Currencies offered for a trip budget (ISO 4217 codes, sent to the backend as-is).
export const currencyOptions: { code: string; label: string }[] = [
  { code: "INR", label: "Indian rupee" },
  { code: "USD", label: "US dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British pound" },
  { code: "JPY", label: "Japanese yen" },
  { code: "AUD", label: "Australian dollar" },
  { code: "CAD", label: "Canadian dollar" },
  { code: "SGD", label: "Singapore dollar" },
  { code: "AED", label: "UAE dirham" },
];

export const DEFAULT_CURRENCY = "INR";

// "$", "₹", "€", "£", "¥", and "A$" / "CA$" for dollars that would otherwise look the same.
// Comes from Intl, so no hand-maintained symbol table.
export function currencySymbol(code: string): string {
  const parts = new Intl.NumberFormat("en-US", { style: "currency", currency: code }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? code;
}

// Intl.NumberFormat picks the right symbol and grouping (e.g. $3,000, ₹3,000, €3,000).
// Formatters are cached because creating them is relatively expensive.
const formatters = new Map<string, Intl.NumberFormat>();

export function formatBudget(budget: number | null, currency: string | null = DEFAULT_CURRENCY): string {
  if (budget == null) return "No budget set";
  const code = currency ?? DEFAULT_CURRENCY;
  let formatter = formatters.get(code);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 });
    formatters.set(code, formatter);
  }
  return formatter.format(budget);
}

// Ongoing first, then upcoming (soonest first), then completed (most recent first).
export function sortTrips(trips: Trip[]): Trip[] {
  const order: Record<TripStatus, number> = { ongoing: 0, upcoming: 1, completed: 2 };
  return [...trips].sort((a, b) => {
    const statusA = getTripStatus(a);
    const statusB = getTripStatus(b);
    if (statusA !== statusB) return order[statusA] - order[statusB];
    return statusA === "completed" ? b.startDate.localeCompare(a.startDate) : a.startDate.localeCompare(b.startDate);
  });
}

// Trip types in the design's order, with the label and emoji used everywhere they appear
// (form chips, summary card, trip detail page).
export const tripTypeOptions: { value: TripType; label: string; emoji: string }[] = [
  { value: "RELAXING", label: "Relaxing", emoji: "🧘" },
  { value: "ADVENTURE", label: "Adventure", emoji: "🧗" },
  { value: "CULTURE", label: "Culture", emoji: "🏛️" },
  { value: "FOOD_AND_DRINK", label: "Food and drink", emoji: "🍽️" },
  { value: "BEACH", label: "Beach", emoji: "🏖️" },
  { value: "CITY_BREAK", label: "City break", emoji: "🏙️" },
  { value: "NATURE", label: "Nature", emoji: "🌿" },
];

export function tripTypeLabel(type: TripType): string {
  return tripTypeOptions.find((option) => option.value === type)?.label ?? type;
}

// "🏖️ Beach"
export function tripTypeWithEmoji(type: TripType): string {
  const option = tripTypeOptions.find((o) => o.value === type);
  return option ? `${option.emoji} ${option.label}` : type;
}

// Trip types in the same order as the form's chips. The API returns them as a set (no
// order), so sort before listing them to keep the display stable.
export function sortTripTypes(types: TripType[]): TripType[] {
  const index = (type: TripType) => tripTypeOptions.findIndex((option) => option.value === type);
  return [...types].sort((a, b) => index(a) - index(b));
}

// Which type's emoji represents a trip with several: the ones that say most about the
// place come first (a beach trip with good food is still a beach trip), food last.
const EMOJI_PRIORITY: TripType[] = ["BEACH", "NATURE", "ADVENTURE", "CITY_BREAK", "CULTURE", "RELAXING", "FOOD_AND_DRINK"];

// The big emoji on trip cards and the trip page: the highest-priority type's, or a plane
// when none is set.
export function tripEmoji(trip: Pick<Trip, "tripTypes">): string {
  const top = EMOJI_PRIORITY.find((type) => trip.tripTypes.includes(type));
  return tripTypeOptions.find((option) => option.value === top)?.emoji ?? "✈️";
}

export type TripProgress = {
  label: string; // "Planning" | "In progress" | "Completed"
  percent: number;
  tone: "primary" | "warning" | "success";
  detail: string; // explains the number (tooltip / screen readers)
};

// The progress bar on trip cards (from the design: "Planning 75%", "Completed 100%").
// Upcoming: share of planning steps done. Ongoing: how far through the trip.
// Completed: 100%. Itinerary and expenses can become planning steps once they exist.
export function tripProgress(
  trip: Pick<Trip, "startDate" | "endDate" | "source" | "budget" | "tripTypes">,
  today = dayjs().format("YYYY-MM-DD"),
): TripProgress {
  const status = getTripStatus(trip, today);
  if (status === "completed") {
    return { label: "Completed", percent: 100, tone: "success", detail: "This trip is over" };
  }
  if (status === "ongoing") {
    const length = tripLengthInDays(trip.startDate, trip.endDate);
    const day = dayjs(today).diff(dayjs(trip.startDate), "day") + 1;
    return { label: "In progress", percent: Math.round((day / length) * 100), tone: "warning", detail: `Day ${day} of ${length}` };
  }
  const steps = [
    { name: "trip basics", done: true }, // name, destination and dates are required
    { name: "a starting point", done: Boolean(trip.source?.trim()) },
    { name: "a budget", done: trip.budget != null },
    { name: "a trip type", done: trip.tripTypes.length > 0 },
  ];
  const missing = steps.filter((step) => !step.done).map((step) => step.name);
  return {
    label: "Planning",
    percent: Math.round(((steps.length - missing.length) / steps.length) * 100),
    tone: "primary",
    detail: missing.length > 0 ? `Add ${missing.join(", ")} to finish planning` : "All planning details added",
  };
}

// "3 days", "2 weeks", "4 months": coarse units for countdowns.
function roughDuration(days: number): string {
  if (days < 14) return `${days} ${days === 1 ? "day" : "days"}`;
  if (days < 60) return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
}

// "Starts in 5 days", "Day 3 of 9", "Ended 2 weeks ago", relative to `today` (yyyy-MM-dd).
export function tripCountdown(trip: Pick<Trip, "startDate" | "endDate">, today = dayjs().format("YYYY-MM-DD")): string {
  const now = dayjs(today);
  const status = getTripStatus(trip, today);
  if (status === "upcoming") {
    const days = dayjs(trip.startDate).diff(now, "day");
    return days === 1 ? "Starts tomorrow" : `Starts in ${roughDuration(days)}`;
  }
  if (status === "ongoing") {
    return `Day ${now.diff(dayjs(trip.startDate), "day") + 1} of ${tripLengthInDays(trip.startDate, trip.endDate)}`;
  }
  const days = now.diff(dayjs(trip.endDate), "day");
  return days === 1 ? "Ended yesterday" : `Ended ${roughDuration(days)} ago`;
}

// 1 -> "Just me", 2 -> "2 travellers", 5 -> "5 or more travellers".
export function formatTravellers(travellers: number | null): string | null {
  if (travellers == null) return null;
  if (travellers === 1) return "Just me";
  if (travellers >= 5) return "5 or more travellers";
  return `${travellers} travellers`;
}

export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Big faded letters on the card cover, e.g. "Bali, Indonesia" -> "BAL".
export function destinationCode(destination: string): string {
  return destination.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
}

// A stable bucket in [0, count) for a string, e.g. an avatar colour per email: the same
// email always gets the same colour, on every page and after a reload.
export function colorIndex(key: string, count: number): number {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.codePointAt(0)!) | 0; // | 0 keeps it a 32-bit int
  return Math.abs(hash) % count;
}
