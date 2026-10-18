import { Box, Typography } from "@mui/material";
import { useNotify } from "../../context/useNotify";
import { useUpdateTrip } from "../../services/tripQueries";
import { toTripInput, type Trip } from "../../services/tripService";
import TravellerList from "./TravellerList";

// The design's Travellers card on the trip page. Invites are added from the header's
// Share button; each can be removed here.
const TravellersCard = ({ trip }: { trip: Trip }) => {
  const notify = useNotify();
  const updateTrip = useUpdateTrip(trip.tripId);
  // The API returns invites as a set (no order); alphabetical keeps the list stable.
  const invitees = [...trip.invitedEmails].sort();

  // Removing is a normal trip update with that email left out. No confirmation: it's easy
  // to undo by inviting them again.
  const removeInvite = (email: string) => {
    updateTrip.mutate(
      { ...toTripInput(trip), invitedEmails: trip.invitedEmails.filter((e) => e !== email) },
      {
        onSuccess: () => notify.success(`Removed ${email}`),
        onError: (error) => notify.error(error.message || "Couldn't remove the invite. Please try again."),
      },
    );
  };

  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: 3.5, boxShadow: 1, p: 2.25 }}>
      <Typography component="h2" sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>🧑‍🤝‍🧑 Travellers</Typography>
      <TravellerList emails={invitees} onRemove={removeInvite} removeDisabled={updateTrip.isPending} maxHeight={300} />
    </Box>
  );
};
export default TravellersCard;
