import type { ImageStorage, StoredImage } from '#application/ports/image-storage.js'

/** R2 backed image storage. The bucket stays private; the Worker proxies reads. */
export class R2ImageStorage implements ImageStorage {
  constructor(private readonly bucket: R2Bucket) {}

  async get(key: string): Promise<StoredImage | null> {
    const object = await this.bucket.get(key)
    if (!object) return null
    return {
      body: object.body,
      size: object.size,
      contentType: object.httpMetadata?.contentType ?? null,
      etag: object.httpEtag,
    }
  }

  async put(key: string, body: ArrayBuffer, contentType: string): Promise<void> {
    await this.bucket.put(key, body, { httpMetadata: { contentType } })
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key)
  }
}
