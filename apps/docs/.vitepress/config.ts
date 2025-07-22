import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'WrittenCraft.ai',
  description: 'Open-source AI-powered writing platform',
  
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Contributing', link: '/contributing/' },
      { text: 'GitHub', link: 'https://github.com/ilrein/writtencraft-ai' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is WrittenCraft.ai?', link: '/guide/' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Features Overview', link: '/guide/features' }
          ]
        },
        {
          text: 'User Guide',
          items: [
            { text: 'Writing Interface', link: '/guide/writing' },
            { text: 'AI Assistant', link: '/guide/ai-assistant' },
            { text: 'Project Management', link: '/guide/projects' },
            { text: 'Collaboration', link: '/guide/collaboration' },
            { text: 'Import & Export', link: '/guide/import-export' }
          ]
        },
        {
          text: 'Advanced Features',
          items: [
            { text: 'Story Canvas', link: '/guide/story-canvas' },
            { text: 'Character Management', link: '/guide/characters' },
            { text: 'Codex System', link: '/guide/codex' },
            { text: 'Analytics', link: '/guide/analytics' }
          ]
        }
      ],
      
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Authentication', link: '/api/auth' },
            { text: 'Projects', link: '/api/projects' },
            { text: 'AI Integration', link: '/api/ai' },
            { text: 'WebSocket Events', link: '/api/websocket' }
          ]
        }
      ],
      
      '/contributing/': [
        {
          text: 'Contributing',
          items: [
            { text: 'Overview', link: '/contributing/' },
            { text: 'Development Setup', link: '/contributing/setup' },
            { text: 'Architecture', link: '/contributing/architecture' },
            { text: 'Database Schema', link: '/contributing/database' },
            { text: 'Plugin Development', link: '/contributing/plugins' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ilrein/writtencraft-ai' }
    ],

    footer: {
      message: 'Released under the AGPLv3 License.',
      copyright: 'Copyright © 2025 WrittenCraft.ai Contributors'
    },

    search: {
      provider: 'local'
    }
  }
})