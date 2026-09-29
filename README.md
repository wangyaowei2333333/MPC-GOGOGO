# MPC · MINI PC CLUB

极客组装成品电脑官网。深色科技风 + 3D 整机展示 + 滚动爆炸图 + 数据驱动的配置器。
纯静态站点，源码在 GitHub，push 即自动部署。

---

## 快速开始

```bash
npm install          # 首次
npm run dev          # 本地开发 → http://localhost:5173
npm run build        # 构建 → dist/
npm run preview      # 预览构建产物
```

调试时不想看启动动画：访问 `http://localhost:5173/?skipIntro=1`，
或在地址栏加 `#site`。同一会话内动画只会播一次（存在 sessionStorage）。

---

## 目录结构

```
.
├─ .github/workflows/
│   ├─ deploy-pages.yml        push → 构建 → 发布 GitHub Pages（备用线）
│   └─ weekly-update.yml       每周一 09:00 刷新数据 + 触发重新部署
├─ logo/                       ★ 原始素材，不要动
│   ├─ logo-01.svg             矢量 logo（单色）
│   ├─ logo.jpg                位图 logo
│   └─ 视频+1.mp4               logo 动画（启动动画的源）
├─ public/                     ← npm run assets 生成，不要手改
│   ├─ logo.svg / logo-mark.svg / favicon.svg
│   ├─ intro.mp4 / intro.webm / intro-poster.jpg
│   ├─ og-cover.jpg            社交分享图
│   └─ icon-*.png / apple-touch-icon.png / favicon.ico
├─ scripts/
│   ├─ build-assets.mjs        素材处理管线
│   └─ fetch-hardware.mjs      每周数据刷新
├─ src/
│   ├─ components/
│   │   ├─ Intro.tsx           01 启动动画
│   │   ├─ Nav.tsx             导航
│   │   ├─ Hero.tsx            02 首屏（3D 整机）
│   │   ├─ ExplodedView.tsx    03 滚动爆炸图
│   │   ├─ Mascot.tsx          吉祥物小机器人
│   │   ├─ ui/Section.tsx      通用区块外壳
│   │   └─ sections/           04-09 各区块
│   ├─ three/
│   │   ├─ partsSpec.ts        ★ 3D 部件定义（纯数据）
│   │   ├─ PCModel.tsx         ★ 模型层（可替换点）
│   │   └─ PCStage.tsx         Canvas / 灯光 / 环境
│   ├─ data/
│   │   ├─ hardware.json       ★ 配件与跑分数据，你主要改这个
│   │   └─ index.ts            数据读取层
│   ├─ lib/                    brand / hooks / asset
│   └─ styles/index.css        设计 token 与品牌渐变
├─ PLAN.md                     建站方案
└─ vercel.json                 Vercel 配置
```

带 ★ 的是你以后最常改的文件。

---

## 命令

