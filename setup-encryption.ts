/**
 * Setup script to generate encryption key for API key encryption
 * Run this once during deployment to generate the ENCRYPTION_KEY environment variable
 */

import { generateEncryptionKey } from "./apps/server/src/lib/encryption"

async function main() {
  try {
    process.stdout.write("Generating encryption key for API key encryption...\n")
    const encryptionKey = await generateEncryptionKey()

    process.stdout.write("\n🔐 ENCRYPTION_KEY generated successfully!\n")
    process.stdout.write("\nAdd this to your environment variables (.dev.vars for local development):\n")
    process.stdout.write(`ENCRYPTION_KEY=${encryptionKey}\n`)
    process.stdout.write("\n⚠️  Keep this key secure and never share it publicly!\n")
    process.stdout.write("⚠️  Losing this key will make existing encrypted API keys unrecoverable!\n")
  } catch (error) {
    process.stderr.write(`❌ Failed to generate encryption key: ${error}\n`)
    process.exit(1)
  }
}

main()
