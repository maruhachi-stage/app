import { useState } from "react"
import { ApiError } from "~/lib/api-client"
import { login, resendOtp, verifyOtp } from "~/features/auth/api/staff-auth"
import type { AuthenticatedStaff } from "~/features/auth/domain/staff"

export type StaffLoginStep = "password" | "otp"

export function useStaffLogin() {
  const [step, setStep] = useState<StaffLoginStep>("password")
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function submitPassword(): Promise<void> {
    setSubmitting(true)
    setError("")
    setMessage("")
    try {
      await login(userId, password)
      setPassword("")
      setStep("otp")
      setMessage("登録済みのメールアドレスへ認証コードを送信しました。")
    } catch (cause) {
      setError(toMessage(cause))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitOtp(): Promise<AuthenticatedStaff | null> {
    setSubmitting(true)
    setError("")
    try {
      return await verifyOtp(code)
    } catch (cause) {
      setError(toMessage(cause))
      return null
    } finally {
      setSubmitting(false)
    }
  }

  async function resendCode(): Promise<void> {
    setSubmitting(true)
    setError("")
    try {
      await resendOtp()
      setMessage("新しい認証コードを送信しました。")
    } catch (cause) {
      setError(toMessage(cause))
    } finally {
      setSubmitting(false)
    }
  }

  function resetPasswordStep(): void {
    setStep("password")
    setCode("")
    setError("")
    setMessage("")
  }

  return {
    step,
    userId,
    setUserId,
    password,
    setPassword,
    code,
    setCode,
    submitting,
    message,
    error,
    submitPassword,
    submitOtp,
    resendCode,
    resetPasswordStep,
  }
}

function toMessage(cause: unknown): string {
  return cause instanceof ApiError
    ? cause.message
    : "通信に失敗しました。時間をおいて再度お試しください。"
}