| 命令 | 作用 |
|---|---|
| `npm run dev` | 本地开发服务器 |
| `npm run build` | 构建静态产物到 `dist/` |
| `npm run preview` | 预览 `dist/` |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run assets` | **重跑素材管线**（换 logo / 换视频后跑） |
| `npm run data:update` | 手动刷新硬件数据 |

---

## 素材管线

`npm run assets` 会把 `logo/` 里的原始素材处理成 `public/` 里可直接上线的文件。

当前结果（实测）：

| 产物 | 大小 | 说明 |
|---|---|---|
| `intro.mp4` | 187 KB | H.264，兼容兜底（原 2.0 MB） |
| `intro.webm` | 93 KB | VP9，优先加载 |
| `intro-poster.jpg` | 24 KB | 视频加载前的占位帧 |
| `logo.svg` | 3.7 KB | 完整 logo，MPC 走品牌渐变 |
| `logo-mark.svg` | 2.3 KB | 只有字形的 mark，导航栏 / favicon 用 |
| `og-cover.jpg` | 28 KB | 1200×630 分享图 |

合计约 417 KB。

**依赖**：本机需要 `ffmpeg`。没装的话脚本会跳过视频部分（其余素材照常生成），
也可以用环境变量指定路径：

```bash
FFMPEG=/path/to/ffmpeg npm run assets
```

> ⚠️ **换 logo 的注意事项**：`scripts/build-assets.mjs` 里的 `splitLogo()` 按固定的
> 16 个图形元素分组（0-1 是 MPC 字形，2-11 是小字，12-15 是消散像素点）。
> 如果你换了新 logo，元素数量对不上时脚本会直接报错并提示你重新分组 ——
> 这是故意的，免得静默产出错位的 logo。

---

## 数据怎么填

所有业务数据都在 **`src/data/hardware.json`**。改它就行，不用碰代码。

### 机型 `models`

留空数组 `[]` 时，页面显示「机型陆续上架中」的占位，**不会有任何假卡片**。

填好之后长这样：

```json
"models": [
  {
    "id": "air",
    "name": "MPC Air",
    "tagline": "一句话卖点",
    "formFactor": "ITX · 8.4L",
    "price": 5999,
    "cover": "./images/air.jpg",
    "parts": {
      "cpu": "AMD Ryzen 7 9700X",
      "gpu": "NVIDIA RTX 5070",
      "motherboard": "B850I",
      "ram": "32GB DDR5 6000",
      "storage": "1TB NVMe Gen4",
      "psu": "750W SFX 金牌",
      "cooler": "下压式风冷",
      "case": "铝合金侧透"
    },
    "benchmarks": [
      { "label": "赛博朋克 2077 · 2K 高画质", "value": 0, "unit": "fps" }
    ]
  }
]
```

- `price` 填 `null` 或省略 → 页面显示「价格待定」，不会显示假数字
- `cover` 图片放进 `public/images/`，路径写 `./images/xxx.jpg`
- `benchmarks` 的 `value` 填你实测的数字，单位自己定（fps / ℃ / 分 都行）

### 配件 `parts`

`parts` 里每一类填了数据，配置器就会自动变成可用状态；全空时显示占位。

```json
"parts": {
  "cpu": [
    {
      "id": "cpu-9700x",
      "name": "AMD Ryzen 7 9700X",
      "brand": "AMD",
      "spec": "8 核 16 线程 · 65W",
      "price": 2299
    }
  ]
}
```

分类的 key 固定是这八个：`cpu` `gpu` `motherboard` `ram` `storage` `psu` `cooler` `case`。
想改分类顺序或中文名，改 `hardware.json` 里的 `configurator.categories`。

> **一条硬规矩**：这个站点不会编造任何数据。所有数字、型号、价格都来自这个 JSON。
> 空着就显示空态，不会用占位数字糊过去。

---

## 文案改哪里

| 想改什么 | 去哪改 |
|---|---|
| 首屏大标题、按钮 | `src/components/Hero.tsx` |
| 各区块标题与说明 | `src/components/ui/Section.tsx` 的调用处 |
| 组装流程 4 步 | `src/components/sections/Process.tsx` 的 `STEPS` |
| 常见问题 | `src/components/sections/Faq.tsx` 的 `QA` |
| 邮箱、品牌名 | `src/lib/brand.ts` 的 `BRAND` |
| 导航链接 | `src/components/Nav.tsx` 的 `LINKS` |
| 备案号 / 版权 | `src/components/sections/Contact.tsx` 的 `Footer` |

---

## 3D 模型

模型是**代码程序化建的**，不是下载的模型文件 —— 因为免费模型库里能找到的 PC
模型基本都是「一整块机箱外壳」，内部没有独立部件，做不了爆炸图，也没法做配置器
换件。程序化建模还有体积优势：整个模型 0 额外资源，而一个精细机箱 GLB 动辄 20-50 MB。

- 改部件、改配色、加减组件 → `src/three/partsSpec.ts`（纯数据）
- 改渲染逻辑 → `src/three/PCModel.tsx`
- 爆炸位移就是每个部件的 `explode` 向量；主板设为 `[0,0,0]` 作为视觉锚点不动

**想换成下载的 GLB 模型**：`src/three/PCModel.tsx` 顶部写了替换方法，
保持 props 签名不变即可，`Hero.tsx` / `ExplodedView.tsx` 一行都不用改。

### 视觉调参（踩过的坑，改之前先看这段）

这个 3D 是调了三轮才收敛的，下面每一条都是实际翻过车的地方：

| 症状 | 真正的原因 | 怎么改 |
|---|---|---|
| 整机要么全黑要么糊成一坨品牌色 | `metalness > 0.8` 的铝材几乎没有漫反射，环境一亮就过曝、一暗就全黑，没有中间态 | 铝件 `metalness` 压到 **0.5~0.6**，留一半漫反射给灯光控制 |
| 金属看起来不是铝，是塑料染色 | 环境贴图里全是彩色 `Lightformer`，金属反出来的全是彩色 | 环境里保一盏**大面积中性柔光箱**当主反射源（强度必须是全场最高），彩色只做 `scale` 4 左右的小面积补光 |
| 面板正对镜头时是一张灰色平卡片 | box 没有倒角，正对时没有任何棱边吃光 | 用 `RoundedBoxGeometry`，`Primitive.chamfer` 默认 0.012 |
| 部件颜色发紫、像塑料 | 部件本体加了 `emissive`。哪怕 0.1 的 magenta 都会把深灰染成紫 | 本体**默认不发光**，品牌色只出现在 `glow` 基元上 |
| 风扇"光环"变成一坨实心发光圆盘 | `CylinderGeometry` 是**实心圆柱**，不是圆环 | 灯圈必须用 `kind: 'torus'` |
| 拆开后"机箱壳"整个消失 | 玻璃 `opacity` 只有 0.16，拆开后壳看不见，零件像悬空 | `PCModel` 里按进度把玻璃调到 **0.34**；再高就会变成盖住内部的白色挡板 |
| 爆炸图转到"大侧板正对镜头挡住一切" | 320vh 滚动里放任 `autoRotate`，迟早会转到死角 | 爆炸图**不自转**，给固定 `yaw`（现在 -0.72，约 40° 的 3/4 视角）+ 极小幅 `sway` |
| 首屏机型面朝观众、很扁平 | 同一个原因 | 首屏用 `sway` 往复摆动，永远停在 3/4 视角；不要用累积自转 |
| 内部补光在玻璃上烤出热斑 | 没有阴影贴图，近距点光源必然在贴着的面上留热斑 | 别用点光补机箱内部，抬 `ambientLight` 才是安全做法 |

其他固定值：`toneMapping = NeutralToneMapping`（比 ACES 更保饱和），
`toneMappingExposure = 1.35`（**整体明暗的总闸**，想整体提亮改这里，别去逐盏调灯）。

---

## 设计规范（改 UI 之前先读这段）

站点的视觉规则来自两个开源设计 skill，不是凭手感定的：

| 来源 | 实测 star | 许可 | 贡献的规则 |
|---|---|---|---|
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | 90,759 | MIT | AI Tells 禁止清单、重设计协议 |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | 71,935 | Apache-2.0 | craft-floor 的 Verify / Refuse 清单 |

> star 数是 2026-09-29 用 GitHub API 实测的。中文网文转载的数字普遍不准（这两个仓库被写成 28.5K / 89.6K / 94.3K 的都有）。

### 硬规则（改了就是倒退）

- **不要加编号式小标签**（`03 / 结构`、`01 / 4` 这种）。编号不携带读者需要的信息，是最典型的 AI 痕迹。让标题自己说话。
- **等宽字体只用于真实数据**：价格、规格数值、百分比、代码路径、流程步骤号。装饰性使用（把 `SCROLL`、`装配态` 做成等宽 + 大字号）一律不要。
- **渐变文字最多 2 处**。全站只在首屏和爆炸图各一处。每个标题都挑一个词上渐变，用到第九次品牌色就被稀释成套路了。
- **不要三列等高卡片**。要表达并列关系就换形态：流程线、非对称网格、横向滚动。
- **不要用 clip-path 做滚动入场的初始隐藏**（见下面的坑）。
- **emoji / Unicode 字符不能当图标系统**，图标用 SVG。

### 允许保留的

- **品牌紫与品牌渐变**。规则里写明了「品牌明确要求时让步」—— 紫色本身不是问题，问题是用得滥。
- **中文正文里的破折号「——」**。taste-skill 对破折号零容忍，但那针对英文；中文里它是正规标点。

### 入场动效分三层

| class | 用在哪 | 参数 |
|---|---|---|
| `.reveal-mask` | 区段标题 | 26px 位移 / 1.15s，进得有重量感 |
| `.reveal-item` | 列表项、卡片 | 0.65s，同组内逐项错开 80ms |
| `.reveal` | 正文段落 | 10px / 0.75s，快而轻 |

三层速度差是刻意的：全站原来只有同一套淡入，九个区段滚下来像在看同一页。爆炸图是唯一的大动效，不要再往里加。

### 每个区段的形态（别再改回等高卡片）

| 区段 | 形态 | 为什么 |
|---|---|---|
| 首屏 | 文案占 1-6 列、3D 占 5-12 列，第 5-6 列**层叠**，文案在上层 | 左右各一半的对称切割是最省事的排版，也最没记忆点 |
| 工艺 | 四步**流程线**：序号 + 细横线 + 标题 + 描述，无卡片外壳 | 步骤是线性关系，不是并列关系，套卡片是形状与语义不匹配 |
| 产品线 | **一大两小**：首台横版跨 7 列 2 行，第 2/3 台横版小卡占右 5 列，第 4 台起每行 3 张竖版 | 首台是主推型号，得有自己的视觉权重 |
| 性能 / 配置 / FAQ | 列表 + 分隔线，不套卡片 | 同上，别为了「整齐」给所有东西加框 |
| 联系 | 单列，留白拉到 `py-44` | 结尾要收得住，不要又一个信息密集区 |

### 五个坑

**1. clip-path 遮罩揭示会把自己锁死**

给标题做「遮罩自下而上揭示」时，初始 `clip-path: inset(0 0 100%)` 会把元素整个裁掉。
结果 IntersectionObserver 判定它没进入视口，`.is-in` 永远加不上，标题永久消失。
症状很有迷惑性：同一个区段的正文正常显示，只有标题空白。

**结论：滚动入场不要用 clip-path 做初始隐藏，用位移 + 时长区分。**

**2. CSS mask 的相对路径按样式表位置解析**

导航栏 logo 用 mask 实现渐变流动时，`url(logo-mark.svg)` 会被解析成 `/assets/logo-mark.svg`
（因为样式表在 assets/ 下），而 logo-mark.svg 在部署根目录，于是 mask 404、logo 整块不可见。

修法：在 JS 里用 `new URL(asset('logo-mark.svg'), document.baseURI).href` 绝对化，子路径部署（GitHub Pages）也正确。

**3. `lg:row-span-2` 的大卡高度会被旁边的小卡拖着走**

产品线首台用 `col-span-7 row-span-2` 时，它的高度**不由自己决定**，而等于右边两张小卡
高度之和。小卡如果是竖版 4:3 图（约 670px 一张），首台就会被拉到 1393px，
图片槽变成 1:4 的畸形长条，整段崩掉。

**结论：跨行大卡必须和「横版」小卡配对**——小卡图在左（`lg:flex-row` + `lg:w-[38%]`），
高度由文字内容决定（约 220-250px），首台才能落在 460-500px 这个舒服的区间。
另外跨行卡的内容要 `justify-center`，价格行**不能**再挂 `mt-auto`，
否则自由空间全被它吸走，标题和价格之间会裂开一道空白。

**4. 视频素材的白不是纯白**

启动动画那层幕布的颜色必须和视频帧的白完全一致，否则屏幕上会出现一个矩形接缝。
`#FBFBFB` / `#FFFFFF` 都不对：H.264 编码后的白实测是 `#FDFDFD`（四角采样一致）。

