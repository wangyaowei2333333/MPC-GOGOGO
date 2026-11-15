import type { Derived } from '../lib/game'

export function Backdrop() {
  const base = import.meta.env.BASE_URL

  return (
    <div className="backdrop" aria-hidden="true">
      <div
        className="bd-photo"
        style={{ backgroundImage: `url(${base}assets/bench-bg.jpg)` }}
      />
      <div
        className="bd-circuit"
        style={{ backgroundImage: `url(${base}assets/circuit.jpg)` }}
      />
      <div className="bd-grid" />
      <div className="bd-vignette" />
      <div className="bd-scanlines" />
    </div>
  )
}

export function BootOverlay() {
  return (
    <div className="overlay boot-overlay" role="status" aria-live="polite">
      <div className="boot-box">
        <span className="boot-kicker">POST // POWER-ON SELF TEST</span>
        <ul className="boot-lines">
          <li>CHECK CPU CORE ............ OK</li>
          <li>CHECK MEMORY TRAIN ....... OK</li>
          <li>CHECK PCIE LINK .......... OK</li>
          <li>LOAD THERMAL CURVE ....... OK</li>
          <li>RUN BENCHMARK ............ RUN</li>
        </ul>
        <div className="boot-bar">
          <i />
        </div>
      </div>
    </div>
  )
}

export function ResultOverlay({
  score,
  rank,
  note,
  derived,
  onRestart,
  onClose,
}: {
  score: number
  rank: string
  note: string
  derived: Derived
  onRestart: () => void
  onClose: () => void
}) {
  return (
    <div className="overlay result-overlay" role="dialog" aria-modal="true" aria-label="跑分结果">
      <div className="result-card">
        <span className="result-kicker">SYSTEM ONLINE // 跑分完成</span>

        <div className="result-main">
          <div className={`rank-badge rank-${rank}`}>
            <span>{rank}</span>
            <em>RANK</em>
          </div>

          <div className="result-score-wrap">
            <span className="result-label">PERF INDEX</span>
            <span className="result-score" data-testid="final-score">
              {score.toLocaleString('en-US')}
            </span>
            <span className="result-note">{note}</span>
          </div>
        </div>

        <div className="result-stats">
          <div>
            <span>总花费</span>
            <b>¥{derived.cost.toLocaleString('en-US')}</b>
          </div>
          <div>
            <span>功耗</span>
            <b>{derived.effectivePower}W</b>
          </div>
          <div>
            <span>剩余预算</span>
            <b>¥{derived.remaining.toLocaleString('en-US')}</b>
          </div>
          <div>
            <span>倍率</span>
            <b>×{derived.multiplier.toFixed(2)}</b>
          </div>
        </div>

        <ul className="result-checks">
          {derived.checks.map((c) => (
            <li key={c.key} className={c.state === 'pass' ? 'ok' : 'bad'}>
              <i>{c.state === 'pass' ? '✓' : '×'}</i>
              {c.label}
            </li>
          ))}
        </ul>

        <div className="result-actions">
          <button type="button" data-testid="restart" className="btn-primary" onClick={onRestart}>
            再装一台
          </button>
          <button type="button" data-testid="close-result" className="btn-ghost" onClick={onClose}>
            继续微调
          </button>
        </div>
      </div>
    </div>
  )
}

export function Toast({ message, kind }: { message: string; kind: 'ok' | 'warn' | 'err' }) {
  return (
    <div className={`toast toast-${kind}`} role="status">
      <i />
      {message}
    </div>
  )
}
