import { OtpForm } from "~/features/auth/components/OtpForm"

export default function AuthOtpPage() {
  return (
    <div className="py-12 max-w-md mx-auto">
      <h1 className="mt-18 mb-20 text-5xl font-bold text-center">認証コードの入力</h1>
      <OtpForm />
    </div>
  )
}
