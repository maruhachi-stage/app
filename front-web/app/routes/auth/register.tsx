import { Link } from "react-router"
import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"
import { useRegister } from "~/features/auth/useRegister"

export default function RegisterPage() {
  const { email, setEmail, name, setName, error, loading, redirect, handleSubmit } = useRegister()

  return (
    <div className="py-12 max-w-md mx-auto text-white">
      <h1 className="mt-45 mb-15 text-6xl font-bold text-center">新規会員登録</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            type="email"
            label="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
            autoComplete="email"
          />
          <Input
            id="name"
            label="ユーザー名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: hal_user"
            required
            autoComplete="name"
          />
          <p className="mt-1 mb-1 text-sm">
            メールアドレス、ユーザー名を入力してください。認証コードを送信します。
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
              type="submit" size="lg" disabled={loading}>
            {loading ? "送信中..." : "認証コードを送信"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-white">
          既にアカウントをお持ちの方は{" "}
          <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-red-600 hover:underline">
            ログイン
          </Link>
        </p>
    </div>
  )
}
