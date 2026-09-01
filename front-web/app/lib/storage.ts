// Infrastructure: ブラウザストレージ操作
import type { ReservationDraft } from '~/features/reservation/domain/draft'

const KEY = 'hal_cinema_reservation_draft'

export const draftStorage = {
    get(): ReservationDraft {
        if (typeof window === 'undefined') return {}
        try {
            const raw = sessionStorage.getItem(KEY)
            return raw ? (JSON.parse(raw) as ReservationDraft) : {}
        } catch {
            return {}
        }
    },

    set(partial: Partial<ReservationDraft>): void {
        if (typeof window === 'undefined') return
        const current = draftStorage.get()
        sessionStorage.setItem(KEY, JSON.stringify({ ...current, ...partial }))
    },

    clear(): void {
        if (typeof window === 'undefined') return
        sessionStorage.removeItem(KEY)
    },
}
