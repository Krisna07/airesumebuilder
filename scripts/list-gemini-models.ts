#!/usr/bin/env tsx
import { GoogleGenAI } from '@google/genai'

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.log('NO_GEMINI_KEY')
    return
  }

  const ai = new GoogleGenAI({ apiKey })
  const pager = await ai.models.list({ config: { pageSize: 200 } })

  const names: string[] = []
  for await (const model of pager) {
    if (typeof model?.name === 'string') {
      names.push(model.name)
    }
  }

  const filtered = names.filter((name) => /gemma|flash-lite|imagen/i.test(name))
  filtered.sort()

  for (const name of filtered) {
    console.log(name)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
