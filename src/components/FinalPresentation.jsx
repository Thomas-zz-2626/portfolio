import { OSS } from '../assetBase.js'
// ── 「最终呈现」(2026-10-22 用户要求):展开区块之外、展开按钮下方的黑页。
//    黑底 + 顶部居中标题「最终呈现」+ 第一张图 4.png 全屏贴边(通栏无圆角)。
//    顶部白→黑渐变接住上方白底(收起态按钮区 / 展开态白色 3-4 带)。
//    2026-10-22 用户追加:4.png 下方整体改白底——5.png 收为版心
//    (min(1400, vw−48) 居中、圆角 8px、与 4.png 留 clamp 距离),小字白底
//    黑字、位置不变;底部白留白直接接下方白色相关作品区。
//    静态版面、无动效(无需 reduced-motion 处理);4.png/5.png 无 alpha,
//    可安全挂 LQIP 占位。四档同布局(贴边图 + 版心图 + 标题居中),无断点差异。
//    2026-10-27 用户追加:图 5 小字下方加四宫格(5-1..5-4,上二下二,
//    每格 16:9,原图均 2752×1536 无 alpha,LQIP 安全)。
import { useEffect, useRef } from 'react'
import { getSrcSet, getLqip, SIZES } from '../imageSrc'
import './FinalPresentation.css'

const FINAL_IMAGE = OSS + '/images/edc/pendant-1/4.png'
const FINAL_IMAGE_5 = OSS + '/images/edc/pendant-1/5.png'
/* Generation 2 收尾大图(2026-11-02 用户要求):卡片最底部、全屏贴边 */
const GEN2_IMAGE = OSS + '/images/edc/pendant-1/6.jpg'
/* 图 7/图 8(2026-11-02 用户要求):7.png 在 6.jpg 上方、8.png 在
   6.jpg 下方,均版心宽。7.png 仍为浅灰虚线占位(用户稍后替换);
   8.png 已于 2026-11-05 被用户替换为真实图 2752×1700(白底、
   全不透明,LQIP 安全)——衍生图 + manifest 已补,SW v12 清旧占位缓存 */
const PLACEHOLDER_IMAGE = OSS + '/images/edc/pendant-1/7.png'
const PLACEHOLDER_IMAGE_8 = OSS + '/images/edc/pendant-1/8.png'
/* 图 9-1/9-2(2026-11-07 用户要求):8.png 下方两图并行——左图贴页面
   左缘、右图贴页面右缘、中间相接,各占页面半宽;两图同 2752×1536、
   全不透明(LQIP 安全) */
const PAIR_IMAGE_LEFT = OSS + '/images/edc/pendant-1/9-1.png'
const PAIR_IMAGE_RIGHT = OSS + '/images/edc/pendant-1/9-2.png'
/* 图 9-3/9-4(2026-11-07 用户追加):行二,贴住行一底缘(无行距);
   两图同 2048×2048、全不透明(LQIP 安全) */
const PAIR2_IMAGE_LEFT = OSS + '/images/edc/pendant-1/9-3.png'
const PAIR2_IMAGE_RIGHT = OSS + '/images/edc/pendant-1/9-4.png'
/* 5 小字下四宫格(2026-10-27 用户要求):上二下二,每格 16:9 */
const FINAL_GRID = ['5-1.jpg', '5-2.jpg', '5-3.jpg', '5-4.png'].map(
  (name) => `images/edc/pendant-1/${name}`
)
/* 最终呈现·视频板块(2026-11-07 用户要求):9-5 视频位下方——大标题
   「最终呈现」+ 两个「左视频右文字」行,排布与钢笔式毛笔 showcase
   完全一致;视频 = 文件夹里的 12.mp4 / 13.mp4;标题与描述文案为
   用户 2026-11-07 提供并修改定稿 */
const SHOWCASE_VIDEOS = [
  {
    src: OSS + '/images/edc/pendant-1/12.mp4',
    title: '微光配饰',
    text: '氚管恒定自发光，暗光下透出内敛微光，融入穿搭细节，低调小众，彰显独特审美与个人气质。',
  },
  {
    src: OSS + '/images/edc/pendant-1/13.mp4',
    title: '微光工具',
    text: '氚管长效自发光，无需电源，暗光环境快速定位、应急示位，兼顾把玩收藏属性，硬核别致。',
  },
]
/* 视频板块下方四宫格(2026-11-07 用户要求):14-1..14-4 上二下二,
   间隙上下左右相等(单 gap 值),整块版心 min(1400,vw−48);
   四图均 2752×1536(16:9)全不透明(LQIP 安全) */
