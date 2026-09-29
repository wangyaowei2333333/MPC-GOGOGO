/**
 * 01 启动动画
 *
 * 素材是 logo/视频+1.mp4（1280×720 / 60fps / 5.06s），白底 + MPC 渐变字形
 * 「写」出来，右边带像素消散粒子。为了保证和视频无缝衔接，这一屏的底色
 * 必须和视频的白一致：用 canvas 把播放中的帧画出来逐点采样，实测四角是
 * #FDFDFD（编码后的白不是纯白，之前按 #FBFBFB 填会露一条矩形接缝）。
 *
 * 退场：像素消散粒子爆开 → 白色幕布整体上滑 → 露出深色首屏。
 * 只在同一会话里播一次；prefers-reduced-motion 走静态降级。
 */

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { BRAND } from '@/lib/brand'
import { useLockScroll, usePrefersReducedMotion } from '@/lib/hooks'

const SEEN_KEY = 'mpc:intro-seen'

/**
 * 启动动画的重播间隔。
 *
 * 原来用的是 sessionStorage：同一个标签页看过一次就再也不播，
 * 刷新也算"看过"，所以动态 logo 实际上等于没机会露面。
 *
 * 现在改成时间窗：距上次播放超过这个间隔就再播一次。
 *  - 新访客：看到完整动画
 *  - 连续浏览/刷新：不重复打扰
 *  - 隔一阵再来：又能看到
 * 想要「每次加载都播」，把这个值改成 0 就行。
 */
const INTRO_REPLAY_AFTER_MS = 30 * 60 * 1000

/** 粒子数量与配色 —— 呼应 logo 右上角那几颗消散的像素点 */
const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: 58 + Math.random() * 26,
  top: 38 + Math.random() * 26,
  size: 3 + Math.random() * 9,
  round: Math.random() > 0.6,
  color: ['#FF8A05', '#FF6055', '#E62FA6', '#A824E1', '#722EFF'][i % 5],
}))

/* 幕布底色 = 视频实测底色（canvas 逐点采样），改这里要重新量一次 */
const CURTAIN = '#FDFDFD'

export type IntroProps = {
  onDone: () => void
}

export function Intro({ onDone }: IntroProps) {
  const reduced = usePrefersReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const finished = useRef(false)

  useLockScroll(visible)

  /* 是否跳过：距上次播放不足重播间隔就跳过 */
  useEffect(() => {
    if (typeof window === 'undefined') return
    let last = 0
    try {
      last = Number(localStorage.getItem(SEEN_KEY) ?? 0) || 0
    } catch {
      /* 隐私模式下 localStorage 可能不可用，当作没看过 */
    }
    const skipParam =
      new URLSearchParams(location.search).get('skipIntro') === '1' || location.hash === '#site'
    const recentlySeen = INTRO_REPLAY_AFTER_MS > 0 && Date.now() - last < INTRO_REPLAY_AFTER_MS
    if (skipParam || recentlySeen) {
      setVisible(false)
      onDone()
    }
  }, [onDone])

  /* 退场时间轴 */
  const play = useRef(() => {})
  play.current = () => {
    if (finished.current) return
    finished.current = true
    try {
      localStorage.setItem(SEEN_KEY, String(Date.now()))
    } catch {
      /* 隐私模式下 localStorage 可能不可用，忽略 */
    }

    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.dataset.phase = 'site'
        setVisible(false)
        onDone()
      },
    })

    if (reduced) {
      tl.to('.intro-inner', { autoAlpha: 0, duration: 0.4 }).to(
        '.intro-curtain',
        { yPercent: -100, duration: 0.4, ease: 'power2.inOut' },
        '<',
      )
      return
    }

    tl
      // 字形微微一顶，准备散开
      .to('.intro-logo', { scale: 1.045, duration: 0.5, ease: 'power2.out' }, 0)
      // 像素消散
      .to(
        '.intro-particle',
        {
          x: () => gsap.utils.random(-300, 320),
          y: () => gsap.utils.random(-200, 190),
          rotate: () => gsap.utils.random(-180, 180),
          opacity: 0,
          scale: () => gsap.utils.random(0.3, 1.6),
          duration: 1.15,
          ease: 'power2.out',
          stagger: { amount: 0.4, from: 'random' },
        },
        0.06,
      )
      .to('.intro-inner', { autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 0.5)
      // 露出深色首屏
      .to('.intro-curtain', { yPercent: -100, duration: 1.05, ease: 'expo.inOut' }, 0.62)
      .set(root.current, { display: 'none' })
  }

  /* 视频结束 / 兜底超时 → 退场 */
  useEffect(() => {
    if (!visible) return
    if (reduced) {
      const t = window.setTimeout(() => play.current(), 1100)
      return () => window.clearTimeout(t)
    }
    // 兜底：视频加载不出来或者被拦截时，最多等 7 秒
    const guard = window.setTimeout(() => play.current(), 7000)
    return () => window.clearTimeout(guard)
  }, [visible, reduced])

  if (!visible) return null

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] overflow-hidden"
      role="dialog"
      aria-label="启动动画"
    >
      {/* 白色幕布 */}
      <div className="intro-curtain absolute inset-0" style={{ background: CURTAIN }}>
        <div className="intro-inner absolute inset-0 flex items-center justify-center">
          {/* 视频只占画面中段一小块，放大一点才有开场的气势 */}
          <div className="intro-logo relative" style={{ width: 'min(54vw, 800px)', minWidth: 260 }}>
            {reduced ? (
              <img
                src="./intro-poster.jpg"
                alt={BRAND.title}
                className="w-full select-none"
                draggable={false}
              />
            ) : (
              <video
                ref={video}
                className="block w-full select-none"
                poster="./intro-poster.jpg"
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={() => play.current()}
                onError={() => play.current()}
                onTimeUpdate={(e) => {
                  const v = e.currentTarget
                  if (bar.current && v.duration) {
                    bar.current.style.transform = `scaleX(${v.currentTime / v.duration})`
                  }
                }}
              >
                <source src="./intro.webm" type="video/webm" />
                <source src="./intro.mp4" type="video/mp4" />
              </video>
            )}

            {/* 像素消散粒子，位置对齐 logo 字形的右侧 */}
            {!reduced &&
              PARTICLES.map((p) => (
                <span
                  key={p.id}
                  className="intro-particle pointer-events-none absolute"
                  style={{
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    width: p.size,
                    height: p.size,
                    background: p.color,
                    borderRadius: p.round ? '50%' : 2,
                  }}
                />
              ))}
          </div>
        </div>

        {/* 底部进度条 */}
        {!reduced && (
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-black/[0.06]">
            <div
              ref={bar}
              className="brand-gradient h-full origin-left"
              style={{ transform: 'scaleX(0)' }}
            />
          </div>
        )}
      </div>

      {/* 跳过 */}
      <button
        type="button"
        onClick={() => play.current()}
        className="absolute right-6 bottom-6 z-10 cursor-pointer border-none bg-transparent text-[12.5px] text-black/40 transition-colors hover:text-black/75"
      >
        跳过 SKIP
      </button>
    </div>
  )
}

export default Intro
