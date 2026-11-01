import { createRouter, createWebHashHistory } from 'vue-router'
import appConfig from '@/config/app'
import { getToolByKey } from '@/config/tools'
import BasicLayout from '@/layouts/BasicLayout.vue'

/**
 * 路由约定：
 * - 首页与工具页都在 BasicLayout 内渲染，保持一致的头部 / 页脚。
 * - 新工具上线时，在 views/tools 下新增页面，然后在 tools 路由前补充静态子路由，
 *   未单独配置的工具会回落到 /tools/:key 的占位页。
 * - 使用 hash 模式，纯静态部署刷新不会 404，无需服务端改写。
 */
const routes = [
  {
    path: '/',
    component: BasicLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: '工具列表' }
      },
      {
        path: 'about',
        name: 'about',
        component: () => import('@/views/AboutView.vue'),
        meta: { title: '关于' }
      },
      {
        path: 'tools/pinyin-worksheet',
        name: 'tool-pinyin-worksheet',
        component: () => import('@/views/tools/PinyinWorksheet.vue'),
        meta: { title: '看拼音写词语' }
      },
      {
        path: 'tools/:key',
        name: 'tool',
        component: () => import('@/views/ToolView.vue'),
        meta: { title: '工具详情' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.afterEach((to) => {
  // 工具页优先使用工具名称作为标题
  const tool = to.name === 'tool' ? getToolByKey(to.params.key) : null
  const title = tool?.name || to.meta?.title
  document.title = title ? `${title} · ${appConfig.name}` : appConfig.title
})

export default router
