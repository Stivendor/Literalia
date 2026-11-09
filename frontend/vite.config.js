import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // ponytail: proxy evita CORS en desarrollo; en producción el backend necesita CORSMiddleware
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // uvicorn escucha en IPv4; 'localhost' puede resolver a ::1
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
