import { Box, Button, TextField } from "@mui/material";
import { useState, type KeyboardEvent } from "react";
import { EMAIL_PATTERN } from "../../common/tripUtils";
import InviteeList from "./InviteeList";

const MAX_INVITES = 20; // same limit as the backend

type InviteEmailsFieldProps = {
  value: string[];
  onChange: (emails: string[]) => void;
};

// Type an email, press Enter or "Add", and it joins the list below with a remove button.
const InviteEmailsField = ({ value, onChange }: InviteEmailsFieldProps) => {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const email = draft.trim().toLowerCase();
    if (email === "") return;
    if (!EMAIL_PATTERN.test(email)) return setError("Enter a valid email address");
    if (value.includes(email)) return setError("Already added");
    if (value.length >= MAX_INVITES) return setError(`You can invite up to ${MAX_INVITES} people`);
    onChange([...value, email]);
    setDraft("");
    setError(null);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Enter here adds an invite instead of submitting the trip form
      add();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <TextField
          id="trip-invite"
          label="Invite travellers (optional)"
          type="email"
          placeholder="Add an email address"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          onKeyDown={onKeyDown}
          error={error !== null}
          helperText={error ?? "Saved with your trip. Invites aren't sent yet: that comes with Shared trips."}
          sx={{ flex: 1 }}
        />
        <Button variant="outlined" onClick={add} sx={{ height: 46 }}>Add</Button>
      </Box>
      <InviteeList emails={value} onRemove={(email) => onChange(value.filter((e) => e !== email))} />
    </Box>
  );
};
export default InviteEmailsField;
