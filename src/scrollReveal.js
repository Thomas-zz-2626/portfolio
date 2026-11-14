// ── 全站滚动触发动效系统(IntersectionObserver + WAAPI,动效响应式规范 v1)──
// 标记驱动:元素向下滚入视口时淡入+轻微上移,播完保持显示。
// 全局一次性 + 单向(2026-11-07 用户要求,全站适用):
//  · 只在向下滚动时触发入场;向上滚回不重播、不触发——从视口上方滚入的
//    元素直接呈现、不播动画;
//  · 背景不参与动效:data-reveal 只挂文字/图片/视频等内容元素,带底色
//    板块的背景固定静止(只内容滚入触发,不一块块地出来)。
//
// 标记(默认方向 up,可省略):
//   data-reveal                    单个元素入场
//   data-reveal="up|left|fade|scale"  可选方向
//   data-reveal-group              容器,直接子元素按 stagger 依次入场
//   data-reveal-group="up|…"       可选方向
//   data-reveal-once               兼容保留(现为全局默认行为,无需再标)
//   data-reveal-count="500" data-reveal-count-suffix="w+"  可选数字计数(仅播一次)
//
// 性能(用户硬性要求):
//  · 检测用 IntersectionObserver;唯一 scroll 监听是被动式方向记录器(每次
//    滚动一次标量赋值,零布局读取、无 rAF 工作),滚动期间无 JS 重绘/重排;
//  · 动画只动 transform/opacity,由 WAAPI(element.animate)在合成器上跑,
//    不触发重排;IO 回调按 rAF 合帧批量处理(节流);
//  · will-change 仅动画期间挂,结束即释放;入场后即 unobserve,之后不再
//    产生任何回调;
//  · 视频/hero/coverflow 等(DENY_SELECTORS)不绑定,不叠加多余动画。
//
// 安全:
//  · 初始隐藏只在 html.js-reveal(由 main.jsx 同步添加)下生效——
//    无 JS / JS 报错时,所有内容默认完整可见;
//  · prefers-reduced-motion:完全不建 Observer,内容直接呈现(JS+CSS 双保险);
//  · 重复初始化(面板切换、分类切换、项目切换)先 disconnect 上一个实例,
//    不会堆积监听;已显示元素保持显示不重播,新元素照常触发。
import gsap from 'gsap'

// 已有动效 / 必须静止的元素,永不绑定(即使误标)。
const DENY_SELECTORS = [
  '.hero',                        // 专属入场编排(heroTimeline)
  '.navbar',                      // 专属入场 + 固定定位
  '.lightbox__hero',              // hero 视频编排
  '.lightbox__related-coverflow', // coverflow 自带
  '.pest__stage',                 // PEST 交互舞台
  '.narrative',                   // 自带 IO 卡片入场 + 线描
  '.about__avatar-img',           // 自带 scrub 视差
  '.footer__heading-word',        // 自带 hover quickTo
  'video',                        // 播放中的媒体
  // 左右铺满页面的全幅图不参与滚动触发(2026-10-17 约定,现在与未来
  // 统一生效):statement 图 / fullpage 全景图 / endimages 收尾图。
  '.lightbox__statement-img',
  '.lightbox__fullpage',
  '.lightbox__endimages',
]

// 四档参数(规范 v1):手机 / 平板 / 桌面 / 超宽(与桌面同参)。
// 手机档 directions 不含 left——布局纵向堆叠,横向入场自动按 up 处理。
const TIERS = [
  { mq: '(max-width: 639px)', y: 16, duration: 600, stagger: 70, directions: ['up', 'fade', 'scale'] },
  { mq: '(min-width: 640px) and (max-width: 1023px)', y: 20, duration: 650, stagger: 100, directions: ['up', 'left', 'fade', 'scale'] },
  { mq: '(min-width: 1024px)', y: 24, duration: 700, stagger: 100, directions: ['up', 'left', 'fade', 'scale'] },
]

// 触发线:元素顶部进入视口 96% 处(刚露出一点)即触发——IO rootMargin 底部收 4%。
const ROOT_MARGIN = '0px 0px -4% 0px'
// ≈ power2.out,与旧 GSAP 手感一致
const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)'
// 组内 stagger 延迟上限:长网格尾部元素不叠加久等(ms)
const MAX_GROUP_DELAY = 350

// 计数元素只播一次(重复滚入滚出不重数)
const playedSet = new WeakSet()

