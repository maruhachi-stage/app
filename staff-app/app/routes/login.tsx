import type { Route } from './+types/login'
import { LoginPage } from '~/features/auth/pages/LoginPage'

export function meta(_: Route.MetaArgs) {
    return [
        { title: 'スタッフログイン | HAL Cinema' },
        { name: 'description', content: 'HAL Cinema スタッフログイン' },
    ]
}

export default function LoginRoute() {
    return <LoginPage />
}
