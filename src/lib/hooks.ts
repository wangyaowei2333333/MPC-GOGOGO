import { useEffect, useRef, useState } from 'react'

/** 系统是否开启了「减弱动态效果」 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/** 给 GSAP 写的共享进度对象，避免每帧 re-render */
export function useProgressRef(initial = 0) {
  return useRef<number>(initial)
}

/**
 * 分段入场。三套节奏，各管一层，不再全站一套淡入：
 *  - .reveal-mask → 标题，遮罩自下而上揭示
 *  - .reveal-item → 列表/卡片，同一组内逐项错开
 *  - .reveal      → 正文段落，纯淡入
 */
export function useReveal<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const items = Array.from(
      root.querySelectorAll<HTMLElement>('.reveal, .reveal-mask, .reveal-item'),
    )
    if (!items.length) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    )
    items.forEach((el) => {
      // 错开只在同一组列表项内部计数，且不跨列表累加。
      // 标题和段落不延迟，各自按自己的曲线走，节奏才有层次。
      if (el.classList.contains('reveal-item')) {
        const siblings = Array.from(el.parentElement?.children ?? []).filter((c) =>
          (c as HTMLElement).classList?.contains('reveal-item'),
        )
        const idx = siblings.indexOf(el)
        if (idx > 0) el.style.transitionDelay = `${Math.min(idx * 80, 480)}ms`
      }
      io.observe(el)
    })
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

/** 锁滚动（启动动画播放期间用） */
export function useLockScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const { overflow, paddingRight } = document.body.style
    const gap = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (gap > 0) document.body.style.paddingRight = `${gap}px`
    return () => {
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
    }
  }, [locked])
}

/** 媒体查询小工具 */
export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}
