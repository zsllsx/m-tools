/**
 * 站点级配置：标题、描述、页脚等集中在此维护，页面中不要硬编码。
 */
export default {
  name: 'M-Tools',
  title: 'M-Tools 在线工具箱',
  description: '纯前端的在线小工具集合，无需注册登录，所有数据只在你自己的浏览器中处理。',
  keywords: ['在线工具', '工具箱', '开发者工具', '纯前端'],
  version: '0.1.0',
  // 页脚展示
  footer: {
    text: 'M-Tools · 纯前端工具集',
    links: []
  },
  // 首页统计等开关
  features: {
    search: true,
    themeSwitch: true
  }
}
