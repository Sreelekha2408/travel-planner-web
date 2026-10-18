import { describe, expect, it } from "vitest";
import type { Trip } from "../services/tripService";
import { destinationCode, formatBudget, formatTravellers, getTripStatus, sortTrips, tripCountdown, tripEmoji, tripLengthInDays } from "./tripUtils";

const today = "2026-10-18";

function trip(tripId: number, startDate: string, endDate: string): Trip {
  return {
    tripId,
    title: `Trip ${tripId}`,
    source: null,
    destination: "Somewhere",
    startDate,
    endDate,
    budget: null,
    currency: null,
    travellers: null,
    tripTypes: [],
    invitedEmails: [],
    createdBy: null,
    createdOn: null,
  };
}

describe("getTripStatus", () => {
  it("treats the first and last day of a trip as ongoing", () => {
    expect(getTripStatus({ startDate: today, endDate: "2026-10-25" }, today)).toBe("ongoing");
    expect(getTripStatus({ startDate: "2026-10-10", endDate: today }, today)).toBe("ongoing");
  });

  it("is upcoming before the start date and completed after the end date", () => {
    expect(getTripStatus({ startDate: "2026-10-19", endDate: "2026-10-25" }, today)).toBe("upcoming");
    expect(getTripStatus({ startDate: "2026-10-01", endDate: "2026-10-17" }, today)).toBe("completed");
  });
});

describe("tripLengthInDays", () => {
  it("counts both the first and the last day", () => {
    expect(tripLengthInDays("2026-12-12", "2026-12-22")).toBe(11);
    expect(tripLengthInDays("2026-12-12", "2026-12-12")).toBe(1); // a day trip
  });

  it("works across a month boundary", () => {
    expect(tripLengthInDays("2026-01-30", "2026-02-02")).toBe(4);
  });
});

describe("sortTrips", () => {
  it("orders ongoing, then upcoming (soonest first), then completed (most recent first)", () => {
    // sortTrips compares against the real current date, so use dates far from it.
    const trips = [
      trip(1, "2001-01-01", "2001-01-05"), // completed, older
      trip(2, "2999-06-01", "2999-06-05"), // upcoming, later
      trip(3, "2000-01-01", "2999-12-31"), // ongoing
      trip(4, "2999-01-01", "2999-01-05"), // upcoming, sooner
      trip(5, "2010-01-01", "2010-01-05"), // completed, more recent
    ];
    expect(sortTrips(trips).map((t) => t.tripId)).toEqual([3, 4, 2, 5, 1]);
  });

  it("doesn't mutate the array it's given", () => {
    const trips = [trip(1, "2999-06-01", "2999-06-05"), trip(2, "2999-01-01", "2999-01-05")];
    sortTrips(trips);
    expect(trips.map((t) => t.tripId)).toEqual([1, 2]);
  });
});

describe("formatTravellers", () => {
  it.each([
    [null, null],
    [1, "Just me"],
    [3, "3 travellers"],
    [5, "5 or more travellers"],
    [8, "5 or more travellers"],
  ])("formats %s as %s", (input, expected) => {
    expect(formatTravellers(input)).toBe(expected);
  });
});

describe("formatBudget", () => {
  it("uses the trip's currency symbol, with INR for trips saved without one", () => {
    expect(formatBudget(3000, "USD")).toBe("$3,000");
    expect(formatBudget(3000, "INR")).toBe("₹3,000");
    expect(formatBudget(3000, "EUR")).toBe("€3,000");
    expect(formatBudget(3000, null)).toBe("₹3,000");
    expect(formatBudget(null, "EUR")).toBe("No budget set");
  });
});

describe("tripCountdown", () => {
  it.each([
    ["2026-10-19", "2026-10-25", "Starts tomorrow"],
    ["2026-10-23", "2026-10-31", "Starts in 5 days"],
    ["2026-11-15", "2026-11-20", "Starts in 4 weeks"],
    ["2026-10-18", "2026-10-26", "Day 1 of 9"],
    ["2026-10-16", "2026-10-24", "Day 3 of 9"],
    ["2026-10-10", "2026-10-17", "Ended yesterday"],
    ["2026-09-01", "2026-09-28", "Ended 3 weeks ago"],
  ])("%s to %s is '%s' on 2026-10-18", (startDate, endDate, expected) => {
    expect(tripCountdown({ startDate, endDate }, today)).toBe(expected);
  });
});

describe("tripEmoji", () => {
  it("uses the first trip type's emoji, or a plane when there is none", () => {
    expect(tripEmoji({ tripTypes: ["BEACH", "NATURE"] })).toBe("🏖️");
    expect(tripEmoji({ tripTypes: [] })).toBe("✈️");
  });
});

describe("destinationCode", () => {
  it("takes the first three letters, ignoring spaces and punctuation", () => {
    expect(destinationCode("Bali, Indonesia")).toBe("BAL");
    expect(destinationCode("St. Lucia")).toBe("STL");
  });
});
