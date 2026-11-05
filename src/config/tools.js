import { markRaw } from 'vue'
import { EditPen, Picture } from '@element-plus/icons-vue'

/**
 * 工具分类。首页筛选与工具卡片标签统一使用这里的 key。
 * 数组顺序即首页筛选的展示顺序。
 */
export const categories = [
  { key: 'worksheet', name: '制题工具' },
  { key: 'dev', name: '开发辅助' },
  { key: 'text', name: '文本处理' },
  { key: 'convert', name: '格式转换' },
  { key: 'media', name: '图片与媒体' },
  { key: 'calc', name: '计算与其他' },
  { key: 'other', name: '未分类' }
]

/**
 * 工具清单，首页列表 + 路由标题都由这里驱动。
 *
 * 字段说明：
 * - key:        唯一标识，同时作为路由地址 /tools/:key
 * - name:       工具名称
 * - desc:       一句话说明（卡片与搜索都会用到）
 * - icon:       Element Plus 图标组件
 * - category:  所属分类 key
 * - tags:       搜索关键词，便于模糊匹配
 * - status:     'ready' 已上线 | 'planned' 开发中
 * - route:      已上线工具对应的路由 name，未配置时跳转到 /tools/:key 占位页
 * - placeholder: 仅作占位，不参与首页展示与统计
 */
export const tools = [
  {
    key: 'pinyin-worksheet',
    name: '看拼音写词语',
    desc: '按模板批量录入词语，自动注音并生成带田字格的练习卷，支持样式统一配置与导出图片。',
    icon: markRaw(EditPen),
    category: 'worksheet',
    tags: ['拼音', '田字格', '小学语文', '语文', '制题', '练习卷', '看拼音写词语'],
    status: 'ready',
    route: 'tool-pinyin-worksheet'
  },
  {
    key: 'docx-to-image',
    name: 'Word 转长图',
    desc: '把 .docx 逐页渲染为图片，自动裁掉页边空白后竖向拼接成一张长图，纯本地解析。',
    icon: markRaw(Picture),
    category: 'convert',
    tags: ['Word', 'docx', '长图', '图片', '拼接', '裁边', '格式转换'],
    status: 'ready',
    route: 'tool-docx-to-image'
  }
]

/** 参与首页展示的工具（排除占位项） */
export const visibleTools = tools.filter((tool) => !tool.placeholder)

/** 分类是否存在 */
export function isCategoryKey(key) {
  return categories.some((item) => item.key === key)
}

/** 按 key 查找工具 */
export function getToolByKey(key) {
  return tools.find((item) => item.key === key) || null
}

/** 取分类名称 */
export function getCategoryName(key) {
  return categories.find((item) => item.key === key)?.name || '未分类'
}

/** 按分类分组后的工具，供后续页面复用 */
export function groupToolsByCategory(list = visibleTools) {
  return categories
    .map((category) => ({
      ...category,
      tools: list.filter((tool) => tool.category === category.key)
    }))
    .filter((group) => group.tools.length > 0)
}
