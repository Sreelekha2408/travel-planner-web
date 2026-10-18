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

// Chip labels for the "What kind of trip is it?" field, in the design's order.
export const tripTypeOptions: { value: TripType; label: string }[] = [
  { value: "RELAXING", label: "Relaxing" },
  { value: "ADVENTURE", label: "Adventure" },
  { value: "CULTURE", label: "Culture" },
  { value: "FOOD_AND_DRINK", label: "Food and drink" },
  { value: "BEACH", label: "Beach" },
  { value: "CITY_BREAK", label: "City break" },
  { value: "NATURE", label: "Nature" },
];

export function tripTypeLabel(type: TripType): string {
  return tripTypeOptions.find((option) => option.value === type)?.label ?? type;
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
