/**
 * Test script to create Sisyphus story using the unified graph system
 * This demonstrates how our living story graph works in practice
 */

// Mock API calls - in practice these would be HTTP requests
const API_BASE = "http://localhost:3000/api"
const PROJECT_ID = "test-project-sisyphus" // You'll need a real project ID

interface GraphNode {
  id: string
  nodeType: string
  subType?: string
  title: string
  description: string
  positionX: number
  positionY: number
  visualProperties: string
  metadata?: string
}

interface GraphConnection {
  id: string
  sourceNodeId: string
  targetNodeId: string
  connectionType: string
  connectionStrength: number
  visualProperties?: string
}

interface TextBlock {
  id: string
  storyNodeId: string
  content: string
  orderIndex: number
}

// SISYPHUS STORY DATA STRUCTURE
const sisyphusStoryData = {
  // Characters
  characters: [
    {
      nodeType: "character",
      title: "Sisyphus",
      description:
        "The cunning king of Ephyra, condemned to eternal punishment for his defiance of the gods",
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
        arc: "from despair to acceptance",
      }),
    },
    {
      nodeType: "character",
      title: "Zeus",
      description: "King of the gods, who decreed Sisyphus's eternal punishment",
      positionX: 300,
      positionY: 100,
      visualProperties: JSON.stringify({
        color: "bg-yellow-500",
        size: "large",
        icon: "⚡",
        shape: "diamond",
      }),
      metadata: JSON.stringify({
        role: "antagonist",
        traits: ["powerful", "wrathful", "just"],
        relationship: "divine judge",
      }),
    },
  ],

  // Locations
  locations: [
    {
      nodeType: "location",
      title: "Mountain Peak",
      description:
        "The summit where Sisyphus must push the boulder, representing the goal that's always just out of reach",
      positionX: 500,
      positionY: 200,
      visualProperties: JSON.stringify({
        color: "bg-green-500",
        size: "large",
        icon: "🏔️",
        shape: "rectangle",
      }),
      metadata: JSON.stringify({
        atmosphere: "challenging, unforgiving",
        significance: "symbol of impossible goals",
      }),
    },
    {
      nodeType: "location",
      title: "Valley Below",
      description: "The starting point of each cycle, where the boulder comes to rest",
      positionX: 500,
      positionY: 400,
      visualProperties: JSON.stringify({
        color: "bg-brown-500",
        size: "medium",
        icon: "🏞️",
        shape: "rectangle",
      }),
      metadata: JSON.stringify({
        atmosphere: "defeated, weary",
        significance: "endless beginning",
      }),
    },
  ],

  // Story Elements
  storyElements: [
    {
      nodeType: "story_element",
      subType: "act",
      title: "The Eternal Punishment",
      description: "Sisyphus begins his eternal cycle of pushing the boulder up the mountain",
      positionX: 200,
      positionY: 300,
      visualProperties: JSON.stringify({
        color: "bg-purple-500",
        size: "large",
        icon: "🎭",
        shape: "rectangle",
      }),
    },
    {
      nodeType: "story_element",
      subType: "scene",
      title: "The Punishment Decreed",
      description: "Zeus explains Sisyphus's fate - to push a boulder up a mountain for eternity",
      positionX: 100,
      positionY: 500,
      visualProperties: JSON.stringify({
        color: "bg-red-500",
        size: "medium",
        icon: "⚖️",
        shape: "rectangle",
      }),
    },
    {
      nodeType: "story_element",
      subType: "scene",
      title: "The Push",
      description: "Sisyphus strains against the massive boulder, inching his way up the mountain",
      positionX: 300,
      positionY: 500,
      visualProperties: JSON.stringify({
        color: "bg-orange-500",
        size: "medium",
        icon: "💪",
        shape: "rectangle",
      }),
    },
    {
      nodeType: "story_element",
      subType: "scene",
      title: "The Fall",
      description: "Just before reaching the summit, the boulder rolls back down to the valley",
      positionX: 500,
      positionY: 500,
      visualProperties: JSON.stringify({
        color: "bg-gray-500",
        size: "medium",
        icon: "⬇️",
        shape: "rectangle",
      }),
    },
  ],

  // Plot Threads
  plotThreads: [
    {
      nodeType: "plot_thread",
      title: "The Eternal Cycle",
      description:
        "The endless repetition of pushing the boulder up, watching it fall, and starting again",
      positionX: 700,
      positionY: 300,
      visualProperties: JSON.stringify({
        color: "bg-indigo-500",
        size: "medium",
        icon: "🔄",
        shape: "circle",
      }),
      metadata: JSON.stringify({
        theme: "futility and persistence",
        symbolism: "the human condition",
      }),
    },
  ],

  // Lore
  lore: [
    {
      nodeType: "lore",
      title: "Greek Divine Justice",
      description:
        "The concept of divine punishment fitting the crime - Sisyphus's cleverness turned against him",
      positionX: 700,
      positionY: 100,
      visualProperties: JSON.stringify({
        color: "bg-pink-500",
        size: "small",
        icon: "📜",
        shape: "circle",
      }),
      metadata: JSON.stringify({
        category: "mythology",
        relevance: "explains the nature of the punishment",
      }),
    },
  ],
}

