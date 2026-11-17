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
        port: 3040,
        strictPort: true,
        allowedHosts: ['.ts.net'],
        proxy: {
            '/api': {
                target: 'http://localhost:3080',
                changeOrigin: true,
            },
            '/img-proxy': {
                target: 'http://localhost:3090',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/img-proxy/, ''),
            },
        },
    },
})
