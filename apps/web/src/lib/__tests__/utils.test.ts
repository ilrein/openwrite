import { describe, expect, it } from "vitest"
import { cn } from "../utils"

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names", () => {
      expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white")
    })

    it("should handle conflicting classes by keeping the last one", () => {
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500")
    })

    it("should handle conditional classes", () => {
      expect(cn("base-class", "conditional-class")).toBe("base-class conditional-class")
      expect(cn("base-class", false)).toBe("base-class")
    })

    it("should handle arrays and objects", () => {
      expect(cn(["class1", "class2"], { class3: true, class4: false })).toBe("class1 class2 class3")
    })

    it("should handle empty inputs", () => {
      expect(cn()).toBe("")
      expect(cn("")).toBe("")
      expect(cn(null, undefined)).toBe("")
    })
  })
})
