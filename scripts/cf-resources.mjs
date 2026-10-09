#!/usr/bin/env node
// Ensures the D1 databases, KV namespaces and R2 buckets declared in
// wrangler.jsonc exist in the Cloudflare account (creating missing ones), then
// writes their real IDs into wrangler.jsonc *in the working copy only*.
//
// CI runs this before every deploy, so a new project only needs the two
// secrets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID. Resources are looked
// up by name, so running it again is safe. Do not commit the patched file.
//
//   node scripts/cf-resources.mjs --env dev          # env.dev section
//   node scripts/cf-resources.mjs                    # top level (production)

import { readFileSync, writeFileSync } from "node:fs"
import { applyEdits, modify, parse } from "jsonc-parser"

const CONFIG = "wrangler.jsonc"
const envIndex = process.argv.indexOf("--env")
const envName = envIndex === -1 ? null : process.argv[envIndex + 1]

const token = process.env.CLOUDFLARE_API_TOKEN
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
if (!token || !accountId) {
  console.error("CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set.")
  process.exit(1)
}

const apiBase =
  process.env.CLOUDFLARE_API_BASE_URL ?? "https://api.cloudflare.com/client/v4"
const base = `${apiBase}/accounts/${accountId}`

async function cf(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, ok: res.ok && data.success !== false, data }
}

function fail(what, res) {
  const errors = JSON.stringify(res.data?.errors ?? res.data)
  throw new Error(`${what} failed (HTTP ${res.status}): ${errors}`)
}

async function findD1(name) {
  const res = await cf("GET", `/d1/database?name=${encodeURIComponent(name)}`)
  if (!res.ok) fail(`Listing D1 databases`, res)
  return res.data.result.find((db) => db.name === name)?.uuid
}

async function ensureD1(name) {
  const existing = await findD1(name)
  if (existing) return { id: existing, created: false }
  const res = await cf("POST", "/d1/database", { name })
  if (res.ok) return { id: res.data.result.uuid, created: true }
  // Another run may have created it in the meantime.
  const raced = await findD1(name)
  if (raced) return { id: raced, created: false }
  fail(`Creating D1 database ${name}`, res)
}

async function findKv(title) {
  for (let page = 1; ; page++) {
    const res = await cf(
      "GET",
      `/storage/kv/namespaces?per_page=100&page=${page}`
    )
    if (!res.ok) fail("Listing KV namespaces", res)
    const hit = res.data.result.find((ns) => ns.title === title)
    if (hit) return hit.id
    if (res.data.result.length < 100) return undefined
  }
}

async function ensureKv(title) {
  const existing = await findKv(title)
  if (existing) return { id: existing, created: false }
  const res = await cf("POST", "/storage/kv/namespaces", { title })
  if (res.ok) return { id: res.data.result.id, created: true }
  const raced = await findKv(title)
  if (raced) return { id: raced, created: false }
  fail(`Creating KV namespace ${title}`, res)
}

async function ensureR2(name) {
  const found = await cf("GET", `/r2/buckets/${encodeURIComponent(name)}`)
  if (found.ok) return { created: false }
  const res = await cf("POST", "/r2/buckets", { name })
  if (res.ok) return { created: true }
  const raced = await cf("GET", `/r2/buckets/${encodeURIComponent(name)}`)
  if (raced.ok) return { created: false }
  if (res.data?.errors?.some((e) => e.code === 10042)) {
    throw new Error(
      "R2 is not enabled on this Cloudflare account. Enable it once in the " +
        "dashboard (R2 Object Storage), then re-run this job."
    )
  }
  fail(`Creating R2 bucket ${name}`, res)
}

let text = readFileSync(CONFIG, "utf8")
const config = parse(text)
const section = envName ? config.env?.[envName] : config
if (!section) {
  console.error(`No env "${envName}" in ${CONFIG}.`)
  process.exit(1)
}
// Wrangler names an environment's Worker "<name>-<env>" unless it sets one.
const workerName =
  section.name ?? (envName ? `${config.name}-${envName}` : config.name)
const prefix = envName ? ["env", envName] : []
const formatting = { formattingOptions: { insertSpaces: true, tabSize: 2 } }
const set = (path, value) => {
  text = applyEdits(text, modify(text, [...prefix, ...path], value, formatting))
}
const log = (kind, name, created) =>
  console.log(`${created ? "created " : "found   "} ${kind.padEnd(3)} ${name}`)

for (const [i, db] of (section.d1_databases ?? []).entries()) {
  const { id, created } = await ensureD1(db.database_name)
  set(["d1_databases", i, "database_id"], id)
  log("D1", db.database_name, created)
}

for (const [i, ns] of (section.kv_namespaces ?? []).entries()) {
  const title = `${workerName}-${ns.binding}`
  const { id, created } = await ensureKv(title)
  set(["kv_namespaces", i, "id"], id)
  log("KV", title, created)
}

for (const bucket of section.r2_buckets ?? []) {
  const { created } = await ensureR2(bucket.bucket_name)
  log("R2", bucket.bucket_name, created)
}

writeFileSync(CONFIG, text)
console.log(`Patched ${CONFIG} for ${workerName}.`)
