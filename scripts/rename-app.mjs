#!/usr/bin/env node
// Renames the app (Worker name, D1 names, package name, page title) in one go.
// The app name prefixes every Cloudflare resource, so each project made from
// the template needs its own name — otherwise it deploys over another app.
//
//   npm run rename -- shop-admin
//   npm run rename -- shop-admin --title "Shop Admin"

import { readFileSync, writeFileSync } from "node:fs"
import { parse } from "jsonc-parser"

const args = process.argv.slice(2)
const titleAt = args.indexOf("--title")
const title = titleAt >= 0 ? args.splice(titleAt, 2)[1] : undefined
const name = args[0]

// <= 42 chars keeps "pr-<n>-<name>-dev" within the 63-char DNS label limit.
if (!name || !/^[a-z][a-z0-9-]{0,40}[a-z0-9]$/.test(name)) {
  console.error(
    "Usage: npm run rename -- <name> [--title <display name>]\n" +
      "<name>: 2-42 chars, lowercase letters, digits and dashes, e.g. shop-admin"
  )
  process.exit(1)
}

const toTitle = (n) =>
  n
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")

const oldName = parse(readFileSync("wrangler.jsonc", "utf8")).name
if (oldName === name) {
  console.error(`The app is already named ${name}.`)
  process.exit(1)
}
const oldTitle = toTitle(oldName)
const newTitle = title ?? toTitle(name)

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
// Whole-name matches only, so "my-app" also renames "my-app-db" and
// "my-app-db-dev" but never touches an unrelated "my-apple".
const nameRe = new RegExp(`(?<![a-z0-9-])${escape(oldName)}(?=-|\\b)`, "g")

const edits = {
  "wrangler.jsonc": (t) => t.replace(nameRe, name),
  "package.json": (t) => t.replace(`"name": "${oldName}"`, `"name": "${name}"`),
  "package-lock.json": (t) =>
    t.replaceAll(`"name": "${oldName}"`, `"name": "${name}"`),
  "index.html": (t) =>
    t.replace(`<title>${oldTitle}</title>`, `<title>${newTitle}</title>`),
  "src/App.tsx": (t) => t.replace(`>${oldTitle}</h1>`, `>${newTitle}</h1>`),
}

for (const [file, edit] of Object.entries(edits)) {
  const before = readFileSync(file, "utf8")
  const after = edit(before)
  if (after === before) console.warn(`warning: nothing to rename in ${file}`)
  else writeFileSync(file, after)
}

console.log(`Renamed ${oldName} -> ${name} (title "${newTitle}").`)
console.log(
  `Cloudflare: Workers ${name} and ${name}-dev, D1 ${name}-db and ${name}-db-dev.`
)
