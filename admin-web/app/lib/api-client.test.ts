import { describe, expect, it } from 'vitest'

import { ApiError } from './api-client'

describe('ApiError', () => {
    it('keeps the API error code and status', () => {
        const error = new ApiError('FORBIDDEN', '権限がありません', undefined, 403)

        expect(error).toBeInstanceOf(Error)
        expect(error.name).toBe('ApiError')
        expect(error.message).toBe('権限がありません')
        expect(error.code).toBe('FORBIDDEN')
        expect(error.status).toBe(403)
    })
})
