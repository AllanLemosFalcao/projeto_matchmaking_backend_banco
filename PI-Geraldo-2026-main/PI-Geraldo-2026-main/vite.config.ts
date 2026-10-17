import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      // Gera favicon, apple-touch-icon e ícones do manifest a partir do logo
      pwaAssets: {
        image: 'public/logo.svg',
        preset: 'minimal-2023',
        includeHtmlHeadLinks: true,
        overrideManifestIcons: true,
      },
      manifest: {
        name: 'caisUp',
        short_name: 'caisUp',
        description: 'O cais que conecta startups a investidores.',
        lang: 'pt-BR',
        theme_color: '#212226',
        background_color: '#212226',
        display: 'standalone',
                start_url: '/',
        scope: '/',
      },
      workbox: {
        // Só pré-carrega as fontes latinas; os outros alfabetos raramente são usados
        globPatterns: ['**/*.{js,css,html,svg,png,ico}', '**/*latin*.woff2'],
        navigateFallback: '/index.html',
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
