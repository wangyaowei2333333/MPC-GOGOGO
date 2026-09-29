import { Section, SectionHead } from '@/components/ui/Section'

/**
 * 组装流程。文案是按「极客手工组装成品机」的通用流程写的，
 * 如果你家的流程不一样，直接改这个数组 —— 见 README「文案改哪里」。
 */
const STEPS = [
  {
    no: '01',
    title: '选配',
    desc: '按用途和预算定方向。配置器里逐项选件，选到什么程度、花多少钱，全程看得见。',
  },
  {
    no: '02',
    title: '校验',
    desc: '插槽、内存类型、供电余量、显卡长度、散热限高，逐项过一遍兼容性再下单。',
  },
  {
    no: '03',
    title: '组装',
    desc: '手工装机、走线、上硅脂。不走流水线，一台机器一个人从头装到尾。',
  },
  {
    no: '04',
    title: '烤机',
    desc: '装机后跑压力测试和温度曲线，确认稳定、温度正常，再打包发出。',
  },
]

export function Process() {
  return (
    <Section id="process">
      <SectionHead
        title={
          <>
            一台机器，
            <br />
            四步走完。
          </>
        }
        desc="从你选中配置，到机器装箱发出，中间每一步都是可追溯的。"
      />

      {/* 从「四张等高等宽卡片」改成流程线。
          并列关系用留白和连接线区分，不再用卡片边框把每一步框成一个格子 ——
          等高等宽卡片横排是 AI 生成页面的招牌结构之一。
          序号保留，因为这里流程本身就是有序信息。 */}
      <ol className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <li key={s.no} className="reveal-item group relative">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[13px] tabular-nums text-fg-dim">{s.no}</span>
              <span className="h-px flex-1 bg-white/10 transition-colors duration-500 group-hover:bg-white/25" />
            </div>
            <h3 className="mt-6 text-[16px] font-medium text-fg">{s.title}</h3>
            <p className="mt-2.5 text-[13px] leading-[1.72] text-fg-muted">{s.desc}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

export default Process
