// ── 亮度衰减图表:三个独立卡片,Chart.js 按需初始化 ──
// 布局:外层 max-width:1200px 居中容器(左右 24px 内边距)+ CSS Grid
// 承载 3 张卡片——≥768px 双列(左上夜光管、右上 LED 同排,氚管灯
// grid-column:1/-1 通栏),<768px 单列垂直堆叠,gap 40px。每张卡片:
// 纯黑底 + 圆角 + 内部留白(无边框),标题在图表下方居中。
// 动画:每张卡片各自独立的 IntersectionObserver(根=灯箱滚动容器,
// 触发线 88%)——该卡滚动进入视口时单独「上移 24px + 淡入」(0.7s)
// 并初始化自己的 Chart 实例,未进入视口的卡片保持隐藏、不建 Chart;
// 同排两张卡错峰 0.15s,避免"整行一次性弹出"。reduced-motion 下
// 卡片直接可见、Chart 立即初始化。
// 性能:chart.js 模块级动态 import——组件模块加载即发起下载(与页面
// 资源并行、SW 缓存,主包不膨胀),Chart 实例仍只在卡片入视口时创建。
// 轴:两轴共用一个 0(x 轴 0 刻度标签隐藏,只保留 y 轴 0);自绘插件
// axisTitles 把 Y 标题「Relative Brightness (%)」横写画在绘图区上方
// 左上角(布局 padding 预留 30px,不塞进折线图内),X 单位(Hour/Year)
// 画在 25 刻度之后的右侧(「25 Year」)。无竖线:纵向网格线与 y 轴
// 左竖线全部关闭,只留横向网格与底边。曲线 clip:false,边缘数据点
// 完整显示不被裁半(右侧另留 64/60px 给 25 刻度点与单位文字,
// 画布字号统一 13px 后「25 Year」约 55px 宽 + 8px 起点偏移,64px 全放下);
// 面积渐变 32%→6%,填充可见地抵达底轴。tooltip:三图统一 index 全图
// 悬停(吸附最近节点,鼠标在任何位置都弹信息框),锚点用自定义
// positioner('cursor')钉在鼠标位置,信息框始终贴着光标、靠边自动翻转。
// 贯穿垂直参考线(crosshair 插件):鼠标悬停绘图区时,在鼠标 x 处画一条
// 从绘图区顶部到底部的浅白色细竖线,竖线 × 曲线交点画圆形圆点(曲线色
// 填充+白描边);交点用 LineElement.interpolate 在 tension 贝塞尔曲线上
// 取像素级精确点。触屏(hover:none)按规范禁用;随鼠标 1:1、无动画。
import { useEffect, useRef, useState } from 'react'
import DesignPurpose from './DesignPurpose'
import './BrightnessCharts.css'

// 数据定义(用户 2026-10-17 定稿)
const GLOW = {
  key: 'glow',
  label: '夜光管',
  color: '#f0a500', // 与 LED 同为黄色(上面两张颜色一致)
  fill: true, // 曲线下方浅黄渐变填充
  xUnit: 'Hour',
  yMax: 100,
  data: [
    { x: 0, y: 100 },
    { x: 5, y: 42 },
    { x: 10, y: 22 },
    { x: 15, y: 13 },
    { x: 20, y: 8 },
    { x: 25, y: 3 },
  ],
  note: '夜光管需预先吸收外界光源储能才能发光，本身无法自主发光；储能完成后的余辉以小时为单位持续衰减。',
}

const LED = {
  key: 'led',
  label: 'LED（电池驱动）',
  color: '#f0a500',
  fill: true, // 曲线下方浅黄渐变填充
  xUnit: 'Year',
  yMax: 120,
  show120: true, // 最上面那根 120 网格线左侧显示「120」刻度
  dotsOnTicks: true, // 圆点只画在 x 轴刻度(5 的倍数)节点上,非刻度节点(如 x=3)不画
  data: [
    { x: 0, y: 120 },
    { x: 3, y: 80 },
    { x: 5, y: 40 },
    { x: 10, y: 0 },
    { x: 25, y: 0 },
  ],
  note: 'LED 依靠电能驱动发光，断电后即刻熄灭，无储能余辉效果；其器件寿命约 10 年左右，受供电与环境条件影响。',
}

