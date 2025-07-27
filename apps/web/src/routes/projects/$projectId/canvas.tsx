"use client"

import { createFileRoute } from "@tanstack/react-router"
import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  Handle,
  type Node,
  type NodeProps,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react"
import { useCallback, useState } from "react"
import "@xyflow/react/dist/style.css"

import {
  Circle,
  FileText,
  Layers,
  Redo2,
  Square,
  Target,
  Triangle,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export const Route = createFileRoute("/projects/$projectId/canvas")({
  component: StoryCanvasPage,
})

// Story element types
type StoryElementType = "act" | "chapter" | "scene" | "beat" | "plot-point"

// Story node data interface
interface StoryNodeData extends Record<string, unknown> {
  label: string
  description: string
  goals: string
  conflict: string
  notes: string
  characters: string[]
  themes: string[]
  color: string
  elementType: StoryElementType
}

// Story node type
type StoryNode = Node<StoryNodeData>

// Node type configurations
const nodeConfigs = {
  act: {
    color: "bg-blue-500",
    icon: <Layers className="h-4 w-4" />,
    label: "Act",
    description: "Major story divisions",
  },
  chapter: {
    color: "bg-green-500",
    icon: <Square className="h-4 w-4" />,
    label: "Chapter",
    description: "Narrative divisions with scenes",
  },
  scene: {
    color: "bg-yellow-500",
    icon: <Circle className="h-4 w-4" />,
    label: "Scene",
    description: "Individual dramatic units",
  },
  beat: {
    color: "bg-purple-500",
    icon: <Triangle className="h-4 w-4" />,
    label: "Beat",
    description: "Smallest story moments",
  },
  "plot-point": {
    color: "bg-red-500",
    icon: <Target className="h-4 w-4" />,
    label: "Plot Point",
    description: "Key story turning points",
  },
}

// Custom Story Node Component
function StoryNode({ data, selected }: NodeProps<StoryNode>) {
  const config = nodeConfigs[data.elementType]

  return (
    <div
      className={`min-w-[200px] rounded-lg border-2 bg-background shadow-lg transition-all ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-border"
      }`}
    >
      {/* Node Header */}
      <div className={`flex items-center gap-2 rounded-t-lg p-3 text-white ${config.color}`}>
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="flex-1 font-medium text-sm">{data.label}</div>
        <Badge className="text-xs" variant="secondary">
          {config.label}
        </Badge>
      </div>

      {/* Node Content */}
      <div className="p-3">
        {data.description && (
          <p className="text-muted-foreground text-sm leading-relaxed">{data.description}</p>
        )}
        {(data.goals || data.conflict) && (
          <div className="space-y-1">
            {data.goals && (
              <div className="text-xs">
                <span className="font-medium">Goal:</span> {data.goals}
              </div>
            )}
            {data.conflict && (
              <div className="text-xs">
                <span className="font-medium">Conflict:</span> {data.conflict}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle
        className="h-3 w-3 border-2 border-white bg-gray-400"
        position={Position.Top}
        type="target"
      />
      <Handle
        className="h-3 w-3 border-2 border-white bg-gray-400"
        position={Position.Bottom}
        type="source"
      />
    </div>
  )
}

// Node types configuration
const nodeTypes = {
  storyNode: StoryNode,
}

// Initial nodes
const initialNodes: StoryNode[] = [
  {
    id: "1",
    type: "storyNode",
    position: { x: 300, y: 100 },
    data: {
      label: "Act I: Setup",
      description: "Introduce the protagonist and their world",
      goals: "Establish the main character and their normal world",
      conflict: "The inciting incident that disrupts the status quo",
      notes: "",
      characters: [],
      themes: [],
      color: "bg-blue-500",
      elementType: "act",
    },
  },
  {
    id: "2",
    type: "storyNode",
    position: { x: 300, y: 300 },
    data: {
      label: "Opening Scene",
      description: "The story begins",
      goals: "Hook the reader and establish tone",
      conflict: "",
      notes: "",
      characters: [],
      themes: [],
      color: "bg-yellow-500",
      elementType: "scene",
    },
  },
]

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    type: "smoothstep",
    animated: true,
  },
]

// Main Canvas Component
function StoryCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null)
  const [isDetailPaneOpen, setIsDetailPaneOpen] = useState(false)
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow()

  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  )

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: StoryNode) => {
    setSelectedNode(node)
    setIsDetailPaneOpen(true)
  }, [])

  // Create new story element
  const createStoryElement = useCallback(
    (elementType: StoryElementType) => {
      const config = nodeConfigs[elementType]
      const position = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })

      const newNode: StoryNode = {
        id: `${elementType}-${Date.now()}`,
        type: "storyNode",
        position,
        data: {
          label: `New ${config.label}`,
          description: "",
          goals: "",
          conflict: "",
          notes: "",
          characters: [],
          themes: [],
          color: config.color,
          elementType,
        },
      }

      setNodes((nds) => [...nds, newNode])
      setSelectedNode(newNode)
      setIsDetailPaneOpen(true)
    },
    [screenToFlowPosition, setNodes]
  )

  // Update selected node
  const updateSelectedNode = useCallback(
    (updates: Partial<StoryNodeData>) => {
      if (!selectedNode) {
        return
      }

      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id ? { ...node, data: { ...node.data, ...updates } } : node
        )
      )
      setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, ...updates } } : null))
    },
    [selectedNode, setNodes]
  )

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) {
      return
    }

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id)
    )
    setSelectedNode(null)
    setIsDetailPaneOpen(false)
  }, [selectedNode, setNodes, setEdges])

  return (
    <div className="h-screen w-full">
      {/* Menubar */}
      <Menubar className="rounded-none border-b">
        <MenubarMenu>
          <MenubarTrigger>Elements</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => createStoryElement("act")}>
              <Layers className="mr-2 h-4 w-4" />
              New Act <MenubarShortcut>⌘1</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => createStoryElement("chapter")}>
              <Square className="mr-2 h-4 w-4" />
              New Chapter <MenubarShortcut>⌘2</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => createStoryElement("scene")}>
              <Circle className="mr-2 h-4 w-4" />
              New Scene <MenubarShortcut>⌘3</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => createStoryElement("beat")}>
              <Triangle className="mr-2 h-4 w-4" />
              New Beat <MenubarShortcut>⌘4</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => createStoryElement("plot-point")}>
              <Target className="mr-2 h-4 w-4" />
              New Plot Point <MenubarShortcut>⌘P</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => zoomIn()}>
              <ZoomIn className="mr-2 h-4 w-4" />
              Zoom In <MenubarShortcut>⌘+</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => zoomOut()}>
              <ZoomOut className="mr-2 h-4 w-4" />
              Zoom Out <MenubarShortcut>⌘-</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => fitView()}>
              <FileText className="mr-2 h-4 w-4" />
              Fit View <MenubarShortcut>⌘0</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled>
              <Undo2 className="mr-2 h-4 w-4" />
              Undo <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem disabled>
              <Redo2 className="mr-2 h-4 w-4" />
              Redo <MenubarShortcut>⌘⇧Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem disabled={!selectedNode} onClick={deleteSelectedNode}>
              Delete Selected <MenubarShortcut>⌫</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {/* React Flow Canvas */}
      <div className="h-[calc(100vh-40px)]">
        <ReactFlow
          defaultEdgeOptions={{
            animated: true,
            type: "smoothstep",
          }}
          edges={edges}
          fitView
          nodes={nodes}
          nodeTypes={nodeTypes}
          onConnect={onConnect}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodesChange={onNodesChange}
          snapGrid={[20, 20]}
          snapToGrid
        >
          <Controls position="bottom-right" />
          <Background gap={20} size={1} variant={BackgroundVariant.Dots} />

          {/* Info Panel */}
          <Panel
            className="rounded-lg bg-background/80 p-3 text-sm backdrop-blur-sm"
            position="top-right"
          >
            <div className="space-y-1 text-muted-foreground">
              <div>Elements: {nodes.length}</div>
              <div>Connections: {edges.length}</div>
              <div>Selected: {selectedNode?.data.label || "None"}</div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Detail Pane */}
      <Sheet onOpenChange={setIsDetailPaneOpen} open={isDetailPaneOpen}>
        <SheetContent className="w-[450px] sm:w-[600px]">
          {selectedNode && (
            <>
              <SheetHeader className="px-2 pb-4">
                <SheetTitle className="flex items-center gap-3 text-xl">
                  <div className={`rounded-lg p-2 text-white ${selectedNode.data.color}`}>
                    {nodeConfigs[selectedNode.data.elementType].icon}
                  </div>
                  Edit {nodeConfigs[selectedNode.data.elementType].label}
                </SheetTitle>
                <SheetDescription className="text-base">
                  Configure the details for this story element
                </SheetDescription>
              </SheetHeader>

              <div className="px-2">
                <Tabs className="w-full" defaultValue="overview">
                  <TabsList className="grid h-12 w-full grid-cols-3">
                    <TabsTrigger className="text-sm" value="overview">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger className="text-sm" value="story">
                      Story
                    </TabsTrigger>
                    <TabsTrigger className="text-sm" value="connections">
                      Links
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent className="space-y-5 px-1" value="overview">
                    <div className="space-y-2">
                      <Label className="font-medium text-sm" htmlFor="title">
                        Title
                      </Label>
                      <Input
                        className="h-11"
                        id="title"
                        onChange={(e) => updateSelectedNode({ label: e.target.value })}
                        value={selectedNode.data.label}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-sm" htmlFor="description">
                        Description
                      </Label>
                      <Textarea
                        className="min-h-[90px] resize-none"
                        id="description"
                        onChange={(e) => updateSelectedNode({ description: e.target.value })}
                        placeholder="Describe this story element..."
                        rows={3}
                        value={selectedNode.data.description}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-sm" htmlFor="color">
                        Color Theme
                      </Label>
                      <Select
                        onValueChange={(color) => updateSelectedNode({ color })}
                        value={selectedNode.data.color}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bg-blue-500">💙 Blue</SelectItem>
                          <SelectItem value="bg-green-500">💚 Green</SelectItem>
                          <SelectItem value="bg-yellow-500">💛 Yellow</SelectItem>
                          <SelectItem value="bg-purple-500">💜 Purple</SelectItem>
                          <SelectItem value="bg-red-500">❤️ Red</SelectItem>
                          <SelectItem value="bg-pink-500">💖 Pink</SelectItem>
                          <SelectItem value="bg-indigo-500">💙 Indigo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent className="space-y-5 px-1" value="story">
                    <div className="space-y-2">
                      <Label className="font-medium text-sm" htmlFor="goals">
                        Goals
                      </Label>
                      <Textarea
                        className="min-h-[80px] resize-none"
                        id="goals"
                        onChange={(e) => updateSelectedNode({ goals: e.target.value })}
                        placeholder="What does the character want to achieve in this part?"
                        rows={3}
                        value={selectedNode.data.goals}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-sm" htmlFor="conflict">
                        Conflict
                      </Label>
                      <Textarea
                        className="min-h-[80px] resize-none"
                        id="conflict"
                        onChange={(e) => updateSelectedNode({ conflict: e.target.value })}
                        placeholder="What obstacles, challenges, or tensions arise?"
                        rows={3}
                        value={selectedNode.data.conflict}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-sm" htmlFor="notes">
                        Notes & Ideas
                      </Label>
                      <Textarea
                        className="min-h-[100px] resize-none"
                        id="notes"
                        onChange={(e) => updateSelectedNode({ notes: e.target.value })}
                        placeholder="Additional notes, inspiration, and creative ideas..."
                        rows={4}
                        value={selectedNode.data.notes}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent className="space-y-5 px-1" value="connections">
                    <div className="space-y-2">
                      <Label className="font-medium text-sm">Connected Characters</Label>
                      <div className="rounded-lg border bg-muted/20 p-3 text-muted-foreground text-sm">
                        Character connections will be available soon. You'll be able to link
                        characters to specific story elements.
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-sm">Related Themes</Label>
                      <div className="rounded-lg border bg-muted/20 p-3 text-muted-foreground text-sm">
                        Theme connections will be available soon. Track how themes develop across
                        your story structure.
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-sm">Story Flow</Label>
                      <div className="rounded-lg border bg-background p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
                            {
                              edges.filter(
                                (e) => e.source === selectedNode.id || e.target === selectedNode.id
                              ).length
                            }
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {edges.filter(
                                (e) => e.source === selectedNode.id || e.target === selectedNode.id
                              ).length === 1
                                ? "Connection"
                                : "Connections"}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              Links to other story elements
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="border-t px-2 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Danger Zone</h4>
                    <p className="mt-1 text-muted-foreground text-xs">
                      This action cannot be undone
                    </p>
                  </div>
                  <ConfirmDialog
                    confirmText="Delete"
                    description={`Are you sure you want to delete "${selectedNode.data.label}"? This will permanently remove the story element and all its connections. This action cannot be undone.`}
                    onConfirm={deleteSelectedNode}
                    title="Delete Story Element"
                    variant="destructive"
                  >
                    <Button size="sm" variant="destructive">
                      Delete Element
                    </Button>
                  </ConfirmDialog>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Main component with React Flow Provider
function StoryCanvasPage() {
  return (
    <ReactFlowProvider>
      <StoryCanvas />
    </ReactFlowProvider>
  )
}
