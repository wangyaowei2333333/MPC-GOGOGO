import { useState } from 'react'
import { Section, SectionHead } from '@/components/ui/Section'

/** FAQ 文案可以直接改这里 */
const QA = [
  {
    q: '配件可以自己指定吗？',
    a: '可以。配置器里每一项都能替换，也可以在联系我们时直接把想要的清单发过来，我们按你的清单报可行性和价格。',
  },
  {
    q: '兼容性怎么保证？',
    a: '选件时页面上就会实时校验插槽类型、内存代际、供电余量、显卡长度和散热限高。下单后还会人工再核对一遍，避免出现装不进去的情况。',
  },
  {
    q: '性能页的跑分是哪里来的？',
    a: '整机实机测试来的。测过的项目才会上到性能页，没测过的不会写，也不会拿别处的数据凑数。',
  },
  {
    q: '机器发出来之前会做什么？',
    a: '装完会跑压力测试并记录温度曲线，确认稳定、温度正常再打包。',
  },
  {
    q: '怎么联系你们？',
    a: '直接发邮件就行，配置咨询、报价、售后都可以。拉到页面最下面有邮箱。',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <Section id="faq">
      <SectionHead
        title={
          <>
            你可能
            <br />
            想知道这些。
          </>
        }
      />

      <div className="max-w-[52rem]">
        {QA.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q} className="reveal-item border-b border-white/8">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center gap-4 border-none bg-transparent py-5 text-left"
              >
                <span className="flex-1 text-[14.5px] text-fg">{item.q}</span>
                <span
                  className="relative size-3.5 shrink-0 transition-transform duration-400 ease-[cubic-bezier(.16,1,.3,1)]"
                  style={{ transform: isOpen ? 'rotate(45deg)' : 'none' }}
                  aria-hidden
                >
                  <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-fg-muted" />
                  <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-fg-muted" />
                </span>
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <p className="pb-5 text-[13.5px] leading-[1.78] text-fg-muted">{item.a}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

export default Faq
