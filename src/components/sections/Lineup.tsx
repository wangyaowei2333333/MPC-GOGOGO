import { hardware, formatPrice, type Model } from '@/data'
import { Section, SectionHead, EmptyState } from '@/components/ui/Section'

/** 配件清单的展示顺序与中文名 */
const PART_LABELS: [string, string][] = [
  ['cpu', 'CPU'],
  ['gpu', '显卡'],
  ['motherboard', '主板'],
  ['ram', '内存'],
  ['storage', '存储'],
  ['cooler', '散热'],
  ['psu', '电源'],
  ['case', '机箱'],
]

type CardSize = 'feature' | 'compact' | 'plain'

/**
 * 12 列网格里的跨度。首台占左 7 列、跨 2 行；第 2/3 台占右 5 列，各占 1 行；
 * 之后每行 3 台。
 *
 * 为什么首台要跨 2 行而不是自己定高：这样右栏两张小卡的高度和，
 * 天然等于首台的高度，三张卡在同一视觉带里对齐，不会出现「一张特别高、
 * 旁边空一大截」的断层。前提是小卡必须是横版（图在左）——竖版 4:3 图会让
 * 每张小卡长到 670px 上下，首台就会被拉到 1390px，整段崩掉。
 */
const SPAN: Record<CardSize, string> = {
  feature: 'lg:col-span-7 lg:row-span-2',
  compact: 'lg:col-span-5',
  plain: 'lg:col-span-4',
}

/** 小卡只挑前 4 项，横版卡塞不下全套 → 也不会把高度撑起来 */
const COMPACT_PART_LIMIT = 4

