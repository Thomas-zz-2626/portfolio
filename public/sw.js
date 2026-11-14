// ── Service Worker:静态资源缓存 ──
// 托管方(GitHub Pages)只能给 10 分钟 Cache-Control,这里补一层长期缓存:
//  · /assets/*  哈希构建产物,内容不可变 → cache-first(命中后零网络)
//  · /images/*  图片与视频 → stale-while-revalidate(先出缓存,后台更新)
//  · 导航请求   network-first(index.html 永远拿最新构建,不缓存旧壳)
// 版本号变更即整体失效,无需逐条清理。
// 2026-11-14:资源路径全部改相对,站点可部署在 /portfolio/ 子路径;
// 缓存判定改用注册 scope 前缀(根路径 scope='/' → 前缀为空,行为不变)。
const VERSION = 'v18' // 2026-11-14:全站资源改相对路径(部署 /portfolio/ 子路径)+SW 自身路径变化,升版整体失效

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

  // 图片/视频:stale-while-revalidate——先返回缓存(若有),同时后台刷新
  if (url.pathname.startsWith(IMAGES_PREFIX)) {
    event.respondWith(
      caches.open('media-' + VERSION).then(async (cache) => {
        const cached = await cache.match(request)
        const refresh = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone())
            return res
          })
          .catch(() => cached)
        return cached || refresh
      })
    )
  }
})
