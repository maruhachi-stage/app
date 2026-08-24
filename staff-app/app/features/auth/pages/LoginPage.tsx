import { useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { FiEye, FiEyeOff } from "react-icons/fi"
import { useNavigate } from "react-router"
import { useStaffLogin } from "~/features/auth/hooks/useStaffLogin"
import { useStaffAuth } from "~/hooks/useStaffAuth"

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuthenticatedStaff } = useStaffAuth()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const {
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
  } = useStaffLogin()

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await submitPassword()
  }

  async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const authenticatedStaff = await submitOtp()
    if (!authenticatedStaff) return
    setAuthenticatedStaff(authenticatedStaff)
    navigate("/", { replace: true })
  }

  return <main className="grid min-h-dvh place-items-center bg-canvas p-4">
    <section className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm">
      <p className="text-sm font-black tracking-[0.18em] text-accent">HAL CINEMA</p>
      <h1 className="mt-2 text-2xl font-black">スタッフログイン</h1>
      <p className="mt-2 text-sm text-muted-foreground">{step === "password" ? "ユーザーIDとパスワードを入力してください。" : "メールで受け取った6桁の認証コードを入力してください。"}</p>
      {step === "password" ? <form className="mt-6 grid gap-4" onSubmit={handlePasswordSubmit}>
        <Field label="ユーザーID"><input required autoComplete="username" value={userId} onChange={event => setUserId(event.target.value)} className="input" /></Field>
        <Field label="パスワード"><span className="relative block"><input required type={passwordVisible ? "text" : "password"} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="input pr-12" /><button type="button" aria-label={passwordVisible ? "パスワードを隠す" : "パスワードを表示する"} aria-pressed={passwordVisible} onClick={() => setPasswordVisible(value => !value)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground">{passwordVisible ? <FiEyeOff /> : <FiEye />}</button></span></Field>
        <button className="primary-button" disabled={submitting}>{submitting ? "確認中…" : "認証コードを送信"}</button>
      </form> : <form className="mt-6 grid gap-4" onSubmit={handleOtpSubmit}>
        <Field label="認証コード"><input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} className="input text-center text-xl tracking-[0.5em]" /></Field>
        <button className="primary-button" disabled={submitting}>{submitting ? "確認中…" : "ログイン"}</button>
        <button type="button" className="secondary-button" disabled={submitting} onClick={() => void resendCode()}>認証コードを再送</button>
        <button type="button" className="text-sm font-bold text-muted-foreground" onClick={resetPasswordStep}>別のユーザーIDでログイン</button>
      </form>}
      {message && <p className="mt-4 text-sm font-bold text-success">{message}</p>}
      {error && <p className="mt-4 text-sm font-bold text-danger">{error}</p>}
    </section>
  </main>
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-1.5 text-sm font-bold"><span>{label}</span>{children}</label> }
