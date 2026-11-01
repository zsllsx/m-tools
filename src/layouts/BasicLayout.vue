<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Moon, Sunny } from '@element-plus/icons-vue'
import appConfig from '@/config/app'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const router = useRouter()
const { isDark, toggleTheme } = useTheme()

const navs = [
  { name: 'home', label: '工具列表' },
  { name: 'about', label: '关于' }
]

const activeNav = computed(() => {
  const name = String(route.name ?? '')
  return name.startsWith('tool') ? 'home' : route.name
})
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

          <a
            v-if="appConfig.repo"
            class="icon-btn"
            :href="appConfig.repo"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub 仓库"
            aria-label="GitHub 仓库"
          >
            <svg class="icon-btn__github" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
              />
            </svg>
          </a>
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

.icon-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: $radius-sm;
  color: var(--el-text-color-regular);
  transition: color $duration $ease, background-color $duration $ease;

  &:hover {
    color: var(--el-color-primary);
    background-color: var(--el-fill-color-light);
  }

  @include focus-ring;
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
