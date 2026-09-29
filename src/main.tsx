import { createRoot } from 'react-dom/client'
import '@/styles/index.css'
import App from '@/App'

// 这里刻意不用 StrictMode：它会重复执行 effect，
// 对 GSAP timeline / ScrollTrigger / three 的场景初始化都是干扰源。
const el = document.getElementById('root')
if (!el) throw new Error('找不到 #root 挂载点')

createRoot(el).render(<App />)
