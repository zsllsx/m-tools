<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getCategoryName, getToolByKey } from '@/config/tools'

const route = useRoute()

const tool = computed(() => getToolByKey(String(route.params.key)))
</script>

<template>
  <div class="mt-container tool-page">
    <router-link :to="{ name: 'home' }" class="back">
      <el-icon :size="14"><component :is="ArrowLeft" /></el-icon>
      返回工具列表
    </router-link>

    <template v-if="tool">
      <header class="head">
        <span class="head__icon">
          <el-icon :size="22"><component :is="tool.icon" /></el-icon>
        </span>
        <div class="head__main">
          <h2 class="head__title">
            {{ tool.name }}
            <el-tag size="small" round effect="light" :type="tool.status === 'ready' ? 'success' : 'info'">
              {{ tool.status === 'ready' ? '可用' : '开发中' }}
            </el-tag>
          </h2>
          <p class="head__desc">{{ tool.desc }}</p>
          <div class="head__meta">
            <span>分类：{{ getCategoryName(tool.category) }}</span>
            <span>标识：{{ tool.key }}</span>
          </div>
        </div>
      </header>

      <section class="panel">
        <el-empty description="该工具正在开发中，敬请期待">
          <el-button type="primary" plain @click="$router.push({ name: 'home' })">先去看看其他工具</el-button>
        </el-empty>
      </section>

      <div v-if="tool.tags?.length" class="tags">
        <span class="tags__label">关键词</span>
        <el-tag v-for="tag in tool.tags" :key="tag" size="small" effect="plain" round>{{ tag }}</el-tag>
      </div>
    </template>

    <el-result v-else icon="warning" title="工具不存在" sub-title="请检查地址是否正确，或返回首页重新选择">
      <template #extra>
        <el-button type="primary" @click="$router.push({ name: 'home' })">返回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped lang="scss">
.tool-page {
  padding-top: 28px;
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 18px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  transition: color $duration $ease;

  &:hover {
    color: var(--el-color-primary);
  }
}

.head {
  @include card-surface;
  display: flex;
  gap: 16px;
  padding: 22px;

  @include mobile {
    padding: 18px;
  }

  &__icon {
    @include icon-tile(46px, 13px);
    flex-shrink: 0;
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 600;
  }

  &__desc {
    margin-top: 6px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 18px;
    margin-top: 10px;
    color: var(--el-text-color-placeholder);
    font-size: 12px;
  }
}

.panel {
  margin-top: 16px;
  padding: 12px;
  border: 1px dashed var(--el-border-color);
  border-radius: $radius;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 18px;

  &__label {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
  }
}
</style>
