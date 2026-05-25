import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { safeRedirect } from "~/shared/api/auth"

export function useLogin() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get("redirect"))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ email, type: "login" }),
      })
      sessionStorage.setItem("hal_cinema_pending_email", email)
      navigate(`/auth/otp?type=login&redirect=${encodeURIComponent(redirect)}`)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "OTP_RESEND_COOLDOWN") {
          sessionStorage.setItem("hal_cinema_pending_email", email)
          navigate(`/auth/otp?type=login&redirect=${encodeURIComponent(redirect)}`)
          return
        }
        setError(err.message)
      } else {
        setError("エラーが発生しました。時間をおいてお試しください。")
      }
    } finally {
      setLoading(false)
    }
  }

  return { email, setEmail, error, loading, handleSubmit }
}
