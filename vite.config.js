import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/Special-Education-Class-Management-App/",  // <--- 이 부분을 꼭 추가하세요! (앞뒤로 슬래시 / 필수)
})