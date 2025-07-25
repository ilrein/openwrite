import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import Loader from "../loader"

describe("Loader", () => {
  it("should render loader component", () => {
    const { container } = render(<Loader />)

    const loader = container.querySelector(".lucide-loader-circle")
    expect(loader).toBeInTheDocument()
  })

  it("should have spinning animation class", () => {
    const { container } = render(<Loader />)

    const loader = container.querySelector(".animate-spin")
    expect(loader).toBeInTheDocument()
    expect(loader).toHaveClass("animate-spin")
  })

  it("should be centered with proper styling", () => {
    const { container } = render(<Loader />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass("flex", "h-full", "items-center", "justify-center", "pt-8")
  })
})
