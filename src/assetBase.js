// ── 阿里云 OSS 静态资源根 ──
// 2026-11-14:全部重资产(图片/视频/字体)直接走阿里云 OSS(国内 6MB/s,
// 对比 github.io 被限速 ~95KB/s);HTML 壳与 JS/CSS 仍由 GitHub Pages 提供。
// Bucket 公共读 + CORS * 已配;OSS 默认域名对 text/html 强制 attachment
// 下载,所以 HTML 不能放 OSS,只能放二进制资源。
export const OSS = 'https://myportfolio26.oss-cn-hangzhou.aliyuncs.com'
