import { createContext, useContext } from "react";

export type Notify = {
  success: (message: string) => void;
  error: (message: string) => void;
};

// Lives outside NotificationProvider.tsx because Fast Refresh needs component files to
// export only components.
export const NotificationContext = createContext<Notify | null>(null);

// App-wide toasts, e.g. notify.success("Trip created").
export function useNotify() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotify must be used inside <NotificationProvider>");
  return context;
}
