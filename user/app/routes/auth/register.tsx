import { RegisterForm } from '~/features/auth/components/RegisterForm'

export default function RegisterPage() {
    return (
        <div className="py-12 max-w-md mx-auto">
            <h1 className="mt-18 mb-20 text-5xl font-bold text-center">新規会員登録</h1>
            <RegisterForm />
        </div>
    )
}
