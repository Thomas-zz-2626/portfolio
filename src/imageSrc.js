// ── Responsive image srcset helper ──
// sharp 预生成的 480/768/1280w 衍生图仅供 <1280px 屏幕使用；
// ≥1280 桌面始终加载原图（sizes 首条把桌面槽位拉满，浏览器必然选
// 候选中最大的一张 = 原图）。原图文件本身从不被修改或压缩。
import manifest from './derivedImages.json'
import { OSS } from './assetBase.js'

// 2026-11-14:数据里的 src 统一为相对路径(images/...);返回的 srcset/LQIP
// 一律加 OSS 前缀直连阿里云(比 GitHub 快几十倍)。rel() 同时剥掉前导
// 斜杠与 OSS 前缀,调用方传相对路径或 OSS 绝对地址都能查到 manifest。
// OSS='' (本地模式)时 OSS+'/' 是 '/' 会吞掉 images/ 的斜杠,
// 必须按空前缀跳过该步(2026-11-14 修复:本地模式 srcset/LQIP 静默丢失)
const rel = (s) => {
  const k = (s || '').replace(/^\//, '')
  return OSS ? k.replace(OSS + '/', '') : k
}

const lookup = (src) => {
  const key = rel(src)
  if (!key || key.startsWith('images/derived/')) return null
  return manifest[key] || null
}

/** 返回 img 的 srcSet 属性值；无衍生数据时返回 undefined（照常只加载 src）。 */
export const getSrcSet = (src) => {
  const entry = lookup(src)
  if (!entry || entry.candidates.length < 2) return undefined
  return entry.candidates.map((c) => `${OSS}/${rel(c.src)} ${c.w}w`).join(', ')
}

/** 返回该图对应的 LQIP(24px 模糊 webp)URL,用作加载前的低清占位背景。 */
export const getLqip = (src) => {
  const entry = lookup(src)
  return entry?.lqip ? `${OSS}/${rel(entry.lqip)}` : null
}

/** 各上下文的 sizes 表达式。首条 (min-width: 1280px) calc(100vw + 1px)
    —— +1px 把桌面槽位抬到 1281 以上，浏览器必然跳过 1280w 衍生图、
    选中候选中最大的原图(决策 1:≥1280 桌面始终加载原图)。
    2026-10-15 曾尝试桌面小槽位(card/avatar/half/related/meta)改取
    衍生图 webp 减重,用户 2560 屏实测研究图被放大 2.4 倍后"很糊、
    基本上看不了",已全部回滚:桌面全档位恢复原图,webp 衍生图只
    服务 <1280 屏幕(清晰优先,体积靠懒加载/LQIP/Service Worker)。 */
const DESKTOP_FORCE_ORIGINAL = '(min-width: 1280px) calc(100vw + 1px)'

export const SIZES = {
  /** 项目卡片：≥1280 整行卡 ≈600px；1024 三列；768 两列；手机单列 */
  card: `${DESKTOP_FORCE_ORIGINAL}, (max-width: 640px) calc(100vw - 48px), (max-width: 768px) calc(50vw - 40px), calc(33vw - 30px)`,
  /** About 头像：440px(桌面) / 340px / 300px */
  avatar: `${DESKTOP_FORCE_ORIGINAL}, (max-width: 1024px) 300px, 340px`,
  /** Lightbox 首屏大图 / 全幅大图：整屏宽 */
  full: `(min-width: 1280px) calc(100vw + 1px), 100vw`,
  /** Lightbox 图文混排 / showcase 双列：约半屏 */
  half: `${DESKTOP_FORCE_ORIGINAL}, (max-width: 768px) calc(100vw - 48px), 50vw`,
  /** 相关作品轮播小卡：约 1/4 屏(≈230px) */
  related: `${DESKTOP_FORCE_ORIGINAL}, (max-width: 768px) calc(100vw - 48px), 25vw`,
  /** meta 小图块：约 400px */
  meta: `${DESKTOP_FORCE_ORIGINAL}, (max-width: 768px) calc(100vw - 48px), 400px`,
  /** FinalStack 堆叠大卡：与 showcase 模块同宽(桌面 1700−160；≤1024 边距 40；≤768 边距 24) */
  stack: `${DESKTOP_FORCE_ORIGINAL}, (max-width: 768px) calc(100vw - 48px), (max-width: 1024px) calc(100vw - 80px), calc(100vw - 160px)`,
  /** Form Derivation 版面图：≥1280 桌面原图；<1280 按槽位近似(2-2/2-5 整行、2-3/2-4 半行) */
  board: `${DESKTOP_FORCE_ORIGINAL}, (max-width: 1024px) calc(100vw - 48px), 100vw`,
  /** 双图并排各半屏(9-1/9-2 贴边并排):任何视口都恰为 50vw */
  pair: `${DESKTOP_FORCE_ORIGINAL}, 50vw`,
}
