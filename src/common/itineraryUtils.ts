import dayjs from "dayjs";
import { activityColors } from "./theme";
import type { ActivityType, ItineraryItem } from "../services/itineraryService";
import type { Trip } from "../services/tripService";

// Label, emoji and tile colour for each activity type, in the order the type picker shows.
export const activityTypeOptions: { value: ActivityType; label: string; emoji: string; tile: string }[] = [
  { value: "ACTIVITY", label: "Activity", emoji: "🎟️", tile: activityColors.activity.tile },
  { value: "FOOD", label: "Food", emoji: "🍽️", tile: activityColors.food.tile },
  { value: "FLIGHT", label: "Flight", emoji: "✈️", tile: activityColors.flight.tile },
  { value: "HOTEL", label: "Stay", emoji: "🏨", tile: activityColors.hotel.tile },
  { value: "TRANSPORT", label: "Transport", emoji: "🚕", tile: activityColors.transport.tile },
];

export function activityTypeOption(type: ActivityType) {
  return activityTypeOptions.find((option) => option.value === type) ?? activityTypeOptions[0];
}

// "08:45:00" or "08:45" -> "08:45"; null -> null.
export function formatActivityTime(time: string | null): string | null {
  return time ? time.slice(0, 5) : null;
}

export type ItineraryDay = {
  date: string; // yyyy-MM-dd
  dayNumber: number; // 1-based within the trip
  label: string; // "Day 1 — Oct 16, Friday"
  items: ItineraryItem[];
};

// Within a day: timed items by time, then the ones without a set time.
function byTime(a: ItineraryItem, b: ItineraryItem) {
  if (a.activityTime && b.activityTime) return a.activityTime.localeCompare(b.activityTime);
  if (a.activityTime) return -1;
  if (b.activityTime) return 1;
  return a.itineraryItemId - b.itineraryItemId; // stable: in the order they were added
}

// One entry per day of the trip, empty days included, so every day can take a new activity
// (like the design's "Day 1 — Jun 12, Thursday" blocks). Items dated outside the trip
// (e.g. after the dates were changed) come back separately so they aren't lost.
export function groupItineraryByDay(
  items: ItineraryItem[],
  trip: Pick<Trip, "startDate" | "endDate">,
): { days: ItineraryDay[]; outsideTrip: ItineraryItem[] } {
  const start = dayjs(trip.startDate);
  const length = dayjs(trip.endDate).diff(start, "day") + 1;
  const days: ItineraryDay[] = Array.from({ length }, (_, i) => {
    const date = start.add(i, "day");
    return { date: date.format("YYYY-MM-DD"), dayNumber: i + 1, label: `Day ${i + 1} — ${date.format("MMM D, dddd")}`, items: [] };
  });
  const byDate = new Map(days.map((day) => [day.date, day]));
  const outsideTrip: ItineraryItem[] = [];
  for (const item of items) {
    const day = byDate.get(item.activityDate);
    if (day) day.items.push(item);
    else outsideTrip.push(item);
  }
  for (const day of days) day.items.sort(byTime);
  outsideTrip.sort((a, b) => a.activityDate.localeCompare(b.activityDate) || byTime(a, b));
  return { days, outsideTrip };
}
