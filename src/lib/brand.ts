/**
 * 品牌常量 —— 所有色值都是对 logo/logo.jpg 逐像素采样得到的真实值，
 * 不要凭感觉改。改品牌色请同时更新 src/styles/index.css 里的渐变。
 */

export const COLORS = {
  orange: '#FF8A05',
  ember: '#FF6055',
  pink: '#E62FA6',
  purple: '#A824E1',
  violet: '#722EFF',
  glow: '#8C28FA',
} as const

/** 与 CSS @utility brand-gradient 保持一致 */
export const BRAND_GRADIENT =
  'linear-gradient(97deg, #FF8A05 0%, #FF6055 24%, #E62FA6 46%, #A824E1 72%, #722EFF 100%)'

export type GradientStop = { at: number; color: string }

/** 渐变采样点（位置 0~1），用于 three.js 里生成贴图或 lerp 取色 */
export const GRADIENT_STOPS: readonly GradientStop[] = [
  { at: 0.0, color: '#FF8A05' },
  { at: 0.24, color: '#FF6055' },
  { at: 0.46, color: '#E62FA6' },
  { at: 0.72, color: '#A824E1' },
  { at: 1.0, color: '#722EFF' },
]

export const BRAND = {
  name: 'MPC',
  fullName: 'MINI PC CLUB',
  title: 'MPC · MINI PC CLUB',
  email: '373967824@qq.com',
  domain: 'mpc.example.com',
} as const

/** 按 t(0~1) 取品牌渐变色，返回 [r,g,b] 0~1，给 three.js 用 */
export function gradientColorAt(t: number): [number, number, number] {
  const stops = GRADIENT_STOPS
  const x = Math.min(1, Math.max(0, t))
  let a = stops[0]
  let b = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (x >= stops[i].at && x <= stops[i + 1].at) {
      a = stops[i]
      b = stops[i + 1]
      break
    }
  }
  const span = b.at - a.at || 1
  const k = (x - a.at) / span
  const pa = hexToRgb(a.color)
  const pb = hexToRgb(b.color)
  return [pa[0] + (pb[0] - pa[0]) * k, pa[1] + (pb[1] - pa[1]) * k, pa[2] + (pb[2] - pa[2]) * k]
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}
