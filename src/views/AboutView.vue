<script setup>
import appConfig from '@/config/app'
import { categories, visibleTools } from '@/config/tools'

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
        <el-tag size="small" round effect="plain">{{ visibleTools.length }} 个工具</el-tag>
        <el-tag size="small" round effect="plain">{{ categories.length }} 个分类</el-tag>
      </div>
    </header>

    <section class="info-grid">
      <div class="info">
        <h3 class="info__title">背景说明</h3>
        <p class="info__lead">{{ appConfig.about.background }}</p>
        <p class="info__note">为日常备课与课堂练习整理而做，工具持续补充中。</p>
      </div>

      <div class="info">
        <h3 class="info__title">开发者信息</h3>
        <div class="author">
          <el-avatar :size="56" :src="appConfig.author.avatar" fit="cover" class="author__avatar" />
          <div class="author__main">
            <p class="author__name">{{ appConfig.author.name }}</p>
            <p class="author__item">QQ：{{ appConfig.author.qq }}</p>
            <p class="author__item">
              邮箱：
              <a class="link" :href="`mailto:${appConfig.author.email}`">{{ appConfig.author.email }}</a>
            </p>
          </div>
        </div>
      </div>
    </section>

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

    <section class="contact">
      <h3>反馈与建议</h3>
      <p>
        如有新的工具需求或改进建议，欢迎联系：
        <a class="link" :href="`mailto:${appConfig.author.email}`">{{ appConfig.author.email }}</a>
        <span class="contact__divider">·</span>
        QQ {{ appConfig.author.qq }}
      </p>
    </section>

    <section v-if="appConfig.repo" class="stack">
      <h3>开源</h3>
      <p>
        源码托管在
        <a class="link" :href="appConfig.repo" target="_blank" rel="noopener noreferrer">GitHub</a>
        ，欢迎提交 issue 或 PR。
      </p>
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

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 24px;

  @include tablet {
    grid-template-columns: 1fr;
  }
}

.info {
  @include card-surface;
  padding: 18px;

  &__title {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.4px;
  }

  &__lead {
    margin-top: 8px;
    color: var(--el-color-primary);
    font-size: 16px;
    font-weight: 600;
  }

  &__note {
    margin-top: 6px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}

.author {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;

  &__avatar {
    flex-shrink: 0;
    border: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-fill-color-light);
  }

  &__main {
    min-width: 0;
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
  }

  &__item {
    margin-top: 2px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
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

.link {
  color: var(--el-color-primary);
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }

  @include focus-ring;
}

.contact {
  margin-top: 22px;
  padding: 16px 18px;
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: $radius;
  background-color: var(--el-color-primary-light-9);

  h3 {
    color: var(--el-color-primary);
    font-size: 13px;
    font-weight: 600;
  }

  p {
    margin-top: 6px;
    color: var(--el-text-color-regular);
    font-size: 13px;
  }

  &__divider {
    margin: 0 6px;
    color: var(--el-text-color-placeholder);
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
