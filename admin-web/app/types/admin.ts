export type AdminSection = 'dashboard' | 'seat-layouts'

export type EditKeyStatus = 'unchecked' | 'valid' | 'invalid' | 'missing'

export type AdminEditAccessStatus = 'unchecked' | 'available' | 'blocked'

export type AdminScreen = {
    id: number
    name: string
    size: 'large' | 'medium' | 'small'
    totalSeats: number
    seatCount: number
    layoutId: number | null
    layoutVersion: number | null
    aspectRatio: string | null
}

export type AdminOverview = {
    editKey: {
        configured: boolean
        valid: boolean
    }
    screens: {
        total: number
        seats: number
        items: AdminScreen[]
    }
}
