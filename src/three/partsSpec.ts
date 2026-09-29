/**
 * MPC 整机的程序化建模规格 —— 纯数据，不含任何 three.js 代码。
 *
 * 为什么这么做：
 *  1. 每个部件是独立的 Group，爆炸图 = 动画它的 position，零额外资源
 *  2. 想换外观 / 加减部件 / 改配色，只动这个文件，不用碰渲染逻辑
 *  3. 后期若要换成下载的 GLB 模型，只需把 <PCModel> 换成 <GLTFModel>，
 *     外层接口（progress / rootRef）不变 —— 见 src/three/PCModel.tsx 顶部说明
 *
 * 坐标系：Y 轴朝上，Z 轴朝观察者。1 单位 = 10cm。
 * 机箱外廓 190 × 340 × 165 mm（立式 ITX，正面 + 右侧双钢化玻璃展示结构）。
 *
 * 布局（决定了「从镜头看进去能读到什么」）：
 *   主板是一块立在 YZ 平面的板（法线朝 +X），元件都挂在它的 +X 面上，
 *   显卡也近乎平行地立在主板右侧，风扇朝 +X。
 *   所以右侧板必须是玻璃，不然镜头只能看到一块铝板，内部全被挡住。
 *
 * 调材质经验（踩了两轮坑的结论）：
 *  - metalness 只给 0.5~0.6。物理上铝是纯金属，但纯金属没有漫反射，在程序化
 *    环境里极易「要么全黑要么过曝」。留一半漫反射，光照才有可控余量。
 *  - 部件本体不要加自发光。哪怕 0.1 的 magenta 自发光都会把深灰塑料染成紫色
 *    塑料。品牌色只出现在 glow 基元（灯带 / 风扇圈）上。
 *  - 板材一定给倒角（见 PCModel 的 DEFAULT_CHAMFER），棱边吃光才像加工件。
 */

export type Vec3 = [number, number, number]

export type Primitive = {
  kind: 'box' | 'cyl' | 'torus'
  /** box 用 */
  size?: Vec3
  /** cyl / torus 用 */
  radius?: number
  /** cyl 用 */
  height?: number
  /** torus 用：管径 */
  tube?: number
  segments?: number
  pos?: Vec3
  rot?: Vec3
  /** 绕自身轴自转，单位 弧度/秒。扇叶用 */
  spin?: number
  /** 该基元换成品牌色自发光材质（灯带、风扇圈） */
  glow?: boolean
  /** box 倒角半径，默认 0.012。给 0 就是硬边盒 */
  chamfer?: number
}

export type MaterialSpec = {
  color: string
  metalness: number
  roughness: number
  /** 0~1，设了就会开 transparent */
  opacity?: number
  /** 环境反射强度。玻璃要压低，否则糊成一片亮面 */
  envMapIntensity?: number
  /** 双面渲染，只有玻璃板需要 */
  doubleSide?: boolean
  /**
   * 部件本体的自发光强度。默认不设 = 完全不发光。
   * 只有极少数情况才需要（例如想让某块部件在暗处轻微提亮），
   * 和 rgb 一起用时是拿品牌色发光，注意给大了整块会变塑料。
   */
  emissiveIntensity?: number
}

export type PartGroup = '外壳' | '主板' | '算力' | '散热' | '供电' | '存储'

export type PartSpec = {
  id: string
  /** 爆炸图浮标上的名字 */
  label: string
  /** 浮标第二行，一句话说明 */
  note: string
  group: PartGroup
  /** 装配态位置 */
  pos: Vec3
  /** 爆炸态相对装配态的位移量（progress=1 时完全生效） */
  explode: Vec3
  material: MaterialSpec
  primitives: Primitive[]
  /** 有没有品牌渐变 RGB 灯效，值是渐变取样位置 0~1 */
  rgb?: { at: number }[]
}

/* 机箱壁厚与外廓 —— D 特意比 W 小，整体才像「塔」而不是「箱子」 */
const T = 0.05
const W = 1.9
const H = 3.0
const D = 1.65

