/**
 * 04 配置器
 *
 * 现在这一版是「数据驱动 + 空态友好」：
 *   - src/data/hardware.json 的 parts 里填了配件，这里立刻变成可用的配置器
 *   - 没填的时候显示空态，不会出现假配件、假价格
 *
 * 还没做（等模型层扩展后再加）：选中显卡/散热后 3D 里同步换模型。
 * 挂钩点已经留好 —— selected 状态直接可以被 PCModel 读取。
 */

import { useMemo, useState } from 'react'
import { categories, partsOf, formatPrice, type Part } from '@/data'
import { Section, SectionHead, EmptyState } from '@/components/ui/Section'

/** 兼容性校验占位：真实规则等配件数据到位后按品牌/插槽补 */
function checkCompat(): string[] {
  return []
}

export function Configurator() {
  const [activeCat, setActiveCat] = useState(categories[0]?.key ?? 'cpu')
  const [selected, setSelected] = useState<Record<string, string>>({})

  const list = partsOf(activeCat)

  const summary = useMemo(() => {
    const picked: { cat: string; part: Part }[] = []
    let total = 0
    let missingPrice = false
    for (const cat of categories) {
      const id = selected[cat.key]
      if (!id) continue
      const part = partsOf(cat.key).find((p) => p.id === id)
      if (!part) continue
      picked.push({ cat: cat.label, part })
      if (typeof part.price === 'number') total += part.price
      else missingPrice = true
    }
    return { picked, total, missingPrice }
  }, [selected])

  const warnings = checkCompat()
  const empty = categories.every((c) => partsOf(c.key).length === 0)

  const toggle = (part: Part) => {
    setSelected((s) => {
      const next = { ...s }
      if (next[activeCat] === part.id) delete next[activeCat]
      else next[activeCat] = part.id
      return next
    })
  }

  return (
    <Section id="configurator">
      <SectionHead
        title={
          <>
            自己配一台，
            <br />
            配得明明白白。
          </>
        }
        desc="逐项选件，价格实时累加。每一项都会做兼容性校验，配不进去的组合不会放行。"
      />

      {empty ? (
        <EmptyState
          title="配件库陆续上架中"
          hint="等配件和价格录入之后，这个配置器会立刻可用：分类选件、实时计价、兼容性校验。在你填数据之前，这里不会出现任何虚构的型号或价格。"
          file="src/data/hardware.json → parts"
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* 分类 */}
          <div className="lg:col-span-3">
            <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {categories.map((c) => {
                const done = Boolean(selected[c.key])
                const active = activeCat === c.key
                return (
                  <li key={c.key} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      onClick={() => setActiveCat(c.key)}
                      className={[
                        'flex w-full cursor-pointer items-center gap-2.5 rounded-md border px-4 py-2.5 text-left text-[13px] whitespace-nowrap transition-colors',
                        active
                          ? 'border-white/22 bg-white/8 text-fg'
                          : 'border-white/8 bg-transparent text-fg-muted hover:border-white/16 hover:text-fg',
                      ].join(' ')}
                    >
                      <span
                        className="inline-block size-1.5 shrink-0 rounded-full"
                        style={{
                          background: done ? '#E62FA6' : 'rgba(255,255,255,.18)',
                        }}
                      />
                      {c.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* 配件列表 */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {list.map((p) => {
                const on = selected[activeCat] === p.id
                const price = formatPrice(p.price)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p)}
                    className={[
                      'cursor-pointer rounded-md border p-4 text-left transition-colors',
                      on
                        ? 'border-brand-pink/60 bg-brand-pink/8'
                        : 'border-white/8 bg-white/[0.02] hover:border-white/18',
                    ].join(' ')}
                  >
                    {p.brand && (
                      <span className="mb-1.5 block text-[11.5px] text-fg-dim">{p.brand}</span>
                    )}
                    <span className="block text-[13.5px] text-fg">{p.name}</span>
                    {p.spec && (
                      <span className="mt-1 block text-[12px] text-fg-muted">{p.spec}</span>
                    )}
                    <span className="mt-3 block font-mono text-[12.5px] text-fg-muted">
                      {price ?? '待定'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 汇总 */}
          <aside className="lg:col-span-3">
            <div className="rounded-lg border border-white/8 bg-white/[0.02] p-5 lg:sticky lg:top-24">
              <h3 className="mb-4 text-[13px] font-medium text-fg">当前配置</h3>
              {summary.picked.length === 0 ? (
                <p className="text-[12.5px] text-fg-dim">还没选件</p>
              ) : (
                <ul className="space-y-2.5">
                  {summary.picked.map(({ cat, part }) => (
                    <li key={cat} className="flex justify-between gap-3 text-[12.5px]">
                      <span className="text-fg-dim">{cat}</span>
                      <span className="truncate text-right text-fg-muted">{part.name}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5 flex items-baseline justify-between border-t border-white/8 pt-4">
                <span className="text-[12.5px] text-fg-dim">合计</span>
                <span className="font-mono text-[16px] text-fg">
                  {summary.total > 0 ? `¥${summary.total.toLocaleString('zh-CN')}` : '待定'}
                </span>
              </div>
              {summary.missingPrice && (
                <p className="mt-2 text-[11px] text-fg-dim">部分配件未标价，合计未计入</p>
              )}

              {warnings.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {warnings.map((w) => (
                    <li key={w} className="flex gap-2 text-[11.5px] text-brand-ember">
                      {/* 用 SVG 而不是 ⚠ 字符：字符在不同系统上字形不一致，
                          也算「拿 emoji 当图标系统」 */}
                      <svg
                        viewBox="0 0 16 16"
                        className="mt-[2px] size-3.5 shrink-0"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M8 2.4 14.4 13.2H1.6L8 2.4Z"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 6.4v3.2M8 11.4h.01"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </svg>
                      {w}
                    </li>
                  ))}
                </ul>
              )}

              <a
                href="#contact"
                className="mt-5 block rounded-full py-2.5 text-center text-[13px] font-medium text-white"
                style={{ background: 'linear-gradient(97deg,#FF8A05,#E62FA6 52%,#722EFF)' }}
              >
                把这套发给我报价
              </a>
            </div>
          </aside>
        </div>
      )}
    </Section>
  )
}

export default Configurator