const TRITIUM = {
  key: 'tritium',
  label: '氚管灯',
  color: '#5eead4',
  fill: true, // 曲线下方浅青绿渐变填充
  xUnit: 'Year',
  yMax: 120,
  hideTopLine: true, // 去掉最上面那根横线(120 网格线不画)
  // 曲线上标注:节点正上方写「12.5year」(x=12.5)、「25year」(x=25)
  annotations: [
    { x: 12.5, label: '12.5year' },
    { x: 25, label: '25year' },
  ],
  // 全图悬停 tooltip(三图统一,interaction 处配置):以 x 轴为参考,
  // 鼠标在任何位置都弹当前位置信息框
  data: [
    { x: 0, y: 100 },
    { x: 5, y: 80 },
    { x: 10, y: 60 },
    { x: 12.5, y: 55 }, // 标注点本身也是数据节点:悬停可吸附并弹信息框
    { x: 15, y: 50 },
    { x: 20, y: 40 },
    { x: 25, y: 30 },
  ],
  // 卡下说明文字:第一段为普通字档(全站正文统一字号),第二段为小字档
  // (与上两卡同号);两段左对齐、共享左缘,整块居中
  noteBig: true,
  note: [
    '氚的半衰期约12.3 年，氚管依靠氚衰变持续自发光，无需外界光源充电；每经过 12.3 年亮度衰减至初始的一半，有效可视发光时长约 10–20 年，亮度随时间缓慢下降，不会突然熄灭。',
    '氚管释放的低能 β 射线无法穿透人体皮肤，单纯皮肤接触破裂后的氚气体不会造成外部辐射伤害，常规小型饰品用氚管一旦破裂，氚气会快速在空气中扩散，通风环境下风险极低。',
  ],
}

// chart.js 按需分包:模块加载即发起下载,Chart 实例仍按卡进入视口才创建
const chartModP = import('chart.js/auto').catch((err) => {
  console.error('chart.js 加载失败', err)
  return null
})

let axisTitlesRegistered = false

// 轴标题自绘插件:横写、画在绘图区之外——Y 标题在绘图区上方左上角
// (layout.padding.top 预留 30px 空间,文字不会塞进折线图内),
// X 单位(Hour/Year)在 25 刻度之后的右侧(「25 Year」,layout.padding.right
// 预留空间)。afterDraw 阶段坐标系已按 devicePixelRatio 归一,坐标为 CSS px。
const axisTitles = {
  id: 'axisTitles',
  afterDraw(chart) {
    const opts = chart.options.plugins.axisTitles
    if (!opts) return
    const { ctx, chartArea, scales } = chart
    ctx.save()
    ctx.fillStyle = '#d1d5db' // 黑底上的浅灰文字
    const family = getComputedStyle(document.body).fontFamily
    ctx.font = `13px ${family}` // 全站小字档统一 13px(随 body 字体栈自动换新字体)
    if (opts.y) {
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.fillText(opts.y, chartArea.left, chartArea.top - 10)
    }
    if (opts.x) {
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(opts.x, scales.x.getPixelForValue(opts.xAt) + 8, chartArea.bottom + 8)
    }
    ctx.restore()
  },
}

