import { describe, expect, it } from 'vitest'

import { ApiError } from './api-client'
import { API_PREFIXES, apiPath, staffApiPaths } from '../config/api'

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

describe('apiPath', () => {
    it('prefixes staff endpoints with the v1 API prefix', () => {
        expect(apiPath(staffApiPaths.auth.login)).toBe('/api/v1/staff/auth/login')
        expect(apiPath('/staff/overview')).toBe('/api/v1/staff/overview')
        expect(API_PREFIXES.legacy).toBe('/api')
    })
})
