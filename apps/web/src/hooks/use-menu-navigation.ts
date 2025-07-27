import type { Editor } from "@tiptap/react"
import * as React from "react"

type Orientation = "horizontal" | "vertical" | "both"

interface MenuNavigationOptions<T> {
  /**
   * The Tiptap editor instance, if using with a Tiptap editor.
   */
  editor?: Editor | null
  /**
   * Reference to the container element for handling keyboard events.
   */
  containerRef?: React.RefObject<HTMLElement | null>
  /**
   * Search query that affects the selected item.
   */
  query?: string
  /**
   * Array of items to navigate through.
   */
  items: T[]
  /**
   * Callback fired when an item is selected.
   */
  onSelect?: (item: T) => void
  /**
   * Callback fired when the menu should close.
   */
  onClose?: () => void
  /**
   * The navigation orientation of the menu.
   * @default "vertical"
   */
  orientation?: Orientation
  /**
   * Whether to automatically select the first item when the menu opens.
   * @default true
   */
  autoSelectFirstItem?: boolean
}

/**
 * Hook that implements keyboard navigation for dropdown menus and command palettes.
 *
 * Handles arrow keys, tab, home/end, enter for selection, and escape to close.
 * Works with both Tiptap editors and regular DOM elements.
 *
 * @param options - Configuration options for the menu navigation
 * @returns Object containing the selected index and a setter function
 */
export function useMenuNavigation<T>({
  editor,
  containerRef,
  query,
  items,
  onSelect,
  onClose,
  orientation = "vertical",
  autoSelectFirstItem = true,
}: MenuNavigationOptions<T>) {
  const [selectedIndex, setSelectedIndex] = React.useState<number>(autoSelectFirstItem ? 0 : -1)

  React.useEffect(() => {
    // Helper function to move to the next item
    const moveNext = () =>
      setSelectedIndex((currentIndex) => {
        if (currentIndex === -1) {
          return 0
        }
        return (currentIndex + 1) % items.length
      })

    // Helper function to move to the previous item
    const movePrev = () =>
      setSelectedIndex((currentIndex) => {
        if (currentIndex === -1) {
          return items.length - 1
        }
        return (currentIndex - 1 + items.length) % items.length
      })

    // Helper function to handle vertical arrow keys (up/down)
    const handleVerticalArrowKey = (event: KeyboardEvent, direction: "up" | "down") => {
      if (orientation === "horizontal") {
        return false
      }
      event.preventDefault()
      if (direction === "up") {
        movePrev()
      } else {
        moveNext()
      }
      return true
    }

    // Helper function to handle horizontal arrow keys (left/right)
    const handleHorizontalArrowKey = (event: KeyboardEvent, direction: "left" | "right") => {
      if (orientation === "vertical") {
        return false
      }
      event.preventDefault()
      if (direction === "left") {
        movePrev()
      } else {
        moveNext()
      }
      return true
    }

    // Helper function to handle arrow key navigation
    const handleArrowKey = (event: KeyboardEvent, key: string) => {
      switch (key) {
        case "ArrowUp":
          return handleVerticalArrowKey(event, "up")
        case "ArrowDown":
          return handleVerticalArrowKey(event, "down")
        case "ArrowLeft":
          return handleHorizontalArrowKey(event, "left")
        case "ArrowRight":
          return handleHorizontalArrowKey(event, "right")
        default:
          return false
      }
    }

    // Helper function to handle tab navigation
    const handleTabKey = (event: KeyboardEvent) => {
      event.preventDefault()
      if (event.shiftKey) {
        movePrev()
      } else {
        moveNext()
      }
      return true
    }

    // Helper function to handle home/end navigation
    const handleHomeEndKey = (event: KeyboardEvent, key: string) => {
      event.preventDefault()
      if (key === "Home") {
        setSelectedIndex(0)
      } else if (key === "End") {
        setSelectedIndex(items.length - 1)
      }
      return true
    }

    // Helper function to handle item selection
    const handleEnterKey = (event: KeyboardEvent) => {
      if (event.isComposing) {
        return false
      }
      event.preventDefault()
      if (selectedIndex !== -1 && items[selectedIndex]) {
        onSelect?.(items[selectedIndex])
      }
      return true
    }

    // Helper function to handle menu closing
    const handleEscapeKey = (event: KeyboardEvent) => {
      event.preventDefault()
      onClose?.()
      return true
    }

    // Main keyboard navigation handler
    const handleKeyboardNavigation = (event: KeyboardEvent) => {
      if (!items.length) {
        return false
      }

      const { key } = event

      // Handle arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
        return handleArrowKey(event, key)
      }

      // Handle other navigation keys
      switch (key) {
        case "Tab":
          return handleTabKey(event)
        case "Home":
        case "End":
          return handleHomeEndKey(event, key)
        case "Enter":
          return handleEnterKey(event)
        case "Escape":
          return handleEscapeKey(event)
        default:
          return false
      }
    }

    let targetElement: HTMLElement | null = null

    if (editor) {
      targetElement = editor.view.dom
    } else if (containerRef?.current) {
      targetElement = containerRef.current
    }

    if (targetElement) {
      targetElement.addEventListener("keydown", handleKeyboardNavigation, true)

      return () => {
        targetElement?.removeEventListener("keydown", handleKeyboardNavigation, true)
      }
    }

    return
  }, [editor, containerRef, items, selectedIndex, onSelect, onClose, orientation])

  React.useEffect(() => {
    if (query) {
      setSelectedIndex(autoSelectFirstItem ? 0 : -1)
    }
  }, [query, autoSelectFirstItem])

  return {
    selectedIndex: items.length ? selectedIndex : undefined,
    setSelectedIndex,
  }
}
