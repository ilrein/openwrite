"use client"

import * as React from "react"
import { Separator } from "@/components/tiptap-ui-primitive/separator"
import "@/components/tiptap-ui-primitive/toolbar/toolbar.scss"
import { cn } from "@/lib/tiptap-utils"

type BaseProps = React.HTMLAttributes<HTMLDivElement>
type ToolbarGroupProps = React.HTMLAttributes<HTMLFieldSetElement>

interface ToolbarProps extends BaseProps {
  variant?: "floating" | "fixed"
}

const mergeRefs = <T,>(refs: Array<React.Ref<T> | null | undefined>): React.RefCallback<T> => {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(value)
      } else if (ref && typeof ref === "object" && "current" in ref) {
        ;(ref as { current: T | null }).current = value
      }
    }
  }
}

const useObserveVisibility = (
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void
): void => {
  React.useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    let isMounted = true

    if (isMounted) {
      requestAnimationFrame(callback)
    }

    const observer = new MutationObserver(() => {
      if (isMounted) {
        requestAnimationFrame(callback)
      }
    })

    observer.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
    })

    return () => {
      isMounted = false
      observer.disconnect()
    }
  }, [ref, callback])
}

const useToolbarKeyboardNav = (toolbarRef: React.RefObject<HTMLDivElement | null>): void => {
  React.useEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar) {
      return
    }

    const getFocusableElements = () =>
      Array.from(
        toolbar.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [role="button"]:not([disabled]), [tabindex="0"]:not([disabled])'
        )
      )

    const navigateToIndex = (e: KeyboardEvent, targetIndex: number, elements: HTMLElement[]) => {
      e.preventDefault()
      let nextIndex = targetIndex

      if (nextIndex >= elements.length) {
        nextIndex = 0
      } else if (nextIndex < 0) {
        nextIndex = elements.length - 1
      }

      elements[nextIndex]?.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusableElements = getFocusableElements()
      if (!focusableElements.length) {
        return
      }

      const currentElement = document.activeElement as HTMLElement
      const currentIndex = focusableElements.indexOf(currentElement)

      if (!toolbar.contains(currentElement)) {
        return
      }

      const keyActions: Record<string, () => void> = {
        ArrowRight: () => navigateToIndex(e, currentIndex + 1, focusableElements),
        ArrowDown: () => navigateToIndex(e, currentIndex + 1, focusableElements),
        ArrowLeft: () => navigateToIndex(e, currentIndex - 1, focusableElements),
        ArrowUp: () => navigateToIndex(e, currentIndex - 1, focusableElements),
        Home: () => navigateToIndex(e, 0, focusableElements),
        End: () => navigateToIndex(e, focusableElements.length - 1, focusableElements),
      }

      const action = keyActions[e.key]
      if (action) {
        action()
      }
    }

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (toolbar.contains(target)) {
        target.setAttribute("data-focus-visible", "true")
      }
    }

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (toolbar.contains(target)) {
        target.removeAttribute("data-focus-visible")
      }
    }

    toolbar.addEventListener("keydown", handleKeyDown)
    toolbar.addEventListener("focus", handleFocus, true)
    toolbar.addEventListener("blur", handleBlur, true)

    const focusableElements = getFocusableElements()
    for (const element of focusableElements) {
      element.addEventListener("focus", handleFocus)
      element.addEventListener("blur", handleBlur)
    }

    return () => {
      toolbar.removeEventListener("keydown", handleKeyDown)
      toolbar.removeEventListener("focus", handleFocus, true)
      toolbar.removeEventListener("blur", handleBlur, true)

      const cleanupFocusableElements = getFocusableElements()
      for (const element of cleanupFocusableElements) {
        element.removeEventListener("focus", handleFocus)
        element.removeEventListener("blur", handleBlur)
      }
    }
  }, [toolbarRef])
}

