/**
 * 03 爆炸图
 *
 * 实现要点（也是这类效果最容易翻车的地方）：
 *  1. 滚动进度写进 ref，不进 React state —— 每帧 re-render 必掉帧
 *  2. 主板作为「视觉锚点」不动，其余部件以它为参照散开，避免全部乱飞
 *  3. 部件浮标用真实 3D 世界坐标投影到屏幕，不是写死的百分比定位
 *  4. 模型在 PCModel 内部做指数阻尼，滚动搓快也不会抖动
 */

import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PCStage } from '@/three/PCStage'
import { PCModel, type Progress } from '@/three/PCModel'
import { LABELED_PART_IDS, PART_BY_ID } from '@/three/partsSpec'
import { GRADIENT_STOPS } from '@/lib/brand'
import { useMediaQuery } from '@/lib/hooks'

gsap.registerPlugin(ScrollTrigger)

const MOBILE_LABELS = ['front-glass', 'motherboard', 'cpu', 'cooler', 'gpu', 'ram', 'psu'] as const

/* -------------------------------------------------------------------------- */
/*  浮标：屏幕层                                                              */
/* -------------------------------------------------------------------------- */

function LabelLayer({
  ids,
  domRefs,
}: {
  ids: readonly string[]
  domRefs: RefObject<(HTMLDivElement | null)[]>
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {ids.map((id, i) => {
        const spec = PART_BY_ID[id]
        const dot = GRADIENT_STOPS[Math.min(i, GRADIENT_STOPS.length - 1)].color
        return (
          <div
            key={id}
            ref={(el) => {
              domRefs.current[i] = el
            }}
            className="absolute top-0 left-0 opacity-0 will-change-transform"
          >
            <div className="flex items-center gap-2 rounded-full border border-white/12 bg-ink-950/78 px-3 py-1.5 whitespace-nowrap backdrop-blur-md">
              <span className="size-1.5 shrink-0 rounded-full" style={{ background: dot }} />
              <span className="text-[11.5px] font-medium text-fg">{spec.label}</span>
              <span className="hidden text-[11px] text-fg-dim lg:inline">{spec.note}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  浮标：3D 层，每帧把世界坐标投影到屏幕                                      */
/* -------------------------------------------------------------------------- */

function LabelProjector({
  ids,
  domRefs,
  rootRef,
  shown,
}: {
  ids: readonly string[]
  domRefs: RefObject<(HTMLDivElement | null)[]>
  rootRef: RefObject<THREE.Group | null>
  shown: Progress
}) {
  const { camera, size } = useThree()
  const v = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const root = rootRef.current
    if (!root) return
    // useFrame 里读 matrixWorld 前必须手动更新，否则拿到的是上一帧的
    root.updateWorldMatrix(true, false)

    const t = shown.current
    // 拆解到一定程度才让浮标浮现
    const labelOpacity = Math.max(0, Math.min(1, (t - 0.14) / 0.26))

    ids.forEach((id, i) => {
      const el = domRefs.current[i]
      if (!el) return
      const spec = PART_BY_ID[id]
      if (!spec) return

      v.set(
        spec.pos[0] + spec.explode[0] * t,
        spec.pos[1] + spec.explode[1] * t,
        spec.pos[2] + spec.explode[2] * t,
      )
        .applyMatrix4(root.matrixWorld)
        .project(camera)

      const x = (v.x * 0.5 + 0.5) * size.width
      const y = (-v.y * 0.5 + 0.5) * size.height

      // 只在屏幕右半边 → 浮标往右挂，反之往左，避免压住模型
      const dir = x > size.width / 2 ? 1 : -1
      if (!el.dataset.w) el.dataset.w = String(el.offsetWidth || 120)
      const w = Number(el.dataset.w)
      const offX = dir * (w / 2 + 14)
      // 相邻部件（内存/CPU 这种）投影下来会挨得很近，按索引错开一点纵向位置
      const offY = [0, -30, 30, -15][i % 4]

      el.style.transform = `translate(-50%,-50%) translate(${x + offX}px, ${y + offY}px)`
      el.style.opacity = String(labelOpacity)
      // 近的浮标压住远的
      el.style.zIndex = String(2000 - Math.round(v.z * 1000))
    })
  })

  return null
}

/* -------------------------------------------------------------------------- */
/*  底部进度读数                                                              */
/* -------------------------------------------------------------------------- */

function ProgressReadout({ progress }: { progress: Progress }) {
  const bar = useRef<HTMLDivElement>(null)
  const txt = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const t = Math.max(0, Math.min(1, progress.current))
      if (bar.current) bar.current.style.transform = `scaleX(${t})`
      if (txt.current) txt.current.textContent = `${String(Math.round(t * 100)).padStart(3, '0')}%`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [progress])

  return (
    <div className="relative z-20 mx-auto w-full max-w-[1400px] px-6 lg:px-10">
      <div className="flex items-center gap-4 border-t border-white/8 pt-4">
        <span className="text-[11px] text-fg-dim">装配态</span>
        <div className="relative h-px flex-1 bg-white/10">
          <div
            ref={bar}
            className="brand-gradient absolute inset-0 origin-left"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
        <span className="text-[11px] text-fg-dim">拆解态</span>
        {/* 百分比是真实测量值，等宽 + tabular-nums 是功能性的，保留 */}
        <span
          ref={txt}
          className="w-14 text-right font-mono text-[11px] tabular-nums text-fg-muted"
        >
          000%
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

export function ExplodedView({ ready }: { ready: boolean }) {
  const section = useRef<HTMLElement>(null)
  const progress = useRef(0)
  /** 阻尼后的真实进度，PCModel 会写进来，浮标读它才能和模型完全同步 */
  const shown = useRef(0)
  const rootRef = useRef<THREE.Group | null>(null)
  const domRefs = useRef<(HTMLDivElement | null)[]>([])
  const isMobile = useMediaQuery('(max-width: 1023px)')

  const ids = useMemo<readonly string[]>(
    () => (isMobile ? MOBILE_LABELS : LABELED_PART_IDS),
    [isMobile],
  )

  useEffect(() => {
    const el = section.current
    if (!el) return
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progress.current = self.progress
      },
    })
    return () => st.kill()
  }, [])

  // 启动动画期间 body 被锁滚动，ScrollTrigger 量出来的高度不准，结束要重算
  useEffect(() => {
    if (!ready) return
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120)
    return () => window.clearTimeout(id)
  }, [ready])

  return (
    <section id="exploded" ref={section} className="relative h-[320vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        {/* 顶部说明 */}
        <div className="relative z-20 mx-auto w-full max-w-[1400px] px-6 pt-24 lg:px-10 lg:pt-28">
          <div className="max-w-[36rem]">
            <h2 className="text-[clamp(1.75rem,3.6vw,2.9rem)] leading-[1.12] font-medium tracking-[-0.025em] text-fg">
              拆开看，
              <span className="brand-text">才知道钱花在哪。</span>
            </h2>
            <p className="mt-5 hidden max-w-[34rem] text-[14.5px] leading-[1.72] text-fg-muted sm:block">
              继续往下滚，整机会沿结构轴分离。每一层都能对上型号，不用猜。
            </p>
          </div>
        </div>

        {/* 3D + 浮标 */}
        <div className="relative min-h-0 flex-1">
          <PCStage camera={[0, 1.6, 8.6]} fov={34} shadow shadowY={-3.1}>
            {/* 这里【不】自转：320vh 的滚动里放任自转，迟早会转到「大侧板正对
                镜头挡住全部内部件」的角度。固定基调 + 轻微飘动，构图才可控。 */}
            <PCModel
              progress={progress}
              yaw={-0.72}
              sway={{ amplitude: 0.09, speed: 0.2 }}
              shownRef={shown}
              rootRef={rootRef}
            />
            <LabelProjector ids={ids} domRefs={domRefs} rootRef={rootRef} shown={shown} />
          </PCStage>
          <LabelLayer ids={ids} domRefs={domRefs} />
        </div>

        {/* 底部进度 */}
        <div className="pb-8">
          <ProgressReadout progress={progress} />
        </div>
      </div>
    </section>
  )
}

export default ExplodedView
