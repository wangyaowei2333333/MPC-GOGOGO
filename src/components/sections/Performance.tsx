import { hardware, formatUpdatedAt } from '@/data'
import { Section, SectionHead, EmptyState } from '@/components/ui/Section'

export function Performance() {
  const rows = hardware.models.flatMap((m) =>
    (m.benchmarks ?? []).map((b) => ({ ...b, model: m.name })),
  )
  const max = rows.reduce((acc, r) => Math.max(acc, r.value || 0), 0)

  return (
    <Section id="performance">
      <SectionHead
        title={
          <>
            跑分不吹，
            <br />
            测出来多少写多少。
          </>
        }
        desc="数据全部来自整机烤机与实机游戏测试。没测过的项目不会出现在这里。"
        aside={
          rows.length > 0 ? (
            <div className="text-[12px] text-fg-dim">
              数据更新于 {formatUpdatedAt(hardware.updatedAt)}
            </div>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="实测数据陆续补充中"
          hint="跑分和温度数据等你实测完填进来就会自动显示。没有数据时这里不会出现任何编造的数字。"
          file="src/data/hardware.json → models[].benchmarks"
        />
      ) : (
        <ul className="flex flex-col gap-7">
          {rows.map((r, i) => (
            <li key={`${r.model}-${r.label}-${i}`} className="reveal-item">
              <div className="mb-2.5 flex items-baseline justify-between gap-4">
                <span className="text-[13.5px] text-fg">{r.label}</span>
                <span className="shrink-0 font-mono text-[13px] tabular-nums text-fg-muted">
                  {r.value}
                  {r.unit ? ` ${r.unit}` : ''}
                </span>
              </div>
              <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className="brand-gradient h-full origin-left rounded-full transition-[width] duration-1000 ease-[cubic-bezier(.16,1,.3,1)]"
                  style={{ width: `${max > 0 ? Math.max(2, (r.value / max) * 100) : 0}%` }}
                />
              </div>
              <span className="mt-1.5 block text-[11.5px] text-fg-dim">{r.model}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

export default Performance
