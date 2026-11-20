/**
 * Keeps `assets/images` and the R2 bucket in sync. The same files are used by
 * local development (Miniflare R2) and production (real R2), so there is only
 * one source of truth for image data.
 *
 * Usage:
 *   node scripts/images.mjs push    assets/images -> R2 (skips existing keys)
 *   node scripts/images.mjs pull    R2 -> assets/images (skips existing files)
 *   node scripts/images.mjs local   assets/images -> Miniflare R2 used by `wrangler dev`
 *
 * Environment variables (push / pull only, R2 S3 API token):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 * Optional:
 *   R2_ENDPOINT   (default: https://<account-id>.r2.cloudflarestorage.com)
 *   IMAGE_DIR     (default: assets/images)
 *   CONCURRENCY   (default: 16)
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

const CONTENT_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
}

const root = path.resolve(import.meta.dirname, '..')
const imageDir = path.resolve(root, process.env.IMAGE_DIR ?? 'assets/images')
const bucket = process.env.R2_BUCKET_NAME
const accountId = process.env.R2_ACCOUNT_ID
const concurrency = Number(process.env.CONCURRENCY ?? 16)
const cacheControl = 'public, max-age=31536000, immutable'

const command = process.argv[2]

function contentTypeFor(file) {
  const ext = path.extname(file).slice(1).toLowerCase()
  return CONTENT_TYPES[ext] ?? 'application/octet-stream'
}

/** Lists `assets/images` as R2 keys (relative, forward slashes). */
function listLocalKeys(dir = imageDir, prefix = '') {
  if (!fs.existsSync(dir)) {
    if (!prefix) {
      console.warn(
        `[images] ${imageDir} がありません。先に \`node scripts/images.mjs pull\` で取得してください。`,
      )
    }
    return []
  }
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const key = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) return listLocalKeys(path.join(dir, entry.name), key)
      return [key]
    })
    .filter((key) => CONTENT_TYPES[path.extname(key).slice(1).toLowerCase()])
}

function requireCredentials() {
  if (!accountId || !bucket || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.error(
      '[images] R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME を設定してください',
    )
    process.exit(1)
  }
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT ?? `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })
}

async function runPool(items, task) {
  let cursor = 0
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++]
      try {
        await task(item)
      } catch (error) {
        console.error(`[images] ${item} で失敗しました`, error)
        process.exitCode = 1
      }
    }
  })
  await Promise.all(workers)
}

async function pushKeys(client, keys) {
  await runPool(keys, async (key) => {
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
      return
    } catch (error) {
      if (error?.$metadata?.httpStatusCode !== 404) throw error
    }
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fs.readFileSync(path.join(imageDir, key)),
        ContentType: contentTypeFor(key),
        CacheControl: cacheControl,
      }),
    )
  })
}

async function push() {
  const client = requireCredentials()
  const keys = listLocalKeys()
  console.log(`[images] ${keys.length} 件を ${bucket} へ同期します（並列 ${concurrency}）`)
  await pushKeys(client, keys)
  console.log('[images] push 完了')
}

async function pull() {
  const client = requireCredentials()
  let token
  const keys = []
  do {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }),
    )
    keys.push(...(page.Contents ?? []).map((object) => object.Key).filter(Boolean))
    token = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (token)

  console.log(`[images] R2 の ${keys.length} 件を ${imageDir} へ取得します`)
  await runPool(keys, async (key) => {
    const target = path.join(imageDir, key)
    if (fs.existsSync(target)) return
    const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, Buffer.from(await object.Body.transformToByteArray()))
  })
  console.log('[images] pull 完了')
}

/**
 * Seeds the Miniflare R2 simulator so `wrangler dev` serves the same keys as
 * production. Uses the wrangler CLI so the local persistence layout stays in
 * sync with whatever the installed wrangler version expects.
 */
async function local() {
  const keys = listLocalKeys()
  const wranglerBin = path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js')
  console.log(`[images] ${keys.length} 件をローカル R2 へ投入します`)

  for (const key of keys) {
    await new Promise((resolve, reject) => {
      // Node を直接起動する（Windows の .cmd シェル経由は不安定なため使わない）。
      const child = spawn(
        process.execPath,
        [
          wranglerBin,
          'r2',
          'object',
          'put',
          `${bucket}/${key}`,
          '--local',
          '--file',
          path.join(imageDir, key),
          '--content-type',
          contentTypeFor(key),
          '--cache-control',
          cacheControl,
        ],
        { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] },
      )
      let stderr = ''
      child.stderr.on('data', (chunk) => {
        stderr += chunk
      })
      child.on('error', reject)
      child.on('exit', (code) =>
        code === 0
          ? resolve()
          : reject(
              new Error(`wrangler r2 object put ${key} (exit ${code})\n${stderr.slice(-400)}`),
            ),
      )
    })
    process.stdout.write('.')
  }
  console.log('\n[images] local 完了')
}

const commands = { push, pull, local }

if (!commands[command]) {
  console.error('[images] 使い方: node scripts/images.mjs <push|pull|local>')
  process.exit(1)
}

await commands[command]()
