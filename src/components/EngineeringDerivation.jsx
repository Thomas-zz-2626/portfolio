import { OSS } from '../assetBase.js'
// ── 「工程推演」:展开区块内、「形态推演」版面正下方
//    (2026-10-22 用户要求:四张形态推演图下面加标题「工程推演」,
//    下面一行放三张图 3-1/3-2/3-3 横向排列,每张图有圆角矩形方框框住;
//    与「形态推演」同属展开内容,点击展开后才显示)──
// 白底静态版面,无动效(无需处理 reduced-motion):顶部居中标题
// (与「形态推演」标题同款),下面一行三列图组(横向排列,四档同布局,
// 手机上一行三图等比缩小、保持横向)。
// 三张图均不透明(alpha 全 255),可安全挂 LQIP 占位。
// 2026-10-22 用户追加:三图下方整行 3-4 的「这一行」背景改黑色;
// 同日再改:该带改白底(与上方白页同色),figure 移出 inner 作 section
// 直接子元素,带底白留白接「最终呈现」顶部白→黑渐变(展开态)。
import { getSrcSet, getLqip, SIZES } from '../imageSrc'
import './EngineeringDerivation.css'

const IMAGES = [
  { src: OSS + '/images/edc/pendant-1/3-1.png', cls: 'engder__img-31', alt: '工程推演过程图一' },
  { src: OSS + '/images/edc/pendant-1/3-2.png', cls: 'engder__img-32', alt: '工程推演过程图二' },
  { src: OSS + '/images/edc/pendant-1/3-3.png', cls: 'engder__img-33', alt: '工程推演过程图三' },
]

// 三图下方整行图(2026-10-22 用户要求):版心全宽,圆角 8px;
// 同日改:该行带底色先黑后白(最终白底),figure 移出 inner 作 section
// 直接子元素(白带通栏贴边,底接「最终呈现」顶部白→黑渐变)
// 2026-11-07 用户调整:上槽换 3-5.png(2752×736 宽幅横图,原 3-4.png
// 改名而来,全不透明可挂 LQIP),3-5 下方再放一张 3-4.jpg
// (2752×1536),两张均版心宽度
const FULL_TOP = { src: OSS + '/images/edc/pendant-1/3-5.png', cls: 'engder__img-35', alt: '工程推演总览图' }
const FULL_BOTTOM = { src: OSS + '/images/edc/pendant-1/3-4.jpg', cls: 'engder__img-34', alt: '工程推演总览图二' }

export default function EngineeringDerivation() {
  const fullTopLqip = getLqip(FULL_TOP.src)
  const fullBottomLqip = getLqip(FULL_BOTTOM.src)
  return (
    <section className="engder">
      <div className="engder__inner">
        <h2 className="engder__title">工程推演</h2>
        <div className="engder__row">
          {IMAGES.map((f) => {
            const lqip = getLqip(f.src)
            return (
              <figure className="engder__figure" key={f.src}>
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
              </figure>
            )
          })}
        </div>
      </div>
      <figure className="engder__full">
        <img
          className={FULL_TOP.cls}
          src={FULL_TOP.src}
          srcSet={getSrcSet(FULL_TOP.src)}
          sizes={SIZES.board}
          alt={FULL_TOP.alt}
          loading="lazy"
          decoding="async"
          style={fullTopLqip ? { backgroundImage: `url(${fullTopLqip})`, backgroundSize: 'cover' } : undefined}
        />
        <img
          className={FULL_BOTTOM.cls}
          src={FULL_BOTTOM.src}
          srcSet={getSrcSet(FULL_BOTTOM.src)}
          sizes={SIZES.board}
          alt={FULL_BOTTOM.alt}
          loading="lazy"
          decoding="async"
          style={fullBottomLqip ? { backgroundImage: `url(${fullBottomLqip})`, backgroundSize: 'cover' } : undefined}
        />
      </figure>
    </section>
  )
}
