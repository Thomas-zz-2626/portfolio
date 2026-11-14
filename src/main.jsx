import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 滚动触发动效系统:初始隐藏必须且只能由 JS 存活时生效——
// 在首帧渲染前同步给 <html> 加类,index.css 里所有 opacity:0 都限定在
// html.js-reveal 之下,无 JS / JS 报错时全站内容完整可见。
document.documentElement.classList.add('js-reveal')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 静态资源缓存(仅生产构建):/assets/* cache-first,/images/* SWR,
// 导航 network-first。开发模式下不注册,避免干扰热更新。
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {})
  })
}