const FINAL_GRID_14 = ['14-1.png', '14-2.png', '14-3.png', '14-4.png'].map(
  (name) => `images/edc/pendant-1/${name}`
)
/* 图 15(2026-11-07 用户要求):卡片最下面、页面宽度(通栏贴边,
   同 4.png/8.png 先例,无圆角);2752×1536 全不透明(LQIP 安全) */
const FINAL_IMAGE_15 = OSS + '/images/edc/pendant-1/15.png'
/* 图 16(2026-11-11 用户要求):「color」图(7.png)下方、6.jpg 上方,
   版心宽 min(1400,vw−48) 圆角 8px;上方大标题「最终众筹价格」;
   1940×814 全不透明(LQIP 安全) */
const FINAL_IMAGE_16 = OSS + '/images/edc/pendant-1/16.png'

export default function FinalPresentation() {
  const showcaseRef = useRef(null)
  const lqip = getLqip(FINAL_IMAGE)
  const lqip5 = getLqip(FINAL_IMAGE_5)
  const lqipGen2 = getLqip(GEN2_IMAGE)
  const lqip8 = getLqip(PLACEHOLDER_IMAGE_8)
  const lqip91 = getLqip(PAIR_IMAGE_LEFT)
  const lqip92 = getLqip(PAIR_IMAGE_RIGHT)
  const lqip93 = getLqip(PAIR2_IMAGE_LEFT)
  const lqip94 = getLqip(PAIR2_IMAGE_RIGHT)
  const lqip15 = getLqip(FINAL_IMAGE_15)
  const lqip16 = getLqip(FINAL_IMAGE_16)

  // 视频行自动播放:行进入视口播放、离开视口暂停(IntersectionObserver,
  // threshold 0.5——同一时刻至多一行过半可见,与钢笔式毛笔 showcase
  // 「中心带内至多一条在播」体验一致);reduced-motion 不自动播
  // (首帧仍显示,动效规范 v1)。muted+playsInline 保证触屏可自动播。
  useEffect(() => {
    const root = showcaseRef.current
    if (!root) return
    const videos = [...root.querySelectorAll('video')]
    if (!videos.length) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const v = entry.target
          if (entry.isIntersecting) {
            const p = v.play()
            if (p) p.catch(() => {})
          } else {
            v.pause()
          }
        })
      },
      { threshold: 0.5 }
    )
    videos.forEach((v) => io.observe(v))
    return () => io.disconnect()
  }, [])
  return (
    <section className="finalpres">
      <h2 className="finalpres__title">最终呈现</h2>
      <figure className="finalpres__figure">
        <img
          src={FINAL_IMAGE}
          srcSet={getSrcSet(FINAL_IMAGE)}
          sizes={SIZES.full}
          alt="最终呈现——氚管灯成品"
          loading="lazy"
          decoding="async"
          style={lqip ? { backgroundImage: `url(${lqip})`, backgroundSize: 'cover' } : undefined}
        />
      </figure>
      {/* 4 下面再接 5(2026-10-22 用户要求):下方整体白底区——5 收为版心、
          小字白底黑字(位置不变) */}
      <div className="finalpres__light">
        <figure className="finalpres__figure finalpres__figure--5">
          <img
            src={FINAL_IMAGE_5}
            srcSet={getSrcSet(FINAL_IMAGE_5)}
            sizes={SIZES.board}
            alt="白天夜晚氚管显示对比"
            loading="lazy"
            decoding="async"
            style={lqip5 ? { backgroundImage: `url(${lqip5})`, backgroundSize: 'cover' } : undefined}
          />
          <figcaption className="finalpres__caption">白天夜晚氚管显示对比</figcaption>
        </figure>
        {/* 四宫格(2026-10-27 用户要求):5-1..5-4 上二下二,每格 16:9 */}
        <div className="finalpres__grid">
          {FINAL_GRID.map((src) => {
            const lqip = getLqip(src)
            return (
              <figure className="finalpres__grid-cell" key={src}>
                <img
                  src={src}
                  srcSet={getSrcSet(src)}
                  sizes={SIZES.half}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={lqip ? { backgroundImage: `url(${lqip})`, backgroundSize: 'cover' } : undefined}
                />
              </figure>
            )
          })}
        </div>
        {/* 「color」中标题(2026-11-02 用户要求):7.png 占位图正上方,
            与「形态推演/工程推演」同款中标题档(居中、标题档字号
            clamp(14px,2.8vw,36px)、900、白底黑字 #171717) */}
        <h2 className="finalpres__mid-title">color</h2>
        {/* 图 7 占位(2026-11-02 用户要求):6.jpg 上方、版心宽 16:9;
            7.png 是浅灰虚线占位图,用户稍后直接替换该文件(替换后
            需重生成衍生图 + SW 升版清缓存);暂不挂 srcset/LQIP */}
        <figure className="finalpres__placeholder">
          <img
            src={PLACEHOLDER_IMAGE}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </figure>
        {/* 图 16(2026-11-11 用户要求):「color」图(7.png)下方、6.jpg
            上方,上方大标题「最终众筹价格」——与钢笔式毛笔同款大标题
            (白带 + 橙色下划线 36×3) */}
        <h2 className="finalpres__price-title" data-reveal>
          <span className="finalpres__price-title-text">最终众筹价格</span>
        </h2>
        <figure className="finalpres__figure16">
          <img
            src={FINAL_IMAGE_16}
            srcSet={getSrcSet(FINAL_IMAGE_16)}
            sizes={SIZES.board}
            alt=""
            loading="lazy"
            decoding="async"
            style={lqip16 ? { backgroundImage: `url(${lqip16})`, backgroundSize: 'cover' } : undefined}
          />
        </figure>
        {/* Generation 2(2026-11-02 用户要求):收尾大图 6.jpg,
            全屏左右贴边、随页面自适应;图片左侧叠白色大标题「Generation 2」
            (6.jpg 左区实测纯黑、白字对比充足);四档同布局,静态无动效 */}
        <figure className="finalpres__gen2">
          <img
            src={GEN2_IMAGE}
            srcSet={getSrcSet(GEN2_IMAGE)}
            sizes={SIZES.full}
            alt="Generation 2 第二代氚管灯"
            loading="lazy"
            decoding="async"
            style={lqipGen2 ? { backgroundImage: `url(${lqipGen2})`, backgroundSize: 'cover' } : undefined}
          />
          <figcaption className="finalpres__gen2-title">Generation 2</figcaption>
        </figure>
        {/* 「第二代改进点」中标题(2026-11-04 用户改,原「第二代的两个版本
            区别」):图 8 正上方,与「color」同款中标题档 */}
        <h2 className="finalpres__mid-title">第二代改进点</h2>
        {/* 图 8(2026-11-02 用户要求加位;2026-11-05 用户替换文件为
            真实图 2752×1700 白底;2026-11-05 再改页面宽度左右贴边):
            6.jpg 下方、通栏无圆角。已挂 srcset/LQIP(衍生图 2026-11-05
            生成,SW v12 清旧占位缓存);贴边用 SIZES.full(桌面强制原图、
            小屏 100vw) */}
        <figure className="finalpres__placeholder finalpres__placeholder--8">
          <img
            src={PLACEHOLDER_IMAGE_8}
            srcSet={getSrcSet(PLACEHOLDER_IMAGE_8)}
            sizes={SIZES.full}
            alt="第二代改进点"
            loading="lazy"
            decoding="async"
            style={lqip8 ? { backgroundImage: `url(${lqip8})`, backgroundSize: 'cover' } : undefined}
          />
        </figure>
        {/* 图 9-1..9-4(2026-11-07 用户要求):8.png 下方两行并排图——每行
            左图贴页面左缘、右图贴页面右缘、中间相接,各占页面半宽;
            行一 9-1/9-2,行二 9-3/9-4 贴住行一底缘(无行距);贴边无圆角;
            行内两图同画幅等高无缝;已挂 srcset/LQIP(衍生图 2026-11-07
            生成;新 URL,SW 不升版);sizes 用 SIZES.pair(桌面强制原图、
            其余 50vw) */}
        <div className="finalpres__pair">
          <div className="finalpres__pair-row">
            <img
              src={PAIR_IMAGE_LEFT}
              srcSet={getSrcSet(PAIR_IMAGE_LEFT)}
              sizes={SIZES.pair}
              alt=""
              loading="lazy"
              decoding="async"
              style={lqip91 ? { backgroundImage: `url(${lqip91})`, backgroundSize: 'cover' } : undefined}
            />
            <img
              src={PAIR_IMAGE_RIGHT}
              srcSet={getSrcSet(PAIR_IMAGE_RIGHT)}
              sizes={SIZES.pair}
              alt=""
              loading="lazy"
              decoding="async"
              style={lqip92 ? { backgroundImage: `url(${lqip92})`, backgroundSize: 'cover' } : undefined}
            />
          </div>
          <div className="finalpres__pair-row finalpres__pair-row--2">
            <img
              src={PAIR2_IMAGE_LEFT}
              srcSet={getSrcSet(PAIR2_IMAGE_LEFT)}
              sizes={SIZES.pair}
              alt=""
              loading="lazy"
              decoding="async"
              style={lqip93 ? { backgroundImage: `url(${lqip93})`, backgroundSize: 'cover' } : undefined}
            />
            <img
              src={PAIR2_IMAGE_RIGHT}
              srcSet={getSrcSet(PAIR2_IMAGE_RIGHT)}
              sizes={SIZES.pair}
              alt=""
              loading="lazy"
              decoding="async"
              style={lqip94 ? { backgroundImage: `url(${lqip94})`, backgroundSize: 'cover' } : undefined}
            />
          </div>
        </div>
        {/* 视频位(2026-11-07 用户要求):9-4 下方版心宽视频槽——src 指向
            9-5.mp4,用户稍后把文件放进 public/images/edc/pendant-1/ 即生效,
            无需改代码;poster 可选同名 9-5-poster.jpg;当前无源文件时显示
            浅灰虚线占位框(加载到元数据后自动摘除虚线);
            下方小字说明居中对齐视频(复用 finalpres__caption 样式) */}
        <figure className="finalpres__video">
          <video
            src={OSS + '/images/edc/pendant-1/9-5.mp4'}
            poster={OSS + '/images/edc/pendant-1/9-5-poster.jpg'}
            controls
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="产品演示视频"
            onLoadedMetadata={(e) => { e.currentTarget.classList.add('finalpres__video--ready') }}
          />
          <figcaption className="finalpres__caption">视频说明文字待补充</figcaption>
        </figure>
        {/* ── 最终呈现·视频板块(2026-11-07 用户要求):9-5 视频位下方 ──
            大标题「最终呈现」+ 两个「左视频右文字」行,排布与钢笔式毛笔
            showcase 完全一致:右文字 position:sticky 随滚动钉住
            (top 120px,行滚完随行底缘离开);视频 = 文件夹里的
            12.mp4 / 13.mp4,进视口自动播放、离视口暂停(IO threshold 0.5
            保证至多一条在播),reduced-motion 不自动播(首帧仍显示);
            标题与描述文案为用户 2026-11-07 提供定稿;小字字号与钢笔式
            毛笔 showcase 右侧描述同档(var(--fs-small)) */}
        <section ref={showcaseRef} className="finalpres__showcase">
          <h2 className="finalpres__showcase-title">最终呈现</h2>
          <div className="finalpres__showcase-grid">
            {SHOWCASE_VIDEOS.map((item) => (
              <div key={item.src} className="finalpres__showcase-split">
                <div className="finalpres__showcase-video-box">
                  <video
                    className="finalpres__showcase-video"
                    src={item.src}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label={item.title}
                    onLoadedData={(e) => {
                      // 首帧落画:metadata 载入后 seek 到 0.001s 强制解码
                      // 并绘制第一帧(无海报文件时视频不会黑屏);
                      // 播放中不 seek(同 Lightbox paintFirstFrame)
                      const v = e.currentTarget
                      if (!v.paused) return
                      try { v.currentTime = 0.001 } catch { /* noop */ }
                    }}
                  />
                </div>
                <div className="finalpres__showcase-text">
                  <h3 className="finalpres__showcase-text-title">{item.title}</h3>
                  <p className="finalpres__showcase-text-body">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* 四宫格(2026-11-07 用户要求):视频板块下方,14-1..14-4 上二下二,
            图片间上下/左右间隙相等(单 gap 值),整块版心宽度居中;
            四图均 2752×1536(16:9)全不透明,已挂 srcset/LQIP
            (衍生图 2026-11-07 生成;新 URL,SW 不升版) */}
        <div className="finalpres__grid finalpres__grid--14">
          {FINAL_GRID_14.map((src) => {
            const lqip = getLqip(src)
            return (
              <figure className="finalpres__grid-cell" key={src}>
                <img
                  src={src}
                  srcSet={getSrcSet(src)}
                  sizes={SIZES.half}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={lqip ? { backgroundImage: `url(${lqip})`, backgroundSize: 'cover' } : undefined}
                />
              </figure>
            )
          })}
        </div>
        {/* 图 15(2026-11-07 用户要求):卡片最下面一张、页面宽度通栏贴边
            (同 4.png/8.png 先例,无圆角);上距与 gen2 通栏图同款
            clamp(24px,4vh,48px);已挂 srcset/LQIP(衍生图 2026-11-07
            生成;新 URL,SW 不升版);sizes 用 SIZES.full(桌面强制原图、
            小屏 100vw) */}
        <figure className="finalpres__placeholder finalpres__placeholder--15">
          <img
            src={FINAL_IMAGE_15}
            srcSet={getSrcSet(FINAL_IMAGE_15)}
            sizes={SIZES.full}
            alt=""
            loading="lazy"
            decoding="async"
            style={lqip15 ? { backgroundImage: `url(${lqip15})`, backgroundSize: 'cover' } : undefined}
          />
        </figure>
      </div>
    </section>
  )
}
