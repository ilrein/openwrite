"use client"

import type { Editor } from "@tiptap/react"
import * as React from "react"
// --- Icons ---
import { BoldIcon } from "@/components/tiptap-icons/bold-icon"
import { Code2Icon } from "@/components/tiptap-icons/code2-icon"
import { ItalicIcon } from "@/components/tiptap-icons/italic-icon"
import { StrikeIcon } from "@/components/tiptap-icons/strike-icon"
import { SubscriptIcon } from "@/components/tiptap-icons/subscript-icon"
import { SuperscriptIcon } from "@/components/tiptap-icons/superscript-icon"
import { UnderlineIcon } from "@/components/tiptap-icons/underline-icon"
// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
// --- Lib ---
import { isMarkInSchema, isNodeTypeSelected } from "@/lib/tiptap-utils"

export type Mark = "bold" | "italic" | "strike" | "code" | "underline" | "superscript" | "subscript"

/**
 * Configuration for the mark functionality
 */
export interface UseMarkConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * The type of mark to toggle
   */
  type: Mark
  /**
   * Whether the button should hide when mark is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful mark toggle.
   */
  onToggled?: () => void
}

export const markIcons = {
  bold: BoldIcon,
  italic: ItalicIcon,
  underline: UnderlineIcon,
  strike: StrikeIcon,
  code: Code2Icon,
  superscript: SuperscriptIcon,
  subscript: SubscriptIcon,
}

export const MARK_SHORTCUT_KEYS: Record<Mark, string> = {
  bold: "mod+b",
  italic: "mod+i",
  underline: "mod+u",
  strike: "mod+shift+s",
  code: "mod+e",
  superscript: "mod+.",
  subscript: "mod+,",
}

/**
 * Checks if a mark can be toggled in the current editor state
 */
export function canToggleMark(editor: Editor | null, type: Mark): boolean {
  if (!editor?.isEditable) {
    return false
  }
  if (!isMarkInSchema(type, editor) || isNodeTypeSelected(editor, ["image"])) {
    return false
  }

  return editor.can().toggleMark(type)
}

/**
 * Checks if a mark is currently active
 */
export function isMarkActive(editor: Editor | null, type: Mark): boolean {
  if (!(editor?.isEditable && editor.state)) {
    return false
  }

  try {
    return editor.isActive(type)
  } catch (_error) {
    // Silently handle errors when checking mark active state
    return false
  }
}

/**
 * Toggles a mark in the editor
 */
export function toggleMark(editor: Editor | null, type: Mark): boolean {
  if (!editor?.isEditable) {
    return false
  }
  if (!canToggleMark(editor, type)) {
    return false
  }

  return editor.chain().focus().toggleMark(type).run()
}

/**
 * Determines if the mark button should be shown
 */
export function shouldShowButton(props: {
  editor: Editor | null
  type: Mark
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, type, hideWhenUnavailable } = props

  if (!editor?.isEditable) {
    return false
  }
  if (!isMarkInSchema(type, editor)) {
    return false
  }

  if (hideWhenUnavailable && !editor.isActive("code")) {
    return canToggleMark(editor, type)
  }

  return true
}

/**
 * Gets the formatted mark name
 */
export function getFormattedMarkName(type: Mark): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

/**
 * Custom hook that provides mark functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MySimpleBoldButton() {
 *   const { isVisible, handleMark } = useMark({ type: "bold" })
 *
 *   if (!isVisible) return null
 *
 *   return <button onClick={handleMark}>Bold</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedItalicButton() {
 *   const { isVisible, handleMark, label, isActive } = useMark({
 *     editor: myEditor,
 *     type: "italic",
 *     hideWhenUnavailable: true,
 *     onToggled: () => console.log('Mark toggled!')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       onClick={handleMark}
 *       aria-pressed={isActive}
 *       aria-label={label}
 *     >
 *       Italic
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useMark(config: UseMarkConfig) {
  const { editor: providedEditor, type, hideWhenUnavailable = false, onToggled } = config

  const { editor } = useTiptapEditor(providedEditor)

  // Use direct approach like official Tiptap examples - shouldRerenderOnTransaction handles re-renders
  const isActive = editor ? isMarkActive(editor, type) : false
  const canToggle = editor ? canToggleMark(editor, type) : false
  const isVisible = editor ? shouldShowButton({ editor, type, hideWhenUnavailable }) : false

  const handleMark = React.useCallback(() => {
    if (!editor) {
      return false
    }

    const success = toggleMark(editor, type)
    if (success) {
      onToggled?.()
    }
    return success
  }, [editor, type, onToggled])

  // Don't use custom hotkeys - let Tiptap handle them natively
  // The keyboard shortcuts are handled by Tiptap's built-in extensions
  // useHotkeys(
  //   MARK_SHORTCUT_KEYS[type],
  //   (event) => {
  //     // Improved focus detection
  //     const isEditorFocused = editor?.isFocused
  //     const isInEditor = document.activeElement?.closest(".tiptap-editor-container, .tiptap-editor-content, .simple-editor-wrapper")
  //     const hasEditor = !!editor?.isEditable
  //
  //     if (!hasEditor || !(isEditorFocused || isInEditor)) {
  //       return
  //     }

  //     event.preventDefault()
  //     event.stopPropagation()
  //     handleMark()
  //   },
  //   {
  //     enabled: !!editor && isVisible && canToggle,
  //     enableOnContentEditable: true,
  //     enableOnFormTags: true,
  //     preventDefault: false, // Let the handler control preventDefault
  //   },
  //   [editor, isVisible, canToggle, handleMark] // Add dependencies
  // )

  return {
    isVisible,
    isActive,
    handleMark,
    canToggle,
    label: getFormattedMarkName(type),
    shortcutKeys: MARK_SHORTCUT_KEYS[type],
    Icon: markIcons[type],
  }
}
