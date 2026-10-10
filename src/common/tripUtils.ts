import dayjs from "dayjs";
import type { Trip } from "../services/tripService";

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

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function formatBudget(budget: number | null): string {
  return budget == null ? "No budget set" : currency.format(budget);
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

// Big faded letters on the card cover, e.g. "Bali, Indonesia" -> "BAL".
export function destinationCode(destination: string): string {
  return destination.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
}
