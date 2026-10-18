// Runs before every test file (see `test.setupFiles` in vite.config.ts).
import "@testing-library/jest-dom/vitest"; // adds matchers like toBeInTheDocument()
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount whatever the previous test rendered (we don't use Vitest globals, so RTL
// can't register this automatically).
afterEach(() => {
  cleanup();
});
