import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useWindowSize } from "../use-window-size"

describe("useWindowSize", () => {
  const mockVisualViewport = {
    width: 1024,
    height: 768,
    offsetTop: 0,
    offsetLeft: 0,
    scale: 1,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }

  beforeEach(() => {
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: mockVisualViewport,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should return initial window size from visual viewport", () => {
    const { result } = renderHook(() => useWindowSize())

    expect(result.current).toEqual({
      width: 1024,
      height: 768,
      offsetTop: 0,
      offsetLeft: 0,
      scale: 1,
    })
  })

  it("should add event listeners on mount", () => {
    renderHook(() => useWindowSize())

    expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function))
    expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith("scroll", expect.any(Function))
  })

  it("should remove event listeners on unmount", () => {
    const { unmount } = renderHook(() => useWindowSize())

    unmount()

    expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    )
    expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    )
  })

  it("should handle missing visual viewport gracefully", () => {
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: undefined,
    })

    const { result } = renderHook(() => useWindowSize())

    expect(result.current).toEqual({
      width: 0,
      height: 0,
      offsetTop: 0,
      offsetLeft: 0,
      scale: 0,
    })
  })

  it("should update state when viewport changes", () => {
    const { result } = renderHook(() => useWindowSize())

    // Simulate viewport change
    act(() => {
      mockVisualViewport.width = 800
      mockVisualViewport.height = 600
      mockVisualViewport.offsetTop = 100
      const resizeCallback = mockVisualViewport.addEventListener.mock.calls.find(
        (call) => call[0] === "resize"
      )?.[1]
      resizeCallback?.()
    })

    expect(result.current).toEqual({
      width: 800,
      height: 600,
      offsetTop: 100,
      offsetLeft: 0,
      scale: 1,
    })
  })

  it("should not update state if values are the same", () => {
    const { result } = renderHook(() => useWindowSize())
    const initialResult = result.current

    // Simulate viewport change with same values
    act(() => {
      const resizeCallback = mockVisualViewport.addEventListener.mock.calls.find(
        (call) => call[0] === "resize"
      )?.[1]
      resizeCallback?.()
    })

    // Should return the same object reference for performance
    expect(result.current).toBe(initialResult)
  })
})
