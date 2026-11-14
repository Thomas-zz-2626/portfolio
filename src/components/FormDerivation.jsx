// ── 「形态推演」:展开区块内、2-1 通栏图正下方
//    (2026-10-21 用户要求:属展开内容,点击展开后才显示;
//    2026-10-22 用户要求:标题由英文 Form Derivation 改为中文「形态推演」)──
// 白底静态版面,无动效(无需处理 reduced-motion):顶部居中标题。
// 2026-10-21 用户改版:四张图重排为两行——
// · 第一行:大图 2-2 单独放大填满整行;
// · 第二行:上排 2-3/2-4 等高并排、竖排文字箭头链(原子弹→火箭→
//   爆能器→药剂瓶)放在两张图之间(2026-10-21 用户再改:链从 2-2
//   右边移到 2-3/2-4 之间,两张图等比缩小让出链列,上下间距不变),
//   2-5 横跨整行。
// 2026-10-21 用户再改:所有图片放大到版心最大宽度(第一行 2-2 填满
// 整行、第二行图组左右贴满版心)。四张图均保持原始画幅(2-3/2-4
// 按画幅比例分列宽故等高),纯 CSS calc 无 JS;≥1024 两行版面,
// <1024 堆叠(2-2 整行 → 2-3|链|2-4 上排 → 2-5 整行),四档同布局。
// 四张图均不透明(alpha 全 255),可安全挂 LQIP 占位(与 2-1 不同)。
import { getSrcSet, getLqip, SIZES } from '../imageSrc'
import './FormDerivation.css'

const IMAGES = {
  overview: { src: 'images/edc/pendant-1/2-2.png', cls: 'formder__img-22', alt: '形态推导过程总览' },
  topL: { src: 'images/edc/pendant-1/2-3.png', cls: 'formder__img-23', alt: '形态推导过程图二' },
  topR: { src: 'images/edc/pendant-1/2-4.png', cls: 'formder__img-24', alt: '形态推导过程图三' },
  bottom: { src: 'images/edc/pendant-1/2-5.png', cls: 'formder__img-25', alt: '形态推导过程图四' },
}

// 文字箭头链:从上到下,箭头在文字正下方(最后一项无箭头)
const STEPS = ['原子弹', '火箭', '爆能器', '药剂瓶']

function FormImage({ id }) {
  const f = IMAGES[id]
  const lqip = getLqip(f.src)
  return (
    <img
      className={f.cls}
      src={f.src}
      srcSet={getSrcSet(f.src)}
      sizes={SIZES.board}
      alt={f.alt}
      loading="lazy"
      decoding="async"
      style={lqip ? { backgroundImage: `url(${lqip})`, backgroundSize: 'cover' } : undefined}
    />
  )
}

export default function FormDerivation() {
  return (
    <section className="formder">
      <div className="formder__inner">
        <h2 className="formder__title">形态推演</h2>
        <div className="formder__stage">
          <div className="formder__row1">
            <div className="formder__left">
              <FormImage id="overview" />
            </div>
          </div>
          <div className="formder__group">
            <div className="formder__row">
              <FormImage id="topL" />
              {/* 竖排文字箭头链(2026-10-21 用户再改:放在 2-3/2-4 两张图之间) */}
              <div className="formder__chain">
                {STEPS.map((label, i) => (
                  <div className="formder__step" key={label}>
                    <span className="formder__step-label">{label}</span>
                    {i < STEPS.length - 1 && (
                      <svg className="formder__step-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
              <FormImage id="topR" />
            </div>
            <FormImage id="bottom" />
          </div>
        </div>
      </div>
    </section>
  )
}
