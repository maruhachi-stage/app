import { useState, useEffect } from 'react'
import { apiFetch } from '../../shared/api/client'
import type { Screen } from '../../entities/screen/types'

export function useScreens() {
  const [screens, setScreens] = useState<Screen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ items: Screen[] }>('/screens')
      .then(data => setScreens(data.items))
      .catch((err) => {
        console.error(err)
        setError('スクリーン情報の取得に失敗しました')
      })
      .finally(() => setLoading(false))
  }, [])

  return { screens, loading, error }
}
