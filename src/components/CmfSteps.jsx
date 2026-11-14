// ── 「色彩・材质・工艺」图文台阶滚动板块(2026-11-11 用户要求,棱光 pen-2)──
// 结构:板块顶部四分之一页(25vh)黑带大标题(承接上一版「四分之一页
//       黑带大标题」:标题文本 span 绝对定位在板块顶 12.5vh = 黑带
//       中心),其下粘性面板内左图右文。
// 动效:往下滑,标题升到页面中部(视口 50%)时左半边图 3-1 淡入、约
//       0.2s 后右边文字淡入(2026-11-12 用户要求「第一张图要在标题
//       出现在页面中间的时候就出现」);继续下滑,标题上升到距视口顶
//       约 64px 时钉住(sticky,标题固定页面差不多顶部;同日用户要求
//       下移 48→64px);
//       每再滚动一页(100vh)前进一阶:旧图淡出的同时新图淡入(交叉
//       渐变)、旧字淡出后换新字;3-6 之后继续滚动,面板与标题随页面
//       一起滑出(标题全程固定、释放点与板块结束完全重合,永不会
//       压到下方白色页脚)。向上回滚则反向退阶(双向)。
// 实现:section 高 (n+1)×100vh(6 图 = 700vh,行程 600vh);面板
//       100vh sticky top 0 排最前;h2 排其后、高 calc(100vh − 64px
//       + 12.5vh)、margin-top −100vh 拉回板块顶:sticky top
//       calc(64px − 12.5vh) 钉住时文本中心=64px、盒底恰=视口底,
//       → 释放阈值 secTop + H − 100vh = p=1,与面板同步滑出;
//       h2 盒透明(仅文本渲染)、z-index 2 浮于面板上。同一
//       scrollYProgress 阶跃取步 floor(p×n) 封顶 n−1(每步恰好一页
//       滚动);标题文本中心到达视口中部前图/文保持透明(图先于钉住
//       出现);图片/文字 AnimatePresence 交叉渐变,仅 opacity(合成层,
//       不触发重排)。
// 滚轮两步一阶(2026-11-12 用户先要求「滚一次就改变一个」,同日又改
//       「滚一次切一次太快容易切过头,改滚两次再切下一张」):钉住区间
//       (secTop+0.125h−64 .. secTop+n×100vh)内劫持 wheel——
//       preventDefault 后按格 instant 跳阶,2 格=1 阶,阶跃映射仍是
//       唯一阶源,图/文交叉渐变照常;像素模式每 100px 计一格
//       (Chrome/Edge 鼠标一格=100px)、行模式每事件一格(Firefox
//       鼠标)、触控板连续小增量按累积计(累计 200px 才切);不足
//       2 格时挡掉默认滚动原地钉住(防误切)。0 阶向上攒满 2 格
//       放行自然滚动退出钉住;末阶向下攒满 2 格直接跳到释放点
//       (面板/标题同步滑出,避免整屏粘住像卡死)。触屏与静态态
//       不挂监听。
// 2026-11-14 v9→v10(用户:滚两次容易滚过头、快速滚动不应连跳、
//       保证每张图可读)——参照 fullpage.js 一类整页滚动动效:
//       · 步进锁:每次阶变后 LOCK_MS(900ms,覆盖交叉渐变 ~0.6s +
//         阅读停顿)内吞掉全部滚轮——快滚/惯性最多切一阶、绝不连跳,
//         每张图至少停留 900ms 保可读;
//       · 到达锁:钉住区间外的滚轮不断重设锁——一路滚进来的那股
//         惯性在入区间后 LOCK_MS 内被吞掉,3-1 保住阅读时间;
//       v10 修正(用户报:滚到第三张图上下都滚不动):v9 的快滚抑制
//       (两格间隔 <120ms 整股吞掉)误伤正常拨轮——鼠标拨轮一格
//       间隔常 <120ms,每格都被吞且清空已攒格数,拨轮手势永远凑
//       不齐两格=卡死。步进锁本身已把阶变后 LOCK_MS 内的余格全部
//       吞掉(快甩一甩最多一阶、刻意两格一阶),无需再按速度吞格,
//       故删除快滚抑制。
// 响应式:手机 <640 单列(图上文下);矮视口(<560px)/reduced-motion
//       退化为静态:紧凑标题 + 六行图文纵向排列,内容完整呈现。
// 2026-11-14 用户要求:这几张图回到最开始网页全屏的样子,移动端
//       (<768)不再适配查看——所有宽度统一全屏台阶滚动,棱光页移动端
//       由 Lightbox 的拦截弹窗接管(见 Lightbox.jsx mobileBlock)。
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react'
import { getLqip, getSrcSet, SIZES } from '../imageSrc'
import './CmfSteps.css'

