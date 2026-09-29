import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// base 走相对路径：Vercel / Cloudflare Pages 部署在根域，GitHub Pages 部署在
// /repo-name/ 子路径，两者都能用。需要绝对路径时用环境变量 VITE_BASE 覆盖。
export default defineConfig({
  base: process.env.VITE_BASE ?? './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Vite 8 / rolldown 的分包 API。拆开之后浏览器可以并行下载，
        // 且第三方库不随业务代码变动，缓存命中率高。
        codeSplitting: {
          groups: [
            { name: 'three', test: /[\\/]node_modules[\\/]three[\\/]/ },
            { name: 'r3f', test: /[\\/]node_modules[\\/]@react-three[\\/]/ },
            { name: 'gsap', test: /[\\/]node_modules[\\/]gsap[\\/]/ },
            { name: 'react', test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
})
