import { OSS } from '../assetBase.js'
// ── 叙事尾段:外壳页(静态标题 + 居中产品图)+「设计目的」──
// 挂在 BrightnessCharts 的 Fragment 之后,只随 pendant-1 挂载:
// 图表区(黑)→ 外壳页(白)→「设计目的」(白)。
//
// 白底简约工业风(用户 2026-10-18 二次修订:背景换白):白底 #ffffff、
// 无边框、无辅助标记线;白底照片原图直出与白底无缝融合。
//
// 用户 2026-10-19 简化(算了,全部去掉):三层视差滚动、标题向左下
// 钉住动效、右侧钛合金参数卡片全部移除——外壳页 = 50vh 静态标题
// 板块(标题 + 细横线 + 小字)+ 1-1 原图静态居中(不贴左右边缘、
// max-width 1400 封顶(同日用户第三次要求放大:800 → 1000 → 1200 → 1400),两侧
// 留白随视口收放),下方直接接「设计目的」。
// 整页无滚动动效,reduced-motion 无需额外处理;图片懒加载 + webp
// srcset(<1280 屏幕走 webp,≥1280 用原图)。
import { useState } from 'react'
import InkReveal from './InkReveal'
import FormDerivation from './FormDerivation'
import EngineeringDerivation from './EngineeringDerivation'
import FinalPresentation from './FinalPresentation'
import { getSrcSet, getLqip, SIZES } from '../imageSrc'
import './DesignPurpose.css'

const SHELL_IMAGE = OSS + '/images/edc/pendant-1/1-1.png'

function ShellScene() {
  const lqip = getLqip(SHELL_IMAGE)
  return (
    <div className="lightbox__shellscene">
      {/* 标题板块:50vh 白底静态居中(标题 + 细横线 + 小字);
          标题→横线 = 横线→小字 同间距 */}
      <section className="lightbox__shell-pitch">
        <h2 className="lightbox__shell-title">承托光源的外壳</h2>
        <span className="lightbox__shell-divider" aria-hidden="true" />
        <p className="lightbox__shell-sub">氚管是玻璃做的，挂在钥匙串上天天被钥匙砸、被硬币磨、被汗水泡、被雨淋 ——玻璃不碎的前提，是外壳先扛住。</p>
      </section>
      {/* 静态产品图:1-1 原图居中、不贴左右边缘、max-width 1400 封顶 */}
      <figure className="lightbox__shell-figure">
        <img
          src={SHELL_IMAGE}
          srcSet={getSrcSet(SHELL_IMAGE)}
          sizes={SIZES.stack}
          alt="承托光源的外壳——氚管吊坠"
          loading="lazy"
          decoding="async"
          style={lqip ? { backgroundImage: `url(${lqip})`, backgroundSize: 'cover' } : undefined}
        />
      </figure>
    </div>
  )
}

