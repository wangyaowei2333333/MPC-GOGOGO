/**
 * 数据读取层。所有业务数据都来自 hardware.json —— 你只要改那个 JSON，
 * 网站就跟着变，不用碰任何组件代码。
 */

import raw from './hardware.json'

export type Part = {
  id: string
  name: string
  brand?: string
  spec?: string
  price?: number | null
  note?: string
}

export type Benchmark = {
  label: string
  value: number
  unit?: string
}

export type Model = {
  id: string
  name: string
  tagline?: string
  formFactor?: string
  price?: number | null
  cover?: string
  parts?: Record<string, string | null>
  benchmarks?: Benchmark[]
}

export type Category = { key: string; label: string; required?: boolean }

export type HardwareData = {
  updatedAt: string
  models: Model[]
  parts: Record<string, Part[]>
  configurator?: {
    categories?: Category[]
    buildFee?: number | null
  }
}

export const hardware = raw as unknown as HardwareData

export const hasModels = hardware.models.length > 0

export const partsOf = (key: string): Part[] => hardware.parts?.[key] ?? []

export const hasAnyParts = Object.values(hardware.parts ?? {}).some((v) => (v?.length ?? 0) > 0)

export const DEFAULT_CATEGORIES: Category[] = [
  { key: 'cpu', label: 'CPU', required: true },
  { key: 'motherboard', label: '主板', required: true },
  { key: 'gpu', label: '显卡', required: true },
  { key: 'ram', label: '内存', required: true },
  { key: 'storage', label: '存储', required: true },
  { key: 'psu', label: '电源', required: true },
  { key: 'cooler', label: '散热', required: true },
  { key: 'case', label: '机箱', required: true },
]

export const categories = hardware.configurator?.categories?.length
  ? hardware.configurator.categories
  : DEFAULT_CATEGORIES

/** 只在有真实价格时才输出字符串，null / undefined 一律返回 null，绝不显示假价格 */
export const formatPrice = (n?: number | null): string | null =>
  typeof n === 'number' && Number.isFinite(n)
    ? `¥${n.toLocaleString('zh-CN')}`
    : null

export const formatUpdatedAt = (iso: string): string => {
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${y}.${m}.${d}` : iso
}