const isDenied = (el) => {
  if (getComputedStyle(el).position === 'fixed') return true
  return DENY_SELECTORS.some((sel) => el.closest(sel))
}

/** 标记元素不可绑定:跳过并强制可见,防止"永远不出现"。 */
const skip = (el) => el.classList.add('reveal-skip')

// 收集 root 下所有待绑定元素:单元素 + 组子元素。
// 组内 stagger:同组子元素按 DOM 序记 groupIndex,触发后依次入场。
const collect = (root) => {
  const targets = []
  root.querySelectorAll('[data-reveal]').forEach((el) => {
    if (isDenied(el)) { skip(el); return }
    targets.push({ el, dir: el.dataset.reveal || 'up' })
  })
  root.querySelectorAll('[data-reveal-group]').forEach((group) => {
    const dir = group.dataset.revealGroup || 'up'
    ;[...group.children].forEach((child, i) => {
      // 自带标记的子元素单独绑定;不可绑定的强制可见
      if (child.hasAttribute('data-reveal') || child.hasAttribute('data-reveal-group')) return
      if (isDenied(child)) { skip(child); return }
      targets.push({ el: child, dir, groupIndex: i })
    })
  })
  return targets
}

/** 绑定前先把 scroller 解析为元素(IO root 需要元素;window 用 null 视口)。 */
const resolveScroller = (scroller) =>
  scroller && typeof scroller === 'string' ? document.querySelector(scroller) || window : window

/** 已开始播放的计数元素统一落回终值——重初始化(面板切换)时数字
 *  不能残留 0/中间值。落回终值后进 playedSet,重绑定时跳过、不再重播。 */
const finalizeCounters = (root) => {
  root.querySelectorAll('[data-reveal-count].reveal-count-started').forEach((el) => {
    const t = parseFloat(el.dataset.revealCount)
    if (Number.isFinite(t)) {
      el.textContent = t + (el.dataset.revealCountSuffix || '')
      playedSet.add(el)
    }
  })
}

/**
 * 初始化 root 下的滚动触发动效。返回清理函数;对同一 root 重复调用
 * (面板切换、分类切换、项目切换)前会先执行上次的清理——Observer 即连即断,
 * 不会堆积监听;已显示元素保持显示,未显示元素按视口状态照常绑定。
 * options.scroller:滚动容器选择器(Lightbox 内传 '.lightbox__scroll',
 * 主页面省略即 window 视口)。
 */
