import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Element Plus 暗色主题变量（组件样式由 unplugin 按需引入）
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/assets/styles/index.scss'

createApp(App).use(router).mount('#app')
