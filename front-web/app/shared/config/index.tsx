import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { apiFetch } from "~/shared/api/client"

export type AppConfig = {
  tickets: {
    type: string
    label: string
    price: number
  }[]
}

type ConfigContextValue = {
  config: AppConfig | null
  loading: boolean
  error: string | null
}

const ConfigContext = createContext<ConfigContextValue>({
  config: null,
  loading: true,
  error: null,
})

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    apiFetch<AppConfig>("/config")
      .then((data) => {
        if (mounted) {
          setConfig(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || "Failed to load config")
          setLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <ConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useAppConfig() {
  return useContext(ConfigContext)
}