export function initReveal(root = document, { scroller } = {}) {
  if (!root) return () => {}
  const scrollerEl = resolveScroller(scroller)
  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)')

  let observer = null
  let disposed = false
  let rafId = 0
  let onScroll = null
  // 单向判定(2026-11-07):被动 scroll 记录器只跟踪滚动位置与方向
  // (每次滚动一次标量赋值,零布局读取)。位置变化超过 2px 视为已开始滚动;
  // 向上滚入的元素直接呈现、不播动画。快速跳转/滚动条拖动时元素首回调
  // 可能落在视口中部、自身轨迹无法判向,方向以滚动记录器为准。
  let baseScroll = null
  let lastPos = 0
  let scrollDir = 0 // 最近一次滚动方向:1 向下 / -1 向上 / 0 未知
  let scrollStarted = false
  const pendingEntries = new Set()
  const metas = new Map()      // el -> { dir, groupIndex, top(上次可见回调的 rect.top) }
  const counterEls = new Set() // 只播一次的计数元素
  const counterTops = new Map() // 计数元素的方向判定同上
  const anims = new Map()      // el -> 进行中的 WAAPI 动画
  const counterTweens = new Set()

  const getScrollPos = () =>
    scrollerEl === window
      ? (window.scrollY || document.documentElement.scrollTop || 0)
      : scrollerEl.scrollTop

  const tier = () => TIERS.find((t) => window.matchMedia(t.mq).matches) || TIERS[2]

  const cancelAnim = (el) => {
    const a = anims.get(el)
    if (a) {
      anims.delete(el)
      a.onfinish = null
      a.oncancel = null
      a.cancel()
    }
  }

  /** 显示终态:内联 commit,供重初始化/卸载时保持可见(与 CSS 隐藏态解耦)。 */
  const setShown = (el) => {
    el.style.opacity = '1'
    el.style.transform = ''
    el.style.willChange = ''
  }

  /** 入场:WAAPI 只动 transform/opacity,合成器执行;will-change 动画期间才挂。 */
  const playEnter = (el, meta) => {
    const t = tier()
    const useDir = t.directions.includes(meta.dir) ? meta.dir : 'up'
    const from = { opacity: '0' }
    if (useDir === 'up') from.transform = `translateY(${t.y}px)`
    else if (useDir === 'left') from.transform = `translateX(-${t.y}px)`
    else if (useDir === 'scale') from.transform = 'scale(0.96)'
    // fade:只有 opacity

    cancelAnim(el)
    el.style.willChange = 'transform, opacity'
    const anim = el.animate([from, { opacity: '1', transform: 'none' }], {
      duration: t.duration,
      delay: Math.min((meta.groupIndex || 0) * t.stagger, MAX_GROUP_DELAY),
      easing: EASE,
      fill: 'forwards',
    })
    anims.set(el, anim)
    el.classList.add('is-revealed')
    const done = () => {
      // 完成后取消 fill 动画并把终态内联 commit,
      // 否则残留的 fill 会在退出重置时把元素"拉回"显示态
      if (anims.get(el) !== anim) return
      anims.delete(el)
      anim.onfinish = null
      anim.oncancel = null
      anim.cancel()
      setShown(el)
    }
    anim.onfinish = done
    anim.oncancel = () => {
      if (anims.get(el) === anim) {
        anims.delete(el)
        el.style.willChange = ''
      }
    }
  }

  /** 数字计数(仅播一次):首入视口开播,重复滚入滚出不再重数。 */
  const startCounter = (el) => {
    if (playedSet.has(el)) return
    const target = parseFloat(el.dataset.revealCount)
    if (!Number.isFinite(target)) return
    const suffix = el.dataset.revealCountSuffix || ''
    const finalText = target + suffix
    const proxy = { value: 0 }
    const tween = gsap.to(proxy, {
      value: target,
      duration: 1.2,
      ease: 'power2.out',
      onStart: () => el.classList.add('reveal-count-started'),
      onUpdate: () => { el.textContent = Math.round(proxy.value) + suffix },
      onComplete: () => { el.textContent = finalText; playedSet.add(el) },
      // 播到一半被打断(面板切换/卸载):直接落终值,不残留 0/中间值
      onInterrupt: () => {
        if (el.classList.contains('reveal-count-started')) {
          el.textContent = finalText
          playedSet.add(el)
        }
      },
    })
    counterTweens.add(tween)
  }

  // IO 回调按 rAF 合帧批量处理(节流):一帧内多次回调只 flush 一次,
  // 快速滚动大量元素同时进出视口时,不会每帧重复做类切换和动画创建。
  const flush = () => {
    rafId = 0
    const rootRect = scrollerEl === window
      ? { top: 0, height: window.innerHeight }
      : scrollerEl.getBoundingClientRect()
    const entries = [...pendingEntries]
    pendingEntries.clear()
    // 判定元素本次回调是否属于"从视口上方滚入"(用户向上滚):
    //   · 有上次可见回调 → 元素 top 变大 = 在视口中向下移动 = 向上滚;
    //   · 首次回调       → 以滚动方向为准(向上滚 = 从上方进入);快速跳转
    //     /滚动条拖动时首回调可能落在视口中部,元素自身轨迹无法判向;
    //   · 无滚动信息(纯布局变化挤入视口) → 中线兜底。
    const enteringFromTop = (rect, prevTop) => {
      if (!scrollStarted) return false
      if (prevTop !== undefined) return rect.top > prevTop + 0.5
      if (scrollDir !== 0) return scrollDir < 0
      return rect.top + rect.height / 2 < rootRect.top + rootRect.height / 2
    }
    for (const entry of entries) {
      const el = entry.target
      const meta = metas.get(el)
      const rect = entry.boundingClientRect
      const prevTop = meta ? meta.top : undefined
      // 只在可见回调里更新 top:初始/离开视口的回调不能留值——否则
      // 下方元素被跳过后向上滚入,会拿旧的"视口下方"top 误判成向下滚
      if (meta) meta.top = entry.isIntersecting ? rect.top : undefined
      if (entry.isIntersecting) {
        if (counterEls.has(el)) {
          const prevTopC = counterTops.get(el)
          counterTops.set(el, rect.top)
          // 计数只随向下滚动播放;向上滚入直接落终值不播动画(与入场单向一致)
          if (enteringFromTop(rect, prevTopC)) {
            const t = parseFloat(el.dataset.revealCount)
            if (Number.isFinite(t) && !playedSet.has(el)) {
              el.textContent = t + (el.dataset.revealCountSuffix || '')
              playedSet.add(el)
            }
          } else {
            startCounter(el)
          }
        }
        if (!meta) continue
        // 重复初始化后仍在视口的已显示元素:保持显示,不重播
        if (el.classList.contains('is-revealed')) {
          setShown(el)
          if (observer) observer.unobserve(el)
          continue
        }
        // 可视比例不足 1% 先不播:拦截"贴着裁剪容器边缘的亚像素重叠"
        // (如 About 非激活面板条目)造成的误触发;IO 在比例跨过 1% 时
        // 会再次回调,真正可见时正常入场,不会永久隐藏
        if (entry.intersectionRatio < 0.01) continue
        // 全局一次性 + 单向(2026-11-07 用户要求):只在向下滚动时触发
        // 入场;向上滚回(元素从视口上方进入)直接呈现、不播动画
        if (enteringFromTop(rect, prevTop)) {
          setShown(el)
          el.classList.add('is-revealed')
        } else {
          playEnter(el, meta)
        }
        // 一次性:入场/呈现后不再观察——离开视口不重置,滚回不重播
        if (observer) observer.unobserve(el)
      }
      // 离开视口:不做任何处理——全局一次性,内容保持显示(2026-11-07)
    }
  }

  const onEntries = (entries) => {
    entries.forEach((en) => pendingEntries.add(en))
    if (!rafId) rafId = requestAnimationFrame(flush)
  }

  const setup = () => {
    if (disposed || reduceMq.matches) return
    if (!('IntersectionObserver' in window)) {
      // 极旧浏览器:全部直接显示,不做入场动画
      root.querySelectorAll('[data-reveal], [data-reveal-group] > *').forEach((el) => skip(el))
      return
    }
    collect(root).forEach((t) => metas.set(t.el, { dir: t.dir, groupIndex: t.groupIndex, top: undefined }))
    root.querySelectorAll('[data-reveal-count]').forEach((el) => counterEls.add(el))
    if (!metas.size && !counterEls.size) return
    observer = new IntersectionObserver(onEntries, {
      root: scrollerEl !== window ? scrollerEl : null,
      rootMargin: ROOT_MARGIN,
      // [0, 0.01]:0 档负责进出视口判定,0.01 档负责"可视比例足够"补发回调
      threshold: [0, 0.01],
    })
    metas.forEach((_, el) => observer.observe(el))
    counterEls.forEach((el) => observer.observe(el))
    // 方向记录器(2026-11-07):与实例同生命周期,重初始化时重挂。
    // 只记录位置/方向,不做任何布局读取之外的 JS 工作。
    baseScroll = getScrollPos()
    lastPos = baseScroll
    scrollDir = 0
    scrollStarted = false
    onScroll = () => {
      const pos = getScrollPos()
      if (!scrollStarted && Math.abs(pos - baseScroll) > 2) scrollStarted = true
      const d = pos - lastPos
      if (d > 0.5) scrollDir = 1
      else if (d < -0.5) scrollDir = -1
      lastPos = pos
    }
    const scrollTarget = scrollerEl === window ? window : scrollerEl
    scrollTarget.addEventListener('scroll', onScroll, { passive: true })
  }

  setup()

  const onReduceChange = () => {
    cleanup(false)
    setup()
  }
  reduceMq.addEventListener('change', onReduceChange)

  /** 拆一个实例:断开 Observer、杀掉动画与计数补间;重初始化不堆积监听。 */
  const cleanup = (final = true) => {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0 }
    pendingEntries.clear()
    if (onScroll) {
      const scrollTarget = scrollerEl === window ? window : scrollerEl
      scrollTarget.removeEventListener('scroll', onScroll)
      onScroll = null
    }
    if (observer) { observer.disconnect(); observer = null }
    counterTweens.forEach((tw) => tw.kill())
    counterTweens.clear()
    // 进行中的入场动画:先 cancel 再落显示终态,重初始化后保持可见不重播。
    // 必须先 cancel——不取消的话 fill:forwards 的动画对象会残留在元素上
    // (且已不在 anims 表里),之后清不掉,元素被卡在可见态
    anims.forEach((anim, el) => {
      anim.onfinish = null
      anim.oncancel = null
      anim.cancel()
      setShown(el)
    })
    anims.clear()
    if (final) {
      finalizeCounters(root)
      disposed = true
      reduceMq.removeEventListener('change', onReduceChange)
    }
  }

  return () => cleanup(true)
}

/** 兼容导出:IO 自动跟踪布局与动态内容,无需手动刷新。 */
export function refreshReveal() {}
