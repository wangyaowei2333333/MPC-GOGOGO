export type Category = 'cpu' | 'mobo' | 'gpu' | 'ram' | 'cooler' | 'psu' | 'ssd' | 'fan'

export type Rarity = 'common' | 'rare' | 'epic' | 'legend'

export interface Part {
  id: string
  cat: Category
  name: string
  spec: string
  price: number
  power: number
  score: number
  rarity: Rarity
  tier: 1 | 2 | 3
  /** 电源容量 / 散热器解热能力 */
  capacity?: number
  /** 风扇风量 */
  airflow?: number
}

export const BUDGET = 12800

export const CATEGORIES: { key: Category; label: string; en: string }[] = [
  { key: 'cpu', label: '处理器', en: 'CPU' },
  { key: 'mobo', label: '主板', en: 'MOBO' },
  { key: 'gpu', label: '显卡', en: 'GPU' },
  { key: 'ram', label: '内存', en: 'RAM' },
  { key: 'cooler', label: '散热', en: 'COOLER' },
  { key: 'psu', label: '电源', en: 'PSU' },
  { key: 'ssd', label: '存储', en: 'SSD' },
  { key: 'fan', label: '风扇', en: 'FAN' },
]

export const PARTS: Part[] = [
  // ---- CPU ----
  {
    id: 'cpu-k6',
    cat: 'cpu',
    name: 'KRYO K6',
    spec: '6C / 12T · 4.9GHz · 65W',
    price: 1299,
    power: 65,
    score: 320,
    rarity: 'rare',
    tier: 1,
  },
  {
    id: 'cpu-v8',
    cat: 'cpu',
    name: 'KRYO V8',
    spec: '8C / 16T · 5.4GHz · 105W',
    price: 2199,
    power: 105,
    score: 470,
    rarity: 'epic',
    tier: 2,
  },
  {
    id: 'cpu-x16',
    cat: 'cpu',
    name: 'KRYO X16',
    spec: '16C / 32T · 5.7GHz · 170W',
    price: 3699,
    power: 170,
    score: 720,
    rarity: 'legend',
    tier: 3,
  },

  // ---- 主板 ----
  {
    id: 'mobo-a620',
    cat: 'mobo',
    name: 'SLATE A620M',
    spec: 'mATX · DDR5 · PCIe 4.0',
    price: 699,
    power: 18,
    score: 90,
    rarity: 'common',
    tier: 1,
  },
  {
    id: 'mobo-b650',
    cat: 'mobo',
    name: 'SLATE B650',
    spec: 'ATX · DDR5 · PCIe 5.0',
    price: 1099,
    power: 26,
    score: 150,
    rarity: 'rare',
    tier: 2,
  },
  {
    id: 'mobo-x670e',
    cat: 'mobo',
    name: 'SLATE X670E',
    spec: 'E-ATX · 双 PCIe 5.0',
    price: 1899,
    power: 38,
    score: 230,
    rarity: 'epic',
    tier: 3,
  },

  // ---- 显卡 ----
  {
    id: 'gpu-60',
    cat: 'gpu',
    name: 'PHANTOM 60',
    spec: '8G · 2.4GHz · 115W',
    price: 1899,
    power: 115,
    score: 420,
    rarity: 'rare',
    tier: 1,
  },
  {
    id: 'gpu-70s',
    cat: 'gpu',
    name: 'PHANTOM 70S',
    spec: '12G · 2.6GHz · 220W',
    price: 3299,
    power: 220,
    score: 640,
    rarity: 'epic',
    tier: 2,
  },
  {
    id: 'gpu-80s',
    cat: 'gpu',
    name: 'PHANTOM 80S',
    spec: '16G · 2.8GHz · 320W',
    price: 5999,
    power: 320,
    score: 980,
    rarity: 'legend',
    tier: 3,
  },

  // ---- 内存 ----
  {
    id: 'ram-16',
    cat: 'ram',
    name: 'PULSE 16G',
    spec: 'DDR5-5600 · CL36 · 8W',
    price: 299,
    power: 8,
    score: 100,
    rarity: 'common',
    tier: 1,
  },
  {
    id: 'ram-32',
    cat: 'ram',
    name: 'PULSE 32G',
    spec: 'DDR5-6400 · CL32 · 12W',
    price: 599,
    power: 12,
    score: 180,
    rarity: 'rare',
    tier: 2,
  },
  {
    id: 'ram-64',
    cat: 'ram',
    name: 'PULSE 64G',
    spec: 'DDR5-7200 · CL30 · 16W',
    price: 1099,
    power: 16,
    score: 280,
    rarity: 'epic',
    tier: 3,
  },

  // ---- 散热 ----
  {
    id: 'cool-air4',
    cat: 'cooler',
    name: 'AIR-4',
    spec: '4 热管塔冷 · 解热 160W',
    price: 199,
    power: 5,
    score: 60,
    rarity: 'common',
    tier: 1,
    capacity: 160,
  },
  {
    id: 'cool-240',
    cat: 'cooler',
    name: 'HYDRO 240',
    spec: '240 冷排 · 解热 240W',
    price: 599,
    power: 12,
    score: 120,
    rarity: 'rare',
    tier: 2,
    capacity: 240,
  },
  {
    id: 'cool-360',
    cat: 'cooler',
    name: 'HYDRO 360',
    spec: '360 冷排 · 解热 320W',
    price: 999,
    power: 18,
    score: 180,
    rarity: 'epic',
    tier: 3,
    capacity: 320,
  },

  // ---- 电源 ----
  {
    id: 'psu-550',
    cat: 'psu',
    name: 'VOLT 550',
    spec: '550W · 铜牌 · 半模组',
    price: 399,
    power: 0,
    score: 0,
    rarity: 'common',
    tier: 1,
    capacity: 550,
  },
  {
    id: 'psu-750',
    cat: 'psu',
    name: 'VOLT 750',
    spec: '750W · 金牌 · 全模组',
    price: 599,
    power: 0,
    score: 0,
    rarity: 'rare',
    tier: 2,
    capacity: 750,
  },
  {
    id: 'psu-1000',
    cat: 'psu',
    name: 'VOLT 1000',
    spec: '1000W · 白金 · 全模组',
    price: 899,
    power: 0,
    score: 0,
    rarity: 'epic',
    tier: 3,
    capacity: 1000,
  },

  // ---- 存储 ----
  {
    id: 'ssd-1',
    cat: 'ssd',
    name: 'NV-1',
    spec: '1TB · Gen4 · 5000MB/s',
    price: 399,
    power: 7,
    score: 80,
    rarity: 'common',
    tier: 1,
  },
  {
    id: 'ssd-2',
    cat: 'ssd',
    name: 'NV-2',
    spec: '2TB · Gen4 · 7400MB/s',
    price: 699,
    power: 8,
    score: 140,
    rarity: 'rare',
    tier: 2,
  },
  {
    id: 'ssd-5',
    cat: 'ssd',
    name: 'NV-5',
    spec: '2TB · Gen5 · 12000MB/s',
    price: 1099,
    power: 12,
    score: 220,
    rarity: 'epic',
    tier: 3,
  },

  // ---- 风扇 ----
  {
    id: 'fan-t3',
    cat: 'fan',
    name: 'TURBINE 3',
    spec: '3×120 · ARGB · 风量 120',
    price: 399,
    power: 12,
    score: 120,
    rarity: 'common',
    tier: 1,
    airflow: 120,
  },
  {
    id: 'fan-t4',
    cat: 'fan',
    name: 'TURBINE 4',
    spec: '4×120 · ARGB · 风量 200',
    price: 599,
    power: 18,
    score: 180,
    rarity: 'rare',
    tier: 2,
    airflow: 200,
  },
  {
    id: 'fan-vx',
    cat: 'fan',
    name: 'VORTEX X',
    spec: '4×140 · 反叶 · 风量 300',
    price: 899,
    power: 24,
    score: 260,
    rarity: 'epic',
    tier: 3,
    airflow: 300,
  },
]

export const RARITY_LABEL: Record<Rarity, string> = {
  common: '标准',
  rare: '稀有',
  epic: '史诗',
  legend: '传说',
}

export function partById(id: string | null | undefined): Part | null {
  if (!id) return null
  return PARTS.find((p) => p.id === id) ?? null
}

export function partsOf(cat: Category): Part[] {
  return PARTS.filter((p) => p.cat === cat)
}

export function categoryOf(cat: Category) {
  return CATEGORIES.find((c) => c.key === cat)!
}
