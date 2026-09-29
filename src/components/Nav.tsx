import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { asset } from '@/lib/asset'
import { BRAND } from '@/lib/brand'

const LINKS = [
  { href: '#hero', label: '首页' },
  { href: '#exploded', label: '结构' },
  { href: '#configurator', label: '配置' },
  { href: '#performance', label: '性能' },
  { href: '#lineup', label: '机型' },
]

export function Nav() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)

  /**
   * 遮罩 URL 必须绝对化。
   *
   * CSS 里的相对路径是按【样式表】的位置解析的，样式表在 /assets/ 下，
   * 于是 `url(logo-mark.svg)` 会变成 /assets/logo-mark.svg —— 而 logo-mark.svg
   * 在部署根目录，结果就是 404、logo 整块不可见（照不到底，遮罩把元素裁没了）。
   * 用 document.baseURI 兜底解析，子路径部署（GitHub Pages）也正确。
   */
  const logoMask = useMemo(
    () => `url(${new URL(asset('logo-mark.svg'), document.baseURI).href})`,
    [],
  )

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={[
        'fixed inset-x-0 top-0 z-50 transition-[background,backdrop-filter,border-color] duration-500',
        solid
          ? 'border-b border-white/8 bg-ink-900/72 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      ].join(' ')}
    >
      <nav className="mx-auto flex h-16 max-w-[1400px] items-center gap-8 px-6 lg:px-10">
        <a href="#hero" className="flex shrink-0 items-center gap-2.5" aria-label={BRAND.title}>
          {/* 静态 SVG 换成遮罩 + 流动品牌渐变，见 index.css 的 .mpc-logo-mark */}
          <span
            className="mpc-logo-mark"
            role="img"
            aria-label="MPC"
            style={{ '--logo-url': logoMask } as CSSProperties}
          />
          <span className="hidden text-[10.5px] tracking-[0.16em] text-fg-dim sm:inline">
            {BRAND.fullName}
          </span>
        </a>

        <ul className="ml-auto hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-[13px] text-fg-muted transition-colors hover:text-fg"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className="ml-auto hidden rounded-full border border-white/15 px-4 py-1.5 text-[13px] text-fg transition-colors hover:border-white/35 hover:bg-white/5 md:ml-0 md:inline-block"
        >
          联系我们
        </a>

        <button
          type="button"
          aria-label="菜单"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="ml-auto flex size-9 cursor-pointer flex-col items-center justify-center gap-[5px] rounded-full border border-white/12 bg-transparent md:hidden"
        >
          <span
            className="block h-px w-4 bg-fg transition-transform duration-300"
            style={open ? { transform: 'translateY(3px) rotate(45deg)' } : undefined}
          />
          <span
            className="block h-px w-4 bg-fg transition-transform duration-300"
            style={open ? { transform: 'translateY(-3px) rotate(-45deg)' } : undefined}
          />
        </button>
      </nav>

      {/* 移动端抽屉 */}
      <div
        className={[
          'overflow-hidden border-t border-white/8 bg-ink-900/95 backdrop-blur-xl transition-[max-height] duration-500 md:hidden',
          open ? 'max-h-80' : 'max-h-0 border-transparent',
        ].join(' ')}
      >
        <ul className="mx-auto flex max-w-[1400px] flex-col px-6 py-2">
          {[...LINKS, { href: '#contact', label: '联系我们' }].map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block border-b border-white/5 py-3.5 text-[15px] text-fg-muted last:border-0"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}

export default Nav
