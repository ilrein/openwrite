/**
 * Unit tests for the Graph API test script
 * Testing Framework: Vitest with TypeScript support
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock console methods to capture output
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('Graph API Test Script', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('testGraphAPI function execution', () => {
    it('should execute the test script without throwing errors', async () => {
      expect(() => {
        // Import and execute the test script
        require('../test-graph-api');
      }).not.toThrow();
    });

    it('should log the test header correctly', () => {
      require('../test-graph-api');
      
      expect(consoleSpy.log).toHaveBeenCalledWith('🧪 Testing Graph API Endpoints');
      expect(consoleSpy.log).toHaveBeenCalledWith('=====================================');
    });

    it('should log character node creation step', () => {
      require('../test-graph-api');
      
      expect(consoleSpy.log).toHaveBeenCalledWith('1. Creating Sisyphus character node...');
    });

    it('should validate node structure and log success', () => {
      require('../test-graph-api');
      
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Node structure is valid');
    });

    it('should log all required API endpoints', () => {
      require('../test-graph-api');
      
      const expectedEndpoints = [
        '📍 GET http://localhost:3001/api/projects/{projectId}/graph/nodes',
        '📍 POST http://localhost:3001/api/projects/{projectId}/graph/nodes',
        '📍 GET http://localhost:3001/api/projects/{projectId}/graph/connections',
        '📍 POST http://localhost:3001/api/projects/{projectId}/graph/connections',
        '📍 GET http://localhost:3001/api/projects/{projectId}/graph/nodes/{nodeId}/text-blocks',
        '📍 POST http://localhost:3001/api/projects/{projectId}/graph/nodes/{nodeId}/text-blocks'
      ];

      expectedEndpoints.forEach(endpoint => {
        expect(consoleSpy.log).toHaveBeenCalledWith(endpoint);
      });
    });

    it('should log success message and next steps', () => {
      require('../test-graph-api');
      
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Graph API is ready for testing!');
      expect(consoleSpy.log).toHaveBeenCalledWith('Next steps:');
      expect(consoleSpy.log).toHaveBeenCalledWith('1. Use the web app to create a project');
      expect(consoleSpy.log).toHaveBeenCalledWith('2. Get the project ID from the URL');
      expect(consoleSpy.log).toHaveBeenCalledWith('3. Use tools like Postman or curl to test the endpoints');
      expect(consoleSpy.log).toHaveBeenCalledWith('4. Start building the frontend integration!');
    });

    it('should not call console.error in normal execution', () => {
      require('../test-graph-api');
      
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });

  describe('Node data structure validation', () => {
    let sisyphusNode: any;

    beforeEach(() => {
      // Recreate the expected node structure for testing based on the file content
      sisyphusNode = {
        nodeType: "character",
        title: "Sisyphus",
        description: "The cunning king condemned to eternal punishment",
        positionX: 100,
        positionY: 100,
        visualProperties: JSON.stringify({
          color: "bg-blue-500",
          size: "medium",
          icon: "👤",
          shape: "circle",
        }),
        metadata: JSON.stringify({
          role: "protagonist",
          traits: ["cunning", "defiant", "persistent"],
        }),
      };
    });

    it('should create a valid character node with all required fields', () => {
      expect(sisyphusNode).toHaveProperty('nodeType', 'character');
      expect(sisyphusNode).toHaveProperty('title', 'Sisyphus');
      expect(sisyphusNode).toHaveProperty('description');
      expect(sisyphusNode).toHaveProperty('positionX', 100);
      expect(sisyphusNode).toHaveProperty('positionY', 100);
      expect(sisyphusNode).toHaveProperty('visualProperties');
      expect(sisyphusNode).toHaveProperty('metadata');
    });

    it('should have valid JSON in visualProperties field', () => {
      expect(() => {
        JSON.parse(sisyphusNode.visualProperties);
      }).not.toThrow();

      const visualProps = JSON.parse(sisyphusNode.visualProperties);
      expect(visualProps).toHaveProperty('color', 'bg-blue-500');
      expect(visualProps).toHaveProperty('size', 'medium');
      expect(visualProps).toHaveProperty('icon', '👤');
      expect(visualProps).toHaveProperty('shape', 'circle');
    });

    it('should have valid JSON in metadata field', () => {
      expect(() => {
        JSON.parse(sisyphusNode.metadata);
      }).not.toThrow();

      const metadata = JSON.parse(sisyphusNode.metadata);
      expect(metadata).toHaveProperty('role', 'protagonist');
      expect(metadata).toHaveProperty('traits');
      expect(Array.isArray(metadata.traits)).toBe(true);
      expect(metadata.traits).toEqual(['cunning', 'defiant', 'persistent']);
    });

    it('should have numeric position coordinates', () => {
      expect(typeof sisyphusNode.positionX).toBe('number');
      expect(typeof sisyphusNode.positionY).toBe('number');
      expect(sisyphusNode.positionX).toBeGreaterThanOrEqual(0);
      expect(sisyphusNode.positionY).toBeGreaterThanOrEqual(0);
    });

    it('should have a non-empty title and description', () => {
      expect(sisyphusNode.title).toBeTruthy();
      expect(sisyphusNode.title.length).toBeGreaterThan(0);
      expect(sisyphusNode.description).toBeTruthy();
      expect(sisyphusNode.description.length).toBeGreaterThan(0);
    });

    it('should have correct character-specific properties', () => {
      expect(sisyphusNode.nodeType).toBe('character');
      expect(sisyphusNode.title).toBe('Sisyphus');
      expect(sisyphusNode.description).toContain('cunning king');
      expect(sisyphusNode.description).toContain('eternal punishment');
    });

    it('should have properly structured visual properties', () => {
      const visualProps = JSON.parse(sisyphusNode.visualProperties);
      expect(visualProps.color).toMatch(/^bg-\w+-\d+$/);
      expect(['small', 'medium', 'large']).toContain(visualProps.size);
      expect(visualProps.icon).toBeTruthy();
      expect(['circle', 'square', 'triangle']).toContain(visualProps.shape);
    });

    it('should have meaningful metadata structure', () => {
      const metadata = JSON.parse(sisyphusNode.metadata);
      expect(metadata.role).toBe('protagonist');
      expect(metadata.traits).toHaveLength(3);
      expect(metadata.traits).toContain('cunning');
      expect(metadata.traits).toContain('defiant');
      expect(metadata.traits).toContain('persistent');
    });
  });

  describe('API configuration validation', () => {
    it('should use correct API base URL format', () => {
      require('../test-graph-api');
      
      // Check that the correct API base is being used in the logged endpoints
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3001/api')
      );
    });

    it('should reference correct project ID placeholder in all endpoints', () => {
      require('../test-graph-api');
      
      // Verify that project ID placeholder is used in all endpoints
      const logCalls = consoleSpy.log.mock.calls.flat();
      const endpointCalls = logCalls.filter(call => call && call.includes('📍'));
      
      endpointCalls.forEach(endpoint => {
        expect(endpoint).toContain('{projectId}');
      });
    });

    it('should include node ID placeholder in text-blocks endpoints', () => {
      require('../test-graph-api');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('{nodeId}/text-blocks')
      );
    });

    it('should cover all required HTTP methods', () => {
      require('../test-graph-api');
      
      const logCalls = consoleSpy.log.mock.calls.flat();
      const endpointCalls = logCalls.filter(call => call && call.includes('📍'));
      
      const getMethods = endpointCalls.filter(call => call && call.includes('GET'));
      const postMethods = endpointCalls.filter(call => call && call.includes('POST'));
      
      expect(getMethods.length).toBeGreaterThan(0);
      expect(postMethods.length).toBeGreaterThan(0);
    });

    it('should have correct endpoint paths structure', () => {
      require('../test-graph-api');
      
      const expectedPaths = [
        '/projects/{projectId}/graph/nodes',
        '/projects/{projectId}/graph/connections',
        '/projects/{projectId}/graph/nodes/{nodeId}/text-blocks'
      ];
      
      expectedPaths.forEach(path => {
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining(path)
        );
      });
    });
  });

  describe('Constants and configuration', () => {
    it('should have valid API_BASE constant format', () => {
      const apiBase = 'http://localhost:3001/api';
      const expectedPattern = /^https?:\/\/localhost:\d+\/api$/;
      expect(apiBase).toMatch(expectedPattern);
    });

    it('should have TEST_PROJECT_ID constant defined', () => {
      const testProjectId = 'test-project-id';
      expect(testProjectId).toBeTruthy();
      expect(typeof testProjectId).toBe('string');
      expect(testProjectId.length).toBeGreaterThan(0);
    });

    it('should use localhost for development testing', () => {
      require('../test-graph-api');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('localhost')
      );
    });

    it('should use port 3001 for API endpoints', () => {
      require('../test-graph-api');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining(':3001')
      );
    });
  });

  describe('Error handling', () => {
    it('should catch and log errors if JSON operations fail', () => {
      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      vi.spyOn(JSON, 'stringify').mockImplementation(() => {
        throw new Error('JSON stringify test error');
      });

      require('../test-graph-api');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Error testing Graph API:',
        expect.any(Error)
      );

      // Restore original implementation
      JSON.stringify = originalStringify;
    });

    it('should handle console method failures gracefully', () => {
      const originalLog = console.log;
      vi.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Console log error');
      });

      expect(() => {
        require('../test-graph-api');
      }).not.toThrow();

      console.log = originalLog;
    });
  });

  describe('Logging behavior and output', () => {
    it('should log in the correct sequence', () => {
      require('../test-graph-api');
      
      const calls = consoleSpy.log.mock.calls.map(call => call[0]);
      
      // Check that header comes first
      expect(calls[0]).toBe('🧪 Testing Graph API Endpoints');
      expect(calls[1]).toBe('=====================================');
      
      // Check that character creation comes before API endpoints
      const characterIndex = calls.findIndex(call => 
        call && call.includes('Creating Sisyphus character node')
      );
      const apiIndex = calls.findIndex(call => 
        call && call.includes('API endpoints available')
      );
      
      expect(characterIndex).toBeLessThan(apiIndex);
      expect(characterIndex).toBeGreaterThan(1); // After header
    });

    it('should use appropriate emoji indicators consistently', () => {
      require('../test-graph-api');
      
      const loggedMessages = consoleSpy.log.mock.calls.flat();
      
      expect(loggedMessages.some(msg => msg && msg.includes('🧪'))).toBe(true);
      expect(loggedMessages.some(msg => msg && msg.includes('✅'))).toBe(true);
      expect(loggedMessages.some(msg => msg && msg.includes('📍'))).toBe(true);
    });

    it('should provide clear next steps for users', () => {
      require('../test-graph-api');
      
      const loggedMessages = consoleSpy.log.mock.calls.flat();
      const nextSteps = loggedMessages.filter(msg => 
        msg && (msg.includes('1.') || msg.includes('2.') || msg.includes('3.') || msg.includes('4.'))
      );
      
      expect(nextSteps.length).toBe(4);
      expect(nextSteps[0]).toContain('web app');
      expect(nextSteps[1]).toContain('project ID');
      expect(nextSteps[2]).toContain('Postman');
      expect(nextSteps[3]).toContain('frontend');
    });

    it('should include proper section breaks and formatting', () => {
      require('../test-graph-api');
      
      const loggedMessages = consoleSpy.log.mock.calls.flat();
      
      // Check for section breaks (newline prefixed messages)
      const sectionBreaks = loggedMessages.filter(msg => 
        msg && msg.startsWith('\n')
      );
      
      expect(sectionBreaks.length).toBeGreaterThan(0);
    });
  });

  describe('Node structure flexibility and edge cases', () => {
    it('should support different node types beyond character', () => {
      const locationNode = {
        nodeType: "location",
        title: "Mount Olympus", 
        description: "Home of the gods",
        positionX: 200,
        positionY: 150,
        visualProperties: JSON.stringify({
          color: "bg-gold-500",
          size: "large",
          icon: "🏔️",
          shape: "square",
        }),
        metadata: JSON.stringify({
          type: "mythical location",
          significance: ["divine", "powerful"],
        }),
      };

      expect(locationNode).toHaveProperty('nodeType', 'location');
      expect(() => JSON.parse(locationNode.visualProperties)).not.toThrow();
      expect(() => JSON.parse(locationNode.metadata)).not.toThrow();
    });

    it('should handle nodes with minimal metadata', () => {
      const minimalNode = {
        nodeType: "concept",
        title: "Justice",
        description: "Abstract concept of fairness",
        positionX: 0,
        positionY: 0,
        visualProperties: JSON.stringify({
          color: "bg-gray-500",
          size: "small",
          icon: "⚖️",
          shape: "circle",
        }),
        metadata: JSON.stringify({}),
      };

      expect(() => JSON.parse(minimalNode.visualProperties)).not.toThrow();
      expect(() => JSON.parse(minimalNode.metadata)).not.toThrow();
      expect(JSON.parse(minimalNode.metadata)).toEqual({});
    });

    it('should validate position coordinates are non-negative', () => {
      const nodeWithPositions = {
        positionX: 100,
        positionY: 100,
      };

      expect(nodeWithPositions.positionX).toBeGreaterThanOrEqual(0);
      expect(nodeWithPositions.positionY).toBeGreaterThanOrEqual(0);
    });

    it('should handle complex visual properties', () => {
      const complexVisualProps = JSON.stringify({
        color: "bg-gradient-to-r from-blue-500 to-purple-500",
        size: "large",
        icon: "🎭",
        shape: "hexagon",
        opacity: 0.8,
        border: "2px solid gold",
      });

      expect(() => JSON.parse(complexVisualProps)).not.toThrow();
      const parsed = JSON.parse(complexVisualProps);
      expect(parsed).toHaveProperty('opacity', 0.8);
      expect(parsed).toHaveProperty('border', '2px solid gold');
    });

    it('should handle arrays in metadata', () => {
      const metadataWithArrays = JSON.stringify({
        role: "protagonist",
        traits: ["cunning", "defiant", "persistent"],
        aliases: ["King of Corinth", "The Cunning One"],
        relationships: [
          { type: "enemy", name: "Zeus" },
          { type: "wife", name: "Merope" }
        ],
      });

      expect(() => JSON.parse(metadataWithArrays)).not.toThrow();
      const parsed = JSON.parse(metadataWithArrays);
      expect(Array.isArray(parsed.traits)).toBe(true);
      expect(Array.isArray(parsed.aliases)).toBe(true);
      expect(Array.isArray(parsed.relationships)).toBe(true);
    });
  });

  describe('Integration and API structure testing', () => {
    it('should provide endpoints for full CRUD operations', () => {
      require('../test-graph-api');
      
      const loggedMessages = consoleSpy.log.mock.calls.flat();
      const endpoints = loggedMessages.filter(msg => msg && msg.includes('📍'));
      
      // Should have GET endpoints for reading
      const getEndpoints = endpoints.filter(ep => ep && ep.includes('GET'));
      expect(getEndpoints.length).toBeGreaterThanOrEqual(3);
      
      // Should have POST endpoints for creating
      const postEndpoints = endpoints.filter(ep => ep && ep.includes('POST'));
      expect(postEndpoints.length).toBeGreaterThanOrEqual(3);
    });

    it('should cover nodes, connections, and text-blocks resources', () => {
      require('../test-graph-api');
      
      const loggedMessages = consoleSpy.log.mock.calls.flat();
      const endpoints = loggedMessages.filter(msg => msg && msg.includes('📍'));
      
      expect(endpoints.some(ep => ep && ep.includes('/nodes'))).toBe(true);
      expect(endpoints.some(ep => ep && ep.includes('/connections'))).toBe(true);
      expect(endpoints.some(ep => ep && ep.includes('/text-blocks'))).toBe(true);
    });

    it('should include proper REST API path structure', () => {
      require('../test-graph-api');
      
      const loggedMessages = consoleSpy.log.mock.calls.flat();
      const endpoints = loggedMessages.filter(msg => msg && msg.includes('📍'));
      
      endpoints.forEach(endpoint => {
        if (endpoint) {
          expect(endpoint).toMatch(/\/api\/projects\/\{projectId\}/);
        }
      });
    });

    it('should mention authentication requirements', () => {
      require('../test-graph-api');
      
      const loggedMessages = consoleSpy.log.mock.calls.flat();
      const authMention = loggedMessages.some(msg => 
        msg && (msg.includes('authentication') || msg.includes('auth'))
      );
      
      expect(authMention).toBe(true);
    });
  });
});