import { LoginForm } from "~/features/auth/components/LoginForm"

export default function LoginPage() {
  return (
    <div className="py-12 max-w-md mx-auto">
      <h1 className="mt-18 mb-20 text-5xl font-bold text-center">ログイン</h1>
      <LoginForm />
    </div>
  )
}
