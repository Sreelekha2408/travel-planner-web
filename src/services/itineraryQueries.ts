import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as itineraryService from "./itineraryService";
import type { ItineraryInput } from "./itineraryService";

// One cache entry per trip's itinerary. Sign-out clears the whole query cache.
export const itineraryKeys = {
  all: ["itinerary"] as const,
  trip: (tripId: number) => ["itinerary", tripId] as const,
};

export function useItinerary(tripId: number) {
  return useQuery({
    queryKey: itineraryKeys.trip(tripId),
    queryFn: () => itineraryService.getItinerary(tripId),
    enabled: Number.isInteger(tripId),
  });
}

// Each mutation refetches that trip's itinerary afterwards, so the list always shows
// what the server saved (ids, order) rather than a local guess.
export function useAddItineraryItem(tripId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ItineraryInput) => itineraryService.addItineraryItems(tripId, [input]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itineraryKeys.trip(tripId) }),
  });
}

export function useUpdateItineraryItem(tripId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itineraryItemId, input }: { itineraryItemId: number; input: ItineraryInput }) =>
      itineraryService.updateItineraryItem(itineraryItemId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itineraryKeys.trip(tripId) }),
  });
}

export function useDeleteItineraryItem(tripId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itineraryItemId: number) => itineraryService.deleteItineraryItem(itineraryItemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itineraryKeys.trip(tripId) }),
  });
}
