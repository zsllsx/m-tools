<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Delete, Download, MagicStick, RefreshLeft, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/el-message.css'
import { downloadBlob, timestamp } from '@/utils/download'
import {
  MAX_PAGES,
  composeLongImage,
  measureOutput,
  pickExportablePages,
  renderDocxToPages
} from '@/utils/wordDoc'

/** Word 文档的 MIME 类型，部分浏览器会给出空 type，需兜底判断扩展名 */
const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
/** 拼接预览的最大宽度，超过后居中留白 */
const STAGE_MAX_WIDTH = 720

const fileRef = ref(null)
const stitchRef = ref(null)

const fileName = ref('')
/** 逐页渲染结果，字段见 utils/wordDoc.js */
const pages = ref([])
/** 文档实际页数，用于提示是否被 MAX_PAGES 截断 */
const totalPages = ref(0)
const processing = ref(false)
const exporting = ref(false)
const dragging = ref(false)
const progress = ref({ done: 0, total: 0 })
/** 拼接预览可用宽度，用来把页面像素换算成展示尺寸 */
const stageWidth = ref(0)
/** 拖动裁切时跟随指针的百分比提示 */
const dragTip = ref(null)

const progressPercent = computed(() => {
  const { done, total } = progress.value
  if (!total) return 0
  return Math.min(100, Math.round((done / total) * 100))
})

const exportablePages = computed(() => pickExportablePages(pages.value))
const output = computed(() => measureOutput(pages.value))
const outputText = computed(() =>
  output.value ? `${output.value.width} × ${output.value.height} px` : '—'
)
const shrinkText = computed(() => {
  const stats = output.value
  if (!stats || stats.factor >= 1) return ''
  return `原始高度 ${stats.rawHeight}px，导出时会等比缩至 ${Math.round(stats.factor * 100)}%`
})
const skippedCount = computed(() => output.value?.skipped ?? 0)

/** 所有页面共用一个缩放比例，保持不同页面之间的相对宽度 */
const maxPageWidth = computed(() =>
  pages.value.reduce((max, page) => Math.max(max, page.width), 0)
)
const displayScale = computed(() => {
  if (!maxPageWidth.value) return 0
  return (stageWidth.value || STAGE_MAX_WIDTH) / maxPageWidth.value
})

function sliceStyle(page) {
  const scale = displayScale.value
  const top = Math.round(page.cropTop * scale)
  const bottom = Math.round(page.cropBottom * scale)
  const height = Math.max(1, Math.round(page.height * scale) - top - bottom)

  return { width: `${Math.round(page.width * scale)}px`, height: `${height}px` }
}

function imageStyle(page) {
  const scale = displayScale.value

  return {
    width: `${Math.round(page.width * scale)}px`,
    height: `${Math.round(page.height * scale)}px`,
    top: `${-Math.round(page.cropTop * scale)}px`
  }
}

/** 裁切比例（相对整页高度） */
function cropPercent(page, key) {
  return Math.round((page[key] / page.height) * 100)
}

function keptPixels(page) {
  return page.height - page.cropTop - page.cropBottom
}

function isUsable(page) {
  return keptPixels(page) > 10
}

function keptText(page) {
  if (!isUsable(page)) return '裁切过度'
  return `保留 ${Math.round((keptPixels(page) / page.height) * 100)}%`
}

/** 上下裁切合计最多 96%，避免把整页裁没 */
function setCrop(page, key, percent) {
  const other = key === 'cropTop' ? page.cropBottom : page.cropTop
  const limit = Math.max(0, 96 - (other / page.height) * 100)
  const safe = Math.min(Math.max(percent, 0), limit)

  page[key] = Math.round((safe / 100) * page.height)
}

function autoTrim(page) {
  page.cropTop = page.contentTop
  page.cropBottom = Math.max(0, page.height - 1 - page.contentBottom)
}

function resetCrop(page) {
  page.cropTop = 0
  page.cropBottom = 0
}

/** 键盘微调：拖动把手获得焦点后可用方向键逐 1% 调整 */
function nudge(page, key, deltaPercent) {
  setCrop(page, key, (page[key] / page.height) * 100 + deltaPercent)
}

