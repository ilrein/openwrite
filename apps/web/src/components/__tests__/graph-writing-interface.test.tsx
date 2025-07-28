import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GraphWritingInterface } from '../graph-writing-interface'
import type { GraphNode } from '@/lib/api'

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    graph: {
      listTextBlocks: vi.fn(),
      createTextBlock: vi.fn(),
      updateNode: vi.fn(),
      parseVisualProperties: vi.fn(),
      stringifyMetadata: vi.fn(),
    },
    characters: {
      list: vi.fn(),
    },
  },
}))

// Mock UI components
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  )
}))

vi.mock('@/components/ui/input', () => ({
  Input: ({ onBlur, defaultValue, ...props }: any) => (
    <input onBlur={onBlur} defaultValue={defaultValue} {...props} />
  )
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, disabled }: any) => (
    <div data-testid="select" data-disabled={disabled} onClick={() => onValueChange?.('test-id')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <div>{placeholder}</div>,
}))

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open, onOpenChange }: any) => (
    open ? <div data-testid="sheet" onClick={() => onOpenChange?.(false)}>{children}</div> : null
  ),
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
  SheetDescription: ({ children }: any) => <div data-testid="sheet-description">{children}</div>,
  SheetHeader: ({ children }: any) => <div data-testid="sheet-header">{children}</div>,
  SheetTitle: ({ children }: any) => <h2 data-testid="sheet-title">{children}</h2>,
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ onChange, onBlur, value, defaultValue, ...props }: any) => (
    <textarea 
      onChange={onChange} 
      onBlur={onBlur} 
      value={value} 
      defaultValue={defaultValue}
      {...props} 
    />
  )
}))

