/**
 * 02 首屏 Hero
 *
 * 左侧文案 + 右侧 3D 整机。整机自转，鼠标移动时做视差 —— 视差在
 * HeroModel 里读 R3F 的 state.pointer，不额外挂监听。
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PCStage } from '@/three/PCStage'
import { PCModel, type Progress } from '@/three/PCModel'
import { BRAND } from '@/lib/brand'

const FEATURES = ['3D 结构拆解', '实时兼容校验', '配置可保存分享']

function HeroModel({ progress }: { progress: Progress }) {
  const tilt = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const g = tilt.current
    if (!g) return
    const { x, y } = state.pointer
    // damp 让视差有惯性，不是硬跟手
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -y * 0.2, 4, delta)
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, x * 0.05, 4, delta)
  })

  return (
    <group ref={tilt}>
      {/* 用摆动而不是自转：一直停在能同时看到正面 + 侧面的 3/4 视角。
          无脑自转在方正机箱上会周期性转成「面板正对镜头」，那一下就变成一张平面。 */}
      <PCModel progress={progress} sway={{ amplitude: 0.26, speed: 0.3 }} />
    </group>
  )
}

export function Hero() {
  const progress = useRef(0)

  return (
    <section id="hero" className="relative flex min-h-[100svh] items-center overflow-hidden pt-16">
      {/* 品牌色氛围光。原来是 opacity .14-.16 + 110px 模糊，等于给首屏挂了三盏
          霓虹灯；调低到 .05-.08，只留一层底色，把注意力还给产品和文案。 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-[18%] -left-[10%] size-[52vw] rounded-full opacity-[0.07] blur-[110px]"
          style={{ background: 'radial-gradient(circle, #FF8A05 0%, transparent 68%)' }}
        />
        <div
          className="absolute -right-[8%] top-[6%] size-[46vw] rounded-full opacity-[0.08] blur-[120px]"
          style={{ background: 'radial-gradient(circle, #722EFF 0%, transparent 68%)' }}
        />
        <div
          className="absolute bottom-[-14%] left-[34%] size-[38vw] rounded-full opacity-[0.05] blur-[110px]"
          style={{ background: 'radial-gradient(circle, #E62FA6 0%, transparent 68%)' }}
        />
        {/* 细网格，科技感基线 */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
            backgroundSize: '68px 68px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #000 30%, transparent 78%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 80% 60% at 50% 40%, #000 30%, transparent 78%)',
          }}
        />
      </div>

      {/* 首屏从「规整的两栏切割」改成层叠：文案占 1-6 列、模型占 5-12 列，
          第 5-6 列重叠，文案在上层（z-20），标题右侧会压到模型画布上。
          这样模型能更大，构图也不再是左右各一半的对称切分。 */}
      <div className="relative mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-6 px-6 lg:grid-cols-12 lg:gap-4 lg:px-10">
        {/* ---------------------------- 文案 ---------------------------- */}
        {/* lg 下两栏要在同一行重叠，所以行和列都必须显式写死。
            只写 col-start 是不够的：CSS Grid 的 auto-placement 按 order 顺序处理，
            3D 那栏 order-1 先被放到第 1 行 5-12 列，光标移到了第 12 列之后，
            这一栏的 col-start-1 落在光标之前，就会被挤到第 2 行去。
            lg:relative 是为了让 z-20 生效（静态定位下 z-index 无效）。 */}
        <div className="order-2 lg:relative lg:z-20 lg:col-span-6 lg:col-start-1 lg:row-start-1">
          {/* 这里原来是一行「等宽字体 + 0.3em 字距 + 彩色圆点」的标签，
              三个 AI 痕迹叠在一起。品牌名已经写在 logo 里，这里只需要全称。 */}
          <p
            className="mpc-rise mb-5 text-[12.5px] tracking-[0.02em] text-fg-dim"
            style={{ animationDelay: '80ms' }}
          >
            {BRAND.fullName}
          </p>

          <h1
            className="mpc-rise text-[clamp(2.1rem,5.4vw,4rem)] leading-[1.06] font-medium tracking-[-0.03em] text-fg"
            style={{ animationDelay: '180ms' }}
          >
            把一台主机
            <br />
            做到<span className="brand-text">刚好</span>。
          </h1>

          <p
            className="mpc-rise mt-6 max-w-[30rem] text-[15px] leading-[1.75] text-fg-muted"
            style={{ animationDelay: '290ms' }}
          >
            极客手工组装的成品电脑。先在这里把结构看懂、把配置配明白，
            <span className="text-fg">每一颗螺丝都上得明明白白</span>，再决定要不要。
          </p>

          <div className="mpc-rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: '400ms' }}>
            <a
              href="#configurator"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-6 py-3 text-[14px] font-medium text-white transition-transform duration-300 hover:scale-[1.03] active:scale-[0.99]"
              style={{ background: 'linear-gradient(97deg,#FF8A05,#E62FA6 52%,#722EFF)' }}
            >
              开始配置
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
            <a
              href="#exploded"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-[14px] text-fg transition-colors hover:border-white/35 hover:bg-white/5"
            >
              看拆解图
            </a>
          </div>

          <ul
            className="mpc-rise mt-12 flex flex-wrap items-center gap-x-7 gap-y-2.5 border-t border-white/8 pt-6"
            style={{ animationDelay: '500ms' }}
          >
            {FEATURES.map((f) => (
              <li key={f} className="text-[12.5px] text-fg-dim">
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* ---------------------------- 3D ---------------------------- */}
        <div className="order-1 lg:col-span-8 lg:col-start-5 lg:row-start-1">
          <div className="relative h-[42svh] min-h-[280px] w-full lg:h-[76svh]">
            <PCStage camera={[4.0, 2.2, 4.8]} fov={34} shadow>
              <HeroModel progress={progress} />
            </PCStage>
          </div>
        </div>
      </div>

      {/* 滚动提示 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center lg:flex">
        <div className="flex flex-col items-center gap-2 text-fg-dim">
          <span className="text-[11px] text-fg-dim">向下滚动</span>
          <span className="block h-9 w-px bg-gradient-to-b from-white/35 to-transparent" />
        </div>
      </div>
    </section>
  )
}

export default Hero