function autoTrimAll() {
  pages.value.forEach(autoTrim)
}

function resetAllCrop() {
  pages.value.forEach(resetCrop)
}

/** 左侧点击页码，把右侧对应的拼接片段滚动到可视区 */
function focusPage(page) {
  document.getElementById(`slice-${page.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

let dragState = null

function startDrag(event, page, key) {
  if (event.button !== undefined && event.button !== 0) return

  const scale = displayScale.value
  if (!scale) return

  event.preventDefault()
  dragState = { page, key, startY: event.clientY, startCrop: page[key], scale }
  dragTip.value = { value: cropPercent(page, key), top: event.clientY, left: event.clientX }

  event.currentTarget.setPointerCapture?.(event.pointerId)
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
  document.body.classList.add('is-cropping')
}

function onDragMove(event) {
  if (!dragState) return

  const { page, key, startY, startCrop, scale } = dragState
  const delta = (event.clientY - startY) / scale
  const next = key === 'cropTop' ? startCrop + delta : startCrop - delta

  setCrop(page, key, (next / page.height) * 100)
  dragTip.value = { value: cropPercent(page, key), top: event.clientY, left: event.clientX }
}

function endDrag() {
  if (!dragState) return

  dragState = null
  dragTip.value = null
  window.removeEventListener('pointermove', onDragMove)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
  document.body.classList.remove('is-cropping')
}

function pickFile() {
  if (processing.value) return
  fileRef.value?.click()
}

function onFileChange(event) {
  const file = event.target.files?.[0]
  // 允许重复选择同一个文件
  event.target.value = ''
  handleFile(file)
}

function onDrop(event) {
  dragging.value = false
  handleFile(event.dataTransfer?.files?.[0])
}

async function handleFile(file) {
  if (!file || processing.value) return

  if (!/\.docx$/i.test(file.name) && file.type !== DOCX_TYPE) {
    ElMessage.warning('请选择 .docx 格式的 Word 文档，旧版 .doc 需要先另存为 .docx')
    return
  }

  processing.value = true
  pages.value = []
  totalPages.value = 0
  progress.value = { done: 0, total: 0 }
  fileName.value = file.name

  try {
    const result = await renderDocxToPages(file, {
      maxPages: MAX_PAGES,
      onProgress: (state) => {
        progress.value = state
      }
    })

    pages.value = result.pages
    totalPages.value = result.total

    ElMessage.success(
      result.total > result.pages.length
        ? `已渲染前 ${result.pages.length} 页（共 ${result.total} 页）`
        : `已渲染 ${result.pages.length} 页`
    )
  } catch (error) {
    console.error(error)
    fileName.value = ''
    ElMessage.error(error?.message || '解析失败，请确认为有效的 .docx 文件')
  } finally {
    processing.value = false
  }
}

async function exportLongImage() {
  if (!pages.value.length || processing.value) return

  if (!exportablePages.value.length) {
    ElMessage.warning('所有页面都被裁切过度，请先调整裁切范围')
    return
  }

  exporting.value = true
  const loading = ElMessage({ message: '正在合成长图，请稍候…', type: 'info', duration: 0 })

  try {
    const { blob, width, height, factor, skipped } = await composeLongImage(pages.value)
    downloadBlob(blob, `word转长图-${timestamp()}.png`)
    loading.close()

    const notes = [`已导出 ${width} × ${height} 长图`]
    if (factor < 1) notes.push('已等比缩小')
    if (skipped) notes.push(`跳过 ${skipped} 页裁切过度的页面`)
    ElMessage.success(notes.join('，'))
  } catch (error) {
    loading.close()
    console.error(error)
    ElMessage.error(error?.message || '导出失败，请减少页数后重试')
  } finally {
    exporting.value = false
  }
}

function clearAll() {
  if (processing.value) return
  pages.value = []
  totalPages.value = 0
  fileName.value = ''
  progress.value = { done: 0, total: 0 }
}

let stitchObserver = null

function observeStitch() {
  stitchObserver?.disconnect()
  const el = stitchRef.value

  if (!el) {
    stageWidth.value = 0
    return
  }

  stageWidth.value = el.clientWidth
  stitchObserver = new ResizeObserver(() => {
    stageWidth.value = el.clientWidth
  })
  stitchObserver.observe(el)
}

watch(
  pages,
  async () => {
    await nextTick()
    observeStitch()
  },
  { flush: 'post' }
)

onBeforeUnmount(() => {
  stitchObserver?.disconnect()
  endDrag()
})
</script>

<template>
  <div class="docx">
    <aside class="panel">
      <section class="card">
        <header class="card__head">
          <h2 class="card__title">选择文档</h2>
          <el-tag v-if="pages.length" size="small" effect="plain" round>{{ pages.length }} 页</el-tag>
        </header>

        <div
          class="drop"
          :class="{ 'is-active': dragging, 'is-busy': processing }"
          role="button"
          tabindex="0"
          @click="pickFile"
          @keydown.enter.prevent="pickFile"
          @keydown.space.prevent="pickFile"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <el-icon class="drop__icon"><UploadFilled /></el-icon>
          <p class="drop__title">{{ fileName || '点击选择或拖入 .docx 文件' }}</p>
          <span class="drop__hint">文件只在本地浏览器中解析，不会上传服务器</span>
        </div>

        <input
          ref="fileRef"
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          hidden
          @change="onFileChange"
        />

        <div v-if="processing" class="progress">
          <el-progress :percentage="progressPercent" :stroke-width="6" :show-text="false" />
          <span class="progress__text">正在渲染 {{ progress.done }} / {{ progress.total }} 页</span>
        </div>

        <el-alert
          v-if="totalPages > pages.length"
          class="card__alert"
          type="warning"
          :closable="false"
          show-icon
          :title="`文档共 ${totalPages} 页，仅处理前 ${MAX_PAGES} 页`"
        />
      </section>

      <section class="card">
        <header class="card__head">
          <h2 class="card__title">解析页面</h2>
          <el-tag v-if="pages.length" size="small" effect="plain" round>{{ pages.length }} 页</el-tag>
        </header>

        <p v-if="!pages.length" class="card__empty">导入文档后，这里会列出每一页。</p>

        <template v-else>
          <div class="thumbs">
            <div v-for="page in pages" :key="page.id" class="thumb">
              <button type="button" class="thumb__main" @click="focusPage(page)">
                <img class="thumb__img" :src="page.preview" alt="" loading="lazy" />
                <span class="thumb__info">
                  <strong>第 {{ page.index }} 页</strong>
                  <em :class="{ 'is-warn': !isUsable(page) }">{{ keptText(page) }}</em>
                </span>
              </button>

              <span class="thumb__ops">
                <button type="button" title="按内容自动裁边" @click="autoTrim(page)">自动</button>
                <button type="button" title="恢复整页" @click="resetCrop(page)">整页</button>
              </span>
            </div>
          </div>

          <div class="actions">
            <el-button size="small" :icon="MagicStick" @click="autoTrimAll">自动裁边</el-button>
            <el-button size="small" :icon="RefreshLeft" @click="resetAllCrop">恢复整页</el-button>
            <el-button size="small" :icon="Delete" @click="clearAll">清空</el-button>
          </div>
        </template>

        <p class="card__hint">
          导入后默认保留整页；点「自动裁边」或每页的「自动」才按内容裁掉页边空白，也可以在右侧拖动每页上下边缘手动裁剪，点击左侧页码可快速定位。
        </p>
      </section>

      <section class="card">
        <header class="card__head">
          <h2 class="card__title">导出长图</h2>
          <el-tag size="small" effect="plain" round>{{ exportablePages.length }} 页</el-tag>
        </header>

        <div class="summary">
          <div class="summary__row">
            <span>输出尺寸</span>
            <strong>{{ outputText }}</strong>
          </div>
          <p v-if="shrinkText" class="summary__note">{{ shrinkText }}</p>
          <p v-else class="summary__note">所有页面自上而下拼接，白色背景。</p>
          <p v-if="skippedCount" class="summary__note is-warn">
            {{ skippedCount }} 页裁切过度，导出时会跳过
          </p>
        </div>

        <el-button
          class="export"
          type="primary"
          :icon="Download"
          :loading="exporting"
          :disabled="!output"
          @click="exportLongImage"
        >
          导出 PNG 长图
        </el-button>
      </section>
    </aside>

    <section class="preview">
      <div class="preview__bar">
        <span>拼接预览</span>
        <span class="preview__meta">
          {{ pages.length ? `${pages.length} 页 · ${outputText}` : '尚未导入文档' }}
        </span>
      </div>

      <div class="preview__scroll">
        <el-empty
          v-if="!pages.length && !processing"
          description="导入 .docx 文件后，这里会纵向拼接每一页"
        />

        <div v-else-if="processing" class="loading">
          <el-progress type="circle" :percentage="progressPercent" :width="120" />
          <p>正在渲染第 {{ progress.done }} / {{ progress.total || '?' }} 页…</p>
        </div>

        <div v-else ref="stitchRef" class="stitch">
          <div
            v-for="page in pages"
            :id="`slice-${page.id}`"
            :key="page.id"
            class="slice"
            :class="{ 'is-warn': !isUsable(page) }"
            :style="sliceStyle(page)"
          >
            <img
              class="slice__img"
              :src="page.preview"
              alt=""
              draggable="false"
              loading="lazy"
              :style="imageStyle(page)"
            />

            <span class="slice__page">第 {{ page.index }} 页</span>

            <button
              type="button"
              class="grip grip--top"
              title="向下拖动裁掉顶部"
              @pointerdown="startDrag($event, page, 'cropTop')"
              @keydown.down.prevent="nudge(page, 'cropTop', 1)"
              @keydown.up.prevent="nudge(page, 'cropTop', -1)"
            />
            <button
              type="button"
              class="grip grip--bottom"
              title="向上拖动裁掉底部"
              @pointerdown="startDrag($event, page, 'cropBottom')"
              @keydown.up.prevent="nudge(page, 'cropBottom', 1)"
              @keydown.down.prevent="nudge(page, 'cropBottom', -1)"
            />
          </div>
        </div>
      </div>
    </section>

    <div
      v-if="dragTip"
      class="drag-tip"
      :style="{ top: `${dragTip.top}px`, left: `${dragTip.left}px` }"
    >
      {{ dragTip.value }}%
    </div>
  </div>
</template>

<style scoped lang="scss">
:global(body.is-cropping) {
  cursor: ns-resize;
  user-select: none;
}

.docx {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 18px;
  max-width: 1440px;
  margin: 0 auto;
  padding: 20px 24px 32px;
  align-items: start;

  @include tablet {
    grid-template-columns: 1fr;
    padding: 16px;
  }
}

.panel {
  position: sticky;
  top: calc($header-height + 16px);
  display: flex;
  flex-direction: column;
  gap: 14px;

  @include tablet {
    position: static;
  }
}

.card {
  @include card-surface;
  padding: 16px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
  }

  &__hint {
    margin-top: 10px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.8;
  }

  &__empty {
    padding: 14px 0;
    color: var(--el-text-color-placeholder);
    font-size: 12px;
    text-align: center;
  }

  &__alert {
    margin-top: 10px;
  }
}

.drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px 16px;
  border: 1px dashed var(--el-border-color);
  border-radius: $radius-md;
  background-color: var(--el-fill-color-lighter);
  text-align: center;
  cursor: pointer;
  transition: border-color $duration $ease, background-color $duration $ease;

  &:hover,
  &:focus-visible,
  &.is-active {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    outline: none;
  }

  &.is-busy {
    cursor: progress;
  }

  &__icon {
    color: var(--el-color-primary);
    font-size: 24px;
  }

  &__title {
    color: var(--el-text-color-primary);
    font-size: 13px;
    font-weight: 500;
    word-break: break-all;
  }

  &__hint {
    color: var(--el-text-color-placeholder);
    font-size: 11px;
    line-height: 1.6;
  }
}

.progress {
  margin-top: 12px;

  &__text {
    display: block;
    margin-top: 6px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.thumbs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 268px;
  overflow-y: auto;
  padding-right: 2px;
}

.thumb {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  background-color: var(--el-fill-color-light);
  transition: border-color $duration $ease, background-color $duration $ease;

  &:hover,
  &:focus-within {
    border-color: var(--el-color-primary-light-5);
    background-color: var(--el-color-primary-light-9);
  }

  &__main {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 10px;
    min-width: 0;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;

    &:focus-visible {
      outline: none;
    }
  }

  &__ops {
    display: flex;
    flex-shrink: 0;
    gap: 4px;

    button {
      padding: 2px 6px;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 4px;
      background-color: var(--el-bg-color-overlay);
      color: var(--el-text-color-secondary);
      font-size: 11px;
      line-height: 1.6;
      cursor: pointer;
      transition: color $duration $ease, border-color $duration $ease;

      &:hover {
        border-color: var(--el-color-primary);
        color: var(--el-color-primary);
      }
    }
  }

  &__img {
    flex-shrink: 0;
    width: 40px;
    height: 54px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    background-color: #fff;
    object-fit: cover;
    object-position: top center;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    strong {
      color: var(--el-text-color-regular);
      font-size: 12px;
      font-weight: 500;
    }

    em {
      color: var(--el-text-color-placeholder);
      font-size: 11px;
      font-style: normal;

      &.is-warn {
        color: var(--el-color-danger);
      }
    }
  }
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;

  .el-button {
    margin-left: 0;
  }
}

.summary {
  padding: 10px 12px;
  border-radius: $radius-sm;
  background-color: var(--el-fill-color-light);

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--el-text-color-regular);
    font-size: 12px;

    strong {
      font-family: $font-mono;
      font-size: 13px;
    }
  }

  &__note {
    margin-top: 6px;
    color: var(--el-text-color-placeholder);
    font-size: 11px;
    line-height: 1.7;

    &.is-warn {
      color: var(--el-color-danger);
    }
  }
}

.export {
  width: 100%;
  margin-top: 12px;
}

.preview {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: $radius;
  background-color: var(--el-fill-color-light);

  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-bg-color-overlay);
    color: var(--el-text-color-regular);
    font-size: 12px;
  }

  &__meta {
    color: var(--el-text-color-placeholder);
  }

  &__scroll {
    padding: 24px 18px;
    max-height: calc(100vh - 232px);
    min-height: 380px;
    overflow: auto;

    @include tablet {
      max-height: none;
      padding: 16px 12px;
    }
  }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.stitch {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  overflow: hidden;
  background-color: #fff;
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.14);
}

.slice {
  position: relative;
  overflow: hidden;
  background-color: #fff;

  & + & {
    border-top: 1px dashed var(--el-color-primary-light-5);
  }

  &.is-warn {
    min-height: 24px;
    background-color: var(--el-color-danger-light-9);
  }

  &__img {
    position: absolute;
    left: 0;
    display: block;
    max-width: none;
    user-select: none;
    -webkit-user-drag: none;
  }

  &__page {
    position: absolute;
    top: 6px;
    left: 6px;
    z-index: 2;
    padding: 1px 7px;
    border-radius: 999px;
    background-color: rgba(0, 0, 0, 0.42);
    color: #fff;
    font-size: 11px;
    line-height: 1.6;
    pointer-events: none;
  }

}

.grip {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 3;
  height: 12px;
  max-height: 30%;
  padding: 0;
  border: 0;
  background-color: transparent;
  cursor: ns-resize;
  touch-action: none;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    width: 36px;
    height: 3px;
    border-radius: 999px;
    background-color: rgba(79, 124, 255, 0.5);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
    transform: translateX(-50%);
    transition: background-color $duration $ease, height $duration $ease;
  }

  &--top {
    top: 0;

    &::after {
      bottom: 0;
    }
  }

  &--bottom {
    bottom: 0;

    &::after {
      top: 0;
    }
  }

  &:hover::after,
  &:focus-visible::after {
    height: 4px;
    background-color: var(--el-color-primary);
  }
}

.drag-tip {
  position: fixed;
  z-index: 3000;
  padding: 2px 8px;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-family: $font-mono;
  font-size: 12px;
  line-height: 1.6;
  pointer-events: none;
  transform: translate(14px, -50%);
}
</style>