describe('GraphWritingInterface', () => {
  const mockApi = vi.mocked(require('@/lib/api').api)
  let queryClient: QueryClient

  const createMockNode = (overrides: Partial<GraphNode> = {}): GraphNode => ({
    id: 'test-node-id',
    title: 'Test Node',
    description: 'Test Description',
    nodeType: 'story_element',
    subType: null,
    visualProperties: '{"icon": "📝"}',
    metadata: '{}',
    ...overrides,
  })

  const defaultProps = {
    projectId: 'test-project-id',
    selectedNode: createMockNode(),
    isOpen: true,
    onClose: vi.fn(),
  }

  const mockTextBlocks = [
    {
      id: 'block-1',
      content: 'This is the first text block content.',
      wordCount: 8,
    },
    {
      id: 'block-2',
      content: 'This is the second text block with more content.',
      wordCount: 10,
    },
  ]

  const mockCharacters = [
    {
      id: 'char-1',
      name: 'John Doe',
      description: 'A brave hero',
    },
    {
      id: 'char-2',
      name: 'Jane Smith',
      description: 'A wise mentor',
    },
  ]

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.graph.listTextBlocks.mockResolvedValue(mockTextBlocks)
    mockApi.characters.list.mockResolvedValue(mockCharacters)
    mockApi.graph.parseVisualProperties.mockReturnValue({ icon: '📝' })
    mockApi.graph.stringifyMetadata.mockReturnValue('{"test": "metadata"}')
    mockApi.graph.createTextBlock.mockResolvedValue({ id: 'new-block' })
    mockApi.graph.updateNode.mockResolvedValue({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render when selectedNode is provided and isOpen is true', () => {
      render(<GraphWritingInterface {...defaultProps} />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('sheet')).toBeInTheDocument()
      expect(screen.getByTestId('sheet-title')).toBeInTheDocument()
    })

    it('should not render when selectedNode is null', () => {
      render(<GraphWritingInterface {...defaultProps} selectedNode={null} />, { wrapper: createWrapper() })
      
      expect(screen.queryByTestId('sheet')).not.toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<GraphWritingInterface {...defaultProps} isOpen={false} />, { wrapper: createWrapper() })
      
      expect(screen.queryByTestId('sheet')).not.toBeInTheDocument()
    })

    it('should display node title and description in the header', () => {
      const node = createMockNode({ title: 'Custom Title', description: 'Custom Description' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={node} />, { wrapper: createWrapper() })
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument()
    })

    it('should display node type and subtype information', () => {
      const node = createMockNode({ nodeType: 'character', subType: 'protagonist' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={node} />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/character/i)).toBeInTheDocument()
      expect(screen.getByText(/protagonist/i)).toBeInTheDocument()
    })

    it('should display word count and block count badges', async () => {
      render(<GraphWritingInterface {...defaultProps} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        expect(screen.getByText('18 words')).toBeInTheDocument() // 8 + 10 from mock data
        expect(screen.getByText('2 blocks')).toBeInTheDocument()
      })
    })

    it('should display appropriate icon for different node types', () => {
      mockApi.graph.parseVisualProperties.mockReturnValue({ icon: '👤' })
      
      const characterNode = createMockNode({ nodeType: 'character' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={characterNode} />, { wrapper: createWrapper() })
      
      expect(screen.getByText('👤')).toBeInTheDocument()
    })

    it('should use default icons when none specified', () => {
      mockApi.graph.parseVisualProperties.mockReturnValue({})
      
      const locationNode = createMockNode({ nodeType: 'location' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={locationNode} />, { wrapper: createWrapper() })
      
      expect(screen.getByText('🏰')).toBeInTheDocument()
    })
  })

  describe('Node Details Section', () => {
    it('should render node details section with title and description inputs', () => {
      render(<GraphWritingInterface {...defaultProps} />, { wrapper: createWrapper() })
      
      expect(screen.getByText('Node Details')).toBeInTheDocument()
      expect(screen.getByLabelText('Title')).toBeInTheDocument()
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
    })

    it('should populate inputs with current node values', () => {
      const node = createMockNode({ title: 'Test Title', description: 'Test Description' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={node} />, { wrapper: createWrapper() })
      
      const titleInput = screen.getByLabelText('Title') as HTMLInputElement
      const descriptionInput = screen.getByLabelText('Description') as HTMLTextAreaElement
      
      expect(titleInput.defaultValue).toBe('Test Title')
      expect(descriptionInput.defaultValue).toBe('Test Description')
    })

    it('should call updateNode when title input loses focus', async () => {
      render(<GraphWritingInterface {...defaultProps} />, { wrapper: createWrapper() })
      
      const titleInput = screen.getByLabelText('Title')
      fireEvent.blur(titleInput, { target: { value: 'Updated Title' } })
      
      await waitFor(() => {
        expect(mockApi.graph.updateNode).toHaveBeenCalledWith(
          'test-project-id',
          'test-node-id',
          { title: 'Updated Title' }
        )
      })
    })

    it('should call updateNode when description input loses focus', async () => {
      render(<GraphWritingInterface {...defaultProps} />, { wrapper: createWrapper() })
      
      const descriptionInput = screen.getByLabelText('Description')
      fireEvent.blur(descriptionInput, { target: { value: 'Updated Description' } })
      
      await waitFor(() => {
        expect(mockApi.graph.updateNode).toHaveBeenCalledWith(
          'test-project-id',
          'test-node-id',
          { description: 'Updated Description' }
        )
      })
    })
  })

  describe('Story Element Writing Section', () => {
    it('should render writing section for story_element nodes', async () => {
      const storyNode = createMockNode({ nodeType: 'story_element' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={storyNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        expect(screen.getByText('Writing Content')).toBeInTheDocument()
      })
    })

    it('should not render writing section for non-story nodes', () => {
      const characterNode = createMockNode({ nodeType: 'character' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={characterNode} />, { wrapper: createWrapper() })
      
      expect(screen.queryByText('Writing Content')).not.toBeInTheDocument()
    })

    it('should display existing text blocks', async () => {
      const storyNode = createMockNode({ nodeType: 'story_element' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={storyNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        expect(screen.getByText('This is the first text block content.')).toBeInTheDocument()
        expect(screen.getByText('This is the second text block with more content.')).toBeInTheDocument()
      })
    })

    it('should show loading state when fetching text blocks', () => {
      mockApi.graph.listTextBlocks.mockImplementation(() => new Promise(() => {})) // Never resolves
      
      const storyNode = createMockNode({ nodeType: 'story_element' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={storyNode} />, { wrapper: createWrapper() })
      
      expect(screen.getByText('Loading text blocks...')).toBeInTheDocument()
    })

    it('should show empty state when no text blocks exist', async () => {
      mockApi.graph.listTextBlocks.mockResolvedValue([])
      
      const storyNode = createMockNode({ nodeType: 'story_element' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={storyNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        expect(screen.getByText('No content yet. Add your first text block below!')).toBeInTheDocument()
      })
    })

    it('should display word count for each text block', async () => {
      const storyNode = createMockNode({ nodeType: 'story_element' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={storyNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        expect(screen.getByText('8 words')).toBeInTheDocument()
        expect(screen.getByText('10 words')).toBeInTheDocument()
      })
    })
  })

  describe('Text Block Creation', () => {
    it('should render new text block input area', async () => {
      const storyNode = createMockNode({ nodeType: 'story_element' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={storyNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        expect(screen.getByLabelText('Add New Text Block')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /add text block/i })).toBeInTheDocument()
      })
    })

    it('should allow typing in the new text block textarea', async () => {
      const user = userEvent.setup()
      
      const storyNode = createMockNode({ nodeType: 'story_element' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={storyNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        const textarea = screen.getByLabelText('Add New Text Block')
        expect(textarea).toBeInTheDocument()
      })
      
      const textarea = screen.getByLabelText('Add New Text Block')
      await user.type(textarea, 'New text block content')
      
      expect(textarea).toHaveValue('New text block content')
    })

    it('should create text block when add button is clicked', async () => {
      const user = userEvent.setup()
      
      const storyNode = createMockNode({ nodeType: 'story_element' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={storyNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        const textarea = screen.getByLabelText('Add New Text Block')
        expect(textarea).toBeInTheDocument()
      })
      
      const textarea = screen.getByLabelText('Add New Text Block')
      await user.type(textarea, 'New content')
      
      const addButton = screen.getByRole('button', { name: /add text block/i })
      await user.click(addButton)
      
      await waitFor(() => {
        expect(mockApi.graph.createTextBlock).toHaveBeenCalledWith('test-project-id', {
          storyNodeId: 'test-node-id',
          content: 'New content',
          orderIndex: 2, // Based on mock data having 2 existing blocks
        })
      })
    })

    it('should disable add button when textarea is empty', async () => {
      const storyNode = createMockNode({ nodeType: 'story_element' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={storyNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /add text block/i })
        expect(addButton).toBeDisabled()
      })
    })

    it('should clear textarea after successful creation', async () => {
      const user = userEvent.setup()
      
      const storyNode = createMockNode({ nodeType: 'story_element' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={storyNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        const textarea = screen.getByLabelText('Add New Text Block')
        expect(textarea).toBeInTheDocument()
      })
      
      const textarea = screen.getByLabelText('Add New Text Block')
      await user.type(textarea, 'New content')
      
      const addButton = screen.getByRole('button', { name: /add text block/i })
      await user.click(addButton)
      
      await waitFor(() => {
        expect(textarea).toHaveValue('')
      })
    })

    it('should show loading state during text block creation', async () => {
      const user = userEvent.setup()
      mockApi.graph.createTextBlock.mockImplementation(() => new Promise(() => {})) // Never resolves
      
      const storyNode = createMockNode({ nodeType: 'story_element' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={storyNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        const textarea = screen.getByLabelText('Add New Text Block')
        expect(textarea).toBeInTheDocument()
      })
      
      const textarea = screen.getByLabelText('Add New Text Block')
      await user.type(textarea, 'New content')
      
      const addButton = screen.getByRole('button', { name: /add text block/i })
      await user.click(addButton)
      
      expect(screen.getByText('Adding...')).toBeInTheDocument()
      expect(addButton).toBeDisabled()
    })
  })

  describe('Character Node Functionality', () => {
    it('should render character information section for character nodes', () => {
      const characterNode = createMockNode({ nodeType: 'character' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={characterNode} />, { wrapper: createWrapper() })
      
      expect(screen.getByText('Character Information')).toBeInTheDocument()
    })

    it('should render character selection dropdown', async () => {
      const characterNode = createMockNode({ nodeType: 'character' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={characterNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        expect(screen.getByText('Select Character')).toBeInTheDocument()
        expect(screen.getByTestId('select')).toBeInTheDocument()
      })
    })

    it('should populate character dropdown with available characters', async () => {
      const characterNode = createMockNode({ nodeType: 'character' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={characterNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })

    it('should update node when character is selected', async () => {
      const user = userEvent.setup()
      
      const characterNode = createMockNode({ nodeType: 'character' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={characterNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        const select = screen.getByTestId('select')
        expect(select).toBeInTheDocument()
      })
      
      const select = screen.getByTestId('select')
      await user.click(select)
      
      await waitFor(() => {
        expect(mockApi.graph.stringifyMetadata).toHaveBeenCalledWith({
          linkedCharacterId: 'test-id',
          isPlaceholder: false,
        })
        expect(mockApi.graph.updateNode).toHaveBeenCalled()
      })
    })

    it('should show message when no characters are available', async () => {
      mockApi.characters.list.mockResolvedValue([])
      
      const characterNode = createMockNode({ nodeType: 'character' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={characterNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        expect(screen.getByText('No characters created yet. Create characters in the sidebar first!')).toBeInTheDocument()
      })
    })
  })

  describe('Other Node Types', () => {
    it('should render location details for location nodes', () => {
      const locationNode = createMockNode({ nodeType: 'location' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={locationNode} />, { wrapper: createWrapper() })
      
      expect(screen.getByText('Location Details')).toBeInTheDocument()
    })

    it('should render lore entry for lore nodes', () => {
      const loreNode = createMockNode({ nodeType: 'lore' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={loreNode} />, { wrapper: createWrapper() })
      
      expect(screen.getByText('Lore Entry')).toBeInTheDocument()
    })

    it('should render plot thread for plot_thread nodes', () => {
      const plotNode = createMockNode({ nodeType: 'plot_thread' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={plotNode} />, { wrapper: createWrapper() })
      
      expect(screen.getByText('Plot Thread')).toBeInTheDocument()
    })

    it('should show appropriate usage instructions for each node type', () => {
      const locationNode = createMockNode({ nodeType: 'location' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={locationNode} />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/drag this location onto scenes/i)).toBeInTheDocument()
    })
  })

  describe('Sheet Interaction', () => {
    it('should call onClose when sheet is closed', async () => {
      const user = userEvent.setup()
      
      render(<GraphWritingInterface {...defaultProps} />, { wrapper: createWrapper() })
      
      const sheet = screen.getByTestId('sheet')
      await user.click(sheet)
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully during text block creation', async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockApi.graph.createTextBlock.mockRejectedValue(new Error('API Error'))
      
      const storyNode = createMockNode({ nodeType: 'story_element' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={storyNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        const textarea = screen.getByLabelText('Add New Text Block')
        expect(textarea).toBeInTheDocument()
      })
      
      const textarea = screen.getByLabelText('Add New Text Block')
      await user.type(textarea, 'New content')
      
      const addButton = screen.getByRole('button', { name: /add text block/i })
      await user.click(addButton)
      
      // Should not crash the component
      expect(screen.getByTestId('sheet')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should handle missing node ID gracefully', async () => {
      const user = userEvent.setup()
      const nodeWithoutId = { ...createMockNode(), id: '' }
      
      render(<GraphWritingInterface {...defaultProps} selectedNode={nodeWithoutId} />, { wrapper: createWrapper() })
      
      // Should still render the component
      expect(screen.getByTestId('sheet')).toBeInTheDocument()
    })

    it('should handle malformed visual properties gracefully', () => {
      const nodeWithBadVisualProps = createMockNode({ visualProperties: 'invalid json' })
      mockApi.graph.parseVisualProperties.mockImplementation(() => {
        throw new Error('Parse error')
      })
      
      expect(() => {
        render(<GraphWritingInterface {...defaultProps} selectedNode={nodeWithBadVisualProps} />, { wrapper: createWrapper() })
      }).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<GraphWritingInterface {...defaultProps} />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('sheet-title')).toBeInTheDocument()
      expect(screen.getByText('Node Details')).toBeInTheDocument()
    })

    it('should have proper form labels', async () => {
      render(<GraphWritingInterface {...defaultProps} />, { wrapper: createWrapper() })
      
      expect(screen.getByLabelText('Title')).toBeInTheDocument()
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
    })

    it('should provide descriptive help text', async () => {
      const storyNode = createMockNode({ nodeType: 'story_element' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={storyNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        expect(screen.getByText(/write your story content here/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('should not fetch data when node is not enabled for queries', () => {
      const characterNode = createMockNode({ nodeType: 'character' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={characterNode} />, { wrapper: createWrapper() })
      
      // Should not call listTextBlocks for non-story nodes
      expect(mockApi.graph.listTextBlocks).not.toHaveBeenCalled()
    })

    it('should invalidate queries appropriately after mutations', async () => {
      const user = userEvent.setup()
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')
      
      const storyNode = createMockNode({ nodeType: 'story_element' })
      render(<GraphWritingInterface {...defaultProps} selectedNode={storyNode} />, { wrapper: createWrapper() })
      
      await waitFor(() => {
        const textarea = screen.getByLabelText('Add New Text Block')
        expect(textarea).toBeInTheDocument()
      })
      
      const textarea = screen.getByLabelText('Add New Text Block')
      await user.type(textarea, 'New content')
      
      const addButton = screen.getByRole('button', { name: /add text block/i })
      await user.click(addButton)
      
      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['text-blocks', 'test-project-id', 'test-node-id']
        })
      })
    })
  })
})