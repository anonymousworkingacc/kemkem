#!/usr/bin/env node
// Creates migrations/<UTC timestamp>_<name>.sql. Timestamps (not 0001, 0002…)
// keep migrations from parallel branches from colliding on the same number.
//
//   npm run db:new add_tags_to_notes

import { existsSync, mkdirSync, writeFileSync } from "node:fs"

const name = process.argv[2]
if (!name || !/^[a-z0-9_]+$/.test(name)) {
  console.error("Usage: npm run db:new <snake_case_name>")
  process.exit(1)
}

const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14)
const file = `migrations/${stamp}_${name}.sql`
mkdirSync("migrations", { recursive: true })
if (existsSync(file)) {
  console.error(`${file} already exists`)
  process.exit(1)
}
writeFileSync(file, `-- Migration: ${name}\n`)
console.log(`Created ${file}`)
