import type { Editor } from "@tiptap/react"
import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
// --- Icons ---
import { BanIcon } from "@/components/tiptap-icons/ban-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
// --- Tiptap UI ---
import type {
  HighlightColor,
  UseColorHighlightConfig,
} from "@/components/tiptap-ui/color-highlight-button"
import {
  ColorHighlightButton,
  pickHighlightColorsByValue,
  useColorHighlight,
} from "@/components/tiptap-ui/color-highlight-button"
// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button, ButtonGroup } from "@/components/tiptap-ui-primitive/button"
import { Card, CardBody, CardItemGroup } from "@/components/tiptap-ui-primitive/card"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/tiptap-ui-primitive/popover"
import { Separator } from "@/components/tiptap-ui-primitive/separator"
// --- Hooks ---
import { useMenuNavigation } from "@/hooks/use-menu-navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

export interface ColorHighlightPopoverContentProps {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Optional colors to use in the highlight popover.
   * If not provided, defaults to a predefined set of colors.
   */
  colors?: HighlightColor[]
  /**
   * Function to close the popover.
   */
  onClose: () => void
}

export interface ColorHighlightPopoverProps
  extends Omit<ButtonProps, "type">,
    Pick<UseColorHighlightConfig, "editor" | "hideWhenUnavailable" | "onApplied"> {
  /**
   * Optional colors to use in the highlight popover.
   * If not provided, defaults to a predefined set of colors.
   */
  colors?: HighlightColor[]
}

export const ColorHighlightPopoverButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => (
    <Button
      aria-label="Highlight text"
      className={className}
      data-appearance="default"
      data-style="ghost"
      ref={ref}
      tabIndex={-1}
      tooltip="Highlight"
      type="button"
      {...props}
    >
      {children ?? <HighlighterIcon className="tiptap-button-icon" />}
    </Button>
  )
)

ColorHighlightPopoverButton.displayName = "ColorHighlightPopoverButton"

