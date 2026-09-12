import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import demoBridge from './server/demo-bridge.mjs'

export default defineConfig({
  plugins: [react(), tailwindcss(), demoBridge()],
  base: process.env.GH_PAGES ? '/apex-pacific-pms/' : '/',
  server: { port: 5199, host: true },
  preview: { port: 5199, host: true },
})
