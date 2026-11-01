import { ref, watch } from 'vue'

const STORAGE_KEY = 'm-tools:theme'
const isDark = ref(false)
let initialized = false

function apply(dark) {
  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
}

/**
 * 浅色 / 深色主题切换，状态与 localStorage 同步。
 * 首次访问跟随系统偏好。
 */
export function useTheme() {
  if (!initialized) {
    initialized = true
    const saved = localStorage.getItem(STORAGE_KEY)
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    apply(saved ? saved === 'dark' : prefersDark)
    watch(isDark, (dark) => localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light'))
  }

  const toggleTheme = () => apply(!isDark.value)

  return { isDark, toggleTheme }
}
