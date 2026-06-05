import { Link } from "react-router"
import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"
import { useRegister } from "~/features/auth/useRegister"

export function RegisterForm() {
  const { email, setEmail, name, setName, error, loading, redirect, handleSubmit } = useRegister()

  return (
    <div className="w-full">
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
        <p className="mb-6 text-sm">
          メールアドレスとユーザー名を入力してください。認証コードを送信します。
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? "送信中..." : "認証コードを送信"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-foreground">
        既にアカウントをお持ちの方は{" "}
        <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-red-600 font-bold hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  )
}
