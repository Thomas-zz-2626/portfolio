// ── Responsive image srcset helper ──
// sharp 预生成的 480/768/1280/1600/2560w q82 webp 衍生图按槽位宽度
// 选择(槽位 ≤ 候选宽,永不放大);桌面全屏/贴边槽取最大候选(2560w
// 或原宽 webp)。2026-11-15 用户同意「同尺寸 webp」:github.io 国内
// ~123KB/s 下 PNG/JPG 原图单张 45s+,webp 提速 3-5 倍。原图文件
// 保留在 public/ 不被引用(用户素材,如需换 CDN 可恢复引用)。
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

/** 各上下文的 sizes 表达式。2026-11-15 用户同意「同尺寸 webp」提速
    (github.io 国内 ~123KB/s,灯箱原图单张 45s+):桌面不再强制加载
    PNG/JPG 原图,改为按显示位宽度声明槽位,浏览器取 480~2560w 的
    q82 webp 候选——槽位宽 ≤ 候选宽,永不放大,画质在显示尺寸下与
    原图不可辨。原图文件保留在 public/ 不再被引用(用户素材)。
    候选:480/768/1280/1600/2560w + ≤2560w 原图的全分辨率 webp。
    2026-10-15 曾因桌面改 webp 被放大 2.4 倍"很糊"而回滚原图;
    本次不再复用该错误:槽位按实际显示宽声明,无放大即无糊。 */
const DESKTOP_FORCE_ORIGINAL = '(min-width: 1280px) calc(100vw + 1px)'

export const SIZES = {
  /** 项目卡片:桌面槽位声明 640px(实际显示 ~600-800px),使浏览器取
      768w webp(DPR1)/1280w webp(DPR2)而非 1-6MB 原图——2026-11-15
      用户报告首页图片加载极慢(github.io 国内 ~150KB/s,原图 5MB 需
      30s+),卡片封面改用衍生 webp 后单图 <1s。 */
  card: '(max-width: 640px) calc(100vw - 48px), (max-width: 768px) calc(50vw - 40px), 640px',
  /** About 头像：桌面 ~440px(→480w) / 340 / 300 */
  avatar: '(max-width: 1024px) 300px, 440px',
  /** Lightbox 首屏大图 / 全幅贴边大图：桌面取最大候选(2560w 或原宽 webp,
      2560 屏 1:1;DPR2 取 2560w) */
  full: `${DESKTOP_FORCE_ORIGINAL}, 100vw`,
  /** Lightbox 图文混排 / showcase 双列：约半屏 ≤700(→768w) */
  half: '(max-width: 768px) calc(100vw - 48px), 700px',
  /** 版心内全宽图(research 洞察图/showcase 单列/process 背景图):
      版心 1400−两侧 80px = 1240(→1280w,1.03 余量) */
  wide: '(max-width: 768px) calc(100vw - 48px), 1240px',
  /** 工程推演三列等宽图(3-1/3-2/3-3):桌面约 470(→480w) */
  third: '(max-width: 768px) calc((100vw - 48px) / 3), 470px',
  /** 相关作品轮播小卡：约 1/4 屏 ≤350(→480w) */
  related: '(max-width: 768px) calc(100vw - 48px), 350px',
  /** meta 小图块：约 400px(→480w) */
  meta: '(max-width: 768px) calc(100vw - 48px), 400px',
  /** FinalStack 堆叠大卡：版心 1400(→1600w)；≤1024 边距 40；≤768 边距 24 */
  stack: '(max-width: 768px) calc(100vw - 48px), (max-width: 1024px) calc(100vw - 80px), 1400px',
  /** Form Derivation 版面图：版心 1400(→1600w) */
  board: '(max-width: 1024px) calc(100vw - 48px), 1400px',
  /** 双图并排各半屏(9-1/9-2 贴边并排):桌面 50vw≤1280(→1280w 恰 1:1) */
  pair: '(max-width: 1280px) 50vw, 1280px',
}
