// ── 静态资源根 ──
// 2026-11-14:全部重资产(图片/视频/字体)原走阿里云 OSS 直连。
// 同日用户要求:OSS 欠费期间改**本地读取**(public/ 直接提供),
// 部署上线时再一起上传 OSS 并把下面 OSS 改回原地址即可:
//   const OSS = 'https://myportfolio26.oss-cn-hangzhou.aliyuncs.com'
// (改回后记得同步 sw.js 的 OSS_ENABLED = true 并升 VERSION)
export const OSS = ''
