/**
 * Uploads the local image-server files into the R2 bucket used by the API Worker.
 *
 * Required environment variables (R2 S3 API token):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 * Optional:
 *   R2_ENDPOINT   (default: https://<account-id>.r2.cloudflarestorage.com)
 *   IMAGE_DIR     (default: ../image-server/images)
 *   CONCURRENCY   (default: 16)
 *
 * Existing keys are skipped, so the script can be re-run safely.
 */
import fs from 'node:fs'
import path from 'node:path'
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

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
const imageDir = path.resolve(root, process.env.IMAGE_DIR ?? '../image-server/images')
const bucket = process.env.R2_BUCKET_NAME
const accountId = process.env.R2_ACCOUNT_ID

if (!bucket || !accountId || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  console.error(
    '[upload-images] R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME を設定してください',
  )
  process.exit(1)
}
if (!fs.existsSync(imageDir)) {
  console.error(`[upload-images] ${imageDir} が見つかりません`)
  process.exit(1)
}

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT ?? `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

function contentTypeFor(file) {
  const ext = path.extname(file).slice(1).toLowerCase()
  return CONTENT_TYPES[ext] ?? 'application/octet-stream'
}

async function exists(key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404) return false
    throw err
  }
}

async function upload(file) {
  const key = file
  if (await exists(key)) return 'skipped'
  const body = fs.readFileSync(path.join(imageDir, file))
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentTypeFor(file),
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )
  return 'uploaded'
}

const files = fs
  .readdirSync(imageDir)
  .filter((file) => /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(file))
const concurrency = Number(process.env.CONCURRENCY ?? 16)

console.log(`[upload-images] ${files.length} 件を ${bucket} へ同期します（並列 ${concurrency}）`)

let uploaded = 0
let skipped = 0
let cursor = 0

async function worker() {
  while (cursor < files.length) {
    const file = files[cursor++]
    try {
      const result = await upload(file)
      if (result === 'uploaded') uploaded++
      else skipped++
      if ((uploaded + skipped) % 100 === 0) {
        console.log(`[upload-images] ${uploaded + skipped}/${files.length}`)
      }
    } catch (err) {
      console.error(`[upload-images] ${file} のアップロードに失敗しました`, err)
      process.exitCode = 1
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker))
console.log(`[upload-images] 完了: uploaded=${uploaded} skipped=${skipped}`)
