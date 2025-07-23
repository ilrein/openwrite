import * as React from "react"
// --- Tiptap UI ---
import type { TextAlign, UseTextAlignConfig } from "@/components/tiptap-ui/text-align-button"
import { TEXT_ALIGN_SHORTCUT_KEYS, useTextAlign } from "@/components/tiptap-ui/text-align-button"
import { Badge } from "@/components/tiptap-ui-primitive/badge"
// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"
// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
// --- Lib ---
import { parseShortcutKeys } from "@/lib/tiptap-utils"

export interface TextAlignButtonProps extends Omit<ButtonProps, "type">, UseTextAlignConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
  /**
   * Optional show shortcut keys in the button.
   * @default false
   */
  showShortcut?: boolean
}

export function TextAlignShortcutBadge({
  align,
  shortcutKeys = TEXT_ALIGN_SHORTCUT_KEYS[align],
}: {
  align: TextAlign
  shortcutKeys?: string
}) {
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>
}

/**
 * Button component for setting text alignment in a Tiptap editor.
 *
 * For custom button implementations, use the `useTextAlign` hook instead.
 */
export const TextAlignButton = React.forwardRef<HTMLButtonElement, TextAlignButtonProps>(
  (
    {
      editor: providedEditor,
      align,
      text,
      hideWhenUnavailable = false,
      onAligned,
      showShortcut = false,
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const { isVisible, handleTextAlign, label, canAlign, isActive, Icon, shortcutKeys } =
      useTextAlign({
        editor,
        align,
        hideWhenUnavailable,
        onAligned,
      })

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) {
          return
        }
        handleTextAlign()
      },
      [handleTextAlign, onClick]
    )

    if (!isVisible) {
      return null
    }

    return (
      <Button
        aria-label={label}
        aria-pressed={isActive}
        data-active-state={isActive ? "on" : "off"}
        data-disabled={!canAlign}
        data-style="ghost"
        disabled={!canAlign}
        onClick={handleClick}
        tabIndex={-1}
        tooltip={label}
        type="button"
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <Icon className="tiptap-button-icon" />
            {text && <span className="tiptap-button-text">{text}</span>}
            {showShortcut && <TextAlignShortcutBadge align={align} shortcutKeys={shortcutKeys} />}
          </>
        )}
      </Button>
    )
  }
)

TextAlignButton.displayName = "TextAlignButton"