量法（改视频素材后要重测）：在页面里建 canvas，`drawImage(video, 0, 0)` 后取角落像素。

**5. `rel="preload" as="video"` 是个「看起来在干活、其实什么都没干」的陷阱**

原本 `index.html` 里写了 `<link rel="preload" href="./intro.mp4" as="video" type="video/mp4">`，
想让启动动画的视频早点开始下载。实际三件事全错：

- Chromium 不认 `as="video"`，控制台报 `` uses an unsupported `as` value ``，**请求根本不发出**；
- 它指向 `intro.mp4`，而浏览器实际优先选的是更小的 `intro.webm`（`<video>` 里有多个 `<source>`），
  等于对着一个用不上的文件做无用功；
- 视频真正的请求是 `<video preload="auto">` 自己发的。

**结论：不要给媒体写 `as="video"` 的 preload，删掉它。**（`as="image"` 是有效的，海报图那个要留着。）

判法：看 resource timing 的 `initiatorType` ——

```js
performance.getEntriesByType('resource').filter(r => /intro\./.test(r.name))
// 期望：intro-poster.jpg -> "link"（preload 生效）
//       intro.webm       -> "video"（<video> 自己拉的）
//       且不该出现 intro.mp4
```

---

## 部署

源码在 GitHub，三个平台都从同一个仓库构建，产物都是静态 `dist/`。

