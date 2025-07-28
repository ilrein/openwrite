/**
 * Graph API client
 *
 * This module handles all graph-related API operations
 * for the unified story graph system.
 */

import { type ApiClient, apiCall } from "./base"

// Graph Node Types
export type GraphNodeType = "story_element" | "character" | "location" | "lore" | "plot_thread"
export type StoryElementType = "act" | "chapter" | "scene" | "beat" | "plot_point"
export type ConnectionType =
  | "story_flow"
  | "character_arc"
  | "setting"
  | "plot_thread"
  | "thematic"
  | "reference"

export interface GraphNode {
  id: string
  projectId: string
  nodeType: GraphNodeType
  subType?: string // For story_element: act|chapter|scene|beat|plot_point
  title: string
  description?: string
  positionX: number
  positionY: number
  visualProperties?: string // JSON string for {color, size, icon, shape}
  metadata?: string // JSON string for flexible data
  wordCount: number
  createdAt: Date
  updatedAt: Date
}

export interface TextBlock {
  id: string
  storyNodeId: string
  content?: string
  orderIndex: number
  wordCount: number
  createdAt: Date
  updatedAt: Date
}

export interface GraphConnection {
  id: string
  projectId: string
  sourceNodeId: string
  targetNodeId: string
  connectionType: ConnectionType
  connectionStrength: number
  visualProperties?: string // JSON string for line styling
  metadata?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateGraphNodeData {
  nodeType: GraphNodeType
  subType?: string
  title: string
  description?: string
  positionX?: number
  positionY?: number
  visualProperties?: string
  metadata?: string
}

export interface UpdateGraphNodeData extends Partial<CreateGraphNodeData> {}

export interface CreateTextBlockData {
  storyNodeId: string
  content?: string
  orderIndex?: number
}

export interface UpdateTextBlockData extends Partial<CreateTextBlockData> {}

export interface CreateGraphConnectionData {
  sourceNodeId: string
  targetNodeId: string
  connectionType: ConnectionType
  connectionStrength?: number
  visualProperties?: string
  metadata?: string
}

export interface UpdateGraphConnectionData extends Partial<CreateGraphConnectionData> {}

/**
 * Graph Node API client factory
 * Creates a graph node API client for a specific project
 */
export const createGraphNodeApi = (
  projectId: string
): Required<ApiClient<GraphNode, CreateGraphNodeData, UpdateGraphNodeData>> => ({
  async list(): Promise<GraphNode[]> {
    const response = await apiCall(`/api/projects/${projectId}/graph/nodes`)
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format from graph nodes API")
    }
    return Array.isArray(response.nodes) ? response.nodes : []
  },

  async get(id: string): Promise<GraphNode> {
    const response = await apiCall(`/api/projects/${projectId}/graph/nodes/${id}`)
    if (!response?.node) {
      throw new Error(`Graph node with id ${id} not found in response`)
    }
    return response.node
  },

  async create(data: CreateGraphNodeData): Promise<GraphNode | { success: boolean; id: string }> {
    return await apiCall(`/api/projects/${projectId}/graph/nodes`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: UpdateGraphNodeData): Promise<{ success: boolean }> {
    return await apiCall(`/api/projects/${projectId}/graph/nodes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<{ success: boolean }> {
    return await apiCall(`/api/projects/${projectId}/graph/nodes/${id}`, {
      method: "DELETE",
    })
  },
})

/**
 * Text Block API client factory
 * Creates a text block API client for story nodes
 */
export const createTextBlockApi = (projectId: string) => ({
  async list(storyNodeId: string): Promise<TextBlock[]> {
    const response = await apiCall(
      `/api/projects/${projectId}/graph/nodes/${storyNodeId}/text-blocks`
    )
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format from text blocks API")
    }
    return Array.isArray(response.textBlocks) ? response.textBlocks : []
  },

  get(_id: string): Promise<TextBlock> {
    // Note: Individual text block GET would need to be implemented in backend
    throw new Error("Individual text block GET not implemented yet")
  },

  async create(data: CreateTextBlockData): Promise<TextBlock | { success: boolean; id: string }> {
    return await apiCall(`/api/projects/${projectId}/graph/nodes/${data.storyNodeId}/text-blocks`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  update(_id: string, _data: UpdateTextBlockData): Promise<{ success: boolean }> {
    // Note: Text block update would need to be implemented in backend
    throw new Error("Text block update not implemented yet")
  },

  delete(_id: string): Promise<{ success: boolean }> {
    // Note: Text block delete would need to be implemented in backend
    throw new Error("Text block delete not implemented yet")
  },
})

/**
 * Graph Connection API client factory
 * Creates a graph connection API client for a specific project
 */
export const createGraphConnectionApi = (
  projectId: string
): Required<ApiClient<GraphConnection, CreateGraphConnectionData, UpdateGraphConnectionData>> => ({
  async list(): Promise<GraphConnection[]> {
    const response = await apiCall(`/api/projects/${projectId}/graph/connections`)
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format from graph connections API")
    }
    return Array.isArray(response.connections) ? response.connections : []
  },

  async get(id: string): Promise<GraphConnection> {
    const response = await apiCall(`/api/projects/${projectId}/graph/connections/${id}`)
    if (!response?.connection) {
      throw new Error(`Graph connection with id ${id} not found in response`)
    }
    return response.connection
  },

  async create(
    data: CreateGraphConnectionData
  ): Promise<GraphConnection | { success: boolean; id: string }> {
    return await apiCall(`/api/projects/${projectId}/graph/connections`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: UpdateGraphConnectionData): Promise<{ success: boolean }> {
    return await apiCall(`/api/projects/${projectId}/graph/connections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<{ success: boolean }> {
    return await apiCall(`/api/projects/${projectId}/graph/connections/${id}`, {
      method: "DELETE",
    })
  },
})

/**
 * Combined Graph API
 * Provides convenient access to all graph operations
 */
export const graphApi = {
  // Create API clients for a specific project
  nodes: (projectId: string) => createGraphNodeApi(projectId),
  textBlocks: (projectId: string) => createTextBlockApi(projectId),
  connections: (projectId: string) => createGraphConnectionApi(projectId),

  // Convenience methods that require projectId
  listNodes: (projectId: string) => createGraphNodeApi(projectId).list(),
  createNode: (projectId: string, data: CreateGraphNodeData) =>
    createGraphNodeApi(projectId).create(data),
  updateNode: (projectId: string, nodeId: string, data: UpdateGraphNodeData) => {
    return createGraphNodeApi(projectId).update(nodeId, data)
  },
  updateNodePosition: async (
    projectId: string,
    nodeId: string,
    positionX: number,
    positionY: number
  ) => {
    return await apiCall(`/api/projects/${projectId}/graph/nodes/${nodeId}/position`, {
      method: "PUT",
      body: JSON.stringify({ positionX, positionY }),
    })
  },
  deleteNode: (projectId: string, nodeId: string) => {
    return createGraphNodeApi(projectId).delete(nodeId)
  },

  listConnections: (projectId: string) => {
    return createGraphConnectionApi(projectId).list()
  },
  createConnection: (projectId: string, data: CreateGraphConnectionData) => {
    return createGraphConnectionApi(projectId).create(data)
  },
  deleteConnection: (projectId: string, connectionId: string) => {
    return createGraphConnectionApi(projectId).delete(connectionId)
  },

  listTextBlocks: (projectId: string, storyNodeId: string) => {
    return createTextBlockApi(projectId).list(storyNodeId)
  },
  createTextBlock: (projectId: string, data: CreateTextBlockData) => {
    return createTextBlockApi(projectId).create(data)
  },

  // Utility functions for working with graph data
  parseVisualProperties: (visualProps?: string) => {
    if (!visualProps) {
      return {}
    }
    try {
      return JSON.parse(visualProps)
    } catch {
      return {}
    }
  },

  stringifyVisualProperties: (props: Record<string, unknown>) => {
    return JSON.stringify(props)
  },

  parseMetadata: (metadata?: string) => {
    if (!metadata) {
      return {}
    }
    try {
      return JSON.parse(metadata)
    } catch {
      return {}
    }
  },

  stringifyMetadata: (metadata: Record<string, unknown>) => {
    return JSON.stringify(metadata)
  },
}
