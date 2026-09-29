/**
 * ============================================================================
 *  模型层 —— 这是「可替换点」
 * ============================================================================
 *
 *  现在：程序化建模（由 partsSpec.ts 驱动）
 *  以后：如果你想换成下载的 GLB 模型，只需替换本文件里的 PCModel 实现，
 *        保持同样的 props 签名即可，外层（Hero / ExplodedView）一行都不用改：
 *
 *        export function PCModel({ progress, autoRotate, rootRef }: PCModelProps) {
 *          const { scene } = useGLTF(asset('models/mpc-case.glb'))
 *          // 遍历 scene，按 name 找到各部件节点，同样按 explode 位移
 *          useEffect(() => { if (rootRef) rootRef.current = scene as unknown as THREE.Group }, [])
 *          return <primitive object={scene} />
 *        }
 *
 *  约束：progress 必须是 ref（GSAP / ScrollTrigger 直接写 .current），
 *       不能用 React state，否则滚动时会每帧触发 re-render 掉帧。
 */

import { useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { gradientColorAt } from '@/lib/brand'
import { MPC_PARTS, type PartSpec, type Primitive } from './partsSpec'

/** 默认倒角半径：面板有了倒角，棱边才会吃到环境光，否则正对镜头就是一张平卡片 */
const DEFAULT_CHAMFER = 0.012

/** 共享进度对象：{ current: 0 } 装配态 → { current: 1 } 完全拆解 */
export type Progress = { current: number }

export type PCModelProps = {
  progress: Progress
  /** 基准朝向（弧度）。整机是方盒，朝向直接决定「哪两个面被看到」，一定要显式给 */
  yaw?: number
  /** 自转速度，弧度/秒。0 = 不转 */
  autoRotate?: number
  /**
   * 往复摆动（优先于 autoRotate）。首屏整机用这个：
   * 一直停留在能同时看到正面 + 侧面的 3/4 视角，观感比无脑自转稳。
   */
  sway?: { amplitude: number; speed: number }
  /** 拆解时整体缩小比例，保证全部部件留在画面内 */
  shrinkOnExplode?: number
  /** 外部需要读取模型世界矩阵时用（爆炸图浮标投影要用） */
  rootRef?: RefObject<THREE.Group | null>
  /** 外部需要读取阻尼后的实际拆解进度时用 */
  shownRef?: Progress
}

/** 指数阻尼，帧率无关 */
const damp = (from: number, to: number, lambda: number, dt: number) =>
  from + (to - from) * (1 - Math.exp(-lambda * Math.min(dt, 0.1)))

/* -------------------------------------------------------------------------- */

function usePartMaterials(spec: PartSpec) {
  return useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(spec.material.color),
      metalness: spec.material.metalness,
      roughness: spec.material.roughness,
      transparent: spec.material.opacity !== undefined,
      opacity: spec.material.opacity ?? 1,
      envMapIntensity: spec.material.envMapIntensity ?? 1,
      // 默认单面：盒体本身是封闭实体，双面只会多一倍 overdraw 并让背面法线发暗
      side: spec.material.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    })
    // 部件本体默认【不自发光】。
    // 试过给 0.1 的 magenta 自发光当环境光晕，结果深灰塑料全被染成紫色塑料，
    // 非常廉价。品牌色只出现在 glow 基元（灯带 / 风扇圈）上。
    const accent = spec.rgb?.[0]
    if (accent && spec.material.emissiveIntensity) {
      const [r, g, b] = gradientColorAt(accent.at)
      mat.emissive = new THREE.Color(r, g, b)
      mat.emissiveIntensity = spec.material.emissiveIntensity
    }

    // 灯带 / 风扇圈专用：亮，但面积小，不会吃掉整个部件
    let glow: THREE.MeshStandardMaterial | null = null
    if (spec.rgb && spec.primitives.some((p) => p.glow)) {
      glow = new THREE.MeshStandardMaterial({
        color: '#0B0C11',
        metalness: 0.1,
        roughness: 0.4,
        envMapIntensity: 0.2,
        side: THREE.DoubleSide,
      })
      if (accent) {
        const [r, g, b] = gradientColorAt(accent.at)
        glow.emissive = new THREE.Color(r, g, b)
        glow.emissiveIntensity = 1.5
      }
    }
    return { mat, glow }
  }, [spec])
}

