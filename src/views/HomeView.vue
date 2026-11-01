<script setup>
import { computed, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import appConfig from '@/config/app'
import { categories, tools } from '@/config/tools'
import ToolCard from '@/components/ToolCard.vue'

const keyword = ref('')
const activeCategory = ref('all')

const categoryOptions = computed(() => [
  { key: 'all', name: '全部' },
  ...categories
])

const keywordText = computed(() => keyword.value.trim().toLowerCase())

const filteredTools = computed(() =>
  tools.filter((tool) => {
    const matchCategory = activeCategory.value === 'all' || tool.category === activeCategory.value
    if (!matchCategory) return false
    if (!keywordText.value) return true
    const haystack = [tool.name, tool.desc, tool.key, ...(tool.tags || [])].join(' ').toLowerCase()
    return haystack.includes(keywordText.value)
  })
)

const readyCount = computed(() => tools.filter((tool) => tool.status === 'ready').length)

function countOf(key) {
  return key === 'all' ? tools.length : tools.filter((tool) => tool.category === key).length
}

function resetFilters() {
  keyword.value = ''
  activeCategory.value = 'all'
}
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="mt-container hero__inner">
        <h1 class="hero__title">
          {{ appConfig.name }}
          <span class="hero__title-accent">在线工具箱</span>
        </h1>
        <p class="hero__desc">{{ appConfig.description }}</p>

        <div v-if="appConfig.features.search" class="hero__search">
          <el-input
            v-model="keyword"
            size="large"
            clearable
            :prefix-icon="Search"
            placeholder="搜索工具名称、描述或关键词"
          />
        </div>

        <div class="hero__stats">
          <span>共 <b>{{ tools.length }}</b> 个工具</span>
          <i class="dot"></i>
          <span>已上线 <b>{{ readyCount }}</b> 个</span>
          <i class="dot"></i>
          <span>纯前端运行，数据不出本地</span>
        </div>
      </div>
    </section>

    <section class="mt-container body">
      <div class="chips">
        <button
          v-for="item in categoryOptions"
          :key="item.key"
          type="button"
          class="chip"
          :class="{ 'is-active': activeCategory === item.key }"
          @click="activeCategory = item.key"
        >
          {{ item.name }}
          <em>{{ countOf(item.key) }}</em>
        </button>
      </div>

      <div v-if="filteredTools.length" class="grid">
        <ToolCard v-for="tool in filteredTools" :key="tool.key" :tool="tool" />
      </div>

      <el-empty v-else description="没有找到匹配的工具，换个关键词试试">
        <el-button type="primary" plain @click="resetFilters">重置筛选</el-button>
      </el-empty>
    </section>
  </div>
</template>

<style scoped lang="scss">
.hero {
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-image: var(--mt-hero-bg);

  &__inner {
    padding-top: 56px;
    padding-bottom: 40px;
    text-align: center;

    @include mobile {
      padding-top: 36px;
      padding-bottom: 28px;
    }
  }

  &__title {
    font-size: 34px;
    font-weight: 700;
    letter-spacing: -0.5px;

    @include mobile {
      font-size: 26px;
    }
  }

  &__title-accent {
    @include gradient-text;
  }

  &__desc {
    max-width: 620px;
    margin: 12px auto 0;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }

  &__search {
    max-width: 520px;
    margin: 26px auto 0;

    :deep(.el-input__wrapper) {
      padding: 4px 16px;
      border-radius: 999px;
      box-shadow: 0 8px 24px rgba($primary, 0.12);
    }
  }

  &__stats {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 18px;
    color: var(--el-text-color-placeholder);
    font-size: 12px;

    b {
      color: var(--el-color-primary);
    }
  }
}

.dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background-color: var(--el-border-color);
}

.body {
  padding-top: 24px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background-color: var(--el-bg-color-overlay);
  color: var(--el-text-color-regular);
  font-size: 13px;
  cursor: pointer;
  transition: color $duration $ease, border-color $duration $ease, background-color $duration $ease,
    box-shadow $duration $ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    color: var(--el-color-primary);
  }

  &.is-active {
    border-color: transparent;
    background: $gradient-primary;
    box-shadow: var(--mt-shadow-chip);
    color: #fff;
  }

  em {
    font-size: 11px;
    font-style: normal;
    opacity: 0.7;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;

  @include mobile {
    grid-template-columns: 1fr;
  }
}
</style>