仓库：`https://github.com/wangyaowei2333333/MPC-GOGOGO`

| 平台 | 角色 | 地址 | 怎么配 |
|---|---|---|---|
| **Vercel** | **主站** | `https://<项目名>.vercel.app` | 导入仓库 → 框架直接识别为 Vite（`vercel.json` 已写死 build / output）→ Deploy。之后 push 即自动部署 |
| **Cloudflare Pages** | 国内线路 | `https://<项目名>.pages.dev` | Workers & Pages → 创建 Pages → 连 GitHub → Build `npm run build` / 输出 `dist` |
| **GitHub Pages** | 备用镜像 | https://wangyaowei2333333.github.io/MPC-GOGOGO/ | 仓库 Settings → Pages → Source 选 **GitHub Actions**。`deploy-pages.yml` 会自动跑 |

### 上线自检（`smoke-test.yml`）

每次推送后自动跑，也可以手动触发（Actions → 上线自检 → Run workflow，可传入自定义地址）。
它逐个 curl 三个平台的线上地址，把 HTTP 状态、标题、canonical、og 标签打进 Actions 日志。

下面是 **GitHub Pages 那一条的实测输出**（2026-09-29 核验），Vercel / CF 出来的格式一样：

```
目标: https://wangyaowei2333333.github.io/MPC-GOGOGO/
最终 HTTP: 200
标题     : MPC · MINI PC CLUB — 极客组装成品电脑
canonical: https://wangyaowei2333333.github.io/MPC-GOGOGO/
og:url   : https://wangyaowei2333333.github.io/MPC-GOGOGO/
og:image : https://wangyaowei2333333.github.io/MPC-GOGOGO/og-cover.jpg
占位残留 : 0 处
```

