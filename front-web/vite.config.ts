import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [tailwindcss(), reactRouter()],
    resolve: {
        tsconfigPaths: true,
    },
    server: {
        host: '0.0.0.0',
        port: 3030,
        strictPort: true,
        allowedHosts: ['.ts.net'],
        proxy: {
            // API・画像は wrangler dev（API Worker）が同一経路で提供する
            '/api': {
                target: 'http://localhost:3080',
                changeOrigin: true,
            },
            '/images': {
                target: 'http://localhost:3080',
                changeOrigin: true,
            },
        },
    },
})
