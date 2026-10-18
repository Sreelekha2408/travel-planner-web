import { apiFetch } from "./serviceWrapper";

// Mirrors the TripType enum in travel-planner-api.
export type TripType = "RELAXING" | "ADVENTURE" | "CULTURE" | "FOOD_AND_DRINK" | "BEACH" | "CITY_BREAK" | "NATURE";

// Mirrors TripResponse in travel-planner-api. Dates are ISO strings (yyyy-MM-dd),
// which is how Jackson serialises java.time.LocalDate.
export type Trip = {
  tripId: number;
  title: string;
  source: string | null;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number | null;
  currency: string | null; // ISO 4217 code; null on trips saved before currencies existed (= USD)
  travellers: number | null;
  tripTypes: TripType[];
  invitedEmails: string[]; // saved only; sending invites comes with Shared trips
  createdBy: string | null;
  createdOn: string | null;
};

// Mirrors TripRequest.
export type TripInput = {
  title: string;
  source: string | null;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number | null;
  currency: string;
  travellers: number | null;
  tripTypes: TripType[];
  invitedEmails: string[];
};

export function getTrips() {
  return apiFetch<Trip[]>("/trip/list");
}

export function getTrip(tripId: number) {
  return apiFetch<Trip>(`/trip/${tripId}`);
}

export function createTrip(input: TripInput) {
  return apiFetch<Trip>("/trip/create", { method: "POST", body: JSON.stringify(input) });
}

export function updateTrip(tripId: number, input: TripInput) {
  return apiFetch<Trip>(`/trip/${tripId}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteTrip(tripId: number) {
  return apiFetch<void>(`/trip/${tripId}`, { method: "DELETE" });
}
