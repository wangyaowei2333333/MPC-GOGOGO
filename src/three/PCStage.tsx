/**
 * 3D 舞台：Canvas + 灯光 + 环境反射 + 交互。
 *
 * 环境反射用 drei 的 <Environment> 配合 <Lightformer> 在场景内实时烘出来，
 * 不依赖任何外部 HDR 文件 —— 国内访问不会因为 CDN 被墙而黑掉。
 *
 * 调光经验（踩了两轮坑才收敛）：
 *   1. 金属材质（metalness > 0.8）本质上是「镜子」，它显示出来的其实主要是
 *      环境贴图。如果环境里全是彩色 Lightformer，铝板就糊成一整片品牌色。
 *      → 环境里必须有一盏「大面积中性柔光箱」当主反射源，彩色只做小面积补光。
 *   2. 反射太锐（roughness 低）时面板会变成镜子，看不出材质。
 *      → 铝件 roughness 统一 ≥ 0.48，才有拉丝金属味。
 *   3. 靠堆亮度救不了暗部，只会先过曝高光。宁可多给 ambient / hemisphere，
 *      把底色抬起来，再用 tone mapping 收高光。
 */

import { Suspense, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS } from '@/lib/brand'

export type PCStageProps = {
  children: ReactNode
  camera?: [number, number, number]
  fov?: number
  /** 允许拖拽旋转（不接管滚轮，避免和页面滚动打架） */
  draggable?: boolean
  autoRotate?: boolean
  autoRotateSpeed?: number
  shadow?: boolean
  /** 接触阴影所在高度。爆炸图里部件会散到下方，得把阴影面压低 */
  shadowY?: number
  className?: string
}

export function PCStage({
  children,
  camera = [4.2, 1.1, 5.0],
  fov = 34,
  draggable = false,
  autoRotate = false,
  autoRotateSpeed = 0.6,
  shadow = true,
  shadowY = -2.1,
  className,
}: PCStageProps) {
  return (
    <Canvas
      className={className}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: camera, fov }}
      onCreated={({ gl }) => {
        // Neutral 比 ACES 更保饱和、不死白，产品展示向的图更适合
        gl.toneMapping = THREE.NeutralToneMapping
        // 全局亮度总闸。宁可在这里整体提，也不要去逐盏调灯 —— 改灯会连带
        // 破坏高光层次，改曝光只影响整体明暗。
        gl.toneMappingExposure = 1.35
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        {/* 基础光：负责把暗部抬起来，不让非金属件变成纯黑。
            注意这里【不能】用点光源去补机箱内部 —— 没有阴影贴图，点光会在
            贴着的玻璃上烤出一块热斑。抬 ambient 才是安全的做法。 */}
        <ambientLight intensity={0.65} />
        <hemisphereLight args={['#D2D6DC', '#2A2C32', 0.55]} />
        <directionalLight position={[6, 9, 6]} intensity={1.7} />
        <directionalLight position={[-7, 4, -5]} intensity={0.5} />

        {/* 品牌色轮廓光：近处小范围，只做边缘染色，不做主光。
            这三个值给大了整机会被染成一坨紫，中性色调就丢了。 */}
        <pointLight position={[-6, 1.5, 3]} intensity={3} color={COLORS.orange} distance={16} />
        <pointLight position={[7, 3, -3]} intensity={3.5} color={COLORS.violet} distance={16} />
        <pointLight position={[0, -4.5, 4]} intensity={2} color={COLORS.pink} distance={14} />

        {/* 场景内实时烘环境贴图：金属外壳反射的就是这几盏 */}
        <Environment resolution={256} frames={1}>
          {/* 主柔光箱：中性白，面积尽量大 —— 铝件的银灰底色来源。
              它必须是全场景最亮的光源，否则金属反射全是彩色，就「不像铝」了。 */}
          <Lightformer
            intensity={2.2}
            color="#E4E9F2"
            position={[0, 7, 0]}
            rotation-x={Math.PI / 2}
            scale={13}
          />
          <Lightformer intensity={1.0} color="#B8C4D6" position={[0, 0, 8]} scale={11} />
          {/* 彩色补光：只做边缘染色，scale 小才有「一道边光」而不是「整面染色」 */}
          <Lightformer intensity={0.9} color={COLORS.orange} position={[-6, 1, -3]} scale={4} />
          <Lightformer intensity={0.9} color={COLORS.violet} position={[6, 1, -3]} scale={4} />
          <Lightformer intensity={0.6} color={COLORS.pink} position={[0, -5, 3]} scale={4} />
        </Environment>

        {children}

        {shadow && (
          <ContactShadows
            position={[0, shadowY, 0]}
            opacity={0.5}
            scale={13}
            blur={2.6}
            far={5}
            resolution={512}
            color="#000000"
          />
        )}

        {draggable && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.7}
            makeDefault
          />
        )}
      </Suspense>
    </Canvas>
  )
}

export default PCStage