设计上它是**体检报告**而不是门禁：探测失败只给 `::warning::`，不标红提交历史。
首次部署时平台还在构建，所以内置了 6 次重试（每次间隔 30 秒）。

> 为什么需要它：从**沙箱或公司网络**里常常连不到 `*.vercel.app` / `*.pages.dev`
> （实测本机 DNS 对整个 `*.vercel.app` 通配劫持，返回 `104.244.43.x` 这类无关 IP，
> 代理再回 502）。走 Actions 探测就绕开了这些干扰。

`vite.config.ts` 里 `base` 默认是相对路径 `'./'`，所以根域和子路径都能跑。
GitHub Pages 的 workflow 会自动注入 `VITE_BASE=/<仓库名>/`。

### 站点绝对地址（canonical / og:url）怎么来的

`<link rel="canonical">`、`og:url`、`og:image` 必须是**绝对地址**（微信 / Twitter 不解析相对路径），
但三个平台域名各不相同。所以**不要写死**，由 `vite.config.ts` 的 `resolveSiteUrl()` 在构建时解析：

```
VITE_SITE_URL                    ← 显式指定，优先级最高
  ↓ 没有就用
VERCEL_PROJECT_PRODUCTION_URL    ← Vercel 自动注入的生产域名（不带协议头）
  ↓ 没有就用
CF_PAGES_URL                     ← Cloudflare Pages 自动注入的部署地址
  ↓ 没有就用
https://wangyaowei2333333.github.io/MPC-GOGOGO/   ← 兜底（本地构建走这条）
```

