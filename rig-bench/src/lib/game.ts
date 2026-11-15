import {
  BUDGET,
  CATEGORIES,
  partById,
  type Category,
  type Part,
} from '../data/parts'

export type Build = Record<Category, string | null>

export interface ChecklistItem {
  key: string
  label: string
  detail: string
  state: 'pass' | 'fail' | 'idle'
}

export interface BreakdownItem {
  label: string
  value: string
  active: boolean
}

export interface Derived {
  parts: Part[]
  installed: number
  cost: number
  remaining: number
  power: number
  effectivePower: number
  psuCap: number
  coolerCap: number
  cpuPower: number
  airflow: number
  baseScore: number
  multiplier: number
  score: number
  complete: boolean
  powerOk: boolean
  thermalOk: boolean
  airflowOk: boolean
  budgetOk: boolean
  ocReady: boolean
  ocActive: boolean
  checks: ChecklistItem[]
  breakdown: BreakdownItem[]
}

export function emptyBuild(): Build {
  return {
    cpu: null,
    mobo: null,
    gpu: null,
    ram: null,
    cooler: null,
    psu: null,
    ssd: null,
    fan: null,
  }
}

export function derive(build: Build, overclock: boolean): Derived {
  const parts = CATEGORIES.map((c) => partById(build[c.key])).filter(
    (p): p is Part => Boolean(p),
  )
  const byCat = (cat: Category) => partById(build[cat])
  const cpu = byCat('cpu')
  const cooler = byCat('cooler')
  const psu = byCat('psu')
  const fan = byCat('fan')

  const installed = parts.length
  const cost = parts.reduce((sum, p) => sum + p.price, 0)
  const remaining = BUDGET - cost
  const power = parts.reduce((sum, p) => sum + p.power, 0)
  const psuCap = psu?.capacity ?? 0
  const coolerCap = cooler?.capacity ?? 0
  const cpuPower = cpu?.power ?? 0
  const airflow = fan?.airflow ?? 0
  const baseScore = parts.reduce((sum, p) => sum + p.score, 0)

  const complete = installed === CATEGORIES.length
  const powerOk = Boolean(psu) && power <= psuCap
  const thermalOk = Boolean(cooler) && Boolean(cpu) && coolerCap >= cpuPower
  const airflowOk = Boolean(fan) && airflow >= 200
  const budgetOk = cost <= BUDGET

  // 超频：必须装齐、供电与散热都达标，并各自留出余量
  const ocReady =
    complete &&
    powerOk &&
    thermalOk &&
    psuCap - power >= 60 &&
    coolerCap - cpuPower >= 40
  const ocActive = overclock && ocReady
  const effectivePower = power + (ocActive ? 60 : 0)

  let multiplier = 1
  if (complete) multiplier *= 1.15
  if (thermalOk && coolerCap >= cpuPower + 80) multiplier *= 1.08
  if (airflowOk) multiplier *= 1.05
  if (ocActive) multiplier *= 1.12

  // 预算效率只在装齐后计入，避免空工作台也白拿分
  const budgetEfficiency = complete ? Math.floor(Math.max(0, remaining) * 0.04) : 0
  const score = Math.round(baseScore * multiplier + budgetEfficiency)

  const checks: ChecklistItem[] = [
    {
      key: 'assembly',
      label: '装配完成',
      detail: `${installed} / ${CATEGORIES.length}`,
      state: complete ? 'pass' : 'fail',
    },
    {
      key: 'power',
      label: '供电充足',
      detail: psu ? `${effectivePower}W / ${psuCap}W` : '未装电源',
      state: powerOk ? 'pass' : 'fail',
    },
    {
      key: 'thermal',
      label: '散热达标',
      detail: cooler && cpu ? `${coolerCap}W / ${cpuPower}W` : '缺散热或 CPU',
      state: thermalOk ? 'pass' : 'fail',
    },
    {
      key: 'budget',
      label: '预算合规',
      detail: `${cost.toLocaleString('en-US')} / ${BUDGET.toLocaleString('en-US')}`,
      state: budgetOk ? 'pass' : 'fail',
    },
  ]

  const breakdown: BreakdownItem[] = [
    { label: '部件性能', value: `+${baseScore}`, active: baseScore > 0 },
    { label: '完整装配', value: '×1.15', active: complete },
    {
      label: '散热余量',
      value: '×1.08',
      active: thermalOk && coolerCap >= cpuPower + 80,
    },
    { label: '风道加成', value: '×1.05', active: airflowOk },
    { label: '超频', value: '×1.12', active: ocActive },
    {
      label: '预算效率',
      value: `+${budgetEfficiency}`,
      active: complete && remaining > 0,
    },
  ]

  return {
    parts,
    installed,
    cost,
    remaining,
    power,
    effectivePower,
    psuCap,
    coolerCap,
    cpuPower,
    airflow,
    baseScore,
    multiplier,
    score,
    complete,
    powerOk,
    thermalOk,
    airflowOk,
    budgetOk,
    ocReady,
    ocActive,
    checks,
    breakdown,
  }
}

export function rankOf(score: number): { rank: string; note: string } {
  if (score >= 3200) return { rank: 'S', note: '旗舰级装配 · 可以拿去接单了' }
  if (score >= 2700) return { rank: 'A', note: '高性能主机 · 配置很均衡' }
  if (score >= 2100) return { rank: 'B', note: '主流甜点 · 够用且不浪费' }
  if (score >= 1400) return { rank: 'C', note: '入门配置 · 还能再压榨一点' }
  return { rank: 'D', note: '先把八个部件装齐再跑分' }
}
