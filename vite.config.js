import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  // 使用相对路径，构建产物可直接放到任意静态目录 / CDN 下运行
  base: './',
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router'],
      resolvers: [ElementPlusResolver()],
      dts: false
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: false
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        // 让所有 scss 直接使用 @use 'variables' / @use 'mixins'，无需关心相对路径
        loadPaths: [fileURLToPath(new URL('./src/assets/styles', import.meta.url))],
        // 每个 scss 文件自动注入设计变量与混入，组件样式里可直接使用
        additionalData: `@use 'variables' as *;\n@use 'mixins' as *;\n`
      }
    }
  },
  server: {
    port: 5273,
    open: false
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200
  }
})