解析结果注入两处：`index.html` 里的 `__SITE_URL__` 占位，以及业务代码里的全局常量
`__MPC_SITE_URL__`（`src/lib/brand.ts` 的 `SITE_URL` / `BRAND.domain`）。

**换主域时不用改代码**：在平台的环境变量里加 `VITE_SITE_URL=https://你的域名/` 即可。

> 为什么用 `__SITE_URL__` 而不是 `%SITE_URL%`：Vite 自己会用 `%NAME%` 语法替换
> `import.meta.env`，自定义 token 带百分号有被它先吃掉的风险，留下未替换的占位符。

> 部署后自查：本地 `curl -s https://你的域名/ | grep canonical`，
> 确认输出的是**线上真实域名**而不是占位符。连不上该域名时改用上面的「上线自检」工作流。

### 域名怎么买、怎么绑

**先想清楚一件事：要不要备案。** 这一条决定域名买哪儿。

| 你的情况 | 要 ICP 备案吗 | 域名买哪儿 |
|---|---|---|
| 服务器在 Vercel / Cloudflare Pages（境外） | **不需要** | 哪家都行，海外更便宜 |
| 以后想搬到国内服务器或国内 CDN | **需要** | **必须境内注册商**（阿里云 / 腾讯云 / 华为云…） |

依据（都是官方原文，不是二手总结）：

- 阿里云帮助中心《域名准备与检查》：备案域名核验要求「域名后缀（顶级域名）获得工信部批复」
  **且**「域名的注册商为已批复机构」——境外注册商不在批复名单里，无法备案。
- 腾讯云备案知识库：「境外注册商所注册的域名不能直接备案，请转入境内有资质的服务商。」
- 阿里云帮助中心同一页：「若域名仅解析至非中国内地的服务器，则无需进行备案。」

**本项目的选择**：三线部署全在境外，**现在不需要备案**。
但仍然建议**直接在阿里云 / 腾讯云买** —— `.com` 首年价格和海外差价不到 ¥20/年，
换来的是「以后想备案随时可以」，不用走「转入境内」那一步
（转入要等 60 天冷却期 + 重新实名 + 关闭隐私保护，很折腾）。

**实测价格（2026-09-29 取自官网首页，会变，下单前自己核一遍）**

| 注册商 | `.com` | `.cn` | 实名认证 | 备注 |
|---|---|---|---|---|
| 腾讯云 DNSPod | ¥83/首年（划线价 ¥90） | ¥33/首年（划线价 ¥39） | 必须 | 新用户有 `.com` 首年 0 元活动（需 2 年起注） |
| 阿里云万网 | 日常价 ¥90/年 | 日常价 ¥39/年 | 必须 | 备案助手、免费云解析 |
| Cloudflare Registrar | 成本价，不加价 | **不支持 `.cn`** | 不需要 | 只能用 Cloudflare 自己的 NS，不能换别家 DNS |

