import { useCallback, useEffect, useState } from 'react'
import { getSeatLayouts } from '~/features/seat-layouts/api/get-seat-layouts'
import type { AdminScreen } from '~/types/admin'

export function useSeatLayouts(editKey: string) {
    const [screens, setScreens] = useState<AdminScreen[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const reload = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            setScreens(await getSeatLayouts(editKey))
        } catch (cause) {
            setError(
                cause instanceof Error ? cause.message : '座席レイアウトの読み込みに失敗しました',
            )
        } finally {
            setLoading(false)
        }
    }, [editKey])
    useEffect(() => {
        void reload()
    }, [reload])
    return { screens, loading, error, reload }
}
