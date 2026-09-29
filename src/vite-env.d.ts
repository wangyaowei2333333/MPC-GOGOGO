/// <reference types="vite/client" />

/**
 * 构建时注入的站点绝对地址（带结尾斜杠），来源见 vite.config.ts 的 resolveSiteUrl。
 * 用 define 注入而不是 import.meta.env.VITE_*，是为了让 Vercel / Cloudflare 的
 * 自动域名检测也能走同一个值。
 */
declare const __MPC_SITE_URL__: string
