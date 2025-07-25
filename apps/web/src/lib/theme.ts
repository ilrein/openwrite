import themes from "@/routes/dashboard/themes.json" with { type: "json" }

export interface Theme {
  id: string
  name: string
  description: string
  colors: {
    light: Record<string, string>
    dark: Record<string, string>
  }
}

export const availableThemes: Theme[] = themes

export function getCurrentTheme(): string {
  return localStorage.getItem("selected-theme") || "amethyst-haze"
}

export function applyTheme(themeId: string): void {
  const theme = availableThemes.find((t) => t.id === themeId)
  if (!theme) {
    return
  }

  const root = document.documentElement
  const isDark = root.classList.contains("dark")
  const colorMode = isDark ? "dark" : "light"
  const colors = theme.colors[colorMode]

  // Apply CSS custom properties
  for (const [property, value] of Object.entries(colors)) {
    root.style.setProperty(property, value)
  }

  // Save to localStorage
  localStorage.setItem("selected-theme", themeId)

  // Dispatch custom event for other components to listen
  window.dispatchEvent(new CustomEvent("theme-changed", { detail: { themeId } }))
}

export function initializeTheme(): void {
  const savedTheme = getCurrentTheme()
  applyTheme(savedTheme)

  // Listen for dark mode changes and reapply theme
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.attributeName === "class") {
        // Dark mode changed, reapply current theme
        const currentTheme = getCurrentTheme()
        applyTheme(currentTheme)
      }
    }
  })

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  })
}
