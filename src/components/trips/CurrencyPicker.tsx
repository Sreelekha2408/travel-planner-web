import { Chip, Menu, MenuItem } from "@mui/material";
import { useState, type RefObject } from "react";
import { currencyOptions, currencySymbol } from "../../common/tripUtils";

type CurrencyPickerProps = {
  value: string;
  onChange: (code: string) => void;
  // The menu opens under this element (the whole budget field), not under the chip.
  anchorRef: RefObject<HTMLElement | null>;
};

// A compact chip showing the currency symbol; clicking it opens a menu of symbols.
const CurrencyPicker = ({ value, onChange, anchorRef }: CurrencyPickerProps) => {
  // The element the open menu hangs from (null = closed). Read from the ref in the click
  // handler, not during render: React doesn't re-render when a ref changes.
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const open = menuAnchor !== null;
  const close = () => setMenuAnchor(null);
  const label = currencyOptions.find((option) => option.code === value)?.label ?? value;

  return (
    <>
      <Chip
        label={currencySymbol(value)}
        size="small"
        clickable
        onClick={(event) => setMenuAnchor(anchorRef.current ?? event.currentTarget)}
        aria-label={`Currency: ${label}. Change currency`}
        aria-haspopup="listbox"
        aria-expanded={open}
        sx={{ height: 26, minWidth: 34, bgcolor: "brand.soft", color: "primary.dark", fontWeight: 700, fontSize: 13, "&:hover": { bgcolor: "brand.meterTrack" } }}
      />
      <Menu
        open={open}
        onClose={close}
        anchorEl={menuAnchor}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ list: { role: "listbox", "aria-label": "Currency", dense: true } }}
      >
        {currencyOptions.map((option) => (
          <MenuItem
            key={option.code}
            role="option"
            selected={option.code === value}
            aria-label={option.label} // "$" alone is ambiguous for screen readers
            title={option.label} // and for sighted users on hover
            onClick={() => {
              onChange(option.code);
              close();
            }}
            sx={{ fontSize: 14, fontWeight: 600, minWidth: 72, justifyContent: "center" }}
          >
            {currencySymbol(option.code)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
export default CurrencyPicker;
