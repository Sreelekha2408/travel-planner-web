import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Inter, self-hosted via @fontsource (no request to Google). Only the weights the design uses.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