const useToolbarVisibility = (ref: React.RefObject<HTMLDivElement | null>): boolean => {
  const [isVisible, setIsVisible] = React.useState<boolean>(true)
  const isMountedRef = React.useRef(false)

  React.useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const checkVisibility = React.useCallback(() => {
    if (!isMountedRef.current) {
      return
    }

    const toolbar = ref.current
    if (!toolbar) {
      return
    }

    // Check if any group has visible children
    const hasVisibleChildren = Array.from(toolbar.children).some((child) => {
      if (!(child instanceof HTMLElement)) {
        return false
      }
      if (child.tagName.toLowerCase() === "fieldset") {
        return child.children.length > 0
      }
      return false
    })

    setIsVisible(hasVisibleChildren)
  }, [ref])

  useObserveVisibility(ref, checkVisibility)
  return isVisible
}

const useGroupVisibility = (ref: React.RefObject<HTMLFieldSetElement | null>): boolean => {
  const [isVisible, setIsVisible] = React.useState<boolean>(true)
  const isMountedRef = React.useRef(false)

  React.useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const checkVisibility = React.useCallback(() => {
    if (!isMountedRef.current) {
      return
    }

    const group = ref.current
    if (!group) {
      return
    }

    const hasVisibleChildren = Array.from(group.children).some((child) => {
      if (!(child instanceof HTMLElement)) {
        return false
      }
      return true
    })

    setIsVisible(hasVisibleChildren)
  }, [ref])

  useObserveVisibility(ref, checkVisibility)
  return isVisible
}

const useSeparatorVisibility = (ref: React.RefObject<HTMLDivElement | null>): boolean => {
  const [isVisible, setIsVisible] = React.useState<boolean>(true)
  const isMountedRef = React.useRef(false)

  React.useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const checkVisibility = React.useCallback(() => {
    if (!isMountedRef.current) {
      return
    }

    const separator = ref.current
    if (!separator) {
      return
    }

    const prevSibling = separator.previousElementSibling as HTMLElement
    const nextSibling = separator.nextElementSibling as HTMLElement

    if (!(prevSibling && nextSibling)) {
      setIsVisible(false)
      return
    }

    const areBothGroups =
      prevSibling.tagName.toLowerCase() === "fieldset" &&
      nextSibling.tagName.toLowerCase() === "fieldset"

    const haveBothChildren = prevSibling.children.length > 0 && nextSibling.children.length > 0

    setIsVisible(areBothGroups && haveBothChildren)
  }, [ref])

  useObserveVisibility(ref, checkVisibility)
  return isVisible
}

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ children, className, variant = "fixed", ...props }, ref) => {
    const toolbarRef = React.useRef<HTMLDivElement>(null)
    const isVisible = useToolbarVisibility(toolbarRef)

    useToolbarKeyboardNav(toolbarRef)

    if (!isVisible) {
      return null
    }

    return (
      <div
        aria-label="toolbar"
        className={cn("tiptap-toolbar", className)}
        data-variant={variant}
        ref={mergeRefs([toolbarRef, ref])}
        role="toolbar"
        {...props}
      >
        {children}
      </div>
    )
  }
)

Toolbar.displayName = "Toolbar"

export const ToolbarGroup = React.forwardRef<HTMLFieldSetElement, ToolbarGroupProps>(
  ({ children, className, ...props }, ref) => {
    const groupRef = React.useRef<HTMLFieldSetElement>(null)
    const isVisible = useGroupVisibility(groupRef)

    if (!isVisible) {
      return null
    }

    return (
      <fieldset
        className={cn("tiptap-toolbar-group", className)}
        ref={mergeRefs([groupRef, ref])}
        {...props}
      >
        {children}
      </fieldset>
    )
  }
)

ToolbarGroup.displayName = "ToolbarGroup"

export const ToolbarSeparator = React.forwardRef<
  HTMLDivElement,
  BaseProps & {
    fixed?: boolean
  }
>(({ fixed = false, ...props }, ref) => {
  const separatorRef = React.useRef<HTMLDivElement>(null)
  const isVisible = useSeparatorVisibility(separatorRef)

  if (!(isVisible || fixed)) {
    return null
  }

  return (
    <Separator decorative orientation="vertical" ref={mergeRefs([separatorRef, ref])} {...props} />
  )
})

ToolbarSeparator.displayName = "ToolbarSeparator"
