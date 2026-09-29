import { useState } from 'react'
import { asset } from '@/lib/asset'
import { BRAND } from '@/lib/brand'
import { formatUpdatedAt, hardware } from '@/data'
import { useReveal } from '@/lib/hooks'

export function Contact() {
  const [copied, setCopied] = useState(false)
  const ref = useReveal<HTMLElement>()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(BRAND.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* 非 HTTPS 或没权限时静默失败，用户还可以手选 */
    }
  }

  return (
    <section id="contact" ref={ref} className="relative overflow-hidden py-28 lg:py-44">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute bottom-[-30%] left-1/2 size-[54vw] -translate-x-1/2 rounded-full opacity-[0.07] blur-[120px]"
          style={{ background: 'radial-gradient(circle,#722EFF 0%,transparent 68%)' }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[1400px] px-6 lg:px-10">
        <div className="mx-auto max-w-[46rem] text-center">
          <h2 className="reveal-mask text-[clamp(1.85rem,4.2vw,3.1rem)] leading-[1.12] font-medium tracking-[-0.025em] text-fg">
            想配一台，
            <br className="sm:hidden" />
            或者只是问问。
          </h2>
          <p className="reveal mx-auto mt-5 max-w-[32rem] text-[14.5px] leading-[1.75] text-fg-muted">
            配置咨询、兼容性疑问、报价、售后，都可以直接发邮件。没有自动回复工单，就是人看人回。
          </p>

          <div className="reveal mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`mailto:${BRAND.email}`}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-medium text-white transition-transform duration-300 hover:scale-[1.03]"
              style={{ background: 'linear-gradient(97deg,#FF8A05,#E62FA6 52%,#722EFF)' }}
            >
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
                <path
                  d="M3 6.5h18v11H3zM3 7l9 6 9-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {BRAND.email}
            </a>
            <button
              type="button"
              onClick={copy}
              className="cursor-pointer rounded-full border border-white/15 bg-transparent px-5 py-3 text-[14px] text-fg transition-colors hover:border-white/35 hover:bg-white/5"
            >
              {copied ? '已复制 ✓' : '复制邮箱'}
            </button>
          </div>

          <p className="reveal mt-7 text-[12.5px] text-fg-dim">微信 / QQ 联系方式待补充</p>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-white/8 py-12">
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <img src={asset('logo.svg')} alt={BRAND.title} className="h-9 w-auto select-none" />
            <p className="mt-4 max-w-[22rem] text-[12.5px] leading-[1.7] text-fg-dim">
              极客组装成品电脑。结构透明、配置透明、数据透明。
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-16 gap-y-3 sm:grid-cols-3">
            {[
              ['#hero', '首页'],
              ['#exploded', '结构'],
              ['#configurator', '配置'],
              ['#performance', '性能'],
              ['#lineup', '机型'],
              ['#contact', '联系'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-[13px] text-fg-muted transition-colors hover:text-fg"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/8 pt-6 text-[11.5px] text-fg-dim sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {BRAND.name} · {BRAND.fullName}
          </span>
          <span>数据更新于 {formatUpdatedAt(hardware.updatedAt)} · 备案号待填写</span>
        </div>
      </div>
    </footer>
  )
}

export default Contact
