import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createGraphNodeApi,
  createTextBlockApi,
  createGraphConnectionApi,
  graphApi,
  type GraphNode,
  type TextBlock,
  type GraphConnection,
  type CreateGraphNodeData,
  type UpdateGraphNodeData,
  type CreateTextBlockData,
  type UpdateTextBlockData,
  type CreateGraphConnectionData,
  type UpdateGraphConnectionData,
  type GraphNodeType,
  type StoryElementType,
  type ConnectionType
} from '../api/graph'
import { apiCall } from '../api/base'

// Mock the base API module
vi.mock('../api/base', () => ({
  apiCall: vi.fn()
}))

describe('Graph API Module', () => {
  const mockProjectId = 'test-project-123'
  const mockApiCall = vi.mocked(apiCall)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Type Definitions', () => {
    it('should define correct GraphNodeType values', () => {
      const validNodeTypes: GraphNodeType[] = [
        'story_element',
        'character',
        'location',
        'lore',
        'plot_thread'
      ]
      validNodeTypes.forEach(type => {
        expect(typeof type).toBe('string')
      })
    })

    it('should define correct StoryElementType values', () => {
      const validStoryTypes: StoryElementType[] = [
        'act',
        'chapter',
        'scene',
        'beat',
        'plot_point'
      ]
      validStoryTypes.forEach(type => {
        expect(typeof type).toBe('string')
      })
    })

    it('should define correct ConnectionType values', () => {
      const validConnectionTypes: ConnectionType[] = [
        'story_flow',
        'character_arc',
        'setting',
        'plot_thread',
        'thematic',
        'reference'
      ]
      validConnectionTypes.forEach(type => {
        expect(typeof type).toBe('string')
      })
    })
  })

  describe('GraphNode Interface', () => {
    it('should validate GraphNode structure', () => {
      const mockNode: GraphNode = {
        id: 'node-123',
        projectId: 'project-456',
        nodeType: 'story_element',
        subType: 'chapter',
        title: 'Chapter 1: The Beginning',
        description: 'The story starts here',
        positionX: 100,
        positionY: 200,
        visualProperties: '{"color": "blue", "size": "large"}',
        metadata: '{"tags": ["important", "beginning"]}',
        wordCount: 1500,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      }

      expect(mockNode.id).toBe('node-123')
      expect(mockNode.nodeType).toBe('story_element')
      expect(mockNode.subType).toBe('chapter')
      expect(mockNode.wordCount).toBe(1500)
      expect(mockNode.createdAt).toBeInstanceOf(Date)
    })

    it('should handle optional GraphNode properties', () => {
      const minimalNode: GraphNode = {
        id: 'minimal-node',
        projectId: 'project-123',
        nodeType: 'character',
        title: 'John Doe',
        positionX: 0,
        positionY: 0,
        wordCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(minimalNode.description).toBeUndefined()
      expect(minimalNode.subType).toBeUndefined()
      expect(minimalNode.visualProperties).toBeUndefined()
      expect(minimalNode.metadata).toBeUndefined()
    })
  })

  describe('TextBlock Interface', () => {
    it('should validate TextBlock structure', () => {
      const mockTextBlock: TextBlock = {
        id: 'text-123',
        storyNodeId: 'node-456',
        content: 'This is the opening paragraph of the chapter.',
        orderIndex: 1,
        wordCount: 10,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      }

      expect(mockTextBlock.id).toBe('text-123')
      expect(mockTextBlock.storyNodeId).toBe('node-456')
      expect(mockTextBlock.content).toBe('This is the opening paragraph of the chapter.')
      expect(mockTextBlock.orderIndex).toBe(1)
      expect(mockTextBlock.wordCount).toBe(10)
    })

    it('should handle optional TextBlock content', () => {
      const emptyTextBlock: TextBlock = {
        id: 'empty-text',
        storyNodeId: 'node-123',
        orderIndex: 0,
        wordCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(emptyTextBlock.content).toBeUndefined()
    })
  })

  describe('GraphConnection Interface', () => {
    it('should validate GraphConnection structure', () => {
      const mockConnection: GraphConnection = {
        id: 'connection-789',
        projectId: 'project-123',
        sourceNodeId: 'node-source',
        targetNodeId: 'node-target',
        connectionType: 'story_flow',
        connectionStrength: 0.8,
        visualProperties: '{"style": "dashed", "color": "red"}',
        metadata: '{"notes": "Important transition"}',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      }

      expect(mockConnection.id).toBe('connection-789')
      expect(mockConnection.connectionType).toBe('story_flow')
      expect(mockConnection.connectionStrength).toBe(0.8)
      expect(mockConnection.sourceNodeId).toBe('node-source')
      expect(mockConnection.targetNodeId).toBe('node-target')
    })

    it('should handle different connection types', () => {
      const connectionTypes: ConnectionType[] = [
        'story_flow',
        'character_arc',
        'setting',
        'plot_thread',
        'thematic',
        'reference'
      ]

      connectionTypes.forEach(type => {
        const connection: Partial<GraphConnection> = {
          connectionType: type,
          connectionStrength: 1.0
        }
        expect(connection.connectionType).toBe(type)
      })
    })
  })

  describe('createGraphNodeApi', () => {
    let nodeApi: ReturnType<typeof createGraphNodeApi>

    beforeEach(() => {
      nodeApi = createGraphNodeApi(mockProjectId)
    })

    describe('list()', () => {
      it('should fetch all nodes for a project', async () => {
        const mockNodes: GraphNode[] = [
          {
            id: 'node-1',
            projectId: mockProjectId,
            nodeType: 'story_element',
            title: 'Chapter 1',
            positionX: 100,
            positionY: 200,
            wordCount: 1000,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]

        mockApiCall.mockResolvedValue({ nodes: mockNodes })

        const result = await nodeApi.list()

        expect(mockApiCall).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/graph/nodes`)
        expect(result).toEqual(mockNodes)
      })

      it('should return empty array when no nodes found', async () => {
        mockApiCall.mockResolvedValue({ nodes: [] })

        const result = await nodeApi.list()

        expect(result).toEqual([])
      })

      it('should handle invalid response format', async () => {
        mockApiCall.mockResolvedValue(null)

        await expect(nodeApi.list()).rejects.toThrow('Invalid response format from graph nodes API')
      })

      it('should handle non-array nodes response', async () => {
        mockApiCall.mockResolvedValue({ nodes: 'invalid' })

        const result = await nodeApi.list()

        expect(result).toEqual([])
      })
    })

    describe('get()', () => {
      it('should fetch a specific node by ID', async () => {
        const mockNode: GraphNode = {
          id: 'node-123',
          projectId: mockProjectId,
          nodeType: 'character',
          title: 'John Doe',
          positionX: 150,
          positionY: 250,
          wordCount: 500,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        mockApiCall.mockResolvedValue({ node: mockNode })

        const result = await nodeApi.get('node-123')

        expect(mockApiCall).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/graph/nodes/node-123`)
        expect(result).toEqual(mockNode)
      })

      it('should throw error when node not found', async () => {
        mockApiCall.mockResolvedValue({})

        await expect(nodeApi.get('nonexistent')).rejects.toThrow('Graph node with id nonexistent not found in response')
      })

      it('should handle null response', async () => {
        mockApiCall.mockResolvedValue(null)

        await expect(nodeApi.get('node-123')).rejects.toThrow('Graph node with id node-123 not found in response')
      })
    })

    describe('create()', () => {
      it('should create a new graph node', async () => {
        const createData: CreateGraphNodeData = {
          nodeType: 'story_element',
          subType: 'scene',
          title: 'Opening Scene',
          description: 'The story begins',
          positionX: 100,
          positionY: 200,
          visualProperties: '{"color": "green"}',
          metadata: '{"priority": "high"}'
        }

        const mockResponse = { success: true, id: 'new-node-123' }
        mockApiCall.mockResolvedValue(mockResponse)

        const result = await nodeApi.create(createData)

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/nodes`,
          {
            method: 'POST',
            body: JSON.stringify(createData)
          }
        )
        expect(result).toEqual(mockResponse)
      })

      it('should handle minimal create data', async () => {
        const minimalData: CreateGraphNodeData = {
          nodeType: 'location',
          title: 'Forest Clearing'
        }

        mockApiCall.mockResolvedValue({ success: true, id: 'location-123' })

        await nodeApi.create(minimalData)

        expect(mockApiCall).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(minimalData)
          })
        )
      })
    })

    describe('update()', () => {
      it('should update an existing node', async () => {
        const updateData: UpdateGraphNodeData = {
          title: 'Updated Title',
          description: 'Updated description',
          positionX: 300,
          positionY: 400
        }

        mockApiCall.mockResolvedValue({ success: true })

        const result = await nodeApi.update('node-123', updateData)

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/nodes/node-123`,
          {
            method: 'PUT',
            body: JSON.stringify(updateData)
          }
        )
        expect(result).toEqual({ success: true })
      })

      it('should handle partial updates', async () => {
        const partialUpdate: UpdateGraphNodeData = {
          title: 'New Title Only'
        }

        mockApiCall.mockResolvedValue({ success: true })

        await nodeApi.update('node-456', partialUpdate)

        expect(mockApiCall).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(partialUpdate)
          })
        )
      })
    })

    describe('delete()', () => {
      it('should delete a node', async () => {
        mockApiCall.mockResolvedValue({ success: true })

        const result = await nodeApi.delete('node-123')

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/nodes/node-123`,
          { method: 'DELETE' }
        )
        expect(result).toEqual({ success: true })
      })
    })
  })

  describe('createTextBlockApi', () => {
    let textBlockApi: ReturnType<typeof createTextBlockApi>

    beforeEach(() => {
      textBlockApi = createTextBlockApi(mockProjectId)
    })

    describe('list()', () => {
      it('should fetch text blocks for a story node', async () => {
        const mockTextBlocks: TextBlock[] = [
          {
            id: 'text-1',
            storyNodeId: 'story-node-123',
            content: 'First paragraph',
            orderIndex: 0,
            wordCount: 15,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]

        mockApiCall.mockResolvedValue({ textBlocks: mockTextBlocks })

        const result = await textBlockApi.list('story-node-123')

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/nodes/story-node-123/text-blocks`
        )
        expect(result).toEqual(mockTextBlocks)
      })

      it('should return empty array for invalid response', async () => {
        mockApiCall.mockResolvedValue({ textBlocks: 'invalid' })

        const result = await textBlockApi.list('story-node-123')

        expect(result).toEqual([])
      })
    })

    describe('get()', () => {
      it('should throw not implemented error', async () => {
        await expect(textBlockApi.get('text-123')).rejects.toThrow('Individual text block GET not implemented yet')
      })
    })

    describe('create()', () => {
      it('should create a new text block', async () => {
        const createData: CreateTextBlockData = {
          storyNodeId: 'story-123',
          content: 'New paragraph content',
          orderIndex: 1
        }

        mockApiCall.mockResolvedValue({ success: true, id: 'text-456' })

        const result = await textBlockApi.create(createData)

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/nodes/story-123/text-blocks`,
          {
            method: 'POST',
            body: JSON.stringify(createData)
          }
        )
        expect(result).toEqual({ success: true, id: 'text-456' })
      })
    })

    describe('update()', () => {
      it('should throw not implemented error', async () => {
        await expect(textBlockApi.update('text-123', {})).rejects.toThrow('Text block update not implemented yet')
      })
    })

    describe('delete()', () => {
      it('should throw not implemented error', async () => {
        await expect(textBlockApi.delete('text-123')).rejects.toThrow('Text block delete not implemented yet')
      })
    })
  })

  describe('createGraphConnectionApi', () => {
    let connectionApi: ReturnType<typeof createGraphConnectionApi>

    beforeEach(() => {
      connectionApi = createGraphConnectionApi(mockProjectId)
    })

    describe('list()', () => {
      it('should fetch all connections for a project', async () => {
        const mockConnections: GraphConnection[] = [
          {
            id: 'conn-1',
            projectId: mockProjectId,
            sourceNodeId: 'node-1',
            targetNodeId: 'node-2',
            connectionType: 'story_flow',
            connectionStrength: 0.9,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]

        mockApiCall.mockResolvedValue({ connections: mockConnections })

        const result = await connectionApi.list()

        expect(mockApiCall).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/graph/connections`)
        expect(result).toEqual(mockConnections)
      })

      it('should handle invalid response format', async () => {
        mockApiCall.mockResolvedValue(null)

        await expect(connectionApi.list()).rejects.toThrow('Invalid response format from graph connections API')
      })
    })

    describe('get()', () => {
      it('should fetch a specific connection by ID', async () => {
        const mockConnection: GraphConnection = {
          id: 'conn-123',
          projectId: mockProjectId,
          sourceNodeId: 'source-node',
          targetNodeId: 'target-node',
          connectionType: 'character_arc',
          connectionStrength: 0.7,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        mockApiCall.mockResolvedValue({ connection: mockConnection })

        const result = await connectionApi.get('conn-123')

        expect(mockApiCall).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/graph/connections/conn-123`)
        expect(result).toEqual(mockConnection)
      })

      it('should throw error when connection not found', async () => {
        mockApiCall.mockResolvedValue({})

        await expect(connectionApi.get('nonexistent')).rejects.toThrow('Graph connection with id nonexistent not found in response')
      })
    })

    describe('create()', () => {
      it('should create a new graph connection', async () => {
        const createData: CreateGraphConnectionData = {
          sourceNodeId: 'source-123',
          targetNodeId: 'target-456',
          connectionType: 'thematic',
          connectionStrength: 0.8,
          visualProperties: '{"style": "solid"}',
          metadata: '{"description": "Main theme connection"}'
        }

        mockApiCall.mockResolvedValue({ success: true, id: 'conn-789' })

        const result = await connectionApi.create(createData)

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/connections`,
          {
            method: 'POST',
            body: JSON.stringify(createData)
          }
        )
        expect(result).toEqual({ success: true, id: 'conn-789' })
      })
    })

    describe('update()', () => {
      it('should update an existing connection', async () => {
        const updateData: UpdateGraphConnectionData = {
          connectionStrength: 0.95,
          visualProperties: '{"style": "dashed"}'
        }

        mockApiCall.mockResolvedValue({ success: true })

        const result = await connectionApi.update('conn-123', updateData)

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/connections/conn-123`,
          {
            method: 'PUT',
            body: JSON.stringify(updateData)
          }
        )
        expect(result).toEqual({ success: true })
      })
    })

    describe('delete()', () => {
      it('should delete a connection', async () => {
        mockApiCall.mockResolvedValue({ success: true })

        const result = await connectionApi.delete('conn-123')

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/connections/conn-123`,
          { method: 'DELETE' }
        )
        expect(result).toEqual({ success: true })
      })
    })
  })

  describe('graphApi convenience methods', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    describe('node operations', () => {
      it('should list nodes using convenience method', async () => {
        mockApiCall.mockResolvedValue({ nodes: [] })

        await graphApi.listNodes(mockProjectId)

        expect(mockApiCall).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/graph/nodes`)
      })

      it('should create node using convenience method', async () => {
        const nodeData: CreateGraphNodeData = {
          nodeType: 'lore',
          title: 'Ancient History'
        }

        mockApiCall.mockResolvedValue({ success: true, id: 'lore-123' })

        await graphApi.createNode(mockProjectId, nodeData)

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/nodes`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(nodeData)
          })
        )
      })

      it('should update node using convenience method', async () => {
        const updateData: UpdateGraphNodeData = {
          title: 'Updated Title'
        }

        mockApiCall.mockResolvedValue({ success: true })

        await graphApi.updateNode(mockProjectId, 'node-123', updateData)

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/nodes/node-123`,
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updateData)
          })
        )
      })

      it('should update node position using convenience method', async () => {
        mockApiCall.mockResolvedValue({ success: true })

        await graphApi.updateNodePosition(mockProjectId, 'node-123', 500, 600)

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/nodes/node-123/position`,
          {
            method: 'PUT',
            body: JSON.stringify({ positionX: 500, positionY: 600 })
          }
        )
      })

      it('should delete node using convenience method', async () => {
        mockApiCall.mockResolvedValue({ success: true })

        await graphApi.deleteNode(mockProjectId, 'node-123')

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/nodes/node-123`,
          { method: 'DELETE' }
        )
      })
    })

    describe('connection operations', () => {
      it('should list connections using convenience method', async () => {
        mockApiCall.mockResolvedValue({ connections: [] })

        await graphApi.listConnections(mockProjectId)

        expect(mockApiCall).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/graph/connections`)
      })

      it('should create connection using convenience method', async () => {
        const connectionData: CreateGraphConnectionData = {
          sourceNodeId: 'source-123',
          targetNodeId: 'target-456',
          connectionType: 'reference'
        }

        mockApiCall.mockResolvedValue({ success: true, id: 'conn-789' })

        await graphApi.createConnection(mockProjectId, connectionData)

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/connections`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(connectionData)
          })
        )
      })

      it('should delete connection using convenience method', async () => {
        mockApiCall.mockResolvedValue({ success: true })

        await graphApi.deleteConnection(mockProjectId, 'conn-123')

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/connections/conn-123`,
          { method: 'DELETE' }
        )
      })
    })

    describe('text block operations', () => {
      it('should list text blocks using convenience method', async () => {
        mockApiCall.mockResolvedValue({ textBlocks: [] })

        await graphApi.listTextBlocks(mockProjectId, 'story-node-123')

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/nodes/story-node-123/text-blocks`
        )
      })

      it('should create text block using convenience method', async () => {
        const textBlockData: CreateTextBlockData = {
          storyNodeId: 'story-123',
          content: 'New content',
          orderIndex: 2
        }

        mockApiCall.mockResolvedValue({ success: true, id: 'text-456' })

        await graphApi.createTextBlock(mockProjectId, textBlockData)

        expect(mockApiCall).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/graph/nodes/story-123/text-blocks`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(textBlockData)
          })
        )
      })
    })
  })

  describe('utility functions', () => {
    describe('parseVisualProperties', () => {
      it('should parse valid JSON visual properties', () => {
        const jsonString = '{"color": "blue", "size": "large", "icon": "star"}'
        const result = graphApi.parseVisualProperties(jsonString)

        expect(result).toEqual({
          color: 'blue',
          size: 'large',
          icon: 'star'
        })
      })

      it('should return empty object for invalid JSON', () => {
        const invalidJson = '{"invalid": json}'
        const result = graphApi.parseVisualProperties(invalidJson)

        expect(result).toEqual({})
      })

      it('should return empty object for undefined input', () => {
        const result = graphApi.parseVisualProperties(undefined)

        expect(result).toEqual({})
      })

      it('should return empty object for empty string', () => {
        const result = graphApi.parseVisualProperties('')

        expect(result).toEqual({})
      })
    })

    describe('stringifyVisualProperties', () => {
      it('should stringify visual properties object', () => {
        const props = {
          color: 'red',
          size: 'medium',
          shape: 'circle'
        }

        const result = graphApi.stringifyVisualProperties(props)

        expect(result).toBe('{"color":"red","size":"medium","shape":"circle"}')
      })

      it('should handle empty object', () => {
        const result = graphApi.stringifyVisualProperties({})

        expect(result).toBe('{}')
      })

      it('should handle complex nested objects', () => {
        const complexProps = {
          style: {
            border: { width: 2, color: 'black' },
            background: 'white'
          },
          animation: {
            duration: 1000,
            easing: 'ease-in-out'
          }
        }

        const result = graphApi.stringifyVisualProperties(complexProps)

        expect(() => JSON.parse(result)).not.toThrow()
        expect(JSON.parse(result)).toEqual(complexProps)
      })
    })

    describe('parseMetadata', () => {
      it('should parse valid JSON metadata', () => {
        const jsonString = '{"tags": ["important", "draft"], "priority": "high"}'
        const result = graphApi.parseMetadata(jsonString)

        expect(result).toEqual({
          tags: ['important', 'draft'],
          priority: 'high'
        })
      })

      it('should return empty object for invalid JSON', () => {
        const invalidJson = '{"broken": json'
        const result = graphApi.parseMetadata(invalidJson)

        expect(result).toEqual({})
      })

      it('should return empty object for undefined input', () => {
        const result = graphApi.parseMetadata(undefined)

        expect(result).toEqual({})
      })
    })

    describe('stringifyMetadata', () => {
      it('should stringify metadata object', () => {
        const metadata = {
          author: 'John Doe',
          version: 1,
          tags: ['fantasy', 'adventure'],
          settings: {
            autoSave: true,
            theme: 'dark'
          }
        }

        const result = graphApi.stringifyMetadata(metadata)

        expect(() => JSON.parse(result)).not.toThrow()
        expect(JSON.parse(result)).toEqual(metadata)
      })

      it('should handle arrays and nested objects', () => {
        const complexMetadata = {
          history: [
            { action: 'create', timestamp: '2024-01-01' },
            { action: 'update', timestamp: '2024-01-02' }
          ],
          permissions: {
            read: ['user1', 'user2'],
            write: ['user1']
          }
        }

        const result = graphApi.stringifyMetadata(complexMetadata)

        expect(JSON.parse(result)).toEqual(complexMetadata)
      })
    })
  })

  describe('API Factory Functions', () => {
    it('should create node API with correct project ID', () => {
      const nodeApi = graphApi.nodes('project-abc')

      expect(typeof nodeApi.list).toBe('function')
      expect(typeof nodeApi.get).toBe('function')
      expect(typeof nodeApi.create).toBe('function')
      expect(typeof nodeApi.update).toBe('function')
      expect(typeof nodeApi.delete).toBe('function')
    })

    it('should create text block API with correct project ID', () => {
      const textBlockApi = graphApi.textBlocks('project-def')

      expect(typeof textBlockApi.list).toBe('function')
      expect(typeof textBlockApi.get).toBe('function')
      expect(typeof textBlockApi.create).toBe('function')
      expect(typeof textBlockApi.update).toBe('function')
      expect(typeof textBlockApi.delete).toBe('function')
    })

    it('should create connection API with correct project ID', () => {
      const connectionApi = graphApi.connections('project-ghi')

      expect(typeof connectionApi.list).toBe('function')
      expect(typeof connectionApi.get).toBe('function')
      expect(typeof connectionApi.create).toBe('function')
      expect(typeof connectionApi.update).toBe('function')
      expect(typeof connectionApi.delete).toBe('function')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle API call failures gracefully', async () => {
      mockApiCall.mockRejectedValue(new Error('Network error'))

      await expect(graphApi.listNodes(mockProjectId)).rejects.toThrow('Network error')
    })

    it('should handle malformed response data', async () => {
      mockApiCall.mockResolvedValue('invalid response')

      await expect(graphApi.listNodes(mockProjectId)).rejects.toThrow('Invalid response format from graph nodes API')
    })

    it('should handle null/undefined project IDs', async () => {
      mockApiCall.mockResolvedValue({ nodes: [] })

      await graphApi.listNodes('')
      await graphApi.listNodes('null' as any)

      expect(mockApiCall).toHaveBeenCalledTimes(2)
    })

    it('should handle special characters in node IDs', async () => {
      const specialId = 'node-with-special-chars!@#$%^&*()'
      mockApiCall.mockResolvedValue({ node: { id: specialId } })

      await expect(graphApi.nodes(mockProjectId).get(specialId)).resolves.toBeDefined()
    })

    it('should handle very long strings in properties', async () => {
      const longString = 'a'.repeat(10000)
      const nodeData: CreateGraphNodeData = {
        nodeType: 'story_element',
        title: longString,
        description: longString
      }

      mockApiCall.mockResolvedValue({ success: true, id: 'long-node' })

      await expect(graphApi.createNode(mockProjectId, nodeData)).resolves.toBeDefined()
    })

    it('should handle unicode characters in node data', async () => {
      const unicodeData: CreateGraphNodeData = {
        nodeType: 'character',
        title: '角色名前',
        description: '这是一个包含中文的描述 🌟',
        metadata: '{"notes": "包含emoji和特殊字符 🎭🎪"}'
      }

      mockApiCall.mockResolvedValue({ success: true, id: 'unicode-node' })

      await expect(graphApi.createNode(mockProjectId, unicodeData)).resolves.toBeDefined()
    })
  })

  describe('Performance and Concurrency', () => {
    it('should handle multiple simultaneous API calls', async () => {
      mockApiCall.mockResolvedValue({ nodes: [] })

      const promises = Array.from({ length: 10 }, () => 
        graphApi.listNodes(`project-${Math.random()}`)
      )

      await expect(Promise.all(promises)).resolves.toHaveLength(10)
    })

    it('should handle large datasets efficiently', async () => {
      const largeNodeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `node-${i}`,
        projectId: mockProjectId,
        nodeType: 'story_element' as GraphNodeType,
        title: `Node ${i}`,
        positionX: i * 10,
        positionY: i * 10,
        wordCount: i,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      mockApiCall.mockResolvedValue({ nodes: largeNodeArray })

      const startTime = performance.now()
      const result = await graphApi.listNodes(mockProjectId)
      const endTime = performance.now()

      expect(result).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(100) // Should be fast
    })
  })
})