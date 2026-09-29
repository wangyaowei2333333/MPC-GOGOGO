#!/usr/bin/env node
/**
 * 每周硬件数据刷新
 * ---------------------------------------------------------------------------
 * 跑法： npm run data:update          （本地手动跑）
 *        GitHub Actions 每周一 09:00 自动跑
 *
 * 它做两件事：
 *   1. 如果有配 MPC_PRICE_SOURCE（一个返回 JSON 的地址），就拉取最新价格，
 *      按配件 id 合并进 src/data/hardware.json
 *   2. 把 updatedAt 更新成今天
 *
 * 重要原则：本脚本永远不会「猜」数据。
 *   拉不到来源 → 不编价格；某个配件在来源里找不到 → 保持原值不动。
 *
 * 价格源的 JSON 格式（只写要改的字段就行）：
 *   {
 *     "parts": {
 *       "cpu": [ { "id": "cpu-9700x", "price": 2199 } ],
 *       "gpu": [ { "id": "gpu-5070",  "price": 4599 } ]
 *     }
 *   }
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = path.join(ROOT, 'src', 'data', 'hardware.json')

const today = () => new Date().toISOString().slice(0, 10)

/** 从 URL 或本地文件读价格源。拿不到就返回 null，不抛错。 */
async function loadPriceSource(source) {
  if (!source) return null
  try {
    if (/^https?:\/\//i.test(source)) {
      const res = await fetch(source, { headers: { 'user-agent': 'mpc-site-bot' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    }
    return JSON.parse(await readFile(path.resolve(ROOT, source), 'utf8'))
  } catch (err) {
    console.warn(`  [警告] 价格源读取失败：${err.message} —— 本次不改任何价格`)
    return null
  }
}

function mergePrices(data, source) {
  if (!source?.parts) return []
  const changes = []

  for (const [key, incoming] of Object.entries(source.parts)) {
    const list = data.parts?.[key]
    if (!Array.isArray(list) || !Array.isArray(incoming)) continue

    for (const patch of incoming) {
      if (!patch?.id || typeof patch.price !== 'number') continue
      const target = list.find((p) => p.id === patch.id)
      // 找不到这个 id 就跳过 —— 宁可不动，也不要凭空加一个不存在的配件
      if (!target) continue
      if (target.price === patch.price) continue
      changes.push(`${key}/${target.name || target.id}: ${target.price ?? '—'} → ${patch.price}`)
      target.price = patch.price
    }
  }
  return changes
}

async function main() {
  const raw = await readFile(DATA, 'utf8')
  const data = JSON.parse(raw)
  const before = JSON.stringify(data)

  const source = process.env.MPC_PRICE_SOURCE || ''
  const changes = mergePrices(data, await loadPriceSource(source))

  data.updatedAt = today()

  if (changes.length) {
    console.log(`  价格更新 ${changes.length} 条：`)
    changes.forEach((c) => console.log('   ·', c))
  } else {
    console.log(
      source
        ? '  价格源里没有需要更新的条目'
        : '  未配置 MPC_PRICE_SOURCE，本次只更新 updatedAt（不编造任何价格）',
    )
  }

  if (JSON.stringify(data) === before) {
    console.log('  文件无变化，不写盘')
    return
  }

  await writeFile(DATA, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  console.log(`  hardware.json 已更新 → updatedAt = ${data.updatedAt}`)
}

main().catch((err) => {
  console.error('数据刷新失败：', err.message)
  process.exit(1)
})
