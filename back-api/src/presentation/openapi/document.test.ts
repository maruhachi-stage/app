import { describe, expect, it } from 'vitest'
import { openApiDocument } from './document.js'

describe('OpenAPI document', () => {
  it('describes the public API routes', () => {
    expect(openApiDocument.openapi).toBe('3.0.3')
    expect(openApiDocument.paths['/api/v1/health']).toBeDefined()
    expect(openApiDocument.paths['/api/reservations']).toBeDefined()
    expect(openApiDocument.paths['/api/admin/edit-access']).toBeDefined()
  })
})
