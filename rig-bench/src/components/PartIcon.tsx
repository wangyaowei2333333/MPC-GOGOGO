import type { Category } from '../data/parts'

/** 纯矢量部件图标：不依赖位图，任意尺寸都清晰 */
export function PartIcon({ cat, className }: { cat: Category; className?: string }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {cat === 'cpu' && (
        <g {...common}>
          <rect x="11" y="11" width="26" height="26" rx="2.5" />
          <rect x="19" y="19" width="10" height="10" rx="1" />
          {[16, 22, 28, 32].map((v) => (
            <g key={v}>
              <path d={`M${v} 11V6`} />
              <path d={`M${v} 37v5`} />
              <path d={`M11 ${v}H6`} />
              <path d={`M37 ${v}h5`} />
            </g>
          ))}
        </g>
      )}

      {cat === 'mobo' && (
        <g {...common}>
          <rect x="8" y="8" width="32" height="32" rx="2" />
          <rect x="13" y="13" width="9" height="9" rx="1" />
          <rect x="27" y="13" width="8" height="4" rx="1" />
          <rect x="27" y="20" width="8" height="4" rx="1" />
          <path d="M13 27h9v8h-9z" />
          <path d="M26 30h9M26 35h9M26 40h9" />
          <circle cx="17.5" cy="17.5" r="1.2" />
        </g>
      )}

      {cat === 'gpu' && (
        <g {...common}>
          <path d="M5 16h38v16H5z" />
          <path d="M9 32v4M41 32v4" />
          <circle cx="16" cy="24" r="5" />
          <circle cx="32" cy="24" r="5" />
          <path d="M16 21.5v5M13.5 24h5M32 21.5v5M29.5 24h5" />
          <path d="M5 19h-2M5 24H2" />
        </g>
      )}

      {cat === 'ram' && (
        <g {...common}>
          <rect x="15" y="7" width="18" height="34" rx="2" />
          <rect x="19" y="12" width="10" height="6" rx="1" />
          <rect x="19" y="21" width="10" height="6" rx="1" />
          <rect x="19" y="30" width="10" height="6" rx="1" />
          <path d="M19 41v3M23 41v3M27 41v3M31 41v3" />
        </g>
      )}

      {cat === 'cooler' && (
        <g {...common}>
          <rect x="7" y="7" width="34" height="34" rx="3" />
          <circle cx="24" cy="24" r="12" />
          <circle cx="24" cy="24" r="3" />
          <path d="M24 12c5 4 5 9 0 12M36 24c-4 5-9 5-12 0M24 36c-5-4-5-9 0-12M12 24c4-5 9-5 12 0" />
        </g>
      )}

      {cat === 'psu' && (
        <g {...common}>
          <rect x="6" y="13" width="36" height="22" rx="2" />
          <circle cx="18" cy="24" r="7" />
          <path d="M18 20v4l3 2" />
          <path d="M30 20h6M30 24h6M30 28h6" />
          <path d="M42 20v8" />
        </g>
      )}

      {cat === 'ssd' && (
        <g {...common}>
          <path d="M6 19h30l6 5v10H6z" />
          <rect x="11" y="23" width="8" height="8" rx="1" />
          <rect x="22" y="23" width="8" height="8" rx="1" />
          <path d="M33 23h4M33 27h4M33 31h4" />
          <path d="M10 34v4M15 34v4M20 34v4" />
        </g>
      )}

      {cat === 'fan' && (
        <g {...common}>
          <circle cx="24" cy="24" r="16" />
          <circle cx="24" cy="24" r="4" />
          <path d="M24 20c-7-4-11 1-9 6 2 4 7 3 9-2" />
          <path d="M28 24c4-7-1-11-6-9-4 2-3 7 2 9" />
          <path d="M24 28c7 4 11-1 9-6-2-4-7-3-9 2" />
          <path d="M20 24c-4 7 1 11 6 9 4-2 3-7-2-9" />
        </g>
      )}
    </svg>
  )
}

export default PartIcon