// 数据点标注插件(氚管灯专属):把旁注写在曲线上指定 x 的节点正上方——
// x=12.5 上方写「12.5year」,x=25 上方写「25year」,文字居中、贴着
// 节点上缘;靠近右缘的文字自动向左收,保证完整不被画布裁掉。
// 节点圆点本身由数据点渲染(12.5 已作为数据节点加入曲线),插件只画文字。
const pointAnnotations = {
  id: 'pointAnnotations',
  afterDatasetsDraw(chart) {
    const opts = chart.options.plugins.pointAnnotations
    if (!opts || !opts.items || !opts.items.length) return
    const { ctx, scales } = chart
    const ds = chart.data.datasets[0]
    ctx.save()
    ctx.fillStyle = '#9ca3af' // 黑底上的浅灰文字
    const family = getComputedStyle(document.body).fontFamily
    ctx.font = `13px ${family}` // 全站小字档统一 13px(随 body 字体栈自动换新字体)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    for (const it of opts.items) {
      let y
      const pts = ds.data
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]
        const b = pts[i + 1]
        if (it.x >= a.x && it.x <= b.x) {
          y = a.y + ((it.x - a.x) / (b.x - a.x)) * (b.y - a.y)
          break
        }
      }
      if (y === undefined) y = pts[pts.length - 1].y
      const px = scales.x.getPixelForValue(it.x)
      const py = scales.y.getPixelForValue(y)
      const w = ctx.measureText(it.label).width
      // 正上方居中;右缘标注向左收,防越界裁切
      const cx = Math.min(px, chart.width - w / 2 - 2)
      ctx.fillText(it.label, cx, py - 12)
    }
    ctx.restore()
  },
}

// 贯穿垂直参考线插件:鼠标悬停绘图区时,在鼠标 x 处画一条从绘图区顶部
// 到底部的浅白色细竖线,并在竖线与曲线的交点画圆形圆点(曲线色填充 +
// 白描边,与数据节点样式一致)。交点用 LineElement.interpolate 在
// tension 贝塞尔曲线上取像素级精确点,不靠线性插值近似。
// afterEvent 里只记录 x 并置 args.changed = true,由 Chart.js 事件循环
// 统一触发重绘,不自己调 render;画在 afterDatasetsDraw(曲线/填充之上、
// tooltip 的 afterDraw 之下),信息框不会被竖线划开。
// 触屏设备((hover: none)主输入无悬停)按规范禁用且不占位;竖线随鼠标
// 1:1 移动、无动画,reduced-motion 不受影响。
const crosshair = {
  id: 'crosshair',
  afterEvent(chart, args) {
    // 触屏(主输入无 hover):鼠标跟随类特效直接禁用且不占位(规范)
    if (window.matchMedia('(hover: none)').matches) return
    const ev = args.event
    if (!chart.chartArea) return
    if (ev.type === 'mousemove') {
      const { left, right } = chart.chartArea
      // 事件对象上的 x/y 由 Chart.js 核心装饰为画布相对 CSS px
      const x = ev.x >= left && ev.x <= right ? ev.x : null
      if (chart.$crosshairX !== x) {
        chart.$crosshairX = x
        args.changed = true
      }
    } else if (ev.type === 'mouseout') {
      if (chart.$crosshairX != null) {
        chart.$crosshairX = null
        args.changed = true
      }
    }
  },
  afterDatasetsDraw(chart) {
    const x = chart.$crosshairX
    if (x == null) return
    const { ctx, chartArea } = chart
    if (x < chartArea.left || x > chartArea.right) return
    const line = chart.getDatasetMeta(0).dataset
    // 交点:在 tension 贝塞尔曲线上插值(bezier 精确解,贴合实际曲线)
    const hit = line && line.interpolate ? line.interpolate({ x }, 'x') : null
    ctx.save()
    // 浅白色细竖线,贯穿绘图区顶部到底部
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, chartArea.top)
    ctx.lineTo(x, chartArea.bottom)
    ctx.stroke()
    if (hit) {
      // 竖线 × 曲线交点:圆形圆点标记(曲线色填充 + 白描边)
      ctx.beginPath()
      ctx.arc(hit.x, hit.y, 5.5, 0, Math.PI * 2)
      ctx.fillStyle = chart.data.datasets[0].borderColor
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()
    }
    ctx.restore()
  },
}

