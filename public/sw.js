// ── Service Worker:静态资源缓存 ──
// 托管方(GitHub Pages)只能给 10 分钟 Cache-Control,这里补一层长期缓存:
//  · /assets/*  哈希构建产物,内容不可变 → cache-first(命中后零网络)
//  · /images/*  图片/视频/字体 → 代理到阿里云 OSS(国内直连,比 GitHub 快几十倍),
//               stale-while-revalidate(先出缓存,后台刷新);OSS 不可达时退回原站
//  · 导航请求   network-first(index.html 永远拿最新构建,不缓存旧壳)
// 版本号变更即整体失效,无需逐条清理。
// 2026-11-14:资源路径全部改相对,站点可部署在 /portfolio/ 子路径;
// 缓存判定改用注册 scope 前缀(根路径 scope='/' → 前缀为空,行为不变)。
const VERSION = 'v22' // 2026-11-14:OSS 欠费期间关闭 /images 代理,本地/原站直读;部署恢复 OSS 时 OSS_ENABLED 改回 true 并再升版本

const OSS_BASE = 'https://myportfolio26.oss-cn-hangzhou.aliyuncs.com'
// OSS 欠费期间 = false:/images/* 直接原站(本地预览/局域网/GitHub Pages);
// 部署上线(OSS 已恢复付费)时改回 true:代理到 OSS 直连(国内快),失败退回原站
const OSS_ENABLED = false

const scopePath = new URL(self.registration.scope).pathname.replace(/\/$/, '')
const ASSETS_PREFIX = scopePath + '/assets/'
const IMAGES_PREFIX = scopePath + '/images/'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.endsWith('-' + VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== location.origin) return

  // 导航请求:网络优先,失败时退回缓存
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
    return
  }

  // 哈希构建产物:cache-first,背景填充
  if (url.pathname.startsWith(ASSETS_PREFIX)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit
        return fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open('assets-' + VERSION).then((c) => c.put(request, copy))
          }
          return res
        })
      })
    )
    return
  }

  // 图片/视频/字体
  if (url.pathname.startsWith(IMAGES_PREFIX)) {
    // OSS 欠费期间(2026-11-14 用户):不代理,直接原站读取(本地预览/局域网/
    // GitHub Pages);不缓存媒体,避免占满存储。恢复 OSS 后走下方代理分支。
    if (!OSS_ENABLED) {
      event.respondWith(fetch(request))
      return
    }
    // 代理到 OSS 取文件(比 GitHub 快),stale-while-revalidate
    event.respondWith(
      caches.open('media-' + VERSION).then(async (cache) => {
        const cached = await cache.match(request)
        // OSS 上的 key = 去掉 scope 前缀的路径(Bucket 内没有 /portfolio/ 前缀)
        const ossUrl = OSS_BASE + url.pathname.slice(scopePath.length)
        const network = async () => {
          try {
            const res = await fetch(ossUrl, { headers: request.headers })
            // 200 完整响应入缓存;206(Range 分段,视频拖动)不入缓存
            if (res.ok && res.status === 200) {
              const copy = res.clone()
              cache.put(request, copy).catch(() => {})
            }
            return res
          } catch (e) {
            // OSS 不可达 → 退回原站(GitHub)
            return cached || fetch(request)
          }
        }
        if (cached) {
          network() // 后台刷新
          return cached
        }
        return network()
      })
    )
  }
})
