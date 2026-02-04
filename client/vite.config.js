import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'Planejamento Acadêmico Senac',
                short_name: 'Senac Plan',
                description: 'Sistema de Planejamento Acadêmico do Senac',
                theme_color: '#004587',
                background_color: '#ffffff',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                orientation: 'portrait',
                icons: [
                    {
                        src: '/senac-logo.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/senac-logo.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: '/senac-logo.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
})
