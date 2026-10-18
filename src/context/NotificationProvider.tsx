import { Alert, Snackbar } from "@mui/material";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { NotificationContext } from "./useNotify";

type Toast = { id: number; message: string; severity: "success" | "error" };

// Shows one toast at a time at the bottom centre; a new one replaces the current one.
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const show = useCallback((message: string, severity: Toast["severity"]) => {
    // A new id remounts the Snackbar, so its auto-hide timer restarts for every toast.
    setToast({ id: Date.now(), message, severity });
  }, []);

  const notify = useMemo(
    () => ({
      success: (message: string) => show(message, "success"),
      error: (message: string) => show(message, "error"),
    }),
    [show],
  );

  const close = () => setToast(null);

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Snackbar
        key={toast?.id}
        open={toast !== null}
        autoHideDuration={toast?.severity === "error" ? 6000 : 4000} // errors stay a bit longer
        onClose={(_, reason) => {
          if (reason !== "clickaway") close(); // clicking elsewhere on the page shouldn't dismiss it
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {/* Alert has role="alert", so screen readers announce the message. */}
        <Alert onClose={close} severity={toast?.severity ?? "success"} variant="filled" sx={{ minWidth: 280, borderRadius: 3, boxShadow: 4 }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}
