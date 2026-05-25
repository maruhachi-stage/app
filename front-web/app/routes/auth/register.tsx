import { RegisterForm } from "~/features/auth/components/RegisterForm"

export default function RegisterPage() {
  return (
    <div className="py-12 max-w-md mx-auto">
      <h1 className="mb-2 text-2xl font-bold text-center">新規会員登録</h1>
        <p className="mb-6 text-sm text-gray-500 text-center">
          メールアドレスとユーザー名を入力してください。認証コードを送信します。
        </p>
        <RegisterForm />
    </div>
  )
}
