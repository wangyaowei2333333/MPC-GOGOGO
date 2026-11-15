import { BUDGET } from '../data/parts'
import type { Derived } from '../lib/game'

interface Props {
  derived: Derived
  overclock: boolean
  booting: boolean
  onToggleOc: () => void
  onPower: () => void
  onReset: () => void
}

export function Inspector({
  derived,
  overclock,
  booting,
  onToggleOc,
  onPower,
  onReset,
}: Props) {
  const powerRatio = derived.psuCap ? Math.min(1.4, derived.effectivePower / derived.psuCap) : 0
  const thermalRatio = derived.coolerCap
    ? Math.min(1.4, derived.cpuPower / derived.coolerCap)
    : 0
  const segments = 18

  return (
    <aside className="panel inspector" aria-label="状态面板">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">TELEMETRY</span>
          <h2 className="panel-title">状态</h2>
        </div>
        <span className={`insp-state ${derived.complete ? 'ok' : ''}`}>
          {derived.complete ? 'ONLINE' : 'STANDBY'}
        </span>
      </div>

      <div className="score-block">
        <span className="score-label">PERF INDEX</span>
        <span className="score-value" data-testid="score">
          {derived.score.toLocaleString('en-US')}
        </span>
        <span className="score-mult">倍率 ×{derived.multiplier.toFixed(2)}</span>
      </div>

      <div className="meter">
        <div className="meter-head">
          <span>POWER DRAW</span>
          <b className={derived.psuCap && derived.effectivePower > derived.psuCap ? 'is-bad' : ''}>
            {derived.effectivePower}W
            <i>/ {derived.psuCap || '--'}W</i>
          </b>
        </div>
        <div className="seg-bar" aria-hidden="true">
          {Array.from({ length: segments }).map((_, i) => {
            const lit = powerRatio > 0 && i / segments < powerRatio
            const hot = i / segments >= 0.8
            return <i key={i} className={lit ? (hot ? 'lit hot' : 'lit') : ''} />
          })}
        </div>
      </div>

      <div className="meter">
        <div className="meter-head">
          <span>THERMAL LOAD</span>
          <b className={derived.coolerCap && derived.cpuPower > derived.coolerCap ? 'is-bad' : ''}>
            {derived.cpuPower}W
            <i>/ {derived.coolerCap || '--'}W</i>
          </b>
        </div>
        <div className="seg-bar thermal" aria-hidden="true">
          {Array.from({ length: segments }).map((_, i) => {
            const lit = thermalRatio > 0 && i / segments < thermalRatio
            const hot = i / segments >= 0.75
            return <i key={i} className={lit ? (hot ? 'lit hot' : 'lit') : ''} />
          })}
        </div>
      </div>

      <ul className="checklist">
        {derived.checks.map((c) => (
          <li key={c.key} className={`check check-${c.state}`}>
            <span className="check-mark" aria-hidden="true">
              {c.state === 'pass' ? '✓' : '×'}
            </span>
            <span className="check-label">{c.label}</span>
            <span className="check-detail">{c.detail}</span>
          </li>
        ))}
      </ul>

      <div className="breakdown">
        <span className="breakdown-title">SCORE BREAKDOWN</span>
        <ul>
          {derived.breakdown.map((b) => (
            <li key={b.label} className={b.active ? 'is-on' : ''}>
              <span>{b.label}</span>
              <b>{b.value}</b>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        data-testid="oc"
        role="switch"
        aria-checked={overclock}
        className={`oc-switch ${overclock ? 'is-on' : ''} ${derived.ocReady ? '' : 'is-locked'}`}
        onClick={onToggleOc}
      >
        <span className="oc-track">
          <i />
        </span>
        <span className="oc-text">
          <b>超频模式</b>
          <em>
            {derived.ocReady
              ? '+60W / +12% 性能'
              : '需要供电与散热各留 60W 余量'}
          </em>
        </span>
        <span className="oc-flag">{overclock ? 'ON' : 'OFF'}</span>
      </button>

      <div className="power-zone">
        <button
          type="button"
          data-testid="power-on"
          className={`power-btn ${derived.complete ? 'is-ready' : ''}`}
          onClick={onPower}
          disabled={booting}
        >
          <span className="power-halo" aria-hidden="true" />
          <svg className="power-glyph" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 3v9M6.2 6.4a8 8 0 1 0 11.6 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <span className="power-label">{booting ? 'BOOTING' : 'POWER ON'}</span>
        </button>
        <p className="power-hint">
          {derived.complete
            ? `预计性能指数 ${derived.score.toLocaleString('en-US')} · 花费 ¥${derived.cost.toLocaleString('en-US')}`
            : `还差 ${8 - derived.installed} 个部件才能启动`}
        </p>
        <div className="power-sub">
          <span>预算 ¥{BUDGET.toLocaleString('en-US')}</span>
          <button type="button" data-testid="reset" className="reset-btn" onClick={onReset}>
            重置装配
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Inspector