function PrimitiveMesh({
  p,
  material,
  glowMaterial,
}: {
  p: Primitive
  material: THREE.Material
  glowMaterial: THREE.Material | null
}) {
  const spinRef = useRef<THREE.Mesh>(null)
  const spin = p.kind === 'cyl' ? (p.spin ?? 0) : 0

  const geometry = useMemo(() => {
    if (p.kind === 'box') {
      const [w, h, d] = p.size!
      // 倒角半径必须小于最短边的一半，薄板（如 0.035 的玻璃）会自动收窄
      const r = Math.min(p.chamfer ?? DEFAULT_CHAMFER, Math.min(w, h, d) * 0.42)
      if (r <= 0.0005) return new THREE.BoxGeometry(w, h, d)
      return new RoundedBoxGeometry(w, h, d, 2, r)
    }
    if (p.kind === 'torus') {
      // 注意：圆柱体是「实心圆片」不是「圆环」。想要风扇那一圈光环，
      // 必须用 torus，否则整块会变成一个发光圆盘。
      return new THREE.TorusGeometry(p.radius!, p.tube ?? 0.02, 10, p.segments ?? 40)
    }
    return new THREE.CylinderGeometry(p.radius!, p.radius!, p.height!, p.segments ?? 24, 1, false)
  }, [p])

  useFrame((_, delta) => {
    if (spin && spinRef.current) {
      // 夹住 delta：切后台回来时扇叶不会突然转一大圈
      spinRef.current.rotation.y += spin * Math.min(delta, 0.05)
    }
  })

  return (
    <group position={p.pos ?? [0, 0, 0]} rotation={p.rot ?? [0, 0, 0]}>
      <mesh
        ref={spinRef}
        geometry={geometry}
        material={p.glow && glowMaterial ? glowMaterial : material}
        castShadow
        receiveShadow
      />
    </group>
  )
}

function Part({ spec, shown }: { spec: PartSpec; shown: Progress }) {
  const group = useRef<THREE.Group>(null)
  const { mat, glow } = usePartMaterials(spec)
  const baseOpacity = spec.material.opacity

  useFrame(() => {
    const g = group.current
    if (!g) return
    const t = shown.current
    g.position.set(
      spec.pos[0] + spec.explode[0] * t,
      spec.pos[1] + spec.explode[1] * t,
      spec.pos[2] + spec.explode[2] * t,
    )
    // 玻璃板在装配态是 0.16 的近乎全透，一旦拆解就会「整个机箱壳消失」，
    // 爆炸图看起来像一堆零件悬空。所以随进度把它调到 0.34 —— 但不能再高了，
    // 玻璃面积太大，调到 0.5 以上就会变成一块盖住内部的白色挡板。
    if (baseOpacity !== undefined && mat.transparent) {
      mat.opacity = baseOpacity + (0.34 - baseOpacity) * t
    }
  })

  return (
    <group ref={group} position={spec.pos}>
      {spec.primitives.map((p, i) => (
        <PrimitiveMesh key={`${spec.id}-${i}`} p={p} material={mat} glowMaterial={glow} />
      ))}
    </group>
  )
}

/* -------------------------------------------------------------------------- */

export function PCModel({
  progress,
  yaw = 0,
  autoRotate = 0,
  sway,
  shrinkOnExplode = 0.25,
  rootRef,
  shownRef,
}: PCModelProps) {
  const root = useRef<THREE.Group>(null)
  /** 阻尼后的实际拆解进度，所有部件读它，保证整体同步 */
  const shownInternal = useRef(0)
  const shown = shownRef ?? shownInternal
  const spinAccum = useRef(0)
  const elapsed = useRef(0)

  const attachRoot = (node: THREE.Group | null) => {
    root.current = node
    if (rootRef) rootRef.current = node
  }

  useFrame((_, delta) => {
    const g = root.current
    if (!g) return

    const dt = Math.min(delta, 0.05)
    shown.current = damp(shown.current, progress.current, 9, delta)
    const t = shown.current

    if (sway) {
      // 小幅往复摆动：永远停在 3/4 视角，不会转到「面板正对镜头 = 一张平卡片」
      elapsed.current += dt
      g.rotation.y = yaw + Math.sin(elapsed.current * sway.speed) * sway.amplitude + t * 0.35
    } else {
      if (autoRotate) spinAccum.current += autoRotate * dt
      g.rotation.y = yaw + spinAccum.current + t * 0.35
    }

    g.scale.setScalar(1 - t * shrinkOnExplode)
    // 拆解后整体略微下沉，给上方散开的部件留空间
    g.position.y = -t * 0.25
  })

  return (
    <group ref={attachRoot}>
      {MPC_PARTS.map((spec) => (
        <Part key={spec.id} spec={spec} shown={shown} />
      ))}
    </group>
  )
}

export default PCModel
