<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Moon, Sunny } from '@element-plus/icons-vue'
import appConfig from '@/config/app'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const router = useRouter()
const { isDark, toggleTheme } = useTheme()

const navs = [
  { name: 'home', label: '工具列表' },
  { name: 'about', label: '关于' }
]

const activeNav = computed(() => (route.name === 'tool' ? 'home' : route.name))
</script>

<template>
  <div class="layout">
    <header class="header">
      <div class="mt-container header__inner">
        <router-link :to="{ name: 'home' }" class="brand">
          <span class="brand__logo">M</span>
          <span class="brand__text">
            <strong>{{ appConfig.name }}</strong>
            <em>{{ appConfig.version }}</em>
          </span>
        </router-link>

        <nav class="nav">
          <router-link
            v-for="item in navs"
            :key="item.name"
            :to="{ name: item.name }"
            class="nav__item"
            :class="{ 'is-active': activeNav === item.name }"
          >
            {{ item.label }}
          </router-link>
        </nav>

        <div class="actions">
          <el-button
            v-if="appConfig.features.themeSwitch"
            circle
            text
            :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
            @click="toggleTheme"
          >
            <el-icon :size="18">
              <component :is="isDark ? Sunny : Moon" />
            </el-icon>
          </el-button>
        </div>
      </div>
    </header>

    <main class="main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="footer">
      <div class="mt-container footer__inner">
        <span>{{ appConfig.footer.text }}</span>
        <span class="footer__meta">v{{ appConfig.version }} · 无需登录 · 数据不出本地</span>
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.header {
  position: sticky;
  top: 0;
  z-index: 20;
  height: $header-height;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--mt-header-bg);
  backdrop-filter: blur(12px) saturate(160%);

  &__inner {
    display: flex;
    align-items: center;
    gap: 24px;
    height: 100%;

    @include mobile {
      gap: 12px;
    }
  }
}

.brand {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;

  &__logo {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: $radius-md;
    background: $gradient-primary;
    box-shadow: var(--mt-shadow-brand);
    color: #fff;
    font-size: 16px;
    font-weight: 700;
  }

  &__text {
    display: flex;
    align-items: baseline;
    gap: 6px;

    strong {
      font-size: 16px;
      letter-spacing: 0.2px;
    }

    em {
      font-size: 11px;
      font-style: normal;
      color: var(--el-text-color-placeholder);

      @include mobile {
        display: none;
      }
    }
  }
}

.nav {
  display: flex;
  gap: 4px;
  overflow-x: auto;

  &__item {
    padding: 6px 12px;
    border-radius: $radius-sm;
    color: var(--el-text-color-regular);
    font-size: 14px;
    white-space: nowrap;
    transition: color $duration $ease, background-color $duration $ease;

    &:hover {
      color: var(--el-color-primary);
      background-color: var(--el-fill-color-light);
    }

    &.is-active {
      color: var(--el-color-primary);
      font-weight: 600;
      background-color: var(--el-color-primary-light-9);
    }
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.main {
  flex: 1;
  padding-bottom: 48px;
}

.footer {
  padding: 18px 0;
  border-top: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 12px;

  &__inner {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px 16px;
  }

  &__meta {
    color: var(--el-text-color-placeholder);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s $ease, transform 0.18s $ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-leave-to {
  opacity: 0;
}
</style>
