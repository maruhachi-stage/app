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
        // Tailscale の MagicDNS 名（*.ts.net）でアクセスできるようにする
        allowedHosts: ['.ts.net'],
        proxy: {
            '/api': {
                target: 'http://localhost:3080',
                changeOrigin: true,
            },
            // 画像プロキシ: モバイルから localhost:3090 に直接アクセスできないため代理
            // モバイル不要なら下4行をコメントアウト
            '/img-proxy': {
                target: 'http://localhost:3090',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/img-proxy/, ''),
            },
        },
    },
})
