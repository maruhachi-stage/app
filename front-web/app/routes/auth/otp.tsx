import { OtpForm } from "~/features/auth/components/OtpForm"

export default function AuthOtpPage() {
  return (
    <div className="py-12 max-w-md mx-auto">
      <h1 className="mb-2 text-2xl font-bold text-center">認証コードの入力</h1>
      <OtpForm />
    </div>
  )
}
