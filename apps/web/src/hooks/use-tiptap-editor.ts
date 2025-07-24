import type { Editor } from "@tiptap/react"
import { useCurrentEditor } from "@tiptap/react"
import * as React from "react"

/**
 * Hook that provides access to a Tiptap editor instance.
 *
 * Simplified version that relies on shouldRerenderOnTransaction for re-renders,
 * following the official Tiptap React examples pattern.
 *
 * @param providedEditor - Optional editor instance to use instead of the context editor
 * @returns The provided editor or the editor from context, whichever is available
 */
export function useTiptapEditor(providedEditor?: Editor | null): {
  editor: Editor | null
} {
  const { editor: contextEditor } = useCurrentEditor()
  const editor = React.useMemo(
    () => providedEditor || contextEditor,
    [providedEditor, contextEditor]
  )

  return { editor }
}
