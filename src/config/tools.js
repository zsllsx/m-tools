import { markRaw } from 'vue'
import {
  Clock,
  Document,
  DocumentCopy,
  Files,
  Grid,
  Key,
  Link,
  Lock,
  MagicStick,
  Memo,
  Notebook,
  Odometer,
  Picture,
  Reading,
  Sort,
  Switch,
  Timer,
  Brush
} from '@element-plus/icons-vue'

/**
 * 工具分类。首页筛选与工具卡片标签统一使用这里的 key。
 */
export const categories = [
  { key: 'dev', name: '开发辅助' },
  { key: 'text', name: '文本处理' },
  { key: 'convert', name: '格式转换' },
  { key: 'media', name: '图片与媒体' },
  { key: 'calc', name: '计算与其他' }
]

/**
 * 工具清单，首页列表 + 路由标题都由这里驱动。
 *
 * 字段说明：
 * - key:   唯一标识，同时作为路由地址 /tools/:key
 * - name:  工具名称
 * - desc:  一句话说明（卡片与搜索都会用到）
 * - icon:  Element Plus 图标组件
 * - category: 所属分类 key
 * - tags:  搜索关键词，便于模糊匹配
 * - status: 'ready' 已上线 | 'planned' 开发中
 */
export const tools = [
  {
    key: 'json-formatter',
    name: 'JSON 格式化',
    desc: '格式化、压缩与校验 JSON，支持层级折叠。',
    icon: markRaw(Document),
    category: 'dev',
    tags: ['json', '格式化', '压缩', '校验'],
    status: 'planned'
  },
  {
    key: 'base64',
    name: 'Base64 编解码',
    desc: '文本与 Base64 双向转换，支持 URL 安全字符集。',
    icon: markRaw(Files),
    category: 'convert',
    tags: ['base64', '编码', '解码'],
    status: 'planned'
  },
  {
    key: 'url-codec',
    name: 'URL 编解码',
    desc: 'URL / 查询参数编码解码，支持组件级编码。',
    icon: markRaw(Link),
    category: 'convert',
    tags: ['url', 'encodeURIComponent', '转义'],
    status: 'planned'
  },
  {
    key: 'timestamp',
    name: '时间戳转换',
    desc: 'Unix 时间戳与日期互转，支持多时区与常用格式。',
    icon: markRaw(Timer),
    category: 'dev',
    tags: ['timestamp', '时间戳', '日期', '时区'],
    status: 'planned'
  },
  {
    key: 'regex-tester',
    name: '正则测试',
    desc: '实时匹配预览、分组高亮与常用表达式速查。',
    icon: markRaw(MagicStick),
    category: 'dev',
    tags: ['regex', '正则', '匹配'],
    status: 'planned'
  },
  {
    key: 'jwt-decoder',
    name: 'JWT 解析',
    desc: '解析 JWT 头部与载荷，查看过期时间等信息。',
    icon: markRaw(Key),
    category: 'dev',
    tags: ['jwt', 'token', '解析'],
    status: 'planned'
  },
  {
    key: 'hash',
    name: '哈希计算',
    desc: 'MD5 / SHA-1 / SHA-256 摘要计算，纯前端运算。',
    icon: markRaw(Lock),
    category: 'dev',
    tags: ['hash', 'md5', 'sha', '摘要'],
    status: 'planned'
  },
  {
    key: 'uuid',
    name: 'UUID 生成',
    desc: '批量生成 UUID v4 与自定义长度随机串。',
    icon: markRaw(Grid),
    category: 'calc',
    tags: ['uuid', '随机', 'id'],
    status: 'planned'
  },
  {
    key: 'qrcode',
    name: '二维码生成',
    desc: '文本或链接生成二维码，可调整尺寸并下载。',
    icon: markRaw(Picture),
    category: 'media',
    tags: ['qrcode', '二维码', '生成'],
    status: 'planned'
  },
  {
    key: 'text-diff',
    name: '文本对比',
    desc: '逐行对比两段文本差异，高亮新增与删除。',
    icon: markRaw(DocumentCopy),
    category: 'text',
    tags: ['diff', '对比', '差异'],
    status: 'planned'
  },
  {
    key: 'text-sort',
    name: '文本排序去重',
    desc: '按行排序、去重、去除空行，支持大小写处理。',
    icon: markRaw(Sort),
    category: 'text',
    tags: ['排序', '去重', '行'],
    status: 'planned'
  },
  {
    key: 'word-count',
    name: '字数统计',
    desc: '统计字符、中英文词数、行数与阅读时长。',
    icon: markRaw(Reading),
    category: 'text',
    tags: ['字数', '统计', '词数'],
    status: 'planned'
  },
  {
    key: 'markdown-preview',
    name: 'Markdown 预览',
    desc: '实时渲染 Markdown，支持代码块与表格。',
    icon: markRaw(Notebook),
    category: 'text',
    tags: ['markdown', '预览', '渲染'],
    status: 'planned'
  },
  {
    key: 'csv-json',
    name: 'CSV / JSON 互转',
    desc: '表格与 JSON 双向转换，支持分隔符与表头设置。',
    icon: markRaw(Switch),
    category: 'convert',
    tags: ['csv', 'json', '表格'],
    status: 'planned'
  },
  {
    key: 'yaml-format',
    name: 'YAML 格式化',
    desc: 'YAML 校验、格式化与 JSON 互相转换。',
    icon: markRaw(Memo),
    category: 'convert',
    tags: ['yaml', 'yml', '格式化'],
    status: 'planned'
  },
  {
    key: 'radix-convert',
    name: '进制转换',
    desc: '二 / 八 / 十 / 十六进制互转，支持大数。',
    icon: markRaw(Odometer),
    category: 'calc',
    tags: ['进制', '二进制', '十六进制'],
    status: 'planned'
  },
  {
    key: 'unit-convert',
    name: '单位换算',
    desc: '长度、面积、重量、温度等常用单位换算。',
    icon: markRaw(Odometer),
    category: 'calc',
    tags: ['单位', '换算', '长度', '温度'],
    status: 'planned'
  },
  {
    key: 'password-gen',
    name: '随机密码生成',
    desc: '按字符集规则生成高强度随机密码。',
    icon: markRaw(Lock),
    category: 'calc',
    tags: ['密码', '随机', '强度'],
    status: 'planned'
  },
  {
    key: 'image-base64',
    name: '图片转 Base64',
    desc: '本地图片转 Data URL，可复制为 CSS 或 HTML。',
    icon: markRaw(Picture),
    category: 'media',
    tags: ['图片', 'base64', 'dataurl'],
    status: 'planned'
  },
  {
    key: 'color-convert',
    name: '颜色转换',
    desc: 'HEX / RGB / HSL 互转，附带色板与对比度。',
    icon: markRaw(Brush),
    category: 'media',
    tags: ['颜色', 'hex', 'rgb', 'hsl'],
    status: 'planned'
  },
  {
    key: 'cron',
    name: 'Cron 表达式',
    desc: '解析 Cron 表达式并预览未来执行时间。',
    icon: markRaw(Clock),
    category: 'dev',
    tags: ['cron', '定时', '表达式'],
    status: 'planned'
  }
]

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
export function groupToolsByCategory(list = tools) {
  return categories
    .map((category) => ({
      ...category,
      tools: list.filter((tool) => tool.category === category.key)
    }))
    .filter((group) => group.tools.length > 0)
}
