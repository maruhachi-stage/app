import type { Route } from './+types/login'
import { LoginPage } from '~/features/auth/pages/LoginPage'

export function meta(_: Route.MetaArgs) {
    return [
        { title: 'スタッフログイン | 丸八ステージ' },
        { name: 'description', content: '丸八ステージ スタッフログイン' },
    ]
}

export default function LoginRoute() {
    return <LoginPage />
}
