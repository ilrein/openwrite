import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useIsMobile } from "../use-mobile"

describe("useIsMobile", () => {
  const mockMatchMedia = vi.fn()
  const mockAddEventListener = vi.fn()
  const mockRemoveEventListener = vi.fn()

  beforeEach(() => {
    mockMatchMedia.mockReturnValue({
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    })
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: mockMatchMedia,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should return false for desktop width by default", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it("should return true for mobile width by default", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it("should use custom breakpoint", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 900,
    })

    const { result } = renderHook(() => useIsMobile(1000))
    expect(result.current).toBe(true)
  })

  it("should register media query listener with correct breakpoint", () => {
    renderHook(() => useIsMobile(768))
    expect(mockMatchMedia).toHaveBeenCalledWith("(max-width: 767px)")
  })

  it("should add and remove event listeners", () => {
    const { unmount } = renderHook(() => useIsMobile())
    expect(mockAddEventListener).toHaveBeenCalledWith("change", expect.any(Function))

    unmount()
    expect(mockRemoveEventListener).toHaveBeenCalledWith("change", expect.any(Function))
  })
})
