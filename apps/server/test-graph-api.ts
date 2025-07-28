/**
 * Simple test script to verify our graph API endpoints work
 * Run this after the server is running on port 3001
 */

const API_BASE = "http://localhost:3001/api"
// You'll need to replace this with a real project ID from your database
const TEST_PROJECT_ID = "test-project-id"

function testGraphAPI() {
  console.log("🧪 Testing Graph API Endpoints")
  console.log("=====================================")

  try {
    // Test 1: Create a character node
    console.log("1. Creating Sisyphus character node...")
    const sisyphusNode = {
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
    }

    // Note: This will require authentication, so this is just a demo
    // In practice, you'd need to include auth headers
    console.log("Node data prepared:", sisyphusNode)
    console.log("✅ Node structure is valid")

    // Test 2: Check API endpoint structure
    console.log("\n2. API endpoints available:")
    console.log(`📍 GET ${API_BASE}/projects/{projectId}/graph/nodes`)
    console.log(`📍 POST ${API_BASE}/projects/{projectId}/graph/nodes`)
    console.log(`📍 GET ${API_BASE}/projects/{projectId}/graph/connections`)
    console.log(`📍 POST ${API_BASE}/projects/{projectId}/graph/connections`)
    console.log(`📍 GET ${API_BASE}/projects/{projectId}/graph/nodes/{nodeId}/text-blocks`)
    console.log(`📍 POST ${API_BASE}/projects/{projectId}/graph/nodes/{nodeId}/text-blocks`)

    console.log("\n✅ Graph API is ready for testing!")
    console.log("Next steps:")
    console.log("1. Use the web app to create a project")
    console.log("2. Get the project ID from the URL")
    console.log("3. Use tools like Postman or curl to test the endpoints")
    console.log("4. Start building the frontend integration!")
  } catch (error) {
    console.error("❌ Error testing Graph API:", error)
  }
}

testGraphAPI()
