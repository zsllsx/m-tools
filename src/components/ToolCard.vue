<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
import { getCategoryName } from '@/config/tools'

const props = defineProps({
  tool: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const statusText = computed(() => (props.tool.status === 'ready' ? '可用' : '开发中'))
const statusType = computed(() => (props.tool.status === 'ready' ? 'success' : 'info'))

function openTool() {
  router.push({ name: 'tool', params: { key: props.tool.key } })
}
</script>

<template>
  <article
    class="tool-card"
    role="button"
    tabindex="0"
    @click="openTool"
    @keydown.enter.prevent="openTool"
    @keydown.space.prevent="openTool"
  >
    <div class="tool-card__head">
      <span class="tool-card__icon">
        <el-icon :size="20"><component :is="tool.icon" /></el-icon>
      </span>
      <el-tag :type="statusType" size="small" effect="light" round>{{ statusText }}</el-tag>
    </div>

    <h3 class="tool-card__title">{{ tool.name }}</h3>
    <p class="tool-card__desc">{{ tool.desc }}</p>

    <div class="tool-card__foot">
      <span class="tool-card__category">{{ getCategoryName(tool.category) }}</span>
      <el-icon class="tool-card__arrow" :size="14"><component :is="ArrowRight" /></el-icon>
    </div>
  </article>
</template>

<style scoped lang="scss">
.tool-card {
  @include card-surface;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  outline: none;
  cursor: pointer;
  transition: transform $duration $ease, box-shadow $duration $ease, border-color $duration $ease;

  &:hover,
  &:focus-visible {
    border-color: var(--el-color-primary-light-5);
    box-shadow: var(--mt-shadow-card);
    transform: translateY(-3px);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__icon {
    @include icon-tile(38px);
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  &__desc {
    flex: 1;
    color: var(--el-text-color-secondary);
    font-size: 13px;

    @include ellipsis(2);
  }

  &__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 8px;
    border-top: 1px dashed var(--el-border-color-lighter);
    color: var(--el-text-color-placeholder);
    font-size: 12px;
  }

  &__arrow {
    color: var(--el-color-primary);
    opacity: 0;
    transform: translateX(-4px);
    transition: opacity $duration $ease, transform $duration $ease;
  }

  &:hover &__arrow,
  &:focus-visible &__arrow {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