/** 铝材统一材质，避免每个部件写一遍 */
const ALU: MaterialSpec = { color: '#A8AEBE', metalness: 0.5, roughness: 0.5, envMapIntensity: 0.95 }
const ALU_DARK: MaterialSpec = { color: '#8C93A6', metalness: 0.45, roughness: 0.55, envMapIntensity: 0.95 }

/** 钢化玻璃：正面与右侧板共用。roughness 不能给太低，否则整面镜子反出柔光箱就是一张亮卡 */
const GLASS: MaterialSpec = {
  color: '#A8B4C6',
  metalness: 0.0,
  roughness: 0.1,
  opacity: 0.16,
  envMapIntensity: 0.45,
  doubleSide: true,
}

/** 左侧板冲孔网：8 条横向散热槽 */
const VENT_SLOTS: Primitive[] = Array.from({ length: 8 }, (_, i) => ({
  kind: 'box' as const,
  size: [0.03, 0.1, D * 0.78] as Vec3,
  pos: [0.012, 1.15 - i * 0.33, 0] as Vec3,
}))

export const MPC_PARTS: PartSpec[] = [
  /* ------------------------------ 外壳 ------------------------------ */
  {
    id: 'front-glass',
    label: '前面板',
    note: '4mm 钢化玻璃 · 免工具卡扣',
    group: '外壳',
    pos: [0, 0, D / 2 - 0.02],
    explode: [0.5, 0.3, 1.5],
    material: GLASS,
    primitives: [{ kind: 'box', size: [W - T * 2, H - T * 2, 0.035] }],
  },
  {
    id: 'panel-right',
    label: '右侧板',
    note: '4mm 钢化玻璃 · 侧透',
    group: '外壳',
    pos: [W / 2 - T / 2, 0, 0],
    explode: [2.8, 0, 0],
    material: GLASS,
    primitives: [{ kind: 'box', size: [0.035, H - T * 2, D - T * 2] }],
  },
  {
    id: 'panel-left',
    label: '左侧板',
    note: '一次成型铝合金 · 冲孔网',
    group: '外壳',
    pos: [-W / 2 + T / 2, 0, 0],
    explode: [-2.8, 0, 0],
    material: ALU_DARK,
    primitives: [{ kind: 'box', size: [T, H, D] }, ...VENT_SLOTS],
  },
  {
    id: 'panel-back',
    label: '背板',
    note: '主板 I/O · 显卡挡板',
    group: '外壳',
    pos: [0, 0, -D / 2 + T / 2],
    explode: [0, 0, -1.9],
    material: ALU,
    primitives: [{ kind: 'box', size: [W, H, T] }],
  },
  {
    id: 'frame-top',
    label: '顶板',
    note: '出风 · 磁吸防尘网',
    group: '外壳',
    pos: [0, H / 2 - T / 2, 0],
    explode: [0, 2.1, 0],
    material: ALU,
    primitives: [{ kind: 'box', size: [W, T, D] }],
  },
  {
    id: 'frame-bottom',
    label: '底板',
    note: '脚垫 · 抽拉防尘网',
    group: '外壳',
    pos: [0, -H / 2 + T / 2, 0],
    explode: [0, -2.1, 0],
    material: ALU_DARK,
    primitives: [{ kind: 'box', size: [W, T, D] }],
  },

  /* ------------------------------ 主板 ------------------------------ */
  /*  内部布局的设计依据（决定了「从 3/4 角看进去能读到什么」）：
   *   - 主板立在 YZ 平面、法线朝 +X，元件全挂在 +X 面 → 必须从右侧看
   *   - 显卡做成 1.3×0.5×0.34 的「薄卡」而不是大方块，否则它会变成一堵墙
   *   - 显卡压到下半区，散热器/CPU 留在上半区 → 两者在画面上不互相遮挡
   *   - 相机比模型略高（俯角 ~20°），所以顶面信息也要能看：风扇圈、灯带
   */
  {
    id: 'motherboard',
    label: '主板',
    note: 'ITX 规格 · 三明治结构基准面',
    group: '主板',
    // 视觉锚点：爆炸时不动，其余部件以它为参照散开
    pos: [-0.52, 0.05, -0.02],
    explode: [0, 0, 0],
    material: { color: '#24382F', metalness: 0.3, roughness: 0.68, envMapIntensity: 0.7 },
    primitives: [
      { kind: 'box', size: [0.035, 2.2, 1.32] },
      // 供电与芯片组，纯装饰
      { kind: 'box', size: [0.07, 0.4, 0.5], pos: [-0.035, 0.92, -0.08] },
      { kind: 'box', size: [0.06, 0.32, 0.28], pos: [-0.035, -0.45, 0.05] },
      { kind: 'box', size: [0.05, 0.1, 1.2], pos: [-0.03, -0.72, 0] },
    ],
  },

  /* ------------------------------ 算力 ------------------------------ */
  {
    id: 'cpu',
    label: 'CPU',
    note: '处理器 · 金属顶盖',
    group: '算力',
    pos: [-0.44, 0.82, -0.5],
    explode: [-1.3, 0.6, -0.7],
    material: { color: '#CFD5E2', metalness: 0.85, roughness: 0.24 },
    primitives: [
      { kind: 'box', size: [0.05, 0.38, 0.38] },
      { kind: 'box', size: [0.012, 0.24, 0.28], pos: [0.03, 0, 0] },
    ],
  },
  {
    id: 'gpu',
    label: '显卡',
    note: '双风扇 · 竖装于主板右侧',
    group: '算力',
    // 薄卡比例：长 1.3 在 Y 上，卡高 0.5 在 Z 上，厚度 0.34 在 X 上
    pos: [0.42, -0.12, -0.08],
    explode: [1.9, -0.5, 0],
    material: { color: '#414A5C', metalness: 0.6, roughness: 0.42 },
    primitives: [
      { kind: 'box', size: [0.34, 1.3, 0.5] },
      // 两个风扇沿卡长方向排布，扇面朝 +X（镜头这一侧）
      { kind: 'cyl', radius: 0.23, height: 0.06, segments: 32, pos: [0.18, 0.28, 0], rot: [0, 0, Math.PI / 2], spin: 3.4 },
      { kind: 'cyl', radius: 0.23, height: 0.06, segments: 32, pos: [0.18, -0.28, 0], rot: [0, 0, Math.PI / 2], spin: -3.4 },
      { kind: 'cyl', radius: 0.07, height: 0.08, segments: 20, pos: [0.2, 0.28, 0], rot: [0, 0, Math.PI / 2] },
      { kind: 'cyl', radius: 0.07, height: 0.08, segments: 20, pos: [0.2, -0.28, 0], rot: [0, 0, Math.PI / 2] },
      // 风扇光环（圆环，不是圆片）
      { kind: 'torus', radius: 0.235, tube: 0.017, segments: 36, pos: [0.19, 0.28, 0], rot: [0, Math.PI / 2, 0], glow: true },
      { kind: 'torus', radius: 0.235, tube: 0.017, segments: 36, pos: [0.19, -0.28, 0], rot: [0, Math.PI / 2, 0], glow: true },
      // 背板 + 卡顶灯带
      { kind: 'box', size: [0.02, 1.26, 0.46], pos: [-0.175, 0, 0] },
      { kind: 'box', size: [0.035, 0.05, 0.46], pos: [0.17, 0.63, 0], glow: true },
    ],
    rgb: [{ at: 0.55 }],
  },
  {
    id: 'ram',
    label: '内存',
    note: 'DDR5 · 双通道',
    group: '存储',
    pos: [-0.36, 0.08, 0.38],
    explode: [-0.7, 1.3, 1.4],
    material: { color: '#414A5C', metalness: 0.55, roughness: 0.45 },
    primitives: [
      { kind: 'box', size: [0.24, 0.7, 0.022] },
      { kind: 'box', size: [0.24, 0.7, 0.022], pos: [0, 0, 0.16] },
      // 顶部导光条
      { kind: 'box', size: [0.24, 0.025, 0.028], pos: [0, 0.36, 0], glow: true },
      { kind: 'box', size: [0.24, 0.025, 0.028], pos: [0, 0.36, 0.16], glow: true },
    ],
    rgb: [{ at: 0.72 }],
  },
  {
    id: 'storage',
    label: '固态硬盘',
    note: 'NVMe · 直连 CPU 通道',
    group: '存储',
    pos: [-0.47, -0.52, 0.55],
    explode: [-0.7, -0.7, 1.5],
    material: { color: '#4A5263', metalness: 0.5, roughness: 0.5 },
    primitives: [
      { kind: 'box', size: [0.028, 0.22, 0.78] },
      { kind: 'box', size: [0.012, 0.16, 0.24], pos: [0.026, 0, 0.2] },
    ],
  },

  /* ------------------------------ 散热 ------------------------------ */
  {
    id: 'cooler',
    label: '散热器',
    note: '下压式风冷 · 直触热管',
    group: '散热',
    pos: [-0.22, 0.82, -0.24],
    explode: [0.2, 2.0, -0.6],
    material: { color: '#B4BAC8', metalness: 0.7, roughness: 0.34 },
    primitives: [
      { kind: 'box', size: [0.36, 0.52, 0.52] },
      { kind: 'cyl', radius: 0.24, height: 0.08, segments: 32, pos: [0.21, 0, 0], rot: [0, 0, Math.PI / 2], spin: 4.2 },
      { kind: 'cyl', radius: 0.075, height: 0.1, segments: 20, pos: [0.23, 0, 0], rot: [0, 0, Math.PI / 2] },
      { kind: 'torus', radius: 0.245, tube: 0.017, segments: 36, pos: [0.25, 0, 0], rot: [0, Math.PI / 2, 0], glow: true },
    ],
    rgb: [{ at: 0.24 }],
  },
  {
    id: 'fans',
    label: '机箱风扇',
    note: '顶部双风扇 · 出风',
    group: '散热',
    pos: [0, 1.12, 0],
    explode: [1.3, 1.75, 0],
    material: { color: '#383C48', metalness: 0.42, roughness: 0.52 },
    primitives: [
      { kind: 'cyl', radius: 0.33, height: 0.08, segments: 40, pos: [0, 0, -0.35], spin: 2.6 },
      { kind: 'cyl', radius: 0.14, height: 0.1, segments: 24, pos: [0, 0, -0.35] },
      { kind: 'cyl', radius: 0.33, height: 0.08, segments: 40, pos: [0, 0, 0.35], spin: -2.6 },
      { kind: 'cyl', radius: 0.14, height: 0.1, segments: 24, pos: [0, 0, 0.35] },
      // 外圈发光
      { kind: 'torus', radius: 0.335, tube: 0.02, segments: 44, pos: [0, -0.045, -0.35], rot: [Math.PI / 2, 0, 0], glow: true },
      { kind: 'torus', radius: 0.335, tube: 0.02, segments: 44, pos: [0, -0.045, 0.35], rot: [Math.PI / 2, 0, 0], glow: true },
    ],
    rgb: [{ at: 0.88 }, { at: 0.3 }],
  },

  /* ------------------------------ 供电 ------------------------------ */
  {
    id: 'psu',
    label: '电源',
    note: 'SFX 全模组 · 金牌',
    group: '供电',
    pos: [0, -1.1, 0],
    explode: [0.4, -1.6, -0.8],
    material: { color: '#343948', metalness: 0.55, roughness: 0.48 },
    primitives: [
      { kind: 'box', size: [1.5, 0.6, 1.3] },
      { kind: 'cyl', radius: 0.24, height: 0.06, segments: 32, pos: [0, 0.31, 0], spin: 2.2 },
    ],
  },
]

/** 部件 id → spec，便于外部按 id 取用（配置器换件时会用到） */
export const PART_BY_ID = Object.fromEntries(MPC_PARTS.map((p) => [p.id, p])) as Record<
  string,
  PartSpec
>

/** 爆炸图浮标只标注这些「看得懂」的部件，外壳类不全标，避免刷屏 */
export const LABELED_PART_IDS = [
  'front-glass',
  'motherboard',
  'cpu',
  'cooler',
  'ram',
  'gpu',
  'fans',
  'psu',
  'storage',
] as const
