/**
 * 吉祥物小机器人
 * ---------------------------------------------------------------------------
 * 在页面底部来回溜达，会眨眼、转身、撞边回头，点一下会跳起来说话。
 *
 * 想关掉：把 ENABLE_MASCOT 改成 false，或者整行删掉 <Mascot /> 即可。
 * 想换成你自己的卡通形象：把下面的 <BotSvg /> 换成你的 SVG / 图片就行，
 * 走动逻辑不用动 —— 它只关心容器的宽高。
 */

import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/lib/hooks'

export const ENABLE_MASCOT = true

const SIZE = 76
/** 撞边后停顿的时间范围（毫秒） */
const PAUSE = [700, 1900]
/** 点击时的台词 */
const LINES = [
  '配置有不懂的可以问我',
  '先看结构，再谈价格',
  '这台我刚装完，还没上架',
  '点我一下，我也不会降价',
  '配件陆续上架中…',
  '别忘了看爆炸图',
]

type Mode = 'walk' | 'pause' | 'react'
type Eyes = 'open' | 'blink' | 'happy'

function BotSvg({ eyes, walking }: { eyes: Eyes; walking: boolean }) {
  const legA = walking ? 'mpc-leg-a 0.42s linear infinite' : undefined
  const legB = walking ? 'mpc-leg-b 0.42s linear infinite' : undefined

  return (
    <svg viewBox="0 0 64 64" className="size-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="mascotGrad" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#FF8A05" />
          <stop offset="0.46" stopColor="#E62FA6" />
          <stop offset="1" stopColor="#722EFF" />
        </linearGradient>
      </defs>

      {/* 天线 */}
      <path d="M32 17 L32 9" stroke="#A1A1AA" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="32" cy="7.4" r="2.6" fill="#E62FA6">
        <animate
          attributeName="opacity"
          values="1;0.35;1"
          dur="2.2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* 腿 */}
      <rect x="20" y="48" width="7" height="9" rx="2.5" fill="#2A2A36" style={{ animation: legA }} />
      <rect x="37" y="48" width="7" height="9" rx="2.5" fill="#2A2A36" style={{ animation: legB }} />

      {/* 胳膊 */}
      <rect x="4.5" y="26" width="6.5" height="13" rx="3.2" fill="url(#mascotGrad)" />
      <rect x="53" y="26" width="6.5" height="13" rx="3.2" fill="url(#mascotGrad)" />

      {/* 身体 */}
      <rect x="10" y="16" width="44" height="34" rx="11" fill="url(#mascotGrad)" />
      <rect x="10" y="16" width="44" height="34" rx="11" fill="#fff" opacity="0.08" />

      {/* 面屏 */}
      <rect x="16.5" y="22.5" width="31" height="19" rx="6.5" fill="#0A0A0F" />

      {/* 眼睛 */}
      {eyes === 'blink' ? (
        <>
          <rect x="21.6" y="31.4" width="7" height="1.6" rx="0.8" fill="#F5F5F7" />
          <rect x="35.4" y="31.4" width="7" height="1.6" rx="0.8" fill="#F5F5F7" />
        </>
      ) : eyes === 'happy' ? (
        <>
          <path
            d="M21.6 32.4 Q25.1 28.6 28.6 32.4"
            fill="none"
            stroke="#F5F5F7"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M35.4 32.4 Q38.9 28.6 42.4 32.4"
            fill="none"
            stroke="#F5F5F7"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="25.1" cy="31.2" r="3.2" fill="#F5F5F7" />
          <circle cx="38.9" cy="31.2" r="3.2" fill="#F5F5F7" />
          <circle cx="26.2" cy="30.2" r="1" fill="#0A0A0F" />
          <circle cx="40" cy="30.2" r="1" fill="#0A0A0F" />
        </>
      )}
    </svg>
  )
}

