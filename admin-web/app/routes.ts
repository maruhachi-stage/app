import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

export default [
    layout('routes/admin.tsx', [
        index('routes/dashboard.tsx'),
        route('seat-layouts', 'routes/seat-layouts.tsx'),
    ]),
] satisfies RouteConfig
