import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // @vitejs/react-react에서 수정됨!

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Special-Education-Class-Management-App/', // 바뀐 저장소 이름 반영
})