export const ColorHighlightPopoverContent = React.memo(function ColorHighlightPopoverContent({
  editor,
  colors,
  onClose,
}: ColorHighlightPopoverContentProps) {
  const defaultColors = React.useMemo(() => pickHighlightColorsByValue([
    "var(--tt-color-highlight-green)",
    "var(--tt-color-highlight-blue)",
    "var(--tt-color-highlight-red)",
    "var(--tt-color-highlight-purple)",
    "var(--tt-color-highlight-yellow)",
  ]), [])
  
  const finalColors = colors || defaultColors
  
  // Track what's causing re-renders in content
  const prevContentValues = React.useRef({ hasEditor: !!editor, hasOnClose: !!onClose, colorsCount: finalColors.length })
  React.useEffect(() => {
    const current = { hasEditor: !!editor, hasOnClose: !!onClose, colorsCount: finalColors.length }
    const prev = prevContentValues.current
    
    const changed = Object.keys(current).filter(key => current[key] !== prev[key])
    if (changed.length > 0) {
      console.log('[ColorHighlightPopoverContent] Values changed causing re-render:', {
        changed,
        prev,
        current
      })
    }
    prevContentValues.current = current
  })
  
  console.log('[ColorHighlightPopoverContent] Component render:', {
    hasEditor: !!editor,
    hasOnClose: !!onClose,
    colorsCount: finalColors.length,
    timestamp: Date.now()
  })

  const { handleRemoveHighlight } = useColorHighlight({ editor })
  const isMobile = useIsMobile()
  const containerRef = React.useRef<HTMLDivElement>(null)

  const menuItems = React.useMemo(
    () => [...finalColors, { label: "Remove highlight", value: "none" }],
    [finalColors]
  )

  const { selectedIndex } = useMenuNavigation({
    containerRef,
    items: menuItems,
    orientation: "both",
    onSelect: (item) => {
      console.log('[ColorHighlightPopoverContent] Menu navigation onSelect:', item)
      if (!containerRef.current) {
        return false
      }
      const highlightedElement = containerRef.current.querySelector(
        '[data-highlighted="true"]'
      ) as HTMLElement
      if (highlightedElement) {
        highlightedElement.click()
      }
      if (item.value === "none") {
        handleRemoveHighlight()
      }
    },
    autoSelectFirstItem: false,
  })

  return (
    <Card ref={containerRef} style={isMobile ? { boxShadow: "none", border: 0 } : {}} tabIndex={0}>
      <CardBody style={isMobile ? { padding: 0 } : {}}>
        <CardItemGroup orientation="horizontal">
          <ButtonGroup orientation="horizontal">
            {finalColors.map((color, index) => {
              const { handleColorHighlight, canColorHighlight, isActive } = useColorHighlight({ 
                editor, 
                highlightColor: color.value,
                label: color.label
              })
              
              return (
                <Button
                  key={color.value}
                  aria-label={`${color.label} highlight color`}
                  data-highlighted={selectedIndex === index}
                  data-active-state={isActive ? "on" : "off"}
                  data-style="ghost"
                  disabled={!canColorHighlight}
                  onClick={(e) => {
                    console.log('[ColorHighlightPopoverContent] Color button clicked:', {
                      color: color.label,
                      value: color.value,
                      canColorHighlight,
                      isActive,
                      event: e.type
                    })
                    handleColorHighlight()
                    console.log('[ColorHighlightPopoverContent] About to call onClose')
                    onClose()
                    console.log('[ColorHighlightPopoverContent] onClose called')
                  }}
                  tabIndex={index === selectedIndex ? 0 : -1}
                  tooltip={color.label}
                  type="button"
                  style={{ "--highlight-color": color.value } as React.CSSProperties}
                >
                  <span
                    className="tiptap-button-highlight"
                    style={{ "--highlight-color": color.value } as React.CSSProperties}
                  />
                </Button>
              )
            })}
          </ButtonGroup>
          <Separator />
          <ButtonGroup orientation="horizontal">
            <Button
              aria-label="Remove highlight"
              data-highlighted={selectedIndex === finalColors.length}
              data-style="ghost"
              onClick={(e) => {
                console.log('[ColorHighlightPopoverContent] Remove highlight button clicked:', {
                  event: e.type
                })
                handleRemoveHighlight()
                console.log('[ColorHighlightPopoverContent] About to call onClose (remove)')
                onClose()
                console.log('[ColorHighlightPopoverContent] onClose called (remove)')
              }}
              role="menuitem"
              tabIndex={selectedIndex === finalColors.length ? 0 : -1}
              tooltip="Remove highlight"
              type="button"
            >
              <BanIcon className="tiptap-button-icon" />
            </Button>
          </ButtonGroup>
        </CardItemGroup>
      </CardBody>
    </Card>
  )
})

// Minimal test component using raw Radix primitives

// COMMENTED OUT - Using Tiptap Simple Editor template instead
/*
export function ColorHighlightPopover() {
  // Step 1: Add back just the editor hook to test highlighting functionality
  const { editor } = useTiptapEditor()
  const [isOpen, setIsOpen] = React.useState(false)

  console.log('[ColorHighlightPopover] Render:', { isOpen, hasEditor: !!editor, timestamp: Date.now() })

  const colors = ["#fef08a", "#bbf7d0", "#bfdbfe", "#ddd6fe", "#fce7f3"]

  const handleColorSelect = (color: string) => {
    console.log('Color selected:', color)
    if (editor) {
      editor.chain().focus().setHighlight({ color }).run()
    }
    setIsOpen(false)
  }

  const handleRemoveHighlight = () => {
    console.log('Remove highlight')
    if (editor) {
      editor.chain().focus().unsetHighlight().run()
    }
    setIsOpen(false)
  }

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button className="tiptap-button" data-style="ghost">
          <HighlighterIcon className="tiptap-button-icon" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content className="bg-white border border-gray-200 rounded-md shadow-lg z-50 p-2">
          <div className="flex gap-1">
            {colors.map((color, index) => (
              <PopoverPrimitive.Close asChild key={index}>
                <button
                  onClick={() => handleColorSelect(color)}
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: color }}
                />
              </PopoverPrimitive.Close>
            ))}
            <PopoverPrimitive.Close asChild>
              <button
                onClick={handleRemoveHighlight}
                className="px-2 py-1 text-xs bg-gray-100 rounded"
              >
                Remove
              </button>
            </PopoverPrimitive.Close>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
*/

// Temporary simple export to prevent import errors
export function ColorHighlightPopover() {
  return null
}

export default ColorHighlightPopover
