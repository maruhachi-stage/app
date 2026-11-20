import type { Schedule } from '~/features/screening/domain/screening'

export type Stage = {
    id: number
    title: string
    description: string
    durationMin: number
    thumbnailUrl: string | null
    status: 'now_showing' | 'coming_soon'
    playwright: string | null
    director: string | null
    schedules?: Schedule[]
}
