#!/usr/bin/env node
/**
 * 品牌素材处理管线
 * ---------------------------------------------------------------------------
 * 输入：logo/logo-01.svg（矢量）、logo/logo.jpg（位图）、logo/视频+1.mp4（动画）
 * 输出：public/ 下网页可直接用的全套素材
 *
 * 跑法： npm run assets
 *
 * 依赖： ffmpeg（视频）、sharp（位图与 SVG 光栅化）
 * 说明： 换 logo 重跑本脚本即可，不要手改 public/ 里的产物。
 */

import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import sharp from 'sharp'

const run = promisify(execFile)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'logo')
const OUT = path.join(ROOT, 'public')

const SRC_SVG = path.join(SRC, 'logo-01.svg')
const SRC_JPG = path.join(SRC, 'logo.jpg')
const SRC_MP4 = path.join(SRC, '视频+1.mp4')

/* 品牌渐变 —— 从 logo.jpg 逐像素采样得到的真实值 */
const STOPS = [
  [0.0, '#FF8A05'],
  [0.24, '#FF6055'],
  [0.46, '#E62FA6'],
  [0.72, '#A824E1'],
  [1.0, '#722EFF'],
]
const INK = '#0A0A0F'

const log = (...a) => console.log('  ', ...a)

/* -------------------------------------------------------------------------- */
/*  1. 解析原始 SVG，按结构分成「MPC 字形」「小字」「消散像素点」三组            */
/* -------------------------------------------------------------------------- */

/**
 * 源文件固定是 16 个图形元素，顺序为：
 *   0-1   MPC 字形（两个复合 path）
 *   2-11  "MINI PC CLUB" 小字（10 个字母）
 *   12-15 字形右侧的消散像素点
 * 元素数量对不上说明 logo 换过了，直接报错，不要瞎猜。
 */
function splitLogo(svgText) {
  const shapes = svgText.match(/<(?:path|polygon|rect)\b[^>]*\/?>/g) ?? []
  if (shapes.length !== 16) {
    throw new Error(
      `logo-01.svg 结构变了：期望 16 个图形元素，实际 ${shapes.length} 个。` +
        `请打开 scripts/build-assets.mjs 里的 splitLogo() 重新分组。`,
    )
  }
  const clean = (s) => s.replace(/\s*\/>$/, '/>').trim()
  return {
    glyphs: [shapes[0], shapes[1], ...shapes.slice(12)].map(clean), // MPC + 消散点
    wordmark: shapes.slice(2, 12).map(clean), // MINI PC CLUB
  }
}

function gradientDefs(id, horizontal = true) {
  const coords = horizontal
    ? 'x1="176" y1="512" x2="909" y2="512"'
    : 'x1="0" y1="0" x2="1" y2="0"'
  const units = horizontal ? 'gradientUnits="userSpaceOnUse"' : ''
  return [
    `<linearGradient id="${id}" ${coords} ${units}>`,
    ...STOPS.map(([at, color]) => `<stop offset="${at}" stop-color="${color}"/>`),
    '</linearGradient>',
  ].join('')
}

