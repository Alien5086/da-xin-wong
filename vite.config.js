import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // 將警告門檻提高至 1000KB，避免 Firebase 等大型套件觸發警告
    chunkSizeWarningLimit: 1000, 
  }
})