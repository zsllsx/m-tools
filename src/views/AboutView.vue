<script setup>
import appConfig from '@/config/app'
import { categories, tools } from '@/config/tools'

const features = [
  { title: '纯前端运行', desc: '所有计算都在浏览器内完成，不经过任何服务器。' },
  { title: '无需登录', desc: '打开即用，不采集账号信息，也没有使用次数限制。' },
  { title: '隐私友好', desc: '输入的内容只留在当前页面，刷新即清空。' },
  { title: '持续补充', desc: '工具按分类收纳，后续会持续加入新的实用小工具。' }
]
</script>

<template>
  <div class="mt-container about">
    <header class="head">
      <h2>{{ appConfig.name }}</h2>
      <p>{{ appConfig.description }}</p>
      <div class="head__meta">
        <el-tag size="small" round effect="plain">版本 v{{ appConfig.version }}</el-tag>
        <el-tag size="small" round effect="plain">{{ tools.length }} 个工具</el-tag>
        <el-tag size="small" round effect="plain">{{ categories.length }} 个分类</el-tag>
      </div>
    </header>

    <section class="features">
      <div v-for="item in features" :key="item.title" class="feature">
        <h3>{{ item.title }}</h3>
        <p>{{ item.desc }}</p>
      </div>
    </section>

    <section class="stack">
      <h3>技术栈</h3>
      <p>Vue 3 · Vue Router · Element Plus · Vite · SCSS，构建产物为纯静态文件，可直接部署到任意静态托管。</p>
    </section>
  </div>
</template>

<style scoped lang="scss">
.about {
  padding-top: 32px;
}

.head {
  h2 {
    font-size: 24px;
    font-weight: 700;
  }

  p {
    max-width: 640px;
    margin-top: 8px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  margin-top: 26px;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.feature {
  @include card-surface;
  padding: 18px;

  h3 {
    color: var(--el-color-primary);
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin-top: 6px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}

.stack {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--el-border-color-lighter);

  h3 {
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin-top: 6px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}
</style>
