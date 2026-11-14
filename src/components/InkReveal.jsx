// ── 墨水揭秘(InkReveal):canvas 刮开式遮罩 ──
// 参考 21st.dev ink-reveal 组件,按项目规范重写(本项目为 JSX + 纯 CSS,
// 无 Tailwind/TS,故不照搬 shadcn 结构,组件自包含):
// · 交互统一用 pointer 事件(pointerenter/move/down/leave),不依赖 mouse 事件
// · 刮开为永久性:遮罩 canvas 只在 resize 时重涂,destination-out 逐帧累加
//   ——揭开的字不会重新盖上(参考版是"余辉跟随"式,划过的字会再盖上,
//   不符合"滑到字上面才显示出来"的阅读需求,已改为刮刮卡式)
// · maskAlpha 半透明遮罩:未揭开时文字隐约透出,是"这里可以揭开"的
//   淡淡指示之一(另一指示是父层的虚线框)
// · 触屏/触控笔:pointerdown 一次网格图章全揭开——关键信息不只在
//   hover 出现,触屏有等价 tap 表现(规范)
// · 键盘:父层改变 forceReveal(每次 +1)即全揭开一次(Enter/Space 触发)
// · prefers-reduced-motion:不渲染遮罩,文字直接完整呈现(规范)
// 性能:图章有生命周期,rAF 只在有存活图章时运行,结束即停;canvas
// 分辨率按 dpr≤2 定,不随滚动重复分配。
import { useEffect, useRef, useCallback, useState } from 'react'

const DEFAULT_WOBBLE = [0.14, 0.08, 0.05]
const DEFAULT_GRADIENT = [0.95, 0.88, 0]
const DEFAULT_MASK = [255, 255, 255] // 遮罩色 = 板块背景色(白)

