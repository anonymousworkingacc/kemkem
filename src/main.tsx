import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@fontsource/andika/400.css"
import "@fontsource/andika/700.css"
import "./index.css"
import App from "@/App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

// Block pinch / double-tap zoom where the viewport meta is not honoured.
for (const type of ["gesturestart", "gesturechange", "dblclick"]) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)