const hexA = (hex, a) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// 三张图表统一的视觉配置:纯黑卡片底 + 浅白细网格、圆点节点、tooltip
// 显示小时/年份与相对亮度。Y 轴 0~120(夜光管 0~100):LED 最上面的
// 120 网格线左侧显示「120」刻度;氚管灯最上面那根横线不画。
// 两轴共用一个 0:x 轴 0 刻度标签隐藏,只保留 y 轴 0 标签。
const buildConfig = (spec) => ({
  type: 'line',
  data: {
    datasets: [
      {
        label: spec.label,
        data: spec.data,
        borderColor: spec.color,
        borderWidth: 2.5,
        tension: 0.4, // 三图统一默认平滑
        // 节点圆点(放大一点点):LED(dotsOnTicks)只在与 x 轴刻度(5 的
        // 倍数)对齐的节点画圆点,非刻度节点(如 x=3)不画、悬停也不出现
        pointRadius: (ctx) => (spec.dotsOnTicks && ctx.parsed.x % 5 !== 0 ? 0 : 5),
        pointHoverRadius: (ctx) => (spec.dotsOnTicks && ctx.parsed.x % 5 !== 0 ? 0 : 7),
        pointBackgroundColor: spec.color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        fill: spec.fill,
        clip: false, // 边缘数据点((0,100)/(0,120)/(25,x))完整显示,不被绘图区裁半
        // 曲线下方渐变填充:32% → 6%,底部仍可见、面积完整抵达底轴
        backgroundColor: (ctx) => {
          const { chart } = ctx
          const { ctx: c, chartArea } = chart
          if (!chartArea) return 'transparent'
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          g.addColorStop(0, hexA(spec.color, 0.32))
          g.addColorStop(1, hexA(spec.color, 0.06))
          return g
        },
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // 入场由卡片级 opacity+translateY 过渡承担
    normalized: true,
    // 三图统一全图悬停:index 模式、不要求命中节点(以 x 轴为参考,
    // 吸附最近节点)——鼠标在任何位置都弹当前位置信息框,贴光标显示
    interaction: { mode: 'index', intersect: false },
    // 顶部预留 30px:Y 轴标题横写画在这里(绘图区之外、图表左上角);
    // 右侧预留 64/60px:25 刻度点完整显示 + X 单位文字画在 25 之后
    // (画布字号统一 13px 后单位文字变宽,原 44/40px 会裁掉「Year」尾部)
    layout: { padding: { top: 30, right: window.innerWidth < 768 ? 60 : 64 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.92)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        // 黑底上给信息框加一圈浅白描边,保持原有深色框样式且轮廓清晰
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        // 信息框锚点钉在鼠标位置(自定义 positioner「cursor」),
        // 始终贴着光标弹出,靠边时 Chart.js 自动翻转并收在画布内
        position: 'cursor',
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 13 },
        callbacks: {
          title: (items) => `${items[0].parsed.x} ${spec.xUnit}`,
          label: (item) => `Relative Brightness: ${item.parsed.y}%`,
        },
      },
      axisTitles: { y: 'Relative Brightness (%)', x: spec.xUnit, xAt: 25 },
      pointAnnotations: spec.annotations ? { items: spec.annotations } : false,
    },
    scales: {
      x: {
        type: 'linear',
        min: 0,
        max: 25,
        ticks: {
          stepSize: 5,
          color: '#9ca3af', // 黑底浅灰数字
          font: { size: 13 }, // 全站小字档统一 13px
          padding: 8, // 底部数字往下移一点点
          // 两轴共用一个 0:x 轴的 0 标签隐藏,由 y 轴的 0 代表原点
          callback: (v) => (v === 0 ? '' : v),
        },
        // 无竖线:纵向网格线全部关闭,只留横向网格(属 y 轴)
        grid: { display: false, drawTicks: false },
        border: { color: 'rgba(255, 255, 255, 0.16)' },
      },
      y: {
        min: 0,
        max: spec.yMax,
        ticks: {
          stepSize: 20,
          color: '#9ca3af', // 黑底浅灰数字
          font: { size: 13 }, // 全站小字档统一 13px
          padding: 8, // 左边数字往左移一点点
          // 120 刻度:LED 在最上面那根线左侧显示「120」,其余图不显示
          callback: (v) => (v > 100 ? (spec.show120 ? v : '') : v),
        },
        // 横向网格保留(黑底浅白细线);无竖线:y 轴左侧竖线关闭
        // 氚管灯:最上面那根横线不画(120 网格透明),其余横线同款浅白 8%
        grid: {
          color: (ctx) =>
            spec.hideTopLine && ctx.tick.value === spec.yMax
              ? 'rgba(255, 255, 255, 0)'
              : 'rgba(255, 255, 255, 0.08)',
          drawTicks: false,
        },
        border: { display: false, color: 'rgba(255, 255, 255, 0.16)' },
      },
    },
  },
})

