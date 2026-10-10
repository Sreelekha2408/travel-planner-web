import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as tripService from "./tripService";
import type { TripInput } from "./tripService";

// Query keys in one place. ["trips"] is a prefix of ["trips", id], so invalidating
// ["trips"] refreshes the list and every cached trip detail.
export const tripKeys = {
  all: ["trips"] as const,
  detail: (tripId: number) => ["trips", tripId] as const,
};

export function useTrips() {
  return useQuery({ queryKey: tripKeys.all, queryFn: tripService.getTrips });
}

export function useTrip(tripId: number) {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: () => tripService.getTrip(tripId),
    enabled: Number.isInteger(tripId), // skip the request for a malformed URL like /trips/abc
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TripInput) => tripService.createTrip(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useUpdateTrip(tripId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TripInput) => tripService.updateTrip(tripId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tripId: number) => tripService.deleteTrip(tripId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripKeys.all }),
  });
}
