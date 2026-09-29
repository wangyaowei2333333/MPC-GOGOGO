import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

/** 站点绝对地址（canonical / og:url / og:image 用）。必须带结尾斜杠。 */
function resolveSiteUrl(): string {
  const withSlash = (u: string) => (u.endsWith('/') ? u : `${u}/`)

  // 1. 显式指定优先（本地构建、或想强制指向主域时用）
  if (process.env.VITE_SITE_URL) return withSlash(process.env.VITE_SITE_URL)

  // 2. Vercel 构建时自动注入的「生产域名」，不用手填。
  //    注意它不带协议头，只有 host。
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/`
  }

  // 3. Cloudflare Pages 构建时注入的部署地址
  if (process.env.CF_PAGES_URL) return withSlash(process.env.CF_PAGES_URL)

  // 4. 兜底：GitHub Pages 镜像。换主域后这里不用改，上面三步会自动接管。
  return 'https://wangyaowei2333333.github.io/MPC-GOGOGO/'
}

const SITE_URL = resolveSiteUrl()

/**
 * 把站点绝对地址注入两处：
 *  - index.html 里的 __SITE_URL__ 占位（canonical / og:url / og:image）
 *  - 业务代码里的 __MPC_SITE_URL__ 全局常量（见 src/lib/brand.ts）
 * 用 __XXX__ 而不是 %XXX% 的写法：Vite 自己会用 %NAME% 语法替换 import.meta.env，
 * 自定义 token 若带百分号可能被它先吃掉或留下未替换的占位符。
 */
function siteUrlPlugin(): Plugin {
  return {
    name: 'mpc:site-url',
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', SITE_URL)
    },
  }
}

// base 走相对路径：Vercel / Cloudflare Pages 部署在根域，GitHub Pages 部署在
// /repo-name/ 子路径，两者都能用。需要绝对路径时用环境变量 VITE_BASE 覆盖。
export default defineConfig({
  base: process.env.VITE_BASE ?? './',
  define: {
    __MPC_SITE_URL__: JSON.stringify(SITE_URL),
  },
  plugins: [react(), tailwindcss(), siteUrlPlugin()],
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
