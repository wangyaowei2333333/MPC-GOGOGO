import type { ReactNode } from 'react'
import { useReveal } from '@/lib/hooks'

/**
 * 区段标题。
 *
 * 这里原本有一行 `{index} / {label}` 小标签（「03 / 结构」「09 / 联系」）。
 * 已删除：编号本身不携带读者需要的信息，纯装饰，而且是 AI 生成页面最
 * 常见的痕迹之一。标题自己足够把话说清楚。
 *
 * 标题走 .reveal-mask（遮罩揭示），正文走 .reveal（纯淡入），两层节奏
 * 不同，滚动时才有层次，不再是每节复制同一段淡入。
 */
export function SectionHead({
  title,
  desc,
  aside,
}: {
  title: ReactNode
  desc?: ReactNode
  aside?: ReactNode
}) {
  return (
    <div className="mb-12 flex flex-col gap-6 lg:mb-16 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-[42rem]">
        <h2 className="reveal-mask text-[clamp(1.75rem,3.6vw,2.9rem)] leading-[1.12] font-medium tracking-[-0.025em] text-fg">
          {title}
        </h2>
        {desc && (
          <p className="reveal mt-5 max-w-[36rem] text-[14.5px] leading-[1.75] text-fg-muted">
            {desc}
          </p>
        )}
      </div>
      {aside && <div className="reveal shrink-0">{aside}</div>}
    </div>
  )
}

/**
 * 区段外壳。间距分三档：内容越重越需要喘息，就给越多留白。
 * 原来九个区段全是同一个 py-24 lg:py-32，滚起来像节拍器。
 */
export function Section({
  id,
  children,
  className = '',
  size = 'md',
}: {
  id: string
  children: ReactNode
  className?: string
  /** sm = 紧凑列表 / md = 常规 / lg = 主角区段，给大留白 */
  size?: 'sm' | 'md' | 'lg'
}) {
  const ref = useReveal<HTMLElement>()
  const pad = { sm: 'py-20 lg:py-24', md: 'py-24 lg:py-32', lg: 'py-28 lg:py-44' }[size]
  return (
    <section id={id} ref={ref} className={`relative ${pad} ${className}`}>
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">{children}</div>
    </section>
  )
}

/** 空数据占位：不编数据，直接说明「还没上」 */
export function EmptyState({
  title,
  hint,
  file,
}: {
  title: string
  hint: string
  file?: string
}) {
  return (
    <div className="reveal flex flex-col items-start gap-3 rounded-lg border border-dashed border-white/12 bg-white/[0.015] px-6 py-10">
      <div className="flex items-center gap-2.5">
        <span
          className="inline-block size-2 rounded-full"
          style={{ animation: 'mpc-pulse-dot 2.4s ease-in-out infinite', background: '#E62FA6' }}
        />
        <span className="text-[14px] font-medium text-fg">{title}</span>
      </div>
      <p className="max-w-[38rem] text-[13px] leading-[1.7] text-fg-dim">{hint}</p>
      {file && (
        <code className="rounded border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11.5px] text-fg-muted">
          {file}
        </code>
      )}
    </div>
  )
}
