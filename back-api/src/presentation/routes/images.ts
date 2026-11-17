import { Hono } from 'hono'
import type { AppEnv } from '#types.js'

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
}

function contentTypeFor(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() ?? ''
  return CONTENT_TYPES[ext] ?? 'application/octet-stream'
}

/**
 * Serves R2 objects under /images/*. The API origin is the only public entry
 * point, so the bucket can stay private while thumbnails keep a stable URL.
 */
export const imagesRoute = new Hono<AppEnv>()

imagesRoute.get('/*', async (c) => {
  const key = c.req.path.replace(/^\/images\/?/, '')
  if (!key) return c.notFound()

  const image = await c.get('container').imageStorage.get(key)
  if (!image) return c.notFound()

  return new Response(image.body, {
    headers: {
      'content-type': image.contentType ?? contentTypeFor(key),
      'content-length': String(image.size),
      'cache-control': 'public, max-age=31536000, immutable',
      etag: image.etag,
    },
  })
})
