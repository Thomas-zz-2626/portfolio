// ── 「使用人群差异化需求解读」(2026-11-05 用户要求):棱光钢笔 pen-2
//    卡片内首图下方黑底板块——中标题(与「形态推演/工程推演」同款
//    中标题档:居中、全站标题档字号、900、黑底反白 #f5f5f5)+ 图 1
//    (pen-2/1.png,3100×3078、全不透明 → LQIP 安全)版心
//    min(1400, vw−48) 居中、圆角 8px(全站图片规则)。
//    静态版面、无动效(无需 reduced-motion 处理);四档同布局,无断点差异。
import { getSrcSet, getLqip, SIZES } from '../imageSrc'
import './DemandReading.css'

const DEMAND_IMAGE = 'images/edc/pen-2/1.png'

export default function DemandReading() {
  const lqip = getLqip(DEMAND_IMAGE)
  return (
    <section className="demand">
      <h2 className="demand__title">使用人群差异化需求解读</h2>
      <figure className="demand__figure">
        <img
          src={DEMAND_IMAGE}
          srcSet={getSrcSet(DEMAND_IMAGE)}
          sizes={SIZES.board}
          alt="使用人群差异化需求解读"
          loading="lazy"
          decoding="async"
          style={lqip ? { backgroundImage: `url(${lqip})`, backgroundSize: 'cover' } : undefined}
        />
      </figure>
    </section>
  )
}
