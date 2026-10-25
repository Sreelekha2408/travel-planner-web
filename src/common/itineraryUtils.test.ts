import { describe, expect, it } from "vitest";
import type { ItineraryItem } from "../services/itineraryService";
import { activityTypeOption, formatActivityTime, groupItineraryByDay } from "./itineraryUtils";

function item(itineraryItemId: number, activityDate: string, activityTime: string | null, title = `Item ${itineraryItemId}`): ItineraryItem {
  return { itineraryItemId, title, description: null, location: null, activityType: "ACTIVITY", activityDate, activityTime, price: 0, tripId: 1 };
}

const trip = { startDate: "2026-12-20", endDate: "2026-12-22" };

describe("groupItineraryByDay", () => {
  it("returns every day of the trip, empty ones included, with a readable label", () => {
    const { days } = groupItineraryByDay([], trip);
    expect(days.map((day) => day.label)).toEqual([
      "Day 1 — Dec 20, Sunday",
      "Day 2 — Dec 21, Monday",
      "Day 3 — Dec 22, Tuesday",
    ]);
    expect(days.every((day) => day.items.length === 0)).toBe(true);
  });

  it("puts timed items in time order, then untimed ones in the order they were added", () => {
    const { days } = groupItineraryByDay(
      [item(1, "2026-12-21", null), item(2, "2026-12-21", "19:30:00"), item(3, "2026-12-21", "08:45:00"), item(4, "2026-12-21", null)],
      trip,
    );
    expect(days[1].items.map((i) => i.itineraryItemId)).toEqual([3, 2, 1, 4]);
  });

  it("keeps items dated outside the trip separately instead of dropping them", () => {
    const { days, outsideTrip } = groupItineraryByDay([item(1, "2026-12-25", null), item(2, "2026-12-20", null)], trip);
    expect(days[0].items).toHaveLength(1);
    expect(outsideTrip.map((i) => i.itineraryItemId)).toEqual([1]);
  });
});

describe("formatActivityTime", () => {
  it("shows hours and minutes, whatever precision the API sends", () => {
    expect(formatActivityTime("08:45:00")).toBe("08:45");
    expect(formatActivityTime("19:30")).toBe("19:30");
    expect(formatActivityTime(null)).toBeNull();
  });
});

describe("activityTypeOption", () => {
  it("gives each type its emoji and label", () => {
    expect(activityTypeOption("FLIGHT")).toMatchObject({ label: "Flight", emoji: "✈️" });
    expect(activityTypeOption("HOTEL")).toMatchObject({ label: "Stay", emoji: "🏨" });
  });
});
