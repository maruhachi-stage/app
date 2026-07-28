import { useState, useEffect } from 'react'
import { apiFetch } from '~/lib/api-client'
import type { Screen } from '~/features/theater/domain/screen'

export function useScreen(screenId: number) {
  const [screen, setScreen] = useState<Screen | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!screenId) return

    apiFetch<Screen>(`/screens/${screenId}`)
      .then(data => setScreen(data))
      .catch((err) => {
        console.error(err)
        setError('スクリーン情報の取得に失敗しました')
      })
      .finally(() => setLoading(false))
  }, [screenId])

  return { screen, loading, error }
}