function ChartCard({ spec, second, wide }) {
  const cardRef = useRef(null)
  const canvasRef = useRef(null)
  const chartRef = useRef(null)
  const [ready, setReady] = useState(false)

  // 每张卡片独立的 IO:进入视口才淡入并初始化本卡 Chart 实例
  useEffect(() => {
    const el = cardRef.current
    if (
      !el ||
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setReady(true) // 降级:直接可见
      return undefined
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true)
          io.disconnect()
        }
      },
      // 触发线 88%:比常规 96% 更早触发,上移+淡入的动效在卡片
      // 进入视野中部时仍在播放,滚动触发效果明显可见
      { root: el.closest('.lightbox__scroll'), rootMargin: '0px 0px -12% 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!ready || chartRef.current) return
    const canvas = canvasRef.current
    let disposed = false
    chartModP.then((mod) => {
      if (!mod || disposed || chartRef.current || !canvas) return
      const { default: Chart, Tooltip } = mod
      if (!axisTitlesRegistered) {
        Chart.register(axisTitles, pointAnnotations, crosshair)
        axisTitlesRegistered = true
      }
      // 自定义 tooltip 锚点:钉在鼠标事件坐标上,信息框始终贴着光标,
      // 靠边时 Chart.js 按锚点自动翻转对齐并收进画布内(见 tooltip.position)
      if (!Tooltip.positioners.cursor) {
        Tooltip.positioners.cursor = (items, eventPosition) => {
          const e = eventPosition || { x: 0, y: 0 }
          return { x: e.x, y: e.y }
        }
      }
      const chart = new Chart(canvas, buildConfig(spec))
      chartRef.current = chart
      // 验证钩子(生产无副作用)
      window.__brightnessCharts = window.__brightnessCharts || {}
      window.__brightnessCharts[spec.key] = chart
    })
    return () => {
      disposed = true
    }
  }, [ready, spec])

  useEffect(
    () => () => {
      chartRef.current?.destroy()
      chartRef.current = null
      if (window.__brightnessCharts) delete window.__brightnessCharts[spec.key]
    },
    [spec.key],
  )

  return (
    <article
      ref={cardRef}
      className={`lightbox__chartcard${second ? ' lightbox__chartcard--second' : ''}${wide ? ' lightbox__chartcard--wide' : ''}${ready ? ' lightbox__chartcard--ready' : ''}`}
    >
      <div className="lightbox__chartcard-canvas">
        <canvas ref={canvasRef} role="img" aria-label={`${spec.label}亮度衰减图表`} />
      </div>
      <p className="lightbox__chartcard-title">{spec.label}</p>
      {spec.note && (
        <div className={`lightbox__chartcard-note${spec.noteBig ? ' lightbox__chartcard-note--big' : ''}`}>
          {(Array.isArray(spec.note) ? spec.note : [spec.note]).map((t, i) => (
            <p key={i}>{t}</p>
          ))}
        </div>
      )}
    </article>
  )
}

export default function BrightnessCharts() {
  return (
    <>
      <section className="lightbox__brightness">
        <div className="lightbox__brightness-inner">
          <div className="lightbox__charts-grid">
            <ChartCard spec={GLOW} />
            <ChartCard spec={LED} second />
            <ChartCard spec={TRITIUM} wide />
          </div>
        </div>
      </section>
      {/* 外壳滚动场景(标题横移 + 一页半场景图视差)+「设计目的」半页
          (见 DesignPurpose.jsx) */}
      <DesignPurpose />
    </>
  )
}
