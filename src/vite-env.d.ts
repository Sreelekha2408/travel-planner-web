/// <reference types="vite/client" />

// Augments Vite's env typing so import.meta.env.VITE_API_URL is typed.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}
