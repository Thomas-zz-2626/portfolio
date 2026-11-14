// ── PEST 宏观背景分析(2026-10-27 改版)──
// 原 P/E/S/T 卡片手风琴替换为 React Bits AccordionGallery 图片手风琴
// (用户指定组件,响应式四档,动效规则见 AccordionGallery.jsx 头注)。
// 数据沿用 pest.cards(id/title/detail/image):label = 「P · 政策」,
// caption = 详情长文,随展开面板亮出;图片暂为占位图(数据字段内,
// 待用户上传替换)。图片管线走 srcSet/LQIP/懒加载(占位图已在
// manifest,替换新图后如无衍生图 getSrcSet 自动回退原图)。
import { getSrcSet, getLqip, SIZES } from '../imageSrc'
import AccordionGallery from './AccordionGallery'
import './Pest.css'

const Pest = ({ pest }) => {
  const items = pest.cards.map((c) => {
    const image = c.image
    return {
      image,
      srcSet: getSrcSet(image),
      sizes: SIZES.half,
      lqip: getLqip(image),
      label: `${c.id} · ${c.title}`,
      caption: c.detail,
      alt: c.title,
    }
  })

  return (
    <section className="pest">
      <div className="pest__inner">
        {pest.heading && (
          <h3 className="pest__heading" data-reveal>
            {pest.heading}
          </h3>
        )}
        <AccordionGallery
          items={items}
          defaultIndex={0}
          expandRatio={0.52}
          trigger="hover"
          radius={8}
          gap={10}
        />
      </div>
    </section>
  )
}

export default Pest
