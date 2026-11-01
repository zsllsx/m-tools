/**
 * 站点级配置：标题、描述、页脚等集中在此维护，页面中不要硬编码。
 */
export default {
  name: 'M-Tools',
  title: 'M-Tools 在线工具箱',
  description: '纯前端的在线小工具集合，无需注册登录，所有数据只在你自己的浏览器中处理。',
  keywords: ['在线工具', '工具箱', '开发者工具', '纯前端'],
  version: '0.1.0',
  // GitHub 仓库地址，头部右上角入口与关于页都会用到；留空则不展示
  repo: 'https://github.com/zsllsx/m-tools',
  // 关于页：背景说明
  about: {
    background: '小马老师的专属工具'
  },
  // 关于页：开发者信息
  author: {
    name: '终是落了俗',
    qq: '1739008002',
    email: '1739008002@qq.com',
    // QQ 头像，s 为尺寸，数值越大越清晰
    avatar: 'https://q.qlogo.cn/g?b=qq&s=100&nk=1739008002'
  },
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