function PurposeHalfPage() {
  const [revealed, setRevealed] = useState(false)
  const [revealN, setRevealN] = useState(0)
  return (
    <section className="lightbox__purpose">
      <div className="lightbox__purpose-inner">
        <h2 className="lightbox__purpose-title">设计目的</h2>
        <span className="lightbox__purpose-divider" aria-hidden="true" />
        <p
          className={`lightbox__purpose-text${revealed ? ' lightbox__purpose-text--revealed' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="设计目的:黑夜里随身携带的一个光点标记物。把鼠标放在文字上滑动即可揭开,或按回车键显示。"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setRevealed(true)
              setRevealN((n) => n + 1)
            }
          }}
        >
          <span className="lightbox__purpose-sentence">黑夜里随身携带的一个光点标记物</span>
          <InkReveal className="lightbox__purpose-mask" forceReveal={revealN} onRevealStart={() => setRevealed(true)} />
        </p>
      </div>
    </section>
  )
}

// ── 「展开查看完整过程」:设计目的下方(2026-10-21 用户要求)──
// 按钮与擦窗机器人页面同款(44px 橙色圆钮 + 下箭头 + 灰字);
// 展开后第一张图 = 2-1.png 通栏左右贴边(2026-10-21 用户要求),
// 其下方直接接「形态推导 Form Derivation」版面(2026-10-21 用户要求:
// 该版面属于展开内容,点击展开后才显示,不在展开区块之外);
// 2026-10-22 用户要求:后面未补图的空槽位先全部删除,后续要加
// 东西时再说(空槽 CSS 一并移除)。
// 展开是点击驱动的一次性交互(与墨水揭秘同类),非滚动动效;
// 过渡只有 opacity + max-height;reduced-motion 由 index.css
// 全局 0.01ms 规则兜底(箭头弹跳停、展开瞬时)。
const PROCESS_HERO = OSS + '/images/edc/pendant-1/2-1.png'

// expanded 状态提升到 DesignPurpose:「最终呈现」黑页在展开区块之外,
// 需要知道展开与否来决定顶部渐变(收起态渐变、展开态黑带直连);
// 展开后 section 底部白留白也归零,让 3-4 黑带直贴黑页。
function ProcessExpand({ expanded, onExpand }) {
  return (
    <section className={`lightbox__purpose-process${expanded ? ' lightbox__purpose-process--expanded' : ''}`}>
      <div
        className={`lightbox__purpose-process-slots${expanded ? ' lightbox__purpose-process-slots--expanded' : ''}`}
        aria-hidden={!expanded}
      >
        {/* 第一张:2-1.png 通栏贴边(用户 2026-10-21 要求)。
            注意:2-1.png 带 alpha(约 65% 像素全透明、内容居中),LQIP 底图
            会从透明区透出模糊灰影(像灰雾盖图),故此图不挂 LQIP,透明区
            直接露白页——与 1-1 白底照片同款观感;aspect-ratio 已防 CLS。 */}
        <figure className="lightbox__purpose-process-hero">
          <img
            src={PROCESS_HERO}
            srcSet={getSrcSet(PROCESS_HERO)}
            sizes={SIZES.full}
            alt="氚管灯完整设计过程"
            loading="lazy"
            decoding="async"
          />
          {/* 图下小字(2026-10-21 用户要求):通栏图的过程说明,随图一起只在
              展开后出现。2026-10-21 用户再改:分两段、居中对齐、紧贴图下 */}
          <figcaption className="lightbox__purpose-process-caption">
            <p>以氚自发光管为起点，由密闭自持发光的管状形态，延伸提取导弹浓缩、锐利的硬核意象；</p>
            <p>经过多方案草图比对与造型收敛，逐步删减复杂曲面与多余结构，转化为干净的柱体轮廓，保留侧窗用来呈现内部发光核心，落地为低冗余的极简筒体外观。</p>
          </figcaption>
        </figure>
        {/* 「形态推演」:2-1 通栏图正下方的页面(2026-10-21
            用户要求)——只在点击展开后随区块一起显示,收起时不可见。
            2026-10-22 用户要求:空槽位全部删除,后续要加内容时再说;
            标题改中文「形态推演」。 */}
        <FormDerivation />
        {/* 「工程推演」(2026-10-22 用户要求):形态推演四张图正下方,
            标题 + 一行三张图(3-1/3-2/3-3,圆角矩形方框框住、横向排列),
            同属展开内容。 */}
        <EngineeringDerivation />
      </div>
      {!expanded && (
        <div className="lightbox__purpose-process-toggle">
          <button
            className="lightbox__purpose-process-expand"
            onClick={onExpand}
            aria-label="展开查看完整过程"
          >
            <svg className="lightbox__purpose-process-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <span className="lightbox__purpose-process-text">展开查看完整过程</span>
        </div>
      )}
    </section>
  )
}

export default function DesignPurpose() {
  const [processExpanded, setProcessExpanded] = useState(false)
  return (
    <>
      <ShellScene />
      <PurposeHalfPage />
      <ProcessExpand expanded={processExpanded} onExpand={() => setProcessExpanded(true)} />
      {/* 「最终呈现」黑页(2026-10-22 用户要求):展开区块之外、
          展开按钮下方;顶部白→黑渐变两态均显示(上方 3-4 带已改白底) */}
      <FinalPresentation />
    </>
  )
}
