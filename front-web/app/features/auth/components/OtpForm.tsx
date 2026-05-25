import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"
import { useOtp } from "~/features/auth/useOtp"

export function OtpForm() {
  const { code, setCode, error, loading, email, resendCooldown, resending, handleSubmit, handleResend } = useOtp()

  return (
    <div className="w-full">
      <p className="mb-6 text-sm text-gray-500">
        <span className="font-medium text-gray-700">{email}</span>{" "}
        に送信した6桁のコードを入力してください。
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="code"
          type="text"
          inputMode="numeric"
          label="認証コード（6桁）"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          required
          autoComplete="one-time-code"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" disabled={loading || code.length !== 6} className="w-full">
          {loading ? "確認中..." : "確認する"}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        {resendCooldown > 0 ? (
          <p className="text-gray-400">再送まで {resendCooldown} 秒</p>
        ) : (
          <button type="button" onClick={handleResend} disabled={resending}
                  className="text-red-600 font-bold hover:underline disabled:opacity-50 text-sm">
            {resending ? "送信中..." : "認証コードを再送する"}
          </button>
        )}
      </div>
    </div>
  )
}
