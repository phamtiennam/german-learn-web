import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'German Learn',
        short_name: 'GermanLearn',
        description: 'Learn German vocabulary + speaking practice',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      // Dev-only mirrors of the Worker routes.
      '/api/translate': {
        target: 'https://api-free.deepl.com',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/translate', '/v2/translate'),
      },
      '/api/llm/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/llm/openai', '/v1/chat/completions'),
      },
      '/api/llm/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/llm/anthropic', '/v1/messages'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const auth = proxyReq.getHeader('authorization')
            if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
              proxyReq.removeHeader('authorization')
              proxyReq.setHeader('x-api-key', auth.slice('Bearer '.length))
              proxyReq.setHeader('anthropic-version', '2023-06-01')
            }
          })
        },
      },
    },
  },
})
