import { useRef, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getSrcSet, getLqip, SIZES } from '../imageSrc'

gsap.registerPlugin(ScrollTrigger)

// LQIP 占位:加载中显示低清模糊底图(lqip-img CSS),载入后淡入原图。
const lqStyle = (src) => {
  const l = getLqip(src)
  return l ? { backgroundImage: `url("${l}")` } : undefined
}
const markLoaded = (e) => e.currentTarget.classList.add('is-loaded')
const loadedRef = (n) => { if (n && n.complete) n.classList.add('is-loaded') }

/**
 * 最终呈现 · 滚动堆叠卡(动效响应式规范 v1)
 * 每张卡与上方 showcase 模块同尺寸(整列宽 16:9,容器/边距断点一致),
 * 滚动时后一张滑出盖住前一张,前一张同步缩到 targetScale(最后一张
 * 不被覆盖、不缩小)。纯 CSS sticky 负责钉住,GSAP 只做 scale scrub。
 *
 * 安全:
 *  · reduced-motion:不建任何 GSAP 补间,卡片静态排列、内容完整可见;
 *  · 无 opacity:0 初始态,无 JS 时同样完整呈现;
 *  · will-change 只在区块在视口内时挂载(.is-active),滚离即释放;
 *  · scroller 在 gsap.context 外解析成元素(context 会把选择器作用域到 root)。
 */
function FinalStack({ images, title, trailingTitle, trailingImage }) {
  const sectionRef = useRef(null)

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const section = sectionRef.current
    if (!section) return
    const scroller = section.closest('.lightbox__scroll') || window
    const wraps = section.querySelectorAll('.lightbox__finalstack-wrap')
    const n = wraps.length
    if (!n) return

    const ctx = gsap.context(() => {
      wraps.forEach((wrap, i) => {
        const card = wrap.querySelector('.lightbox__finalstack-card')
        if (!card) return
        // 越靠前的卡被后面压得越多;最后一张不被覆盖、保持 1
        const targetScale = Math.max(0.6, 1 - (n - i - 1) * 0.08)
        gsap.fromTo(card, { scale: 1 }, {
          scale: targetScale,
          ease: 'none',
          scrollTrigger: {
            trigger: wrap,
            scroller,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        })
      })

      // will-change 开关:区块进入视口才挂到卡片上
      ScrollTrigger.create({
        trigger: section,
        scroller,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => section.classList.toggle('is-active', self.isActive),
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <>
    <section className="lightbox__finalstack" ref={sectionRef}>
      {/* 2026-11-08 用户要求:「最终呈现」大标题滚动时始终钉在页面顶部、
          与下方堆叠图同框——标题改为 section 直接子元素(去掉 inner 包裹,
          使 sticky 的包含块=整个 section 横跨全部卡片),CSS position:sticky
          top:0 钉住,卡片从标题带下方滚过。
          2026-11-08 再改:最后一张图往上滚时标题随它同步上移——h2 钉住盒
          高 100vh(负下边距补偿,净占流高仍 80px),钉住时盒底=视口底,
          与最后一张 100vh 卡同时触发底部约束,严格同步上升(文字带在盒顶) */}
      <h2 className="lightbox__finalstack-title" data-reveal>
        <span className="lightbox__finalstack-title-text">{title || '最终呈现'}</span>
      </h2>
      {images.map((img, i) => {
        const src = typeof img === 'string' ? img : img?.src
        return (
          <div className="lightbox__finalstack-wrap" key={i}>
            <div className="lightbox__finalstack-card">
              {src ? (
                <img
                  src={src}
                  alt=""
                  className="lightbox__finalstack-img lqip-img"
                  style={lqStyle(src)}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  onLoad={markLoaded}
                  onError={markLoaded}
                  ref={loadedRef}
                  srcSet={getSrcSet(src)}
                  sizes={SIZES.stack}
                />
              ) : (
                <div className="lightbox__finalstack-placeholder" />
              )}
            </div>
          </div>
        )
      })}
    </section>
    {/* 堆叠图下方收尾图(2026-11-08 用户要求):版心宽 7.png。
        必须渲染在堆叠 section 之外的兄弟 section——若放在 section 内部,
        section 底缘下移会推迟标题钉住盒的底部约束、破坏标题与末卡的
        同步上移;兄弟 section 上距=与末卡的间距。
        图 7 上方大标题「最终众筹价格」(同日用户要求):与「最终呈现」
        同档样式,静态、不参与滚动钉住 */}
    {trailingImage ? (
      <section className="lightbox__finalstack-trailing">
        {trailingTitle ? (
          <h2 className="lightbox__finalstack-trailing-title" data-reveal>
            <span className="lightbox__finalstack-title-text">{trailingTitle}</span>
          </h2>
        ) : null}
        <img
          src={trailingImage}
          alt=""
          className="lightbox__finalstack-trailing-img lqip-img"
          style={lqStyle(trailingImage)}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onLoad={markLoaded}
          onError={markLoaded}
          ref={loadedRef}
          srcSet={getSrcSet(trailingImage)}
          sizes={SIZES.board}
        />
      </section>
    ) : null}
    </>
  )
}

export default FinalStack
