import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // 相对 base:同一构建同时服务根路径(本地 4173/4181)与
  // GitHub Pages 子路径(/portfolio/),配合全站相对资源路径(2026-11-14)。
  base: './',
  plugins: [react()],
  server: {
    host: true,
    watch: {
      // public/ 里的图片是被直接读取的静态资源，不需要 HMR 监听。
      // 原图/ 放的是未压缩的设计原稿（几十 MB），同样不参与监听。
      // Windows 上文件被其它程序占用时，监听会抛 EBUSY 直接把 dev server 弄崩。
      ignored: ['**/public/**', '**/原图/**'],
    },
  },
  preview: {
    // 预览服务器强制 no-cache：index.html 每次都重新校验，
    // 改版后浏览器不再拿旧构建（旧 hash 文件已被清理，缓存会造成页面回退）。
    headers: {
      'Cache-Control': 'no-cache',
    },
  },
})