⚠️ **只看首年价是行业通病**：首年都是促销价，续费才是长期成本。
`.icu` ¥10、`.cloud` ¥12 这种，续费会跳到 ¥66 / ¥280。

⚠️ **后缀别乱选**：`.top` `.icu` `.xyz` 这类几块钱的后缀被大量滥用，
**微信 / QQ 里发链接容易被拦截**。预算够就上 `.com`。

**绑定时的 DNS 记录**

具体值**以平台面板给出的为准**，不要照抄任何教程（Vercel 的 A 记录 IP 改过好几次）：
Vercel 在项目 Settings → Domains 里会显示该填什么，Cloudflare Pages 在 Custom domains 里也会。

两个都只是写个主机记录 + 目标值，唯一的坑是**根域不能挂 CNAME**（RFC 不允许）：
阿里云/腾讯云解析的「CNAME 拉平」和 Cloudflare DNS 自带的 flattening 都能处理，
所以 `@` 直接填 CNAME 目标在实操里是可行的。

### 国内访问提醒

`*.vercel.app` 和 `*.pages.dev` 的默认域名在国内访问都不稳定。
建议**绑自己的域名**，DNS 放 Cloudflare，国内解析走 Cloudflare Pages 那条线。

### 每周自动更新

`.github/workflows/weekly-update.yml`，每周一 01:00 UTC（北京时间 09:00）执行：

```
刷新 src/data/hardware.json（updatedAt + 可选的价格源）
   ↓
有变更 → 自动 commit + push
   ↓
Vercel / Cloudflare 被 webhook 触发，自动重建上线
GitHub Pages 由脚本显式触发（见下方说明）
```

**要接入自动价格更新**：在仓库 Settings → Variables 加一个 `MPC_PRICE_SOURCE`，
值是一个返回 JSON 的地址，格式：

```json
{ "parts": { "cpu": [ { "id": "cpu-9700x", "price": 2199 } ] } }
```

没配这个变量时，脚本只更新 `updatedAt`，**不会改任何价格**。

> **两个坑，已经处理掉了，但你要知道**：
> 1. GitHub 用默认 `GITHUB_TOKEN` 推的提交**不会触发** `on: push` 的 workflow。
>    所以 Pages 那条线是在每周任务末尾用 `gh workflow run` 显式触发的。
>    Vercel / Cloudflare 走的是 webhook，不受影响。
> 2. GitHub Actions 的定时任务，仓库**连续 60 天无提交会被自动暂停**。
>    因为这个任务每周都会产生一次提交，这个坑自动绕开了。

---

## 吉祥物

`src/components/Mascot.tsx` —— 底部来回溜达的小机器人，会眨眼、撞边回头，
点一下会跳起来说句话。

- **关掉**：把文件里的 `ENABLE_MASCOT` 改成 `false`，或删掉 `<Mascot />`
- **换成你自己的卡通形象**：替换 `<BotSvg />` 里的 SVG 内容即可，走动逻辑只关心容器尺寸，不用动
- 移动端默认不显示（`md:block`），避免占屏幕
- 开了「减弱动态效果」的系统设置时它会静止不动

---

## 无障碍与性能

- 全站尊重 `prefers-reduced-motion`：启动动画降级为静态、滚动动画关闭、吉祥物静止
- 3D 场景不加载任何外部 HDR 文件，环境反射是在场景内实时烘的 —— 国内不会因为 CDN 被墙而黑屏
- 动画进度全部走 ref，不进 React state，滚动时零 re-render
- 启动动画可跳过，且同一会话只播一次

---

## 还没做的

- 配置器选中显卡/散热后 3D 里同步换模型（挂钩点已留好，`selected` 状态直接可用）
- 兼容性校验的**真实规则**（现在 `Configurator.tsx` 里的 `checkCompat()` 是空实现，
  需要按品牌/插槽/长度/限高补规则）
- 微信 / QQ 联系方式、ICP 备案号
- 机型实拍图
