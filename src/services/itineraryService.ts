import { apiFetch } from "./serviceWrapper";

// Mirrors the ActivityType enum in travel-planner-api.
export type ActivityType = "FLIGHT" | "HOTEL" | "FOOD" | "ACTIVITY" | "TRANSPORT";

// Mirrors ItineraryResponse. activityDate is yyyy-MM-dd; activityTime is "HH:mm" or
// "HH:mm:ss" (java.time.LocalTime), or null when the plan has no set time.
export type ItineraryItem = {
  itineraryItemId: number;
  title: string;
  description: string | null;
  location: string | null;
  activityType: ActivityType;
  activityDate: string;
  activityTime: string | null;
  price: number;
  tripId: number;
};

// Mirrors ItineraryRequest.
export type ItineraryInput = {
  title: string;
  description: string | null;
  location: string | null;
  activityType: ActivityType;
  activityDate: string;
  activityTime: string | null;
  price: number;
};

export function getItinerary(tripId: number) {
  return apiFetch<ItineraryItem[]>(`/itineraries/${tripId}`);
}

// The API adds a list of items in one request; the UI adds one at a time.
export function addItineraryItems(tripId: number, inputs: ItineraryInput[]) {
  return apiFetch<ItineraryItem[]>(`/itineraries/${tripId}`, { method: "POST", body: JSON.stringify(inputs) });
}

export function updateItineraryItem(itineraryItemId: number, input: ItineraryInput) {
  return apiFetch<ItineraryItem>(`/itineraries/${itineraryItemId}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteItineraryItem(itineraryItemId: number) {
  return apiFetch<string>(`/itineraries/${itineraryItemId}`, { method: "DELETE" });
}