/** 非白色像素的包围盒 —— 用来把 mark 的 viewBox 裁紧 */
async function alphaBBox(pngBuffer) {
  const { data, info } = await sharp(pngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      // 白底图上，任何明显偏离白色的像素都算内容
      if (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) throw new Error('logo 渲染出来是空白，检查 SVG 是否正常')
  return { minX, minY, maxX, maxY, width, height }
}

/* -------------------------------------------------------------------------- */
/*  2. 视频转码                                                               */
/* -------------------------------------------------------------------------- */

async function encodeVideo(ffmpeg) {
  const base = ['-y', '-v', 'error', '-i', SRC_MP4, '-an', '-vf', 'scale=1280:-2']

  // MP4 / H.264 —— 兼容性兜底
  await run(ffmpeg, [
    ...base,
    '-c:v', 'libx264', '-crf', '23', '-preset', 'slow',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    path.join(OUT, 'intro.mp4'),
  ])

  // WebM / VP9 —— 体积小一半，Chrome / Edge / Firefox 优先吃这个
  await run(ffmpeg, [
    ...base,
    '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0',
    '-row-mt', '1', '-deadline', 'good', '-cpu-used', '3',
    path.join(OUT, 'intro.webm'),
  ])

  // poster：取最后一帧（MPC + MINI PC CLUB 完整出现的定格）
  await run(ffmpeg, [
    '-y', '-v', 'error', '-sseof', '-0.08', '-i', SRC_MP4,
    '-frames:v', '1', '-q:v', '4',
    path.join(OUT, 'intro-poster.jpg'),
  ])
}

/* -------------------------------------------------------------------------- */
/*  3. ICO 封装（sharp 不产 .ico，自己拼容器，内容是 PNG）                      */
/* -------------------------------------------------------------------------- */

function pngToIco(images) {
  const head = Buffer.alloc(6)
  head.writeUInt16LE(1, 2)
  head.writeUInt16LE(images.length, 4)
  const entries = Buffer.alloc(16 * images.length)
  let offset = 6 + 16 * images.length
  images.forEach((img, i) => {
    const e = i * 16
    entries.writeUInt8(img.size >= 256 ? 0 : img.size, e)
    entries.writeUInt8(img.size >= 256 ? 0 : img.size, e + 1)
    entries.writeUInt16LE(1, e + 4)
    entries.writeUInt16LE(32, e + 6)
    entries.writeUInt32LE(img.data.length, e + 8)
    entries.writeUInt32LE(offset, e + 12)
    offset += img.data.length
  })
  return Buffer.concat([head, entries, ...images.map((i) => i.data)])
}

/* -------------------------------------------------------------------------- */
/*  主流程                                                                    */
/* -------------------------------------------------------------------------- */

async function main() {
  await mkdir(OUT, { recursive: true })

  /* --- 3.1 SVG --- */
  const raw = await readFile(SRC_SVG, 'utf8')
  const { glyphs, wordmark } = splitLogo(raw)
  const glyphBlock = glyphs.join('\n  ')
  const wordBlock = wordmark.join('\n  ')

  // 完整 logo（深色底用）：MPC 走品牌渐变，小字走浅灰
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 973" role="img" aria-label="MPC MINI PC CLUB">
  <title>MPC · MINI PC CLUB</title>
  <defs>${gradientDefs('mpcGrad')}</defs>
  <g fill="url(#mpcGrad)">
  ${glyphBlock}
  </g>
  <g fill="#9A9AA6">
  ${wordBlock}
  </g>
</svg>
`
  await writeFile(path.join(OUT, 'logo.svg'), fullSvg)
  log('logo.svg          完整 logo（深色底）')

  // 只有字形的 mark，先按原 viewBox 渲染再量包围盒裁紧
  const markRawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 973">
  <rect width="1024" height="973" fill="#ffffff"/>
  <defs>${gradientDefs('mpcGrad')}</defs>
  <g fill="url(#mpcGrad)">
  ${glyphBlock}
  </g>
</svg>
`
  const probe = await sharp(Buffer.from(markRawSvg), { density: 200 }).png().toBuffer()
  const bb = await alphaBBox(probe)
  const scaleBack = 973 / bb.height // 我们把原 viewBox 等比渲染成 bb.height 高
  const pad = 8
  const vx = Math.round(bb.minX * scaleBack) - pad
  const vy = Math.round(bb.minY * scaleBack) - pad
  const vw = Math.round((bb.maxX - bb.minX) * scaleBack) + pad * 2
  const vh = Math.round((bb.maxY - bb.minY) * scaleBack) + pad * 2

  const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" role="img" aria-label="MPC">
  <title>MPC</title>
  <defs>${gradientDefs('mpcGrad')}</defs>
  <g fill="url(#mpcGrad)">
  ${glyphBlock}
  </g>
</svg>
`
  await writeFile(path.join(OUT, 'logo-mark.svg'), markSvg)
  log(`logo-mark.svg     mark 裁紧视图框 ${vx} ${vy} ${vw} ${vh}`)

  // favicon：深色圆角方块 + 居中的渐变 mark
  const box = 64
  const inner = 46
  const s = Math.min(inner / vw, inner / vh)
  const dx = (box - vw * s) / 2 - vx * s
  const dy = (box - vh * s) / 2 - vy * s
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}">
  <defs>
    ${gradientDefs('fg', false)}
    <linearGradient id="fgBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#15151F"/>
      <stop offset="1" stop-color="#08080D"/>
    </linearGradient>
  </defs>
  <rect width="${box}" height="${box}" rx="15" fill="url(#fgBg)"/>
  <g transform="translate(${dx.toFixed(2)} ${dy.toFixed(2)}) scale(${s.toFixed(4)})" fill="url(#fg)">
  ${glyphBlock}
  </g>
</svg>
`
  await writeFile(path.join(OUT, 'favicon.svg'), faviconSvg)
  log('favicon.svg       深色圆角 + 渐变 mark')

  /* --- 3.2 位图 --- */
  const iconPng = (size) =>
    sharp(Buffer.from(faviconSvg), { density: 400 }).resize(size, size).png().toBuffer()

  const [p16, p32, p180, p192, p512] = await Promise.all([
    iconPng(16), iconPng(32), iconPng(180), iconPng(192), iconPng(512),
  ])
  await writeFile(path.join(OUT, 'favicon.ico'), pngToIco([
    { size: 16, data: p16 },
    { size: 32, data: p32 },
  ]))
  await writeFile(path.join(OUT, 'favicon-32.png'), p32)
  await writeFile(path.join(OUT, 'apple-touch-icon.png'), p180)
  await writeFile(path.join(OUT, 'icon-192.png'), p192)
  await writeFile(path.join(OUT, 'icon-512.png'), p512)
  log('favicon.ico / favicon-32 / apple-touch-icon / icon-192 / icon-512')

  // logo.jpg → webp，给不支持 SVG 的场景兜底
  await sharp(SRC_JPG).resize({ width: 1024 }).webp({ quality: 90 }).toFile(path.join(OUT, 'logo.webp'))
  log('logo.webp')

  // OG 分享图：深色卡 + 品牌光晕 + 完整 logo
  const ogBg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <radialGradient id="oa" cx="16%" cy="-6%" r="72%">
      <stop offset="0" stop-color="#FF8A05" stop-opacity=".34"/>
      <stop offset="1" stop-color="#FF8A05" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ob" cx="92%" cy="12%" r="72%">
      <stop offset="0" stop-color="#722EFF" stop-opacity=".40"/>
      <stop offset="1" stop-color="#722EFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="oc" cx="50%" cy="118%" r="66%">
      <stop offset="0" stop-color="#E62FA6" stop-opacity=".26"/>
      <stop offset="1" stop-color="#E62FA6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="${INK}"/>
  <rect width="1200" height="630" fill="url(#oa)"/>
  <rect width="1200" height="630" fill="url(#ob)"/>
  <rect width="1200" height="630" fill="url(#oc)"/>
</svg>`
  const ogLogo = await sharp(Buffer.from(fullSvg), { density: 300 })
    .resize({ width: 660, fit: 'inside' })
    .png()
    .toBuffer()
  await sharp(Buffer.from(ogBg))
    .composite([{ input: ogLogo, gravity: 'center' }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(path.join(OUT, 'og-cover.jpg'))
  log('og-cover.jpg      1200×630')

  // manifest
  await writeFile(
    path.join(OUT, 'site.webmanifest'),
    JSON.stringify(
      {
        name: 'MPC · MINI PC CLUB',
        short_name: 'MPC',
        description: '极客组装成品电脑',
        start_url: './',
        display: 'standalone',
        background_color: INK,
        theme_color: INK,
        icons: [
          { src: './icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: './icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      null,
      2,
    ),
  )
  log('site.webmanifest')

  /* --- 3.3 视频 --- */
  const ffmpeg = process.env.FFMPEG || 'ffmpeg'
  try {
    await encodeVideo(ffmpeg)
    log('intro.mp4 / intro.webm / intro-poster.jpg')
  } catch (err) {
    console.warn(
      '\n  [跳过视频] 没找到可用的 ffmpeg。装一个再重跑，或者手动把 logo/视频+1.mp4\n' +
        '  转成 public/intro.mp4 + public/intro.webm + public/intro-poster.jpg。\n' +
        '  设置环境变量 FFMPEG 可以指定 ffmpeg 的完整路径。\n',
      err.message,
    )
  }

  console.log('\n素材处理完成 →', OUT)
}

main().catch((err) => {
  console.error('\n素材处理失败：', err.message)
  process.exit(1)
})
