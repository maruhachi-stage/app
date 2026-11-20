import type { Route } from './+types/dashboard'
import { DashboardPage } from '~/features/dashboard/pages/DashboardPage'

export function meta(_: Route.MetaArgs) {
    return [
        { title: 'スタッフ画面 | 丸八ステージ' },
        { name: 'description', content: '丸八ステージ スタッフ画面' },
    ]
}

export default function DashboardRoute() {
    return <DashboardPage />
}
