import { LoginForm } from "~/features/auth/components/LoginForm"

export default function LoginPage() {
  return (
    <div className="py-12 max-w-md mx-auto">
      <h1 className="mb-2 text-2xl font-bold text-center">ログイン</h1>
      <p className="mb-6 text-sm text-gray-500 text-center">
        登録済みのメールアドレスに認証コードを送信します。
      </p>
      <LoginForm />
    </div>
  )
}
