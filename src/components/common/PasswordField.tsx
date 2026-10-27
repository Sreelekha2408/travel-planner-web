import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import { IconButton, InputAdornment, TextField, type TextFieldProps } from "@mui/material";
import { useState } from "react";

// A TextField with an eye button that shows or hides what was typed. Takes the same
// props as TextField, so react-hook-form's register() can be spread onto it.
const PasswordField = ({ slotProps, ...props }: TextFieldProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      slotProps={{
        ...slotProps,
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible((current) => !current)}
                // Keep focus (and the cursor position) in the field when clicking the eye.
                onMouseDown={(event) => event.preventDefault()}
                edge="end"
                size="small"
              >
                {/* The icon shows the current state (crossed out = hidden); the label says the action. */}
                {visible ? <VisibilityOutlined fontSize="small" /> : <VisibilityOffOutlined fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

export default PasswordField;
