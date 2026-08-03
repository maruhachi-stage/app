import { useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { FiEye, FiEyeOff } from "react-icons/fi"
import { useNavigate } from "react-router"
import { ApiError } from "~/lib/api-client"
import { login, resendOtp, verifyOtp } from "~/features/auth/api/staff-auth"
import { useStaffAuth } from "~/hooks/useStaffAuth"

type Step = "password" | "otp"

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuthenticatedStaff } = useStaffAuth()
  const [step, setStep] = useState<Step>("password")
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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

  async function submitOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const authenticatedStaff = await verifyOtp(code)
      setAuthenticatedStaff(authenticatedStaff)
      navigate("/", { replace: true })
    } catch (cause) {
      setError(toMessage(cause))
    } finally {
      setSubmitting(false)
    }
  }

  async function sendAgain() {
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

  return <main className="grid min-h-dvh place-items-center bg-canvas p-4">
    <section className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm">
      <p className="text-sm font-black tracking-[0.18em] text-accent">HAL CINEMA</p>
      <h1 className="mt-2 text-2xl font-black">スタッフログイン</h1>
      <p className="mt-2 text-sm text-muted-foreground">{step === "password" ? "ユーザーIDとパスワードを入力してください。" : "メールで受け取った6桁の認証コードを入力してください。"}</p>
      {step === "password" ? <form className="mt-6 grid gap-4" onSubmit={submitPassword}>
        <Field label="ユーザーID"><input required autoComplete="username" value={userId} onChange={event => setUserId(event.target.value)} className="input" /></Field>
        <Field label="パスワード"><span className="relative block"><input required type={passwordVisible ? "text" : "password"} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="input pr-12" /><button type="button" aria-label={passwordVisible ? "パスワードを隠す" : "パスワードを表示する"} aria-pressed={passwordVisible} onClick={() => setPasswordVisible(value => !value)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground">{passwordVisible ? <FiEyeOff /> : <FiEye />}</button></span></Field>
        <button className="primary-button" disabled={submitting}>{submitting ? "確認中…" : "認証コードを送信"}</button>
      </form> : <form className="mt-6 grid gap-4" onSubmit={submitOtp}>
        <Field label="認証コード"><input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} className="input text-center text-xl tracking-[0.5em]" /></Field>
        <button className="primary-button" disabled={submitting}>{submitting ? "確認中…" : "ログイン"}</button>
        <button type="button" className="secondary-button" disabled={submitting} onClick={() => void sendAgain()}>認証コードを再送</button>
        <button type="button" className="text-sm font-bold text-muted-foreground" onClick={() => { setStep("password"); setCode(""); setError("") }}>別のユーザーIDでログイン</button>
      </form>}
      {message && <p className="mt-4 text-sm font-bold text-success">{message}</p>}
      {error && <p className="mt-4 text-sm font-bold text-danger">{error}</p>}
    </section>
  </main>
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-1.5 text-sm font-bold"><span>{label}</span>{children}</label> }
function toMessage(cause: unknown) { return cause instanceof ApiError ? cause.message : "通信に失敗しました。時間をおいて再度お試しください。" }