function ModelCard({ m, size }: { m: Model; size: CardSize }) {
  const horizontal = size !== 'plain'
  const price = formatPrice(m.price)
  const allParts = PART_LABELS.filter(([k]) => m.parts?.[k])
  const parts = size === 'compact' ? allParts.slice(0, COMPACT_PART_LIMIT) : allParts

  return (
    <article
      className={[
        'reveal-item group relative flex flex-col overflow-hidden rounded-xl border bg-white/[0.02] transition-colors',
        SPAN[size],
        size === 'feature'
          ? 'border-white/10 hover:border-white/20 lg:flex-row'
          : size === 'compact'
            ? 'border-white/8 hover:border-white/16 lg:flex-row'
            : 'border-white/8 hover:border-white/16',
      ].join(' ')}
    >
      <div
        className={[
          'relative overflow-hidden bg-white/[0.03]',
          horizontal ? 'aspect-[4/3] lg:aspect-auto lg:shrink-0' : 'aspect-[4/3]',
          size === 'feature' ? 'lg:w-[46%]' : size === 'compact' ? 'lg:w-[38%]' : '',
        ].join(' ')}
      >
        {m.cover ? (
          <img
            src={m.cover}
            alt={m.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center gap-3">
            {/* 空图槽说清楚是待补，免得看起来像加载失败 */}
            <span className="brand-gradient h-px w-14" />
            <span className="text-[11px] text-fg-dim lg:hidden">实拍图待补</span>
          </div>
        )}
      </div>

      {/* 首台跨两行，高度由右边两张小卡决定；内容必须垂直居中，
          不能被 flex-1 / space-y 摊开，否则部件行之间会出现大片空隙。 */}
      <div
        className={[
          'flex flex-1 flex-col',
          size === 'feature' ? 'justify-center p-6 lg:p-8' : 'p-5 lg:p-6',
        ].join(' ')}
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3
            className={
              size === 'feature'
                ? 'text-[19px] leading-[1.25] font-medium tracking-[-0.02em] text-fg'
                : 'text-[16px] font-medium text-fg'
            }
          >
            {m.name}
          </h3>
          {m.formFactor && (
            <span className="shrink-0 text-[11.5px] text-fg-dim">{m.formFactor}</span>
          )}
        </div>

        {m.tagline && (
          <p
            className={[
              'leading-[1.65] text-fg-muted',
              size === 'feature'
                ? 'mt-1.5 max-w-[28rem] text-[13.5px]'
                : 'mt-1 text-[12.5px]',
            ].join(' ')}
          >
            {m.tagline}
          </p>
        )}

        {parts.length > 0 && (
          <dl
            className={[
              size === 'feature'
                ? 'mt-6 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2'
                : 'mt-4 space-y-1.5',
            ].join(' ')}
          >
            {parts.map(([k, label]) => (
              <div key={k} className="flex gap-3 text-[12.5px]">
                <dt className="w-10 shrink-0 text-fg-dim">{label}</dt>
                <dd className="text-fg-muted">{m.parts?.[k]}</dd>
              </div>
            ))}
          </dl>
        )}

        <div
          className={[
            'flex items-center justify-between border-t border-white/8',
            // 首台的内容是整块垂直居中的，价格行不能再吃 mt-auto，
            // 否则自由空间全被它吸走，标题和价格之间会裂开一道空白。
            size === 'feature' ? 'mt-6 pt-5' : 'mt-auto pt-4',
          ].join(' ')}
        >
          <span className="font-mono text-[15px] text-fg">
            {price ?? <span className="text-[12.5px] text-fg-dim">价格待定</span>}
          </span>
          <a
            href="#contact"
            className="text-[12.5px] text-fg-muted transition-colors group-hover:text-fg"
          >
            咨询配置 →
          </a>
        </div>
      </div>
    </article>
  )
}

/** 上架前的骨架占位。形状跟着真实布局走，让人看得出这里将来长什么样。 */
function SkeletonGrid() {
  const line = (w: string, tone = 'bg-white/[0.035]') => (
    <div className={`h-2 ${w} rounded-full ${tone}`} />
  )

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12" aria-hidden>
      {/* 首台：跨 7 列 2 行的横版卡 */}
      <div className="flex flex-col gap-6 rounded-xl border border-white/10 bg-white/[0.012] p-6 sm:col-span-2 lg:col-span-7 lg:row-span-2 lg:flex-row lg:p-8">
        <div className="aspect-[4/3] w-full rounded-md bg-white/[0.03] lg:aspect-auto lg:w-[46%] lg:shrink-0" />
        <div className="flex flex-1 flex-col justify-center">
          {line('w-1/2', 'bg-white/8')}
          <div className="mt-3">{line('w-4/5', 'bg-white/5')}</div>
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, k) => (
              <div key={k}>{line('w-full')}</div>
            ))}
          </div>
          <div className="mt-6 pt-5">{line('w-24', 'bg-white/6')}</div>
        </div>
      </div>

      {/* 第 2/3 台：右栏两张横版小卡 */}
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-5 rounded-xl border border-white/6 bg-white/[0.012] p-5 lg:col-span-5 lg:flex-row lg:p-6"
        >
          <div className="h-32 w-full rounded-md bg-white/[0.03] lg:h-auto lg:w-[38%] lg:shrink-0" />
          <div className="flex flex-1 flex-col">
            {line('w-1/2', 'bg-white/8')}
            <div className="mt-3 space-y-2">
              {[0, 1, 2].map((k) => (
                <div key={k}>{line('w-full')}</div>
              ))}
            </div>
            <div className="mt-auto pt-4">{line('w-20', 'bg-white/6')}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function Lineup() {
  const models = hardware.models

  return (
    <Section id="lineup">
      <SectionHead
        title={
          <>
            几个档位，
            <br />
            按需求挑就好。
          </>
        }
        desc="每个机型都标清楚里面装的是什么。价格随行情浮动，下单前会再跟你确认一次。"
      />

      {models.length === 0 ? (
        <div>
          <SkeletonGrid />
          <div className="mt-8">
            <EmptyState
              title="机型陆续上架中"
              hint="机型、配置和价格准备好之后填进数据文件，这里会自动生成机型卡片。在你填之前，页面不会显示任何虚构的配置或价格。"
              file="src/data/hardware.json → models"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12">
          {models.map((m, i) => (
            <ModelCard
              key={m.id}
              m={m}
              size={i === 0 ? 'feature' : i <= 2 ? 'compact' : 'plain'}
            />
          ))}
        </div>
      )}
    </Section>
  )
}

export default Lineup