/**
 * @param {object} props
 * @param {string} props.title 钉住的大标题(黑带居中显示)
 * @param {Array<{image: string, text: string}>} props.steps 台阶图/文
 * @param {import('react').RefObject<HTMLElement>} [props.scrollContainerRef]
 *   滚动容器 ref(卡片内传 .lightbox__scroll)
 */
export default function CmfSteps({ title, steps = [], scrollContainerRef }) {
  const targetRef = useRef(null)
  const stepRef = useRef(0)
  const reducedMotion = useReducedMotion()
  // 矮视口(横屏手机等):与 reduced-motion 同样退化为静态展示
  const [shortViewport, setShortViewport] = useState(
    () => window.matchMedia('(max-height: 560px)').matches
  )
  const [step, setStep] = useState(0)
  // 图/文出现门控:标题文本中心到达视口中部(0.5h)起为 true
  const [shown, setShown] = useState(false)
  const staticMode = !!reducedMotion || shortViewport

  useEffect(() => {
    const mq = window.matchMedia('(max-height: 560px)')
    const onChange = () => setShortViewport(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const { scrollYProgress } = useScroll({
    container: scrollContainerRef,
    target: targetRef,
    offset: ['start start', 'end end'],
  })

  // 阶跃取步(同一进度源,图文严格同步)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (staticMode) return
    const n = steps.length
    const s = Math.min(Math.floor(v * n), n - 1)
    if (s !== stepRef.current) {
      stepRef.current = s
      setStep(s)
    }
  })

  // 图/文出现门控(2026-11-12 用户要求):标题文本中心到达视口中部
  // (0.5h)时图/文开始淡入——标题尚未钉住(64px),图先出、标题再
  // 继续上升钉住;滚回中部以上则淡出。独立监听容器 scroll 事件:
  // scrollYProgress 在板块顶以下恒 0 不触发 change,无法表达此门控。
  // 标题中心(视口)= 0.125h + secTop − scrollTop,中部 ⇔ scrollTop =
  // secTop − 0.375h。
  useEffect(() => {
    if (staticMode) return
    const cont = scrollContainerRef?.current
    const sec = targetRef.current
    if (!cont || !sec) return
    const update = () => {
      const cr = cont.getBoundingClientRect()
      const secTop = sec.getBoundingClientRect().top - cr.top + cont.scrollTop
      setShown(cont.scrollTop >= secTop - 0.375 * window.innerHeight)
    }
    update() // 初始求值
    cont.addEventListener('scroll', update, { passive: true })
    return () => cont.removeEventListener('scroll', update)
  }, [staticMode, scrollContainerRef])

  // 图片一次性预载:台阶切换即显示,不闪空白;移动端拦截弹窗显示时
  // 内容 display:none,跳过预载省流量(关闭弹窗后切换按需加载,LQIP 兜底)
  useEffect(() => {
    if (targetRef.current?.closest('.lightbox--mobile-blocked')) return
    steps.forEach((s) => {
      const im = new Image()
      im.src = s.image
    })
  }, [steps])

  // ── 滚轮两步一阶 + 步进锁(2026-11-14 v10:删 v9 快滚抑制——
  //    误伤正常拨轮致上下滚不动;步进锁已保证一甩最多一阶)──
  useEffect(() => {
    if (staticMode) return
    const el = scrollContainerRef?.current
    if (!el) return
    const LOCK_MS = 900 // 步进锁/到达锁时长(交叉渐变 ~0.6s + 阅读停顿)
    let accPx = 0 // 触控板像素累计(每 100px = 一格)
    let tickAcc = 0 // 格累计(2 格 = 1 阶)
    let lockUntil = 0 // 锁截止时间戳
    const onWheel = (e) => {
      const sec = targetRef.current
      if (!sec) return
      const cr = el.getBoundingClientRect()
      const secTop = sec.getBoundingClientRect().top - cr.top + el.scrollTop
      const h = window.innerHeight
      const n = steps.length
      const pinOff = 0.125 * h - 64
      const st = el.scrollTop
      const now = performance.now()
      // 钉住区间外不劫持(接近阶段/释放后正常滚动);不断重设
      // 到达锁——入区间后 LOCK_MS 内那股滚进来的惯性被吞掉
      if (st < secTop + pinOff || st > secTop + n * h) {
        accPx = 0
        tickAcc = 0
        lockUntil = now + LOCK_MS
        return
      }
      // 步进锁:阶变后 LOCK_MS 内吞掉全部滚轮(快滚/惯性不连跳)
      if (now < lockUntil) { accPx = 0; tickAcc = 0; e.preventDefault(); return }
      // 页面模式(deltaMode 2)一格=一屏,自然滚动恰一阶,不劫持
      if (e.deltaMode === 2) { accPx = 0; tickAcc = 0; return }
      const lineMode = e.deltaMode === 1
      const notchMode = e.deltaMode === 0 && Math.abs(e.deltaY) >= 60
      let ticks
      if (lineMode || notchMode) {
        // 行模式(Firefox 鼠标)每事件一格;鼠标一格(deltaY ≥60)一格
        // (v10:不再按格间隔快滚吞格——步进锁已保证一甩最多一阶)
        const dir = Math.sign(e.deltaY)
        if (dir === 0) return
        ticks = dir
      } else {
        accPx += e.deltaY
        ticks = Math.trunc(accPx / 100)
        // 未攒满一格:挡掉默认微滚(区间内页面纹丝不动,防破钉)
        if (ticks === 0) { e.preventDefault(); return }
        accPx -= ticks * 100
      }
      tickAcc += ticks
      const stepPx = Math.trunc(tickAcc / 2)
      // 不足两格:原地钉住不动(防一次就切过头)
      if (stepPx === 0) { e.preventDefault(); return }
      tickAcc -= stepPx * 2
      const v = (st - secTop) / (n * h)
      const cur = Math.min(Math.floor(v * n), n - 1)
      const next = cur + stepPx
      if (next >= n) {
        accPx = 0
        tickAcc = 0
        lockUntil = now + LOCK_MS
        // 末阶向下:两格后整段释放——直接跳到释放点(粘性面板与
        // 标题同步滑出,后续滚动自然继续)。2026-11-12 用户:最后
        // 一张图出现后滚两次应继续往下;原实现每两格只自然走
        // 100px,面板/标题粘住整屏不动,像卡死。
        e.preventDefault()
        el.scrollTo({ top: secTop + n * h + 1, behavior: 'instant' })
        return
      }
      if (next < 0) { accPx = 0; tickAcc = 0; return } // 0 阶向上:退出钉住,自然滚动
      lockUntil = now + LOCK_MS
      e.preventDefault()
      // 阶 0 目标=钉住点(图 3-1 可见);其余阶=阶起点
      const target = next === 0 ? secTop + pinOff + 1 : secTop + next * h + 1
      el.scrollTo({ top: target, behavior: 'instant' })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [staticMode, scrollContainerRef, steps.length])

  if (!steps.length) return null

  if (staticMode) {
    return (
      <section className="cmfsteps cmfsteps--static">
        <h2 className="cmfsteps__band-title"><span>{title}</span></h2>
        <div className="cmfsteps__rows">
          {steps.map((s, i) => (
            <div className="cmfsteps__row" key={i}>
              <figure className="cmfsteps__row-imgbox">
                <img
                  src={s.image}
                  srcSet={getSrcSet(s.image)}
                  sizes={SIZES.half}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={getLqip(s.image)
                    ? { backgroundImage: `url(${getLqip(s.image)})`, backgroundSize: 'contain' }
                    : undefined}
                />
              </figure>
              <p className="cmfsteps__row-text">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    )
  }

  const cur = steps[step]

  return (
    <section
      className="cmfsteps"
      ref={targetRef}
      style={{ height: `calc(${steps.length + 1} * 100dvh)` }}
    >
      <div className="cmfsteps__stage">
        {/* ── 整页全屏图(2026-11-14 用户要求:每张图页面全屏,
            文字位置不变、动效不变):图从网格移出,绝对定位铺满
            100dvh 粘性面板;object-fit 由 CSS --cmf-img-fit 控制
            (方案 A contain 整图完整显示=当前;方案 B cover 铺满)。
            2026-11-14 再改:说明文字锚定容器右下角(见 CSS)。 ── */}
        <AnimatePresence initial={false}>
          <motion.img
            key={step}
            src={cur.image}
            srcSet={getSrcSet(cur.image)}
            sizes={SIZES.full}
            alt=""
            className="cmfsteps__img"
            decoding="async"
            style={getLqip(cur.image)
              ? { backgroundImage: `url(${getLqip(cur.image)})`, backgroundSize: 'contain' }
              : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: shown ? 1 : 0 }}
            exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </AnimatePresence>
        <div className="cmfsteps__content">
          {/* 网格占位:占住左半边格位,文字保持右半边原位 */}
          <div className="cmfsteps__imgbox" aria-hidden="true" />
          <div className="cmfsteps__textbox">
            <AnimatePresence initial={false}>
              <motion.p
                key={step}
                className="cmfsteps__text"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: shown ? 1 : 0,
                  transition: { duration: 0.4, delay: 0.2, ease: 'easeOut' },
                }}
                exit={{ opacity: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
              >
                {cur.text}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <h2 className="cmfsteps__band-title">
        <span>{title}</span>
      </h2>
    </section>
  )
}
