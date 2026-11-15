import {
  CATEGORIES,
  RARITY_LABEL,
  categoryOf,
  partById,
  partsOf,
  type Category,
  type Part,
} from '../data/parts'
import type { Build, Derived } from '../lib/game'
import { PartIcon } from './PartIcon'

interface Props {
  tab: Category
  build: Build
  selected: Part | null
  derived: Derived
  onTab: (cat: Category) => void
  onSelect: (part: Part) => void
}

export function PartLibrary({ tab, build, selected, derived, onTab, onSelect }: Props) {
  const list = partsOf(tab)

  return (
    <section className="panel library" aria-label="零件库">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">PARTS LIBRARY</span>
          <h2 className="panel-title">零件库</h2>
        </div>
        <span className="panel-count">{list.length} 件</span>
      </div>

      <div className="tabs" role="tablist" aria-label="部件分类">
        {CATEGORIES.map((c) => {
          const filled = Boolean(build[c.key])
          return (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={tab === c.key}
              data-testid={`tab-${c.key}`}
              className={`tab ${tab === c.key ? 'is-active' : ''} ${filled ? 'is-filled' : ''}`}
              onClick={() => onTab(c.key)}
            >
              <PartIcon cat={c.key} className="tab-icon" />
              <span className="tab-en">{c.en}</span>
              <span className="tab-cn">{c.label}</span>
              {filled && <i className="tab-dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>

      <div className="part-list" role="tabpanel">
        {list.map((part) => {
          const installedHere = build[part.cat] === part.id
          const currentPrice = partById(build[part.cat])?.price ?? 0
          const affordable = part.price <= derived.remaining + currentPrice
          const isSelected = selected?.id === part.id

          return (
            <button
              key={part.id}
              type="button"
              data-testid={`part-${part.id}`}
              aria-pressed={isSelected}
              className={[
                'part-card',
                `rarity-${part.rarity}`,
                isSelected ? 'is-selected' : '',
                installedHere ? 'is-installed' : '',
                affordable ? '' : 'is-locked',
              ].join(' ')}
              onClick={() => onSelect(part)}
            >
              <span className="part-icon">
                <PartIcon cat={part.cat} />
              </span>

              <span className="part-main">
                <span className="part-line">
                  <b className="part-name">{part.name}</b>
                  <em className={`part-rarity rarity-${part.rarity}`}>
                    {RARITY_LABEL[part.rarity]}
                  </em>
                </span>
                <span className="part-spec">{part.spec}</span>
                <span className="part-meta">
                  <span className="part-price">¥{part.price.toLocaleString('en-US')}</span>
                  <span className="part-power">{part.power}W</span>
                  <span className="part-score">+{part.score}</span>
                </span>
              </span>

              <span className="part-badge">
                {installedHere ? '已装' : !affordable ? '超预算' : isSelected ? '已选' : '可选'}
              </span>

              <span className="part-tiers" aria-label={`等级 ${part.tier}`}>
                {[1, 2, 3].map((n) => (
                  <i key={n} className={n <= part.tier ? 'on' : ''} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <div className="library-foot">
        <span className="foot-dot" />
        <span>
          {selected
            ? `已选 ${selected.name} → 点击装配台上的 ${categoryOf(selected.cat).label} 插槽`
            : '先选一个部件，再点装配台上的插槽'}
        </span>
      </div>
    </section>
  )
}

export default PartLibrary
