import { createContext, type ReactNode, useContext, useState } from "react"

interface AISidebarContextType {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  toggle: () => void
}

const AISidebarContext = createContext<AISidebarContextType | null>(null)

export function AISidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)

  const toggle = () => setIsOpen(!isOpen)

  return (
    <AISidebarContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </AISidebarContext.Provider>
  )
}

export function useAISidebar() {
  const context = useContext(AISidebarContext)
  if (!context) {
    throw new Error("useAISidebar must be used within an AISidebarProvider")
  }
  return context
}
