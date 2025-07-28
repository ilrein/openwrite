import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
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
import React, { useCallback, useMemo, useState } from "react"
import "@xyflow/react/dist/style.css"

import {
  Circle,
  Edit,
  FileText,
  Layers,
  Loader2,
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
import { api, type ConnectionType, type GraphNodeType } from "@/lib/api"

export const Route = createFileRoute("/projects/$projectId/canvas")({
  component: StoryCanvasPage,
})

// Story element types - now using our graph types
type StoryElementType = "act" | "chapter" | "scene" | "beat" | "plot-point"

// Enhanced story node data interface matching our graph system
interface StoryNodeData extends Record<string, unknown> {
  // Core graph node properties
  graphNodeId: string
  nodeType: GraphNodeType
  subType?: string
  label: string
  description: string

  // Visual properties
  color: string
  size: string
  icon: string
  shape: string

  // Story-specific fields (for backward compatibility)
  goals: string
  conflict: string
  notes: string
  characters: string[]
  themes: string[]

  // Legacy field mapping
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
function StoryNode(props: NodeProps<StoryNode> & { onEdit?: (node: StoryNode) => void }) {
  const { data, selected, id, onEdit } = props
  const config = nodeConfigs[data.elementType]

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit({
        id,
        type: "storyNode",
        position: { x: 0, y: 0 },
        data,
      } as StoryNode)
    }
  }

  return (
    <div
      className={`min-w-[200px] rounded-lg border-2 bg-background shadow-lg transition-all ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-border"
      }`}
    >
      {/* Node Header */}
      <div className={`flex items-center gap-2 rounded-t-lg p-3 text-white ${config.color}`}>
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="min-w-0 flex-1 truncate font-medium text-sm">{data.label}</div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Badge className="text-xs" variant="secondary">
            {config.label}
          </Badge>
          <Button
            className="h-6 w-6 p-0 hover:bg-white/20"
            onClick={handleEdit}
            size="sm"
            variant="ghost"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
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

// This will be moved inside the component to access state

// Initial nodes and edges - now empty, will be loaded dynamically
const initialNodes: StoryNode[] = []

const initialEdges: Edge[] = []

// Main Canvas Component
function StoryCanvas() {
  const { projectId } = Route.useParams()
  const queryClient = useQueryClient()

  // Load graph data from API
  const { data: graphNodes = [] } = useQuery({
    queryKey: ["graph-nodes", projectId],
    queryFn: async () => {
      return await api.graph.listNodes(projectId)
    },
  })

  const { data: graphConnections = [] } = useQuery({
    queryKey: ["graph-connections", projectId],
    queryFn: async () => {
      return await api.graph.listConnections(projectId)
    },
  })

  // Convert graph nodes to ReactFlow nodes (memoized to prevent infinite loops)
  const flowNodes = useMemo(() => {
    return graphNodes.map((node) => {
      const visualProps = api.graph.parseVisualProperties(node.visualProperties)
      return {
        id: node.id,
        type: "storyNode",
        position: { x: node.positionX, y: node.positionY },
        data: {
          graphNodeId: node.id,
          nodeType: node.nodeType,
          subType: node.subType,
          label: node.title,
          description: node.description || "",
          color: visualProps.color || "bg-blue-500",
          size: visualProps.size || "medium",
          icon: visualProps.icon || "📝",
          shape: visualProps.shape || "rectangle",
          goals: "", // These could come from metadata
          conflict: "",
          notes: "",
          characters: [],
          themes: [],
          elementType: (node.subType as StoryElementType) || "scene",
        },
      }
    })
  }, [graphNodes])

  // Convert graph connections to ReactFlow edges (memoized to prevent infinite loops)
  const flowEdges = useMemo(() => {
    return graphConnections.map((conn) => ({
      id: conn.id,
      source: conn.sourceNodeId,
      target: conn.targetNodeId,
      type: "smoothstep",
      animated: true,
    }))
  }, [graphConnections])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null)
  const [isDetailPaneOpen, setIsDetailPaneOpen] = useState(false)
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow()

  // Handle node edit functionality
  const handleNodeEdit = useCallback((node: StoryNode) => {
    setSelectedNode(node)
    setIsDetailPaneOpen(true)
  }, [])

  // Create StoryNode wrapper with edit functionality
  const StoryNodeWithEdit = useCallback(
    (props: NodeProps<StoryNode>) => <StoryNode {...props} onEdit={handleNodeEdit} />,
    [handleNodeEdit]
  )

  // Node types configuration
  const nodeTypes = useMemo(
    () => ({
      storyNode: StoryNodeWithEdit,
    }),
    [StoryNodeWithEdit]
  )

  // Update nodes and edges when graph data loads (safe one-time update)
  React.useEffect(() => {
    if (graphNodes.length > 0) {
      setNodes(flowNodes) // Using the converted flow nodes
    }
  }, [graphNodes.length, flowNodes, setNodes])

  React.useEffect(() => {
    if (graphConnections.length > 0) {
      setEdges(flowEdges)
    }
  }, [graphConnections.length, flowEdges, setEdges])

  // Handle node selection (sidebar only opens via edit button)
  const onNodeClick = useCallback((_: React.MouseEvent, node: StoryNode) => {
    setSelectedNode(node)
  }, [])

  // Update node position mutation
  const updateNodePositionMutation = useMutation({
    mutationFn: async ({
      nodeId,
      positionX,
      positionY,
    }: {
      nodeId: string
      positionX: number
      positionY: number
    }) => {
      return await api.graph.updateNodePosition(projectId, nodeId, positionX, positionY)
    },
    onError: (_error: Error) => {
      // Position update failed - could show user notification here
    },
  })

  // Create connection mutation
  const createConnectionMutation = useMutation({
    mutationFn: async (params: {
      sourceNodeId: string
      targetNodeId: string
      connectionType?: ConnectionType
    }) => {
      return await api.graph.createConnection(projectId, {
        sourceNodeId: params.sourceNodeId,
        targetNodeId: params.targetNodeId,
        connectionType: params.connectionType || "story_flow",
        connectionStrength: 1,
        metadata: api.graph.stringifyMetadata({}),
      })
    },
    onSuccess: () => {
      // Refresh connections data after creation
      queryClient.invalidateQueries({ queryKey: ["graph-connections", projectId] })
    },
    onError: (_error: Error) => {
      // Connection creation failed - could show user notification here
    },
  })

  // Delete connection mutation
  const deleteConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      return await api.graph.deleteConnection(projectId, connectionId)
    },
    onSuccess: () => {
      // Refresh connections data after deletion
      queryClient.invalidateQueries({ queryKey: ["graph-connections", projectId] })
    },
    onError: (_error: Error) => {
      // Connection deletion failed - could show user notification here
    },
  })

  // Handle edge connections - persist to database
  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        // Extract graph node IDs from React Flow node IDs
        const sourceNode = nodes.find((n) => n.id === params.source)
        const targetNode = nodes.find((n) => n.id === params.target)

        if (sourceNode?.data.graphNodeId && targetNode?.data.graphNodeId) {
          createConnectionMutation.mutate({
            sourceNodeId: sourceNode.data.graphNodeId,
            targetNodeId: targetNode.data.graphNodeId,
          })
        }
      }
    },
    [createConnectionMutation, nodes]
  )

  // Handle edge deletion - remove from database
  const onEdgesDelete = useCallback(
    (edgesToDelete: { id: string }[]) => {
      for (const edge of edgesToDelete) {
        // Find the corresponding graph connection by React Flow edge ID
        const connection = graphConnections.find((conn) => conn.id === edge.id)
        if (connection) {
          deleteConnectionMutation.mutate(connection.id)
        }
      }
    },
    [deleteConnectionMutation, graphConnections]
  )

  // Handle node drag stop - update position in database
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: StoryNode) => {
      // Extract the actual graph node ID from the React Flow node
      const graphNodeId = node.data.graphNodeId
      if (graphNodeId) {
        updateNodePositionMutation.mutate({
          nodeId: graphNodeId,
          positionX: Math.round(node.position.x),
          positionY: Math.round(node.position.y),
        })
      }
    },
    [updateNodePositionMutation]
  )

  // Track node creation state
  const [isCreatingNode, setIsCreatingNode] = React.useState(false)

  // Utility functions for graph node creation
  const getNodeConfig = useCallback((type: GraphNodeType, subType?: string) => {
    // Use existing nodeConfigs for story elements
    if (type === "story_element" && subType && nodeConfigs[subType as keyof typeof nodeConfigs]) {
      return {
        color: nodeConfigs[subType as keyof typeof nodeConfigs].color,
        icon:
          typeof nodeConfigs[subType as keyof typeof nodeConfigs].icon === "string"
            ? nodeConfigs[subType as keyof typeof nodeConfigs].icon
            : "📄", // fallback for JSX icons
        label: nodeConfigs[subType as keyof typeof nodeConfigs].label,
        shape: "rectangle",
      }
    }

    // Default configs for other node types
    const defaultConfigs: Record<
      string,
      { color: string; icon: string; label: string; shape: string }
    > = {
      character: { color: "bg-blue-500", icon: "👤", label: "Character", shape: "circle" },
      location: { color: "bg-green-500", icon: "🏰", label: "Location", shape: "rectangle" },
      lore: { color: "bg-purple-500", icon: "📜", label: "Lore", shape: "circle" },
      plot_thread: { color: "bg-red-500", icon: "🎯", label: "Plot Thread", shape: "diamond" },
    }

    return (
      defaultConfigs[type] || {
        color: "bg-gray-500",
        icon: "⭐",
        label: "Node",
        shape: "rectangle",
      }
    )
  }, [])

  const getNodeTitle = useCallback(
    (nodeType: GraphNodeType, config: ReturnType<typeof getNodeConfig>) => {
      if (nodeType === "character") {
        return "Select Character"
      }
      return `New ${config.label}`
    },
    []
  )

  const getNodeDescription = useCallback((nodeType: GraphNodeType) => {
    if (nodeType === "character") {
      return "Choose an existing character to place in your story"
    }
    return ""
  }, [])

  const getNodeMetadata = useCallback((nodeType: GraphNodeType) => {
    if (nodeType === "character") {
      // Character nodes store which existing character they represent
      return api.graph.stringifyMetadata({
        linkedCharacterId: null, // Will be set when user selects a character
        isPlaceholder: true, // Indicates this node needs character selection
      })
    }
  }, [])

  const getNodeVisualProperties = useCallback((config: ReturnType<typeof getNodeConfig>) => {
    return api.graph.stringifyVisualProperties({
      color: config.color,
      size: "medium",
      icon: config.icon,
      shape: config.shape,
    })
  }, [])

  const handleNodeCreationError = useCallback((error: unknown, nodeType: GraphNodeType) => {
    // biome-ignore lint/suspicious/noConsole: User specifically requested console.error for error handling
    console.error(`Failed to create ${nodeType} node:`, error)

    // In a real app, you'd show a toast notification here
    // For now, we'll use console.error as requested
    // biome-ignore lint/suspicious/noConsole: User specifically requested console.error for error handling
    console.error(`Could not create ${nodeType} node. Please try again.`)
  }, [])

  const waitForQueryInvalidation = useCallback(
    (client: ReturnType<typeof useQueryClient>, queryKey: string[]): Promise<void> => {
      return client.invalidateQueries({ queryKey })
    },
    []
  )

  // Create new graph node (supports all types!)
  const createGraphNode = useCallback(
    async (nodeType: GraphNodeType, subType?: string) => {
      const position = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })

      const config = getNodeConfig(nodeType, subType)

      try {
        setIsCreatingNode(true)

        // Create via API
        const result = await api.graph.createNode(projectId, {
          nodeType,
          subType,
          title: getNodeTitle(nodeType, config),
          description: getNodeDescription(nodeType),
          positionX: position.x,
          positionY: position.y,
          visualProperties: getNodeVisualProperties(config),
          metadata: getNodeMetadata(nodeType),
        })

        if (result && "id" in result) {
          // Wait for query invalidation to complete
          await waitForQueryInvalidation(queryClient, ["graph-nodes", projectId])

          // Find and select the new node after invalidation
          const newNode = nodes.find((n) => n.id === result.id)
          if (newNode) {
            setSelectedNode(newNode)
            setIsDetailPaneOpen(true)
          }
        }
      } catch (error) {
        handleNodeCreationError(error, nodeType)
      } finally {
        setIsCreatingNode(false)
      }
    },
    [
      screenToFlowPosition,
      projectId,
      queryClient,
      nodes,
      getNodeConfig,
      getNodeTitle,
      getNodeDescription,
      getNodeMetadata,
      getNodeVisualProperties,
      handleNodeCreationError,
      waitForQueryInvalidation,
    ]
  )

  // Track loading state for all graph operations
  const isGraphOperationPending = React.useMemo(() => {
    return (
      updateNodePositionMutation.isPending ||
      createConnectionMutation.isPending ||
      deleteConnectionMutation.isPending ||
      isCreatingNode
    )
  }, [
    updateNodePositionMutation.isPending,
    createConnectionMutation.isPending,
    deleteConnectionMutation.isPending,
    isCreatingNode,
  ])

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
            <MenubarItem onClick={() => createGraphNode("story_element", "act")}>
              <Layers className="mr-2 h-4 w-4" />
              New Act <MenubarShortcut>⌘1</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => createGraphNode("story_element", "chapter")}>
              <Square className="mr-2 h-4 w-4" />
              New Chapter <MenubarShortcut>⌘2</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => createGraphNode("story_element", "scene")}>
              <Circle className="mr-2 h-4 w-4" />
              New Scene <MenubarShortcut>⌘3</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => createGraphNode("story_element", "beat")}>
              <Triangle className="mr-2 h-4 w-4" />
              New Beat <MenubarShortcut>⌘4</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => createGraphNode("story_element", "plot-point")}>
              <Target className="mr-2 h-4 w-4" />
              New Plot Point <MenubarShortcut>⌘P</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => createGraphNode("character")}>
              <Circle className="mr-2 h-4 w-4" />
              New Character <MenubarShortcut>⌘C</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => createGraphNode("location")}>
              <Square className="mr-2 h-4 w-4" />
              New Location <MenubarShortcut>⌘L</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => createGraphNode("lore")}>
              <FileText className="mr-2 h-4 w-4" />
              New Lore <MenubarShortcut>⌘R</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => createGraphNode("plot_thread")}>
              <Target className="mr-2 h-4 w-4" />
              New Plot Thread <MenubarShortcut>⌘T</MenubarShortcut>
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

        {/* Loading indicator */}
        {isGraphOperationPending && (
          <div className="ml-auto flex items-center px-4">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          </div>
        )}
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
          onEdgesDelete={onEdgesDelete}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
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
