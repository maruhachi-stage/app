import type { Config } from '@react-router/dev/config'

export default {
    // Cloudflare Pages serves the build as static assets, so the app is a SPA.
    ssr: false,
} satisfies Config
