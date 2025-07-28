/**
 * Graph Writing Interface - The Magic Moment Component
 *
 * This demonstrates how the unified graph system connects:
 * - Canvas nodes (visual story structure)
 * - Writing interface (actual content creation)
 * - Real-time synchronization between both
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { api, type GraphNode, type TextBlock } from "@/lib/api"

interface GraphWritingInterfaceProps {
  projectId: string
  selectedNode: GraphNode | null
  isOpen: boolean
  onClose: () => void
}

export function GraphWritingInterface({
  projectId,
  selectedNode,
  isOpen,
  onClose,
}: GraphWritingInterfaceProps) {
  const queryClient = useQueryClient()
  const [newBlockContent, setNewBlockContent] = useState("")

  // Load text blocks for the selected story node
  const { data: textBlocks = [], isLoading } = useQuery({
    queryKey: ["text-blocks", projectId, selectedNode?.id],
    queryFn: async () => {
      if (!selectedNode?.id) return []
      return await api.graph.listTextBlocks(projectId, selectedNode.id)
    },
    enabled: !!selectedNode?.id && selectedNode.nodeType === "story_element",
  })

  // Create new text block mutation
  const createTextBlockMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedNode?.id) throw new Error("No node selected")
      return await api.graph.createTextBlock(projectId, {
        storyNodeId: selectedNode.id,
        content,
        orderIndex: textBlocks.length,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["text-blocks", projectId, selectedNode?.id])
      setNewBlockContent("")
    },
  })

  // Update node details mutation
  const updateNodeMutation = useMutation({
    mutationFn: async (updates: { title?: string; description?: string }) => {
      if (!selectedNode?.id) throw new Error("No node selected")
      return await api.graph.updateNode(projectId, selectedNode.id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["graph-nodes", projectId])
    },
  })

  const handleAddTextBlock = () => {
    if (!newBlockContent.trim()) return
    createTextBlockMutation.mutate(newBlockContent)
  }

  const handleUpdateNode = (field: string, value: string) => {
    updateNodeMutation.mutate({ [field]: value })
  }

  const getNodeIcon = (node: GraphNode) => {
    const visualProps = api.graph.parseVisualProperties(node.visualProperties)
    return visualProps.icon || getDefaultIcon(node.nodeType)
  }

  const getDefaultIcon = (nodeType: string) => {
    switch (nodeType) {
      case "character":
        return "👤"
      case "location":
        return "🏰"
      case "story_element":
        return "📝"
      case "plot_thread":
        return "🎯"
      case "lore":
        return "📜"
      default:
        return "⭐"
    }
  }

  const getTotalWordCount = () => {
    return textBlocks.reduce((total, block) => total + (block.wordCount || 0), 0)
  }

  if (!selectedNode) return null

  return (
    <Sheet onOpenChange={onClose} open={isOpen}>
      <SheetContent className="w-[600px] sm:w-[800px]">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg text-primary-foreground">
              {getNodeIcon(selectedNode)}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{selectedNode.title}</div>
              <div className="text-muted-foreground text-sm capitalize">
                {selectedNode.nodeType.replace("_", " ")}{" "}
                {selectedNode.subType && `• ${selectedNode.subType}`}
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{getTotalWordCount()} words</Badge>
              <Badge variant="outline">{textBlocks.length} blocks</Badge>
            </div>
          </SheetTitle>
          <SheetDescription>
            This is where the magic happens - your canvas node becomes a living document! Write
            content that's dynamically linked to your story structure.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Node Details Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Node Details</h3>

            <div className="space-y-2">
              <Label htmlFor="node-title">Title</Label>
              <Input
                defaultValue={selectedNode.title}
                id="node-title"
                onBlur={(e) => handleUpdateNode("title", e.target.value)}
                placeholder="Enter node title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="node-description">Description</Label>
              <Textarea
                defaultValue={selectedNode.description}
                id="node-description"
                onBlur={(e) => handleUpdateNode("description", e.target.value)}
                placeholder="Describe this story element..."
                rows={3}
              />
            </div>
          </div>

          {/* Writing Section - Only for story elements */}
          {selectedNode.nodeType === "story_element" && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Writing Content</h3>

              {/* Existing Text Blocks */}
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading text blocks...</div>
              ) : textBlocks.length > 0 ? (
                <div className="space-y-4">
                  {textBlocks.map((block, index) => (
                    <div className="rounded-lg border bg-muted/20 p-4" key={block.id}>
                      <div className="mb-2 flex items-center justify-between">
                        <Badge size="sm" variant="outline">
                          Block {index + 1}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {block.wordCount || 0} words
                        </span>
                      </div>
                      <div className="prose text-sm">
                        {block.content?.split("\n").map((line, i) => (
                          <p className="mb-2 last:mb-0" key={i}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed py-8 text-center text-muted-foreground">
                  No content yet. Add your first text block below!
                </div>
              )}

              {/* Add New Text Block */}
              <div className="space-y-3">
                <Label htmlFor="new-block">Add New Text Block</Label>
                <Textarea
                  id="new-block"
                  onChange={(e) => setNewBlockContent(e.target.value)}
                  placeholder="Write your story content here... This will be linked to your canvas node!"
                  rows={6}
                  value={newBlockContent}
                />
                <Button
                  className="w-full"
                  disabled={!newBlockContent.trim() || createTextBlockMutation.isPending}
                  onClick={handleAddTextBlock}
                >
                  {createTextBlockMutation.isPending ? "Adding..." : "Add Text Block"}
                </Button>
              </div>
            </div>
          )}

          {/* Codex Node Information */}
          {selectedNode.nodeType !== "story_element" && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">
                {selectedNode.nodeType === "character" && "Character Information"}
                {selectedNode.nodeType === "location" && "Location Details"}
                {selectedNode.nodeType === "lore" && "Lore Entry"}
                {selectedNode.nodeType === "plot_thread" && "Plot Thread"}
              </h3>

              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-muted-foreground text-sm">
                  This {selectedNode.nodeType} node can be dragged onto story elements to create
                  connections. The unified graph system will track all relationships automatically!
                </p>

                {selectedNode.nodeType === "character" && (
                  <div className="mt-3 text-sm">
                    <strong>Usage:</strong> Drag this character onto scenes where they appear to
                    create character arc connections.
                  </div>
                )}

                {selectedNode.nodeType === "location" && (
                  <div className="mt-3 text-sm">
                    <strong>Usage:</strong> Drag this location onto scenes that take place here to
                    create setting connections.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* The Magic Moment Message */}
          <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
            <h4 className="mb-2 font-medium text-blue-900">🎉 The Living Story Graph</h4>
            <p className="text-blue-800 text-sm">
              You're experiencing the unified graph system! This node exists simultaneously on your
              canvas AND as editable content. Changes here update the visual graph, and moving nodes
              on the canvas updates their data. Everything is connected in real-time!
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
