import { fireEvent, render, screen } from "@testing-library/react"
import type React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ModeToggle } from "../mode-toggle"
import { useTheme } from "../theme-provider"

// Mock the theme provider
vi.mock("../theme-provider", () => ({
  useTheme: vi.fn(),
}))

// Mock the UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) => (
    <button onClick={onClick} type="button">
      {children}
    </button>
  ),
}))

const TOGGLE_THEME_REGEX = /toggle theme/i

describe("ModeToggle", () => {
  const mockSetTheme = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
      setTheme: mockSetTheme,
    })
  })

  it("should render theme toggle button", () => {
    render(<ModeToggle />)

    expect(screen.getByRole("button", { name: TOGGLE_THEME_REGEX })).toBeInTheDocument()
  })

  it("should render all theme options", () => {
    render(<ModeToggle />)

    expect(screen.getByText("Light")).toBeInTheDocument()
    expect(screen.getByText("Dark")).toBeInTheDocument()
    expect(screen.getByText("System")).toBeInTheDocument()
  })

  it("should call setTheme with correct value when light theme is selected", () => {
    render(<ModeToggle />)

    fireEvent.click(screen.getByText("Light"))
    expect(mockSetTheme).toHaveBeenCalledWith("light")
  })

  it("should call setTheme with correct value when dark theme is selected", () => {
    render(<ModeToggle />)

    fireEvent.click(screen.getByText("Dark"))
    expect(mockSetTheme).toHaveBeenCalledWith("dark")
  })

  it("should call setTheme with correct value when system theme is selected", () => {
    render(<ModeToggle />)

    fireEvent.click(screen.getByText("System"))
    expect(mockSetTheme).toHaveBeenCalledWith("system")
  })
})
