import { Link } from "react-router"
import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"
import { useLogin } from "~/features/auth/useLogin"

export function LoginForm() {
  const { email, setEmail, error, loading, redirect, handleSubmit, handleGuestContinue } = useLogin()

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          type="email"
          label="メールアドレス"
          labelClassName="text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          required
          autoComplete="email"
          className="text-white"
        />
        <p className="mb-6 text-sm text-gray-500 text-left text-white">
          登録済みのメールアドレスに認証コードを送信します。
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? "送信中..." : "認証コードを送信"}
        </Button>
      </form>
      <div className="mt-6 text-center text-sm text-gray-500">
        <p className="mb-2 text-foreground">
          アカウントをお持ちでない方は{" "}
          <Link to={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-red-600 font-bold hover:underline">
            新規会員登録
          </Link>
        </p>
        <Link to={redirect} className="text-gray-400 hover:underline " onClick={handleGuestContinue}>
          ゲストとして続行
        </Link>
      </div>
    </div>
  )
}
