import {
  CATEGORIES,
  RARITY_LABEL,
  partById,
  type Category,
  type Part,
} from '../data/parts'
import type { Build, Derived } from '../lib/game'
import { PartIcon } from './PartIcon'

interface Props {
  build: Build
  selected: Part | null
  derived: Derived
  mismatch: Category | null
  onSlot: (cat: Category) => void
}

export function Bench({ build, selected, derived, mismatch, onSlot }: Props) {
  return (
    <section className="bench-area" aria-label="装配台">
      <div className="bench-head">
        <div>
          <span className="panel-kicker">BUILD BAY</span>
          <h2 className="panel-title">装配台</h2>
        </div>
        <div className="bench-status">
          <span className={`led ${derived.complete ? 'led-ok' : 'led-idle'}`} />
          <span>{derived.complete ? 'READY TO BOOT' : 'ASSEMBLING'}</span>
          <b>
            {derived.installed}
            <i>/{CATEGORIES.length}</i>
          </b>
        </div>
      </div>

      <div className="bench-stage">
        <div className="bench-glow" aria-hidden="true" />
        <div className="chassis">
          <span className="chassis-label">CHASSIS // 开放式测试平台</span>
          <span className="chassis-corner c1" aria-hidden="true" />
          <span className="chassis-corner c2" aria-hidden="true" />
          <span className="chassis-corner c3" aria-hidden="true" />
          <span className="chassis-corner c4" aria-hidden="true" />

          {CATEGORIES.map((cat) => {
            const part = partById(build[cat.key])
            const isTarget = Boolean(selected) && !part && selected?.cat === cat.key
            const isMismatch = mismatch === cat.key

            return (
              <button
                key={cat.key}
                type="button"
                data-testid={`slot-${cat.key}`}
                data-filled={part ? '1' : '0'}
                aria-label={
                  part
                    ? `${cat.label}：${part.name}，点击卸下`
                    : `${cat.label} 空插槽，点击安装`
                }
                className={[
                  'slot',
                  `slot-${cat.key}`,
                  part ? 'is-filled' : 'is-empty',
                  part ? `rarity-${part.rarity}` : '',
                  isTarget ? 'is-target' : '',
                  isMismatch ? 'is-shake' : '',
                ].join(' ')}
                onClick={() => onSlot(cat.key)}
              >
                {part ? (
                  <>
                    <span className="slot-icon">
                      <PartIcon cat={cat.key} />
                    </span>
                    <span className="slot-body">
                      <span className="slot-en">{cat.en}</span>
                      <span className="slot-name">{part.name}</span>
                      <span className="slot-spec">{part.spec}</span>
                      <span className="slot-meta">
                        ¥{part.price.toLocaleString('en-US')} · {part.power}W · +{part.score}
                      </span>
                    </span>
                    <span className={`slot-rarity rarity-${part.rarity}`}>
                      {RARITY_LABEL[part.rarity]}
                    </span>
                    <span className="slot-action">卸下</span>
                  </>
                ) : (
                  <>
                    <span className="slot-ghost">
                      <PartIcon cat={cat.key} />
                    </span>
                    <span className="slot-body">
                      <span className="slot-en">{cat.en}</span>
                      <span className="slot-label">{cat.label}</span>
                      <span className="slot-hint">{isTarget ? '点击安装' : '空槽位'}</span>
                    </span>
                    <span className="slot-index">{cat.en.slice(0, 2)}</span>
                  </>
                )}
              </button>
            )
          })}

          <span className="bench-scan" aria-hidden="true" />
        </div>
      </div>

      <div className="bench-foot">
        <span className="hint">
          <i>01</i> 左侧选件
        </span>
        <span className="hint-arrow">→</span>
        <span className="hint">
          <i>02</i> 点对应插槽安装
        </span>
        <span className="hint-arrow">→</span>
        <span className="hint">
          <i>03</i> 右侧启动系统
        </span>
        <span className="hint-tip">已装部件再点一次即可卸下</span>
      </div>
    </section>
  )
}

export default Bench
