import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CATEGORIES,
  categoryOf,
  partById,
  type Category,
  type Part,
} from './data/parts'
import { derive, emptyBuild, rankOf, type Build, type Derived } from './lib/game'
import { Hud } from './components/Hud'
import { PartLibrary } from './components/PartLibrary'
import { Bench } from './components/Bench'
import { Inspector } from './components/Inspector'
import { Backdrop, BootOverlay, ResultOverlay, Toast } from './components/Overlays'

const STORAGE_KEY = 'rig-bench:build:v1'

type Phase = 'build' | 'booting' | 'result'
type ToastKind = 'ok' | 'warn' | 'err'

interface ResultSnapshot {
  score: number
  rank: string
  note: string
  derived: Derived
}

function loadSaved(): { build: Build; overclock: boolean } {
  const build = emptyBuild()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { build, overclock: false }
    const data = JSON.parse(raw) as { build?: Partial<Build>; overclock?: boolean }
    for (const cat of CATEGORIES) {
      const part = partById(data.build?.[cat.key] ?? null)
      if (part && part.cat === cat.key) build[cat.key] = part.id
    }
    return { build, overclock: Boolean(data.overclock) }
  } catch {
    return { build, overclock: false }
  }
}

export default function App() {
  const saved = useMemo(loadSaved, [])
  const [build, setBuild] = useState<Build>(saved.build)
  const [overclock, setOverclock] = useState(saved.overclock)
  const [selected, setSelected] = useState<Part | null>(null)
  const [tab, setTab] = useState<Category>('cpu')
  const [phase, setPhase] = useState<Phase>('build')
  const [result, setResult] = useState<ResultSnapshot | null>(null)
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null)
  const [mismatch, setMismatch] = useState<Category | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const toastTimer = useRef<number | null>(null)
  const bootTimer = useRef<number | null>(null)
  const shakeTimer = useRef<number | null>(null)

  const derived = useMemo(() => derive(build, overclock), [build, overclock])

  const notify = useCallback((message: string, kind: ToastKind = 'ok') => {
    setToast({ message, kind })
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }, [])

  // 存档
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ build, overclock }))
    } catch {
      /* 隐私模式下忽略 */
    }
  }, [build, overclock])

  // 计时
  useEffect(() => {
    if (phase !== 'build') return
    const timer = window.setInterval(() => setElapsed((v) => v + 1), 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
      if (bootTimer.current) window.clearTimeout(bootTimer.current)
      if (shakeTimer.current) window.clearTimeout(shakeTimer.current)
    }
  }, [])

  // 拆件后如果不再满足超频条件，自动回到默认频率
  useEffect(() => {
    if (overclock && !derived.ocReady) setOverclock(false)
  }, [overclock, derived.ocReady])

  const handleTab = useCallback((cat: Category) => setTab(cat), [])

  const handleSelect = useCallback(
    (part: Part) => {
      const current = partById(build[part.cat])
      const budgetForThis = derived.remaining + (current?.price ?? 0)
      if (part.price > budgetForThis) {
        notify(
          `预算不足：还差 ¥${(part.price - budgetForThis).toLocaleString('en-US')}，先换掉一个贵件`,
          'err',
        )
        return
      }
      setSelected(part)
      if (build[part.cat] === part.id) {
        notify(`${part.name} 已经装在机上了`, 'warn')
      } else {
        notify(`已选中 ${part.name} · 点击${categoryOf(part.cat).label}插槽安装`, 'ok')
      }
    },
    [build, derived.remaining, notify],
  )

  const handleSlot = useCallback(
    (cat: Category) => {
      const current = partById(build[cat])
      const catLabel = categoryOf(cat).label

      // 同类别换件：直接替换，按差价校验预算
      if (current && selected && selected.cat === cat && selected.id !== current.id) {
        const delta = selected.price - current.price
        if (delta > derived.remaining) {
          notify('预算不足，这件换不上去', 'err')
          return
        }
        setBuild((b) => ({ ...b, [cat]: selected.id }))
        setSelected(null)
        notify(`${current.name} → ${selected.name} 替换完成`, 'ok')
        return
      }

      if (current) {
        setBuild((b) => ({ ...b, [cat]: null }))
        notify(`${current.name} 已卸下`, 'ok')
        return
      }

      if (!selected) {
        notify(`先在左侧选一个${catLabel}部件`, 'warn')
        return
      }

      if (selected.cat !== cat) {
        setMismatch(cat)
        if (shakeTimer.current) window.clearTimeout(shakeTimer.current)
        shakeTimer.current = window.setTimeout(() => setMismatch(null), 480)
        notify(
          `槽位不匹配：${selected.name} 是${categoryOf(selected.cat).label}，不是${catLabel}`,
          'err',
        )
        return
      }

      if (selected.price > derived.remaining) {
        notify('预算不足，装不下这个配置', 'err')
        return
      }

      const nextBuild: Build = { ...build, [cat]: selected.id }
      setBuild(nextBuild)
      setSelected(null)
      notify(`${selected.name} 安装到位`, 'ok')

      // 自动跳到下一个空槽位，连续装机的节奏更顺
      const nextEmpty = CATEGORIES.find((c) => !nextBuild[c.key])
      if (nextEmpty) setTab(nextEmpty.key)
    },
    [build, selected, derived.remaining, notify],
  )

  const handleToggleOc = useCallback(() => {
    if (!overclock && !derived.ocReady) {
      notify('超频需要：装齐 8 件，且供电与散热各留 60W 余量', 'warn')
      return
    }
    setOverclock((v) => {
      notify(v ? '超频已关闭' : '超频已开启 · +12% 性能 / +60W', 'ok')
      return !v
    })
  }, [overclock, derived.ocReady, notify])

  const handlePower = useCallback(() => {
    if (phase !== 'build') return
    if (!derived.complete) {
      notify(`还差 ${CATEGORIES.length - derived.installed} 个部件，装齐再启动`, 'warn')
      return
    }
    if (!derived.powerOk) notify('供电不足，启动后性能会被压制', 'warn')
    setPhase('booting')
    bootTimer.current = window.setTimeout(() => {
      const r = rankOf(derived.score)
      setResult({ score: derived.score, rank: r.rank, note: r.note, derived })
      setPhase('result')
    }, 2300)
  }, [phase, derived, notify])

  const handleReset = useCallback(() => {
    if (bootTimer.current) window.clearTimeout(bootTimer.current)
    setBuild(emptyBuild())
    setOverclock(false)
    setSelected(null)
    setTab('cpu')
    setElapsed(0)
    setPhase('build')
    setResult(null)
    notify('工作台已重置', 'ok')
  }, [notify])

  const handleRestart = useCallback(() => {
    handleReset()
  }, [handleReset])

  const handleCloseResult = useCallback(() => {
    setPhase('build')
    setResult(null)
  }, [])

  return (
    <div className="game">
      <Backdrop />

      <Hud cost={derived.cost} installed={derived.installed} elapsed={elapsed} />

      <main className="stage">
        <PartLibrary
          tab={tab}
          build={build}
          selected={selected}
          derived={derived}
          onTab={handleTab}
          onSelect={handleSelect}
        />
        <Bench
          build={build}
          selected={selected}
          derived={derived}
          mismatch={mismatch}
          onSlot={handleSlot}
        />
        <Inspector
          derived={derived}
          overclock={overclock}
          booting={phase === 'booting'}
          onToggleOc={handleToggleOc}
          onPower={handlePower}
          onReset={handleReset}
        />
      </main>

      {toast && <Toast message={toast.message} kind={toast.kind} />}

      {phase === 'booting' && <BootOverlay />}

      {phase === 'result' && result && (
        <ResultOverlay
          score={result.score}
          rank={result.rank}
          note={result.note}
          derived={result.derived}
          onRestart={handleRestart}
          onClose={handleCloseResult}
        />
      )}
    </div>
  )
}
