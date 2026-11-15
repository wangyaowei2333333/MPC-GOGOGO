import { BUDGET, CATEGORIES } from '../data/parts'

function formatTime(total: number) {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0')
  const s = (total % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function Hud({
  cost,
  installed,
  elapsed,
}: {
  cost: number
  installed: number
  elapsed: number
}) {
  const remaining = BUDGET - cost

  return (
    <header className="hud">
      <div className="hud-brand">
        <svg className="hud-mark" viewBox="0 0 40 40" aria-hidden="true">
          <defs>
            <linearGradient id="mark-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38f2ff" />
              <stop offset="55%" stopColor="#8b5bff" />
              <stop offset="100%" stopColor="#ff2d7a" />
            </linearGradient>
          </defs>
          <path
            d="M20 3 35.6 12v16L20 37 4.4 28V12z"
            fill="none"
            stroke="url(#mark-grad)"
            strokeWidth="1.6"
          />
          <path d="M20 10.5 29 15.7v10.6L20 31.5l-9-5.2V15.7z" fill="none" stroke="url(#mark-grad)" strokeWidth="1" opacity=".5" />
          <path d="M14.5 25V17l5.5 5 5.5-5v8" fill="none" stroke="url(#mark-grad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="hud-brand-text">
          <span className="hud-title">RIG BENCH</span>
          <span className="hud-sub">装机台 · MPC LAB</span>
        </div>
      </div>

      <div className="hud-mission">
        <span className="hud-tag">
          <i />
          MISSION
        </span>
        <p>
          在 <b>¥{BUDGET.toLocaleString('en-US')}</b> 预算内装齐 8 个部件，跑出最高性能指数
        </p>
      </div>

      <div className="hud-stats">
        <div className="hud-stat">
          <span>预算余额</span>
          <b className={remaining < BUDGET * 0.2 ? 'is-hot' : ''}>¥{remaining.toLocaleString('en-US')}</b>
        </div>
        <div className="hud-stat">
          <span>装配进度</span>
          <b>
            {installed}
            <i>/{CATEGORIES.length}</i>
          </b>
        </div>
        <div className="hud-stat">
          <span>用时</span>
          <b data-testid="timer">{formatTime(elapsed)}</b>
        </div>
      </div>
    </header>
  )
}

export default Hud
