export type StoredImage = {
  body: ReadableStream
  size: number
  contentType: string | null
  etag: string
}

/**
 * Image objects live in R2 and are served through the API Worker, so the bucket
 * itself can stay private. In-memory implementations are used in tests.
 */
export interface ImageStorage {
  get(key: string): Promise<StoredImage | null>
  put(key: string, body: ArrayBuffer, contentType: string): Promise<void>
  delete(key: string): Promise<void>
}