// STORY CONNECTIONS
const sisyphusConnections = [
  // Character appears in story elements
  {
    sourceType: "character",
    sourceTitle: "Sisyphus",
    targetType: "story_element",
    targetTitle: "The Punishment Decreed",
    connectionType: "character_arc",
  },
  {
    sourceType: "character",
    sourceTitle: "Sisyphus",
    targetType: "story_element",
    targetTitle: "The Push",
    connectionType: "character_arc",
  },
  {
    sourceType: "character",
    sourceTitle: "Sisyphus",
    targetType: "story_element",
    targetTitle: "The Fall",
    connectionType: "character_arc",
  },
  {
    sourceType: "character",
    sourceTitle: "Zeus",
    targetType: "story_element",
    targetTitle: "The Punishment Decreed",
    connectionType: "character_arc",
  },

  // Story flow connections
  {
    sourceType: "story_element",
    sourceTitle: "The Eternal Punishment",
    targetType: "story_element",
    targetTitle: "The Punishment Decreed",
    connectionType: "story_flow",
  },
  {
    sourceType: "story_element",
    sourceTitle: "The Punishment Decreed",
    targetType: "story_element",
    targetTitle: "The Push",
    connectionType: "story_flow",
  },
  {
    sourceType: "story_element",
    sourceTitle: "The Push",
    targetType: "story_element",
    targetTitle: "The Fall",
    connectionType: "story_flow",
  },

  // Location settings
  {
    sourceType: "location",
    sourceTitle: "Valley Below",
    targetType: "story_element",
    targetTitle: "The Punishment Decreed",
    connectionType: "setting",
  },
  {
    sourceType: "location",
    sourceTitle: "Mountain Peak",
    targetType: "story_element",
    targetTitle: "The Push",
    connectionType: "setting",
  },
  {
    sourceType: "location",
    sourceTitle: "Mountain Peak",
    targetType: "story_element",
    targetTitle: "The Fall",
    connectionType: "setting",
  },

  // Plot thread connections
  {
    sourceType: "plot_thread",
    sourceTitle: "The Eternal Cycle",
    targetType: "story_element",
    targetTitle: "The Push",
    connectionType: "plot_thread",
  },
  {
    sourceType: "plot_thread",
    sourceTitle: "The Eternal Cycle",
    targetType: "story_element",
    targetTitle: "The Fall",
    connectionType: "plot_thread",
  },

  // Thematic/lore connections
  {
    sourceType: "lore",
    sourceTitle: "Greek Divine Justice",
    targetType: "story_element",
    targetTitle: "The Punishment Decreed",
    connectionType: "thematic",
  },
]

// TEXT BLOCKS - The actual writing content
const sisyphusTextBlocks = [
  {
    storyNodeTitle: "The Punishment Decreed",
    blocks: [
      {
        content: `"You have deceived the gods one too many times, Sisyphus," Zeus's voice thundered across the underworld. "Your punishment shall fit your nature - endless, futile effort."

The massive boulder materialized before him, its surface rough and unforgiving. Sisyphus looked up at the mountain that stretched impossibly high above them.

"Each day, you will push this stone to the summit. Each day, it will roll back down. Each day, you will begin again. Forever."`,
        orderIndex: 0,
      },
    ],
  },
  {
    storyNodeTitle: "The Push",
    blocks: [
      {
        content: `Sisyphus planted his feet against the rocky ground and pressed his shoulder to the boulder. The stone was warm from the underworld's heat, and its weight seemed to increase with each step up the mountain.

His muscles strained, his breath came in ragged gasps, but he pushed on. Inch by inch, the boulder moved upward. Sometimes he thought he could see the summit, just ahead, just within reach.

The absurdity was not lost on him. He had outsmarted death itself, had chained Thanatos and delayed his own fate. Now he was reduced to this - a man and a stone, locked in eternal struggle.`,
        orderIndex: 0,
      },
    ],
  },
  {
    storyNodeTitle: "The Fall",
    blocks: [
      {
        content: `Just as the summit seemed within reach, just as hope flickered in his chest, the boulder shuddered. The weight that had seemed manageable moments before became insurmountable.

Sisyphus watched, as he had countless times before, as the stone rolled backward, gathering speed, tumbling down the mountain face with terrible inevitability.

He did not curse the gods. He did not weep. He simply watched his work undone, then turned to walk back down the mountain. Tomorrow, he would push the stone again.

In that moment of walking down, in that brief respite, perhaps there was something like peace. Perhaps there was even something like victory.`,
        orderIndex: 0,
      },
    ],
  },
]

console.log("🎭 SISYPHUS STORY GRAPH STRUCTURE:")
console.log("=====================================")
console.log(`📊 Total Nodes: ${Object.values(sisyphusStoryData).flat().length}`)
console.log(`🔗 Total Connections: ${sisyphusConnections.length}`)
console.log(
  `📝 Text Blocks: ${sisyphusTextBlocks.reduce((acc, node) => acc + node.blocks.length, 0)}`
)
console.log("")
console.log("This demonstrates how our unified graph system will work:")
console.log("• All story elements, characters, and locations are nodes")
console.log("• Rich connections show relationships between elements")
console.log("• Text blocks provide the actual writing content")
console.log("• Visual properties enable dynamic canvas rendering")
console.log("• Metadata allows flexible, extensible data storage")

export { sisyphusStoryData, sisyphusConnections, sisyphusTextBlocks }