export default function InkReveal({
  // 默认值必须引用模块级常量:内联字面量每次渲染都是新数组 → mc 身份
  // 变化 → fillMask/resize 重造 → 挂载 effect 每渲染重跑 → 遮罩重涂,
  // 已揭开的字重新盖上(2026-10-19 手机点按揭秘被后续重渲染抹掉的根因)
  maskColor = DEFAULT_MASK,
  maskAlpha = 0.9, // 遮罩不透明度:0.9 → 文字以 ~10% 隐约透出(淡淡指示)
  brushSize = 96, // 单个图章最大半径(px)
  lifetime = 650, // 图章从出现到完全展开的时长(ms)
  rStart = 12, // 图章初始半径
  rVary = 0.45, // 图章半径随机浮动比例
  stampStep = 10, // 笔迹沿线最小落章间距(px)
  maxStamps = 160, // 同时存活图章上限(最旧先剔除)
  segments = 28, // 抖动圆边分段数
  wobble = DEFAULT_WOBBLE, // 抖动幅度权重 [主, 次, 三]
  gradientInnerRadius = 0.18, // 渐变内半径系数
  gradientStops = DEFAULT_GRADIENT, // 渐变不透明度 [中心, 中段, 边缘]
  forceReveal = 0, // 数字变化一次 = 全揭开一次(键盘等外部触发)
  onRevealStart, // 首次交互回调(父层用于淡出虚线指示)
  className,
  style,
}) {
  // reduced-motion:遮罩整体不渲染,文字完整可见
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const canvasRef = useRef(null)
  const stampsRef = useRef([])
  const runningRef = useRef(false)
  const lastPosRef = useRef(null)
  const dimsRef = useRef({ w: 0, h: 0 })
  const startedRef = useRef(false)
  const mc = maskColor

  const fillMask = useCallback(
    (ctx, w, h) => {
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = `rgba(${mc[0]}, ${mc[1]}, ${mc[2]}, ${maskAlpha})`
      ctx.fillRect(0, 0, w, h)
    },
    [mc, maskAlpha]
  )

  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = parent.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    dimsRef.current = { w, h }
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // 重涂 = 重新盖满遮罩(视口变化后已揭开的区域会被盖上,可接受)
    fillMask(ctx, w, h)
  }, [fillMask])

  const carveInk = useCallback(
    (ctx, x, y, r, seed, alpha) => {
      const g = ctx.createRadialGradient(x, y, r * gradientInnerRadius, x, y, r)
      g.addColorStop(0, `rgba(0,0,0,${gradientStops[0] * alpha})`)
      g.addColorStop(0.5, `rgba(0,0,0,${gradientStops[1] * alpha})`)
      g.addColorStop(1, `rgba(0,0,0,${gradientStops[2] * alpha})`)
      ctx.fillStyle = g

      ctx.beginPath()
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2
        const wob =
          0.78 +
          wobble[0] * Math.sin(a * 3 + seed) +
          wobble[1] * Math.sin(a * 5 + seed * 2.1) +
          wobble[2] * Math.sin(a * 7 + seed * 0.7)
        const px = x + Math.cos(a) * r * wob
        const py = y + Math.sin(a) * r * wob
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
    },
    [segments, wobble, gradientInnerRadius, gradientStops]
  )

  const addStamp = useCallback(
    (x, y) => {
      const stamps = stampsRef.current
      if (stamps.length >= maxStamps) stamps.shift()
      stamps.push({
        x,
        y,
        born: performance.now(),
        seed: Math.random() * Math.PI * 2,
        rmax: brushSize * (1 - rVary + Math.random() * rVary),
      })
    },
    [brushSize, rVary, maxStamps]
  )

  const stampAlong = useCallback(
    (x, y) => {
      const last = lastPosRef.current
      if (!last) {
        addStamp(x, y)
      } else {
        const dx = x - last.x
        const dy = y - last.y
        const dist = Math.hypot(dx, dy)
        const steps = Math.max(1, Math.ceil(dist / stampStep))
        for (let i = 1; i <= steps; i++) {
          addStamp(last.x + (dx * i) / steps, last.y + (dy * i) / steps)
        }
      }
      lastPosRef.current = { x, y }
    },
    [addStamp, stampStep]
  )

  // 永久刮开式循环:只累加 destination-out,不重涂整幅——
  // 每帧对存活图章按当前展开半径刮一次,图章到寿即移除,全部
  // 移除后 rAF 停转;canvas 保留已刮开状态(字不会重新盖上)。
  const loop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const now = performance.now()
    const stamps = stampsRef.current

    ctx.globalCompositeOperation = 'destination-out'
    for (let i = stamps.length - 1; i >= 0; i--) {
      const s = stamps[i]
      const t = (now - s.born) / lifetime
      if (t >= 1) {
        stamps.splice(i, 1)
        continue
      }
      const ease = 1 - Math.pow(1 - t, 3)
      const r = rStart + (s.rmax - rStart) * ease
      const alpha = 1 - t * t
      carveInk(ctx, s.x, s.y, r, s.seed, alpha)
    }

    if (stamps.length) requestAnimationFrame(loop)
    else runningRef.current = false
  }, [carveInk, lifetime, rStart])

  const startLoop = useCallback(() => {
    if (!runningRef.current) {
      runningRef.current = true
      requestAnimationFrame(loop)
    }
  }, [loop])

  // 全揭开:网格图章铺满整个遮罩(触屏点按 / 键盘触发)
  const fullReveal = useCallback(() => {
    const { w, h } = dimsRef.current
    if (!w || !h) return
    const step = Math.max(brushSize * 0.7, 24)
    const stamps = stampsRef.current
    for (let y = step / 2; y < h + step / 2; y += step) {
      const offsetX = (Math.round(y / step) % 2) * step * 0.5
      for (let x = step / 2 + offsetX; x < w + step / 2; x += step) {
        if (stamps.length >= maxStamps) stamps.shift()
        stamps.push({
          x: Math.min(x, w),
          y: Math.min(y, h),
          born: performance.now(),
          seed: Math.random() * Math.PI * 2,
          rmax: brushSize * (1 - rVary + Math.random() * rVary),
        })
      }
    }
    startLoop()
  }, [brushSize, rVary, maxStamps, startLoop])

  useEffect(() => {
    if (forceReveal > 0) fullReveal()
  }, [forceReveal, fullReveal])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)
    window.addEventListener('resize', resize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [resize])

  const markStarted = useCallback(() => {
    if (!startedRef.current) {
      startedRef.current = true
      onRevealStart?.()
    }
  }, [onRevealStart])

  if (reduced) return null

  const getPos = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        cursor: 'none', // 站点全局已隐藏系统光标,与自定义光标一致
        touchAction: 'none', // 手指在字上划动 = 刮开,不滚动灯箱
        ...style,
      }}
      aria-hidden="true"
      onPointerEnter={(e) => {
        if (e.pointerType === 'touch') return
        const pos = getPos(e)
        lastPosRef.current = pos
        stampAlong(pos.x, pos.y)
        startLoop()
        markStarted()
      }}
      onPointerMove={(e) => {
        if (e.pointerType === 'touch') return
        const pos = getPos(e)
        stampAlong(pos.x, pos.y)
        startLoop()
      }}
      onPointerDown={(e) => {
        markStarted()
        if (e.pointerType === 'touch' || e.pointerType === 'pen') {
          fullReveal()
        } else {
          const pos = getPos(e)
          stampAlong(pos.x, pos.y)
          startLoop()
        }
      }}
      onPointerLeave={() => {
        lastPosRef.current = null
      }}
    />
  )
}
