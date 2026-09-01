import type { Route } from './+types/dashboard'
import { DashboardPage } from '~/features/dashboard/pages/DashboardPage'

export function meta(_: Route.MetaArgs) {
    return [
        { title: '管理画面 | HAL Cinema' },
        { name: 'description', content: 'HAL Cinema 管理画面' },
    ]
}

export default function DashboardRoute() {
    return <DashboardPage />
}
