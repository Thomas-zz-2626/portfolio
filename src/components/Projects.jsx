import { OSS } from '../assetBase.js'
import { useState, useRef, useEffect, useCallback } from 'react'
import { initReveal } from '../scrollReveal'
import { getSrcSet, SIZES } from '../imageSrc'
import Lightbox from './Lightbox'
import './Projects.css'

const CATEGORIES = [
  {
    id: 'edc',
    label: 'EDC',
    subcategories: [
      {
        id: 'pen',
        label: '笔',
        items: [
          { id: 'pen-1', title: '素翰', image: OSS + '/images/edc/pen-1/1.png', heroVideo: OSS + '/images/edc/pen-1/hero.mp4', tagline: ['口袋藏笔墨', '钛制见风骨'], year: '2026', duration: '8 周', type: '文具设计', skills: '概念 · 建模 · 渲染', heroBg: 'dark', heroClass: 'brush', brief: '传统毛笔笔触与现代钢笔形态的融合', metaImage: OSS + '/images/edc/pen-1/2.png', metaLink: 'https://www.kickstarter.com/projects/419657217/still-a-titanium-brush-pen-that-slows-you-down?ref=discover_saved_projects&category_id=28', fullPageImage: OSS + '/images/edc/pen-1/6.png',
          // Closing images — full-bleed (edge to edge) and shown at their own
          // aspect ratio, so a tall one runs over several screens.
          endImages: [{ src: OSS + '/images/edc/pen-1/11-hd.webp', w: 2560, h: 3429 }],
          research: [
            {
              insight: '如果一支笔的功能不仅仅是用来在纸上做标记呢？',
              caption: '如果它能配合你思绪的节奏——需要思考时缓慢，需要被听见时表达自己？',
              images: [
                { src: OSS + '/images/edc/pen-1/3.png', ratio: 'wide', fit: 'full', w: 3800, h: 1920 },
              ],
            },
            {
              layout: 'side',
              label: 'unmet needs 1',
              insight: '从繁复到轻便',
              caption: '传统毛笔依赖砚台、墨条方可使用，场景受限且准备冗长。这款钢笔式毛笔内置墨囊，省去研墨环节，保留软笔笔锋的同时兼顾便携性。',
              images: [
                { src: OSS + '/images/edc/pen-1/4.png', ratio: 'wide', fit: 'full', w: 4500, h: 2400 },
              ],
            },
            {
              layout: 'side',
              label: 'unmet needs 2',
              insight: '材质更替，减少废弃',
              caption: '塑料笔身易断、生命周期短，是常见的快速消耗品。钛合金材质经 CNC 精密加工，笔身坚固耐损，便于维护，一支可长久使用。',
              images: [
                { src: OSS + '/images/edc/pen-1/5.png', ratio: 'wide', fit: 'full', w: 4500, h: 2400 },
              ],
            },
            {
              pest: {
                heading: '书写工具行业宏观背景分析',
                cards: [
                  {
                    id: 'P',
                    title: '政策',
                    preview: '环保与文化政策双向加持',
                    detailTitle: '环保与文化政策双向加持',
                    detail: '各国限塑令与绿色消费政策逐步落地，一次性塑料文具的使用场景持续收窄，耐用可循环的书写工具获得政策支持；同时传统文化复兴的政策导向，也让软笔书写品类重回大众视野。',
                    image: OSS + '/images/edc/pen-1/4.png', // 占位图(2026-10-27 手风琴改版,待上传替换)
                  },
                  {
                    id: 'E',
                    title: '经济',
                    preview: '消费升级催生高端文具需求',
                    detailTitle: '消费升级催生高端文具需求',
                    detail: '文具消费从功能性向品质感、情绪价值升级，消费者愿意为设计精良、经久耐用的书写工具支付溢价，高端文创与可持续文具市场规模稳步增长。',
                    image: OSS + '/images/edc/pen-1/5.png', // 占位图(2026-10-27 手风琴改版,待上传替换)
                  },
                  {
                    id: 'S',
                    title: '社会',
                    preview: '慢书写文化回归日常场景',
                    detailTitle: '慢书写文化回归日常场景',
                    detail: '国潮文化兴起带动传统书写热度回升，大众开始追求书写的仪式感与放松感，钢笔式毛笔兼顾日常便携与软笔体验，适配碎片化练字、手账记录等多元生活场景。',
                    image: OSS + '/images/edc/pen-1/11.jpg', // 占位图(2026-10-27 手风琴改版,待上传替换)
                  },
                  {
                    id: 'T',
                    title: '技术',
                    preview: '精密制造工艺成熟落地',
                    detailTitle: '精密制造工艺成熟落地',
                    detail: '钛合金 CNC 精密加工工艺成本下探，金属笔身量产可行性提升；同时软笔头储墨技术持续优化，兼顾出墨流畅度与使用寿命，支撑产品的性能与品质。',
                    image: OSS + '/images/edc/pen-1/22.jpg', // 占位图(2026-10-27 手风琴改版,待上传替换)
                  },
                ],
              },
            },
            {
              goal: {
                heading: '目标',
                text: '本项目旨在打造一款适合海外用户书写习惯、符合欧美极简审美、结构稳定的新一代钢笔式毛笔，填补「传统硬尖钢笔」与「专业艺术软笔」之间的市场空白',
                highlights: ['极简审美', '结构稳定'],
              },
            },
          ],
          showcase: [
            { type: 'video', src: OSS + '/images/edc/pen-1/画画写字.mp4', title: '书写绘画一笔覆盖', text: '从户外水墨速写到手写日常记录，钢笔式毛笔兼具自然软笔质感，适配创作与日常书写的不同场景。' },
            { type: 'video', src: OSS + '/images/edc/pen-1/粗细.mp4', title: '运笔轻重，粗细随心', text: '依托软质笔尖的弹性，通过控制运笔力度即可呈现粗细多变的线条，轻行纤细、重按浑厚，还原传统毛笔的笔触表现。' },
            { type: 'video', src: OSS + '/images/edc/pen-1/防滚.mp4', title: '防滚结构设计', text: '笔帽采用非圆柱的切面形态，扩大桌面接触支撑面，有效防止笔具滚落，兼顾外观辨识度与实用性能。' },
            { type: 'video', src: OSS + '/images/edc/pen-1/笔搁.mp4', title: '凹槽承托，停笔稳妥', text: '笔帽可独立充作笔搁，表面凹槽既是设计符号也可承托笔身，桌面临时放置时不易滚落，兼顾美观与实用。' },
          ],
          finalGrid: {
            title: '最终呈现',
            images: [
              { src: OSS + '/images/edc/pen-1/11.jpg' },
              { src: OSS + '/images/edc/pen-1/22.jpg' },
              { src: OSS + '/images/edc/pen-1/33.jpg' },
              { src: OSS + '/images/edc/pen-1/44.jpg' },
            ],
            /* 堆叠图下方收尾图(2026-11-08 用户要求):7.png 版心宽;
               渲染在 FinalStack section 之外的兄弟 section——在堆叠 section
               内部加图会移动 section 底缘、破坏标题与末卡的同步上移 */
            trailingImage: OSS + '/images/edc/pen-1/7.png',
            /* 图 7 上方大标题(2026-11-08 用户要求) */
            trailingTitle: '最终众筹价格',
          },
        },
          { id: 'pen-2', title: '棱光', image: OSS + '/images/edc/pen-2/2.png', heroVideo: OSS + '/images/edc/pen-2/hero.mp4', tagline: ['棱面折射光影', '几何铸就锋芒'], year: '2026', duration: '12 周', type: '文具设计', skills: 'CMF，结构优化', heroBg: '#e6e6e6', heroClass: 'prism', brief: '几何棱面切割，光与金属的视觉交响', metaImage: OSS + '/images/edc/pen-2/meta.png', metaLink: 'https://www.kickstarter.com/projects/1516711080/lumink-ti-pen-pocket-to-full-size-transforming-in-seconds?ref=discover_saved_projects&category_',
            /* ── 色彩・材质・工艺 图文台阶滚动(2026-11-11 用户要求) ──
               标题钉住,每滚动一页切换一组左图右文(3-1..3-6 与文字
               一一对应);2026-11-14 用户:右文拆成 大标题(title)+
               小字描述(text)两部分;title/text 均为占位文案,后续替换 */
            cmf: {
              title: '色彩・材质・工艺',
              steps: [
                { image: OSS + '/images/edc/pen-2/3-1.png', title: '钛黑石洗', text: '滚筒石洗研磨，时长 4–12h，Ra1.2–2.5μm，物理无镀层。\n雾面哑光，抗指纹、耐磕碰，掩盖划痕，适合偏爱器物随使用形成专属包浆质感的硬核人群。' },
                { image: OSS + '/images/edc/pen-2/3-2.png', title: '钛拉丝', text: '定向砂带 / 砂轮拉丝，纹理单向连续，Ra0.4–1.2μm，物理打磨，无镀层。\n规整定向线性纹理，精致利落、柔和低反光，现代工业感，适配偏爱整洁细腻、简约科技风城市通勤和实用的用户。' },
                { image: OSS + '/images/edc/pen-2/3-3.png', title: '钛合金闪电纹', text: '脉冲阳极氧化，局部高压放电，电压 40–100V，纳米级氧化膜，Ra0.8–1.6μm。\n枝状闪电独纹，随光幻彩，辨识度极强；适合追求限量、个性视觉效果的EDC收藏玩家' },
                { image: OSS + '/images/edc/pen-2/3-4.png', title: '钛冰花', text: '高温金相结晶 + 阳极氧化，控温 800℃左右，Ra0.6–1.4μm，晶斑大小可控。\n冰晶状细碎晶纹，柔光幻彩，肌理温润细腻，艺术氛围感强，适合偏爱雅致独特、收藏向EDC玩家' },
                { image: OSS + '/images/edc/pen-2/3-5.png', title: '锆合金抛光', text: '多级精抛 + 电解抛光，Ra0.05–0.1μm。\n手感顺滑，极易留指纹、怕划痕，轻奢高级金属质感，适合追求镜面精致感、收藏向EDC玩家' },
                { image: OSS + '/images/edc/pen-2/3-6.png', title: 'PEI', text: '数控机加工，Ra0.8–3.2μm。\n半透琥珀质感，轻质高强、耐温抗腐，低金属感，轻量化稳定耐用，适合偏爱轻量化、户外通勤、无金属EDC的玩家。' },
              ],
            },
            /* ── 台阶滚动之后的整页大图(2026-11-13 用户要求:3-6 滚完后
               下一页面放图 4,页面大小=占满一屏) ── */
            pageImage: OSS + '/images/edc/pen-2/4.png',
            /* ── 图 4 之后(2026-11-14 用户要求):半页黑底大标题 +
               图 5 页面宽度左右贴边、响应式缩放、完整显示 ── */
            closingTitle: '藏于方寸，落笔从容',
            pageImage2: OSS + '/images/edc/pen-2/5.png',
            /* ── 图 5 之后(2026-11-15 用户要求):再来半页大标题「棱光」
               + 图 6 同规(页面宽度贴边、响应式缩放、完整显示)── */
            closingTitle2: '棱光',
            pageImage3: OSS + '/images/edc/pen-2/6.png',
          },
          /* ── 夹爪笔(2026-11-12 用户要求:首页笔类第三张卡)──
               图片/文案待用户提供:图片放入 public/images/edc/pen-4/,
               数据补齐后删除 minimal 即可恢复完整板块 */
          { id: 'pen-4', title: '夹爪笔', year: '2026', duration: '', type: '文具设计', skills: '', heroBg: 'light', brief: '', minimal: true },
          { id: 'pen-3', title: '凝翎', image: OSS + '/images/edc/pen-3/羽毛钢笔.784.png', year: '2026', duration: '6 周', type: '文具概念设计', skills: '概念 · 手绘 · 建模', heroBg: 'light', brief: '羽毛灵感，轻盈书写的诗意表达' },
        ],
      },
      {
        id: 'pendant',
        label: '吊坠',
        items: [
          { id: 'pendant-1', title: '氚管灯', image: OSS + '/images/edc/pendant-1/三根氚管卡片图.781.png', heroVideo: OSS + '/images/edc/pendant-1/hero.mp4', tagline: '暗夜微光，恒久自明', year: '2025', duration: '10 周', type: '饰品设计', skills: '概念 · 建模 · 渲染', heroBg: 'dark', heroClass: 'tritium', heroTextAfterVideo: true, brief: '自发光氚管，暗夜中的恒久微光', metaImage: OSS + '/images/edc/pendant-1/2.png', metaLink: 'https://www.kickstarter.com/projects/459774293/noxti-a-titanium-glow-tube-light-for-everyday-carry?ref=discovery&term=tritium&total_hits=86&category_id=28', statement: { text: '当最后一盏灯熄灭时，你口袋里还有什么会发光？', image: OSS + '/images/edc/pendant-1/1.jpg' } },
          { id: 'pendant-3', title: 'mini打火机', image: OSS + '/images/edc/pendant-3/卡片图.780.png', heroImage: OSS + '/images/edc/pendant-3/1.jpg', tagline: '掌间微焰，一触即燃', taglineRight: true, year: '2026', duration: '14 周', type: '工具设计', skills: '概念 · 结构 · 渲染', heroBg: 'dark', heroClass: 'lighter', heroNoPadding: true, brief: '掌心大小的极简点火工具',
            /* 图文联动滚动板块(卡片内第一个板块):左图右文共用同一 scrollYProgress,
              图片在 snap 进度卡点一次性弹出切换;wordIndex 绑定文字关键节点;
              两段文案空行分隔,每段首行空两格、段间空一行 */
            scrollReveal: {
              kicker: '滚动阅读',
              text: '在 铸造 与 机床 加工 技术 诞生 之前， 人类 想要 将 一整块 金属 塑造成 可用的 器物， 几乎 只能 依靠 反复 锤打 的 方式。 将 熔炼 得到 的 铜锭、 金坯、 银片 置于 砧上， 工匠 手持 锤子， 一下 接 一下 敲打 延展， 让 金属 慢慢 延展、 弯曲、 起形， 最终 敲打出 碗、 盘、 壶、 各类 装饰 饰片。 这项 依靠 外力 锻打 延展 金属 的 技法， 便是 古老 而 质朴 的 金属 成型 工艺 —— 锤揲。\n\n而 我们 所见 的 锤纹， 正是 这套 手工 成型 过程 里 无法 彻底 抹去 的 天然 副产品。 工匠 每 一次 落锤， 都会 在 柔韧 的 金属 表层 留下 一处 深浅 不一 的 凹坑。 器物 轮廓 逐渐 成型 的 同时， 层层 叠叠 的 锤痕 也 随之 铺满 表面。 这些 错落 的 印记 不是 刻意 附加 的 装饰， 是 锤揲 这个 工艺 动作 最 直观 的 留存， 是 锻造 的 全过程 刻印 在 器物 之上 的 指纹， 把 工匠 劳作 的 节奏、 力道 与 时间， 永久 封存 在 金属 表面。',
              images: [
                { wordIndex: 0, snap: 0, src: 'https://images.unsplash.com/photo-1519219788971-8d9797e0928e?q=80&w=1200&auto=format&fit=crop', alt: '铸造之前的金属——锤打的起点' },
                { wordIndex: 71, snap: 0.357, src: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1200&auto=format&fit=crop', alt: '锤揲工艺——落锤与砧' },
                { wordIndex: 114, snap: 0.574, src: 'https://images.unsplash.com/photo-1524429656589-6633a470097c?q=80&w=1200&auto=format&fit=crop', alt: '层层锤痕——铺满表面的印记' },
                { wordIndex: 155, snap: 0.78, src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop', alt: '锤纹封存——器物上的指纹' },
              ],
              /* 光视频板块(滚动文字板块之后,2026-10-22):黑底,标题+循环视频
                 铺满版心宽度+居中小字(三段) */
              followUp: {
                heading: '它如何改变光？',
                video: OSS + '/images/edc/pendant-3/light.mp4',
                caption: '光滑金属表面是镜面反射，只留下一条干净的高光，\n锤纹把表面打碎成无数个朝向不同的小斜面，每个锤窝都是独立的反光点，表面于是从 "一条光" 变成 "一片流动的碎光"，\n在圆柱弧面上，锤窝的受光角度随弧度连续变化，纹理产生明暗渐变，看起来是 "活" 的。',
                /* 小字最后一段下方的全屏贴边大图(2026-10-23);图内下部分
                   两段小字叠在图底(同日追加,图底为纯黑渲染区,白字直接可读) */
                image: OSS + '/images/edc/pendant-3/2.png',
                imageCaption: '如果一个完整的机械打火机能做得足够小，可以每天携带——而且不会让人觉得是一次性的会怎样？\n一支用五级钛合金加工的微机械打火机，将完整的机械点火系统压缩到仅36毫米。',
                /* 图2 下方版心宽图 3(2026-10-23),与图 2 留 clamp(16,2.5vh,32) 间隙 */
                image2: OSS + '/images/edc/pendant-3/3.png',
                /* 图 3 下方中号字(2026-10-23,用户文案)+其下图 4
                   (2026-11-14 用户改:任何设备都左右贴边、无圆角) */
                quote: '一样物件，佩戴无感、可常伴身侧，便值得成为你的 EDC。',
                image3: OSS + '/images/edc/pendant-3/4.jpg',
                /* 图 4 下方版心宽图 5(2026-10-23);图内顶部一行小字叠在图顶 */
                image4: OSS + '/images/edc/pendant-3/5.png',
                image4Caption: '每一毫米都有其职责。',
                /* 图 5 下方图 6(2026-10-23):左右贴住网页两边,全屏贴边无圆角 */
                image5: OSS + '/images/edc/pendant-3/6.png',
              },
            },
            /* 钢笔式毛笔同款视频+文字板块(2026-10-23,用户要求):左视频右文字,
               右文字随滚动 sticky 钉住、到下一个视频钉住上移,逻辑与 pen-1
               showcase 完全一致;先占位,后续用户替换视频与文案 */
            showcase: [
              { type: 'video', src: OSS + '/images/edc/pendant-3/1.mp4', title: '旋擦即燃，长时续航', text: '旋击擦，一触便引燃。\n稳定持火可达 6 分钟，无感随身，成为日常可靠的 EDC 火种。' },
              { type: 'video', src: OSS + '/images/edc/pendant-3/2.mp4', title: '氚光标识，随形定制', text: '自带氚管自发光，暗夜之中一眼就能定位火种；\n同时支持个性化定制，把独属于你的标记颜色藏进随身EDC。' },
              { type: 'video', src: OSS + '/images/edc/pendant-3/3.mp4', title: '钥匙扣搭载，随身无负担', text: '自带挂孔，轻松挂于钥匙扣，随钥匙一同携带，取用随手即得。' },
              { type: 'video', src: OSS + '/images/edc/pendant-3/4.mp4', title: '不惧涉水，可靠依旧', text: '具备防水性能，偶遇泼溅和短时浸水也不影响点火，户外复杂场景更安心。' },
            ],
            /* showcase 下方白底板块(2026-10-23,用户要求):大标题「短小，且精悍」
               + 7/8 两图并排,两张合计版心宽 min(1400,vw−48);图 9(2026-10-23)
               在其下版心全宽,左下角叠一行小字;图 10-13(2026-10-24)在图 9
               下方两行四图(2×2),每图悬停轻微放大;7/8/9/10-13 之间统一小
               缝隙;视频 5(2026-10-23)在图组下方版心全宽,一直循环播放;
               图 15/14(2026-10-24)在视频 5 下方全屏贴边、上下紧贴,随页面
               自适应缩放(15 在上、14 在下) */
            compact: {
              heading: '短小，且精悍',
              images: [OSS + '/images/edc/pendant-3/7.jpg', OSS + '/images/edc/pendant-3/8.jpg'],
              image9: OSS + '/images/edc/pendant-3/9.jpg',
              image9Caption: '个性化定制，可自行更换不同颜色的氚管',
              images2: [OSS + '/images/edc/pendant-3/10.png', OSS + '/images/edc/pendant-3/11.png', OSS + '/images/edc/pendant-3/12.png', OSS + '/images/edc/pendant-3/13.png'],
              /* 图 10-13 与视频 5 之间的说明段(2026-11-07 用户要求):
                 居中对齐、普通字档;两行文案(pre-line 换行) */
              images2Note: '壳体表面锤纹肌理凹凸错落，有效增大手指接触摩擦力\n握持不易打滑，按压打火时手感扎实，操作更稳定可控',
              video: OSS + '/images/edc/pendant-3/5.mp4',
              /* 图 16(2026-11-11 用户要求):视频 5 下方版心宽大图,
                 上方同款大标题「最终众筹价格」(与钢笔式毛笔 trailing 同款样式) */
              image16Title: '最终众筹价格',
              image16: OSS + '/images/edc/pendant-3/16.png',
              image15: OSS + '/images/edc/pendant-3/15.png',
              image14: OSS + '/images/edc/pendant-3/14.png',
            },
            metaImage: OSS + '/images/edc/pendant-3/meta.png', metaLink: 'https://www.kickstarter.com/projects/2136210227/pyra-micro-titanium-mechanical-lighter-pendant-for-edc?ref=discover_saved_projects&category_id=28' },
          { id: 'pendant-2', title: '氚管吊坠饰品', image: OSS + '/images/edc/pendant-2/card.png', heroImage: OSS + '/images/edc/pendant-2/1.jpg', tagline: '氚管凝光，金工随行', year: '2026', duration: '8 周', type: '饰品设计', skills: '手绘 · 建模 · 打样', heroBg: 'dark', heroClass: 'pendant2', minimal: true, metaCenter: true, brief: '氚管与金属工艺结合的随身饰品' },
        ],
      },
      {
        id: 'knife',
        label: '刀',
        items: [
          { id: 'knife-3', title: '影刃', image: OSS + '/images/edc/knife-3/影刃.793.jpg', year: '2026', duration: '12 周', type: '刀具设计', skills: '概念 · 建模 · 渲染', heroBg: '#ffffff', brief: '紧凑折叠，日常随身携带的切割工具', metaImage: OSS + '/images/edc/knife-3/meta.png', metaLink: 'https://www.kickstarter.com/projects/1051046151/shadowx-gold-carbon-fiber-and-titanium-m390-edc-folding-knife?ref=discover_saved_projects&category_id=28' },
          { id: 'knife-2', title: '流刃', image: OSS + '/images/edc/knife-2/卡片图.780.png', year: '2025', duration: '20 周', type: '刀具设计', skills: '结构 · 建模 · 打样', heroBg: '#ffffff', brief: '隐藏式结构，极简外观的折叠刀具' },
          { id: 'knife-1', title: '岩伐', image: OSS + '/images/edc/knife-1/card.jpg', heroImage: OSS + '/images/edc/knife-1/1.png', year: '2025', duration: '16 周', type: '刀具设计', skills: '概念 · 建模 · 测试', heroBg: '#ffffff', brief: '简洁线条，纯粹的功能美学表达' },
        ],
      },
      {
        id: 'toy',
        label: '指尖玩具',
        items: [
          { id: 'toy-1', title: '陀螺灯', image: OSS + '/images/edc/toy-1/card.png', heroImage: OSS + '/images/edc/toy-1/1.png', heroClass: 'toy1', tagline: '旋转中的光影游戏', year: '2025', duration: '8 周', type: '玩具设计', skills: '概念 · 建模 · 渲染', heroBg: 'light', brief: '旋转中的光影游戏，指尖陀螺与夜灯的结合' },
          { id: 'toy-2', title: '戒指', image: OSS + '/images/edc/toy-2/戒指1.789.jpg', heroVideo: OSS + '/images/edc/toy-2/hero.mp4', tagline: ['指尖微雕塑', '日常佩戴的设计表达'], year: '2026', duration: '6 周', type: '玩具设计 · 饰品设计', skills: '手绘 · 建模 · 打样', heroBg: 'dark', heroClass: 'ring', brief: '指尖上的微型雕塑，日常佩戴的设计表达',
          research: [
            {
              layout: 'narrative',
              narrative: {
                top: { label: '客户问题', text: '一枚戒指，如何成为指尖的微雕塑？' },
                steps: [
                  { title: '灵感来源', text: '从微型雕塑与积木中提炼可佩戴的造型语言——放弃平面装饰，让轮廓自己说话。', image: '', align: 'left' },
                  { title: '手绘推敲', text: '数十张草图快速探索形态与比例，筛选出最具雕塑感的三个方向。', image: '', align: 'center' },
                  { title: '建模打样', text: '数字建模验证结构与佩戴舒适度，3D 打印初版确认手感，再转入金属打样。', image: '', align: 'right' },
                  { title: '成品呈现', text: '最终戒指以立体轮廓在指尖成立——一件随行走而移动的微型雕塑。', image: OSS + '/images/edc/toy-2/戒指1.789.jpg', align: 'center' },
                ],
                bottom: { label: '结论', text: '微型雕塑，随身佩戴。' },
              },
            },
            {
              insight: '从 47 个概念方向中收敛出 3 个核心方案，通过手板验证最终确认了兼顾握感与视觉辨识度的平衡形态。',
              caption: '草模迭代过程，从泡沫模型到 3D 打印验证，共经历 5 轮形态调整。',
              layout: 'side',
              images: [
                { ratio: 'square' },
                { ratio: 'wide' },
              ],
            },
          ] },
        ],
      },
    ],
  },
  {
    id: 'appliances',
    label: '家电',
    subcategories: [
      {
        id: 'appliances-all',
        label: '全部',
        items: [
          { id: 'app-5', title: '擦窗机器人', image: OSS + '/images/appliances/app-5/card.png', year: '2023', duration: '12 周', type: '毕业设计', skills: '调研 · 人机工程 · CMF', heroBg: '#ffffff', brief: '智能路径规划，让高空窗面清洁变得简单安全',
          /* 首图(2026-10-27 用户要求):卡片第一张图,全屏贴边(左右贴网页
             左右、无圆角);调研/设计问题/过程图直接展示,无展开按钮 */
          firstImage: OSS + '/images/appliances/app-5/1.png',
          /* 首图四行字+底部溶解(2026-11-07 用户要求,仿空气炸锅 hero):四行
             元信息(年份/周期/类型/参与)从下方灰色字板块移上首图左下角叠图
             (桌面四行、≤768 单行);首图底部滚动虚化带(heroFade 同款)——
             滚动离开时图底渐入下方白色调研区;原灰色 #d1d1d1 字板块
             (四行字所在)随之清空,图底渐变遮罩终点同步改白衔接调研区 */
          firstMeta: true,
          firstFade: true,
          designQuestion: { text: '如何设计一款更安静、更安全的擦窗机？', highlights: ['更安静', '更安全'] },
          processImage: OSS + '/images/appliances/app-5/背景.png',
          /* 展开显示完整过程(2026-11-07 用户要求):背景.png 衔接处下方的
             居中箭头,点击展开背景图之后的其余内容;两张图先空着
             (空 src = 浅灰虚线占位槽),后续用户替换真实文件 */
          processImages: ['', ''],
          research: [
            {
              insight: '室外风压威胁机身吸附安全性',
              caption: '户外作业时，强风会对机身施加侧向推力，破坏真空吸附平衡，带来高空坠落隐患；反观传统人工外窗擦拭，更存在人身失足的高危风险。',
              images: [
                { ratio: 'wide', src: OSS + '/images/appliances/app-5/3.png' },
              ],
            },
            {
              insight: '现代擦窗机器人，现实挑战。\n真空吸附结构带来的降噪需求日益凸显。',
              caption: '居家智能清洁设备的使用愈发普遍，凸显了低噪音运行对室内使用体验的重要性。',
              images: [
                { ratio: 'wide', src: OSS + '/images/appliances/app-5/2.png' },
              ],
            },
          ],
        },
          { id: 'app-1', title: '空气炸锅', image: OSS + '/images/appliances/app-1/card.png', heroImage: OSS + '/images/appliances/app-1/hero.png', metaInHero: true, metaInHeroInline: true, heroNoPadding: true, heroFade: true, year: '2025', duration: '24 周', type: '家电设计', skills: '调研 · 建模 · CMF', heroBg: 'light', brief: '健康烹饪与厨房美学的有机结合' },
          { id: 'app-2', title: '挂烫机', image: OSS + '/images/appliances/app-2/card.png', year: '2025', duration: '18 周', type: '家电设计', skills: '概念 · 建模 · 渲染', heroBg: 'dark', brief: '高效除皱，重塑衣物护理日常体验' },
          { id: 'app-3', title: '萃茶机', image: OSS + '/images/appliances/app-3/card.jpg', year: '2025', duration: '20 周', type: '家电设计', skills: '调研 · 建模 · CMF', heroBg: 'light', brief: '精准控温萃取，还原每一杯茶的本味' },
          { id: 'app-4', title: '电煮锅', image: OSS + '/images/appliances/app-4/card.png', year: '2025', duration: '16 周', type: '家电设计', skills: '概念 · 结构 · 渲染', heroBg: 'dark', brief: '一锅多能，小空间的全能烹饪方案' },
        ],
      },
    ],
  },
  {
    id: 'furniture',
    label: '家具',
    subcategories: [
      {
        id: 'furniture-all',
        label: '全部',
        items: [
          { id: 'furn-1', title: '可编辑家具', image: OSS + '/images/furniture/furn-1/card.png', year: '2025', duration: '28 周', type: '家具设计', skills: '概念 · 结构 · 打样', heroBg: 'light', brief: '模块化设计，让用户参与家具的创造与演变' },
        ],
      },
    ],
  },
  {
    id: 'electronics',
    label: '消费电子',
    subcategories: [],
  },
]

const ITEMS_PER_PAGE = 3

function ProjectCard({ project, index, onOpen }) {
  const [imgError, setImgError] = useState(false)

  return (
    <article
      className="projects__card"
      data-id={project.id}
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={(e) => onOpen(project, e)}
    >
      <div className="projects__card-image">
        {project.image && !imgError ? (
          <img src={project.image} alt={project.title} className="projects__card-img" style={project.imageStyle} loading="lazy" decoding="async" onError={() => setImgError(true)} srcSet={getSrcSet(project.image)} sizes={SIZES.card} />
        ) : (
          <div className="projects__card-placeholder-img" />
        )}
      </div>
      <div className="projects__card-info">
        <h3 className="projects__card-title">{project.title}</h3>
        <p className="projects__card-meta">{project.year} · {project.type}</p>
        <p className="projects__card-brief">{project.brief}</p>
      </div>
    </article>
  )
}

function Projects() {
  const [activeCategory, setActiveCategory] = useState('edc')
  const [activeSub, setActiveSub] = useState('pen')
  const [expandedSubs, setExpandedSubs] = useState({})
  const [indicatorStyle, setIndicatorStyle] = useState({})
  const [subIndicatorStyle, setSubIndicatorStyle] = useState({})
  const tabsRef = useRef([])
  const subTabsRef = useRef([])
  const containerRef = useRef(null)

  // ── Lightbox ──
  const [lightbox, setLightbox] = useState(null)

  const active = CATEGORIES.find((c) => c.id === activeCategory)
  const currentSub = active?.subcategories.find((s) => s.id === activeSub)

  const updateIndicator = useCallback((refs, setter, index) => {
    const tab = refs.current[index]
    if (tab) {
      setter({
        left: tab.offsetLeft,
        width: tab.offsetWidth,
      })
    }
  }, [])

  const refreshIndicators = useCallback(() => {
    const idx = CATEGORIES.findIndex((c) => c.id === activeCategory)
    updateIndicator(tabsRef, setIndicatorStyle, idx)
    if (active?.subcategories.length > 0) {
      const subIdx = active.subcategories.findIndex((s) => s.id === activeSub)
      updateIndicator(subTabsRef, setSubIndicatorStyle, subIdx)
    }
  }, [activeCategory, activeSub, active, updateIndicator])

  useEffect(() => {
    refreshIndicators()
    const handleResize = () => refreshIndicators()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [refreshIndicators])

  // ── 滚动触发动效:分类/子分类切换会重挂作品网格,重新初始化让新卡片
  //    立即入场,已入场内容保持可见。展开箭头新增的卡片也是组子元素,
  //    同样要重新初始化绑定——否则它们被初始隐藏 CSS 压住,永远不可见。 ──
  useEffect(() => initReveal(containerRef.current), [activeCategory, activeSub, expandedSubs])

  const handleTabEnter = (index) => updateIndicator(tabsRef, setIndicatorStyle, index)
  const handleTabLeave = () => {
    const idx = CATEGORIES.findIndex((c) => c.id === activeCategory)
    updateIndicator(tabsRef, setIndicatorStyle, idx)
  }
  const handleTabClick = (categoryId) => {
    setActiveCategory(categoryId)
    const cat = CATEGORIES.find((c) => c.id === categoryId)
    if (cat?.subcategories.length > 0) {
      setActiveSub(cat.subcategories[0].id)
      setExpandedSubs({})
    }
  }

  const handleSubEnter = (index) => updateIndicator(subTabsRef, setSubIndicatorStyle, index)
  const handleSubLeave = () => {
    if (active?.subcategories.length > 0) {
      const idx = active.subcategories.findIndex((s) => s.id === activeSub)
      updateIndicator(subTabsRef, setSubIndicatorStyle, idx)
    }
  }
  const handleSubClick = (subId) => {
    setActiveSub(subId)
    setExpandedSubs((prev) => ({ ...prev, [subId]: prev[subId] || false }))
  }

  // 展开为一次性交互(2026-11-08 用户要求):点开后全部作品直接展示,
  // 不提供收起、展开态不可逆回;箭头按钮在展开后整体消失(不再有
  // 向上的箭头)
  const expandItems = (subId) => {
    setExpandedSubs((prev) => ({ ...prev, [subId]: true }))
  }

  const getVisibleItems = (sub) => {
    const isExpanded = expandedSubs[sub.id]
    if (isExpanded || sub.items.length <= ITEMS_PER_PAGE) {
      return sub.items
    }
    return sub.items.slice(0, ITEMS_PER_PAGE)
  }

  // ── Related projects: all items from the same main category ──
  const getCategoryProjects = useCallback((projectId) => {
    const cat = CATEGORIES.find((c) =>
      c.subcategories?.some((sub) =>
        sub.items.some((item) => item.id === projectId)
      )
    )
    if (!cat) return { items: [], suggestedIdx: 0 }
    const all = cat.subcategories.flatMap((sub) => sub.items)
    const currentIdx = all.findIndex(item => item.id === projectId)
    const items = all.filter(item => item.id !== projectId)
    // Center the next project after current (or last if current was last)
    const suggestedIdx = currentIdx < items.length ? currentIdx : items.length - 1
    return { items, suggestedIdx }
  }, [])

  const openLightbox = useCallback((project, e) => {
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth
    // Use overflow: clip — prevents scrolling WITHOUT resetting scroll position
    document.documentElement.style.overflow = 'clip'
    document.body.style.paddingRight = `${scrollbarW}px`
    const navbar = document.querySelector('.navbar')
    if (navbar && scrollbarW > 0) {
      navbar.style.right = `${scrollbarW}px`
    }

    const { items: relatedProjects, suggestedIdx: relatedCenterIdx } = getCategoryProjects(project.id)
    setLightbox({ project, relatedProjects, relatedCenterIdx })
  }, [getCategoryProjects])

  // Navigate to a recommended project from the carousel
  const navigateLightbox = useCallback((project) => {
    const { items: relatedProjects, suggestedIdx: relatedCenterIdx } = getCategoryProjects(project.id)
    setLightbox({ project, relatedProjects, relatedCenterIdx })

    // Switch homepage behind the lightbox so it's ready on close
    let found = false
    for (const cat of CATEGORIES) {
      for (const sub of (cat.subcategories || [])) {
        if (sub.items.some((item) => item.id === project.id)) {
          setActiveCategory(cat.id)
          setActiveSub(sub.id)
          if (sub.items.length > ITEMS_PER_PAGE) {
            setExpandedSubs((prev) => ({ ...prev, [sub.id]: true }))
          }
          found = true
          break
        }
      }
      if (found) break
    }

    // Scroll to the card behind the lightbox
    setTimeout(() => {
      const card = document.querySelector(`.projects__card[data-id="${project.id}"]`)
      if (card) {
        card.scrollIntoView({ behavior: 'instant', block: 'center' })
      }
    }, 100)
  }, [getCategoryProjects])

  const closeLightbox = useCallback(() => {
    document.documentElement.style.overflow = ''
    document.body.style.paddingRight = ''
    const navbar = document.querySelector('.navbar')
    if (navbar) navbar.style.right = ''

    setLightbox(null)
  }, [])

  return (
    <section id="projects" className="projects" ref={containerRef}>
      <div className="projects__inner">
        <div className="projects__header">
          <span className="projects__section-label" data-reveal="left">Selected Projects</span>
        </div>

        {/* Main Category Tabs */}
        <nav className="projects__tabs" data-reveal>
          <div
            className="projects__tabs-indicator"
            style={{
              transform: `translateX(${indicatorStyle.left || 0}px)`,
              width: `${indicatorStyle.width || 0}px`,
            }}
          />
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.id}
              ref={(el) => (tabsRef.current[i] = el)}
              className={`projects__tab${
                activeCategory === cat.id ? ' projects__tab--active' : ''
              }`}
              onClick={() => handleTabClick(cat.id)}
              onMouseEnter={() => handleTabEnter(i)}
              onMouseLeave={handleTabLeave}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        {/* Sub-category Tabs */}
        {active && active.subcategories.length > 0 && (
          <>
            <div className="projects__tabs-separator" />
            <nav className="projects__subtabs" data-reveal>
              <div
                className="projects__subtabs-indicator"
                style={{
                  transform: `translateX(${subIndicatorStyle.left || 0}px)`,
                  width: `${subIndicatorStyle.width || 0}px`,
                }}
              />
              {active.subcategories.map((sub, i) => (
                <button
                  key={sub.id}
                  ref={(el) => (subTabsRef.current[i] = el)}
                  className={`projects__subtab${
                    activeSub === sub.id ? ' projects__subtab--active' : ''
                  }`}
                  onClick={() => handleSubClick(sub.id)}
                  onMouseEnter={() => handleSubEnter(i)}
                  onMouseLeave={handleSubLeave}
                >
                  {sub.label}
                </button>
              ))}
            </nav>
          </>
        )}

        {/* Works */}
        <div className="projects__works" key={`${activeCategory}-${activeSub}`}>
          {active && active.subcategories.length > 0 && currentSub ? (
            <>
              <div className="projects__subgroup-items" data-reveal-group>
                {getVisibleItems(currentSub).map((item, i) => (
                  <ProjectCard key={item.id} project={item} index={i} onOpen={openLightbox} />
                ))}
              </div>

              {/* 一次性展开(2026-11-08 用户要求):展开后箭头整体消失,
                  无收起、无向上箭头 */}
              {currentSub.items.length > ITEMS_PER_PAGE && !expandedSubs[currentSub.id] && (
                <button
                  className="projects__expand"
                  onClick={() => expandItems(currentSub.id)}
                  aria-label="展开全部作品"
                >
                  <span className="projects__expand-arrow" />
                </button>
              )}
            </>
          ) : (
            <div className="projects__empty" data-reveal>
              <p>更多作品即将上线</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <Lightbox
          project={lightbox.project}
          relatedProjects={lightbox.relatedProjects}
          relatedCenterIdx={lightbox.relatedCenterIdx}
          onNavigate={navigateLightbox}
          onClose={closeLightbox}
        />
      )}
    </section>
  )
}

export default Projects
