<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <el-result icon="warning" title="404" sub-title="页面不存在或已被移除">
      <template #extra>
        <el-button type="primary" @click="router.push({ name: 'home' })">返回首页</el-button>
        <el-button @click="router.back()">返回上一页</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 0 $container-gutter;
  background-image: var(--mt-hero-bg);
}
</style>