export function Mascot() {
  const reduced = usePrefersReducedMotion()
  const wrap = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [mode, setMode] = useState<Mode>('walk')
  const [eyes, setEyes] = useState<Eyes>('open')
  const [facing, setFacing] = useState(1)
  const [line, setLine] = useState<string | null>(null)
  const [reactKey, setReactKey] = useState(0)

  /** 走动状态放 ref，避免每帧 setState */
  const pos = useRef({ x: 60, dir: 1 as 1 | -1, bob: 0 })
  const modeRef = useRef<Mode>('walk')
  modeRef.current = mode

  /* 主循环 */
  useEffect(() => {
    if (reduced) return
    let raf = 0
    let last = performance.now()
    let pauseUntil = 0

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const el = wrap.current
      if (el) {
        const maxX = Math.max(0, window.innerWidth - SIZE - 16)
        const p = pos.current

        if (modeRef.current === 'walk') {
          p.x += p.dir * 34 * dt
          p.bob += dt * 9
          if (p.x <= 8) {
            p.x = 8
            p.dir = 1
            setFacing(1)
            setMode('pause')
            pauseUntil = now + PAUSE[0] + Math.random() * (PAUSE[1] - PAUSE[0])
          } else if (p.x >= maxX) {
            p.x = maxX
            p.dir = -1
            setFacing(-1)
            setMode('pause')
            pauseUntil = now + PAUSE[0] + Math.random() * (PAUSE[1] - PAUSE[0])
          }
        } else if (modeRef.current === 'pause') {
          p.bob += dt * 3
          if (now >= pauseUntil) {
            setMode('walk')
            // 停顿完随机决定要不要回头
            if (Math.random() < 0.35) {
              p.dir = (p.dir * -1) as 1 | -1
              setFacing(p.dir)
            }
          }
        } else {
          p.bob += dt * 14
        }

        const lift = modeRef.current === 'walk' ? Math.abs(Math.sin(p.bob)) * 3 : 0
        el.style.transform = `translate3d(${p.x}px, ${-lift}px, 0)`
      }
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  /* 眨眼 */
  useEffect(() => {
    if (reduced) return
    let t: number
    const blink = () => {
      setEyes((e) => (e === 'open' ? 'blink' : 'open'))
      t = window.setTimeout(blink, 180 + Math.floor(Math.random() * 140))
      window.setTimeout(() => setEyes('open'), 200)
      t = window.setTimeout(blink, 1800 + Math.random() * 3200)
    }
    t = window.setTimeout(blink, 1500)
    return () => window.clearTimeout(t)
  }, [reduced])

  /* 出现时机 */
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 400)
    return () => window.clearTimeout(id)
  }, [])

  const onClick = () => {
    setLine(LINES[Math.floor(Math.random() * LINES.length)])
    setEyes('happy')
    setReactKey((k) => k + 1)
    setMode('react')
    window.setTimeout(() => {
      setEyes('open')
      setMode('walk')
    }, 1700)
    window.setTimeout(() => setLine(null), 2600)
  }

  if (!ENABLE_MASCOT) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-3 z-30 hidden select-none md:block"
    >
      <div
        ref={wrap}
        className="absolute bottom-0 left-0 will-change-transform"
        style={{ opacity: ready ? 1 : 0, transition: 'opacity .5s ease' }}
      >
        {/* 点击时的对话气泡 */}
        <div
          className="absolute bottom-[86%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/12 bg-ink-950/90 px-3 py-1.5 text-[11.5px] text-fg backdrop-blur-md transition-opacity duration-300"
          style={{ opacity: line ? 1 : 0 }}
        >
          {line ?? ''}
        </div>

        <button
          key={reactKey}
          type="button"
          onClick={onClick}
          aria-label="点我一下"
          className="pointer-events-auto block cursor-pointer border-none bg-transparent p-0"
          style={{
            width: SIZE,
            height: SIZE,
            animation: mode === 'react' ? 'mpc-mascot-jump .5s ease' : undefined,
          }}
        >
          <BotSvg eyes={eyes} walking={mode === 'walk' && !reduced} />
        </button>
      </div>
    </div>
  )
}

export default Mascot
