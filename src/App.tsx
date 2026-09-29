import { useEffect, useMemo, useState } from 'react'
import Intro from '@/components/Intro'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import ExplodedView from '@/components/ExplodedView'
import Configurator from '@/components/sections/Configurator'
import Performance from '@/components/sections/Performance'
import Lineup from '@/components/sections/Lineup'
import Process from '@/components/sections/Process'
import Faq from '@/components/sections/Faq'
import Contact, { Footer } from '@/components/sections/Contact'
import Mascot from '@/components/Mascot'

const seenIntro = () => {
  if (typeof window === 'undefined') return true
  try {
    return (
      sessionStorage.getItem('mpc:intro-seen') === '1' ||
      new URLSearchParams(location.search).get('skipIntro') === '1' ||
      location.hash === '#site'
    )
  } catch {
    // 隐私模式 / 禁用 storage：不播动画，直接进站
    return true
  }
}

export default function App() {
  const skip = useMemo(seenIntro, [])
  const [ready, setReady] = useState(skip)

  // html[data-phase] 控制底色：intro 阶段是视频同款白，进站后切深色
  useEffect(() => {
    document.documentElement.dataset.phase = ready ? 'site' : 'intro'
  }, [ready])

  return (
    <>
      {!skip && <Intro onDone={() => setReady(true)} />}

      <Nav />

      <main>
        <Hero />
        <ExplodedView ready={ready} />
        <Configurator />
        <Performance />
        <Lineup />
        <Process />
        <Faq />
        <Contact />
      </main>

      <Footer />
      <Mascot />
    </>
  )
}
