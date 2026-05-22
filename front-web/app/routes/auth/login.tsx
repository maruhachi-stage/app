import {Link} from "react-router"
import {Button} from "~/shared/ui/Button"
import {Input} from "~/shared/ui/Input"
import {useLogin} from "~/features/auth/useLogin"

export default function LoginPage() {
    const {email, setEmail, error, loading, redirect, handleSubmit, handleGuestContinue} = useLogin()

    return (
        <div className="py-12 max-w-md mx-auto text-white">
            <h1 className="mt-45 mb-15 text-6xl font-bold text-center">ログイン</h1>
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
                <p className="mt-1 mb-1 text-sm">
                    登録済みのメールアドレスに認証コードを送信します。
                </p>

                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" size="lg" disabled={loading}>
                    {loading ? "送信中..." : "認証コードを送信"}
                </Button>
            </form>
            <div className="mt-5 flex flex-col gap-2 text-center text-sm text-white">
                <p className="mb-2">
                    アカウントをお持ちでない方は{" "}
                    <Link to={`/register?redirect=${encodeURIComponent(redirect)}`}
                          className="text-red-600 hover:underline">
                        新規会員登録
                    </Link>
                </p>
                <Link to={redirect} className="text-gray-400 hover:underline" onClick={handleGuestContinue}>
                    ゲストとして続行
                </Link>
            </div>
        </div>
    )
}
