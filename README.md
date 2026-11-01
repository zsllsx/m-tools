# M-Tools

轻量、纯前端的在线工具箱。无需注册登录、无需后端服务，所有计算都在浏览器本地完成，输入内容不会上传到任何服务器。

- 首页工具列表：关键词搜索 + 分类筛选，配置驱动，新增工具只需改一处配置
- 主题：浅色 / 深色切换，首次访问跟随系统偏好并记忆选择
- 部署：构建产物为纯静态文件，`base: './'` + hash 路由，可直接丢到任意静态托管，刷新不会 404

## 技术栈

| 能力 | 选型 |
| --- | --- |
| 框架 | Vue 3（`<script setup>`，JavaScript） |
| 路由 | Vue Router 4（hash 模式） |
| UI | Element Plus（按需引入） |
| 构建 | Vite 7 |
| 样式 | SCSS（变量 / 混入 / 分层） |

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发，默认 http://localhost:5273
npm run dev

# 生产构建，输出到 dist/
npm run build

# 本地预览构建产物
npm run preview
```

## 目录结构

```
m-tools/
├─ index.html                 # HTML 入口
├─ vite.config.js             # 别名、Element Plus 按需引入、SCSS 全局注入
├─ jsconfig.json              # @ 别名提示
├─ public/favicon.svg
└─ src/
   ├─ main.js                 # 应用入口
   ├─ App.vue
   ├─ router/index.js         # 路由表 + 页面标题同步
   ├─ config/
   │   ├─ app.js              # 站点信息：名称、描述、版本、页脚、功能开关
   │   └─ tools.js            # 工具清单 + 分类 + 查询辅助函数
   ├─ layouts/BasicLayout.vue # 吸顶头部、导航、主题切换、页脚
   ├─ components/ToolCard.vue # 工具卡片
   ├─ composables/useTheme.js # 深浅色主题（localStorage + 系统偏好）
   ├─ views/
   │   ├─ HomeView.vue        # 首页：搜索、分类筛选、卡片网格
   │   ├─ ToolView.vue        # /tools/:key 工具挂载点（未单独配置时展示占位）
   │   ├─ AboutView.vue
   │   └─ NotFoundView.vue
   └─ assets/styles/
      ├─ index.scss           # 全局样式入口
      ├─ _variables.scss      # 编译期变量：字体、布局、圆角、品牌色、断点
      ├─ _mixins.scss         # 混入：响应式、卡片、图标块、省略、渐变文字
      ├─ _tokens.scss         # 运行时主题变量（浅色 / 深色）与 Element Plus 主色覆盖
      └─ _base.scss           # 重置、排版、滚动条、通用类
```

## 新增一个工具

1. 在 `src/views/tools/` 下新建页面组件，例如 `JsonFormatter.vue`。
2. 在 `src/config/tools.js` 的 `tools` 数组中补充一条记录，并把 `status` 设为 `'ready'`：

```js
{
  key: 'json-formatter',        // 同时是路由地址 /tools/json-formatter
  name: 'JSON 格式化',
  desc: '格式化、压缩与校验 JSON，支持层级折叠。',
  icon: markRaw(Document),      // @element-plus/icons-vue 图标
  category: 'dev',              // 见 categories
  tags: ['json', '格式化'],      // 参与首页搜索
  status: 'ready'
}
```

3. 在 `src/router/index.js` 的 `tools/:key` 路由之前补一条静态子路由，避免回落到占位页：

```js
{
  path: 'tools/json-formatter',
  name: 'tool-json-formatter',
  component: () => import('@/views/tools/JsonFormatter.vue'),
  meta: { title: 'JSON 格式化' }
}
```

新增分类只需在 `src/config/tools.js` 的 `categories` 中追加，首页筛选项与计数会自动更新。

## 样式约定

- 主题相关（可随明暗切换）的颜色使用 `_tokens.scss` 中的 CSS 自定义属性，如 `var(--el-text-color-secondary)`、`var(--mt-hero-bg)`。
- 静态值（尺寸、圆角、断点、品牌色）使用 `_variables.scss` 的 SCSS 变量，如 `$radius`、`$duration`、`$primary`。
- 组件样式统一 `<style scoped lang="scss">`，BEM 命名 + SCSS 嵌套；响应式使用 `@include mobile { ... }` / `@include tablet { ... }`。
- 变量与混入已由 `vite.config.js` 的 `additionalData` 全局注入，组件样式内无需手动 `@use`。

## 部署

```bash
npm run build
```

将 `dist/` 目录内容上传到任意静态托管（GitHub Pages、Netlify、Vercel、OSS、Nginx 等）即可。由于使用 hash 路由与相对路径，无需额外的服务端重写规则，也可部署在子目录下。

## License

MIT
