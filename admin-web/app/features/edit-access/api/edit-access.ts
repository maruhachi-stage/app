import { apiRequest } from '~/lib/api-client'

function editKeyHeaders(editKey: string): HeadersInit {
    return editKey ? { 'X-Admin-Edit-Key': editKey } : {}
}

export function verifyEditKey(editKey: string) {
    return apiRequest<{ configured: boolean; valid: boolean }>('/api/admin/edit-key/verify', {
        method: 'POST',
        headers: editKeyHeaders(editKey),
    })
}

export function getEditAccess(editKey: string) {
    return apiRequest<{ available: boolean }>('/api/admin/edit-access', {
        headers: editKeyHeaders(editKey),
    })
}
