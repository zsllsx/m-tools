<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { CopyDocument, Delete, Download, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/el-message.css'
import { toPng } from 'html-to-image'
import WorksheetPreview from '@/components/worksheet/WorksheetPreview.vue'
import { copyText } from '@/utils/clipboard'
import { downloadDataUrl, timestamp } from '@/utils/download'
import {
  ANSWER_FONTS,
  DEFAULT_OPTIONS,
  IMAGE_EXTRACT_PROMPT,
  PAPER_HEIGHT,
  PAPER_WIDTH,
  SAMPLE_TEXT,
  parseWorksheet
} from '@/utils/worksheet'

/** 快捷录入文本 */
const input = ref(SAMPLE_TEXT)
/** 页面样式配置 */
const options = reactive({ ...DEFAULT_OPTIONS })
/** 最近一次合法结果，输入不合法时保持不变 */
const paper = reactive({ sections: [] })
const errors = ref([])
const exporting = ref(false)

/** 题目总词语数 */
const totalWords = computed(() =>
  paper.sections.reduce((total, section) => total + section.items.length, 0)
)

/** 预览缩放相关 */
const scrollRef = ref(null)
const scalerRef = ref(null)
const paperRef = ref(null)
const scale = ref(1)
const paperHeight = ref(PAPER_HEIGHT)

const stageStyle = computed(() => ({
  width: `${Math.round(PAPER_WIDTH * scale.value)}px`,
  height: `${Math.round(paperHeight.value * scale.value)}px`
}))

const scaleText = computed(() => `${Math.round(scale.value * 100)}%`)

const errorText = computed(() => {
  if (!errors.value.length) return ''

  const [first] = errors.value
  const prefix = first.line ? `第 ${first.line} 行：` : ''
  const suffix = errors.value.length > 1 ? `（共 ${errors.value.length} 处问题）` : ''

  return `${prefix}${first.message}${suffix}`
})

function parse() {
  const result = parseWorksheet(input.value)
  errors.value = result.errors

  if (result.errors.length) return

  paper.sections = result.sections
  nextTick(measurePaper)
}

let debounceTimer = 0
watch(input, () => {
  window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(parse, 180)
})

let observer
onMounted(() => {
  parse()
  updateScale()
  measurePaper()

  observer = new ResizeObserver(() => {
    updateScale()
    measurePaper()
  })
  if (scrollRef.value) observer.observe(scrollRef.value)
  if (scalerRef.value) observer.observe(scalerRef.value)
})

onBeforeUnmount(() => {
  window.clearTimeout(debounceTimer)
  window.clearTimeout(copiedTimer)
  observer?.disconnect()
})

/** 按容器宽度换算缩放比例，A4 宽度 794px */
function updateScale() {
  const el = scrollRef.value
  if (!el) return

  const available = el.clientWidth - 48
  if (available <= 0) return

  scale.value = Math.min(1, Math.max(0.2, available / PAPER_WIDTH))
}

/** 记录纸张实际高度（内容多时会超出 A4 高度） */
function measurePaper() {
  if (!scalerRef.value) return
  paperHeight.value = scalerRef.value.offsetHeight || PAPER_HEIGHT
}

async function exportImage() {
  if (!totalWords.value) {
    ElMessage.warning('还没有可导出的题目，请先在左侧录入词语')
    return
  }

  if (errors.value.length) {
    ElMessage.info('当前录入存在格式问题，将导出上一次正确的内容')
  }

  exporting.value = true
  try {
    await document.fonts?.ready

    const dataUrl = await toPng(paperRef.value, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: options.background
    })

    downloadDataUrl(dataUrl, `看拼音写词语-${timestamp()}.png`)
    ElMessage.success('图片已导出')
  } catch (error) {
    console.error(error)
    ElMessage.error('导出失败，请重试或改用 Chrome / Edge 浏览器')
  } finally {
    exporting.value = false
  }
}

function useSample() {
  input.value = SAMPLE_TEXT
}

function clearInput() {
  input.value = ''
}

/** 复制图片提取提示词 */
const promptCopied = ref(false)
let copiedTimer = 0

async function copyPrompt() {
  const copied = await copyText(IMAGE_EXTRACT_PROMPT)

  if (!copied) {
    ElMessage.error('复制失败，请手动选中提示词复制')
    return
  }

  promptCopied.value = true
  ElMessage.success('提示词已复制')

  window.clearTimeout(copiedTimer)
  copiedTimer = window.setTimeout(() => {
    promptCopied.value = false
  }, 1600)
}
</script>

<template>
  <div class="worksheet">
    <aside class="panel">
      <section class="card">
        <header class="card__head">
          <h2 class="card__title">快捷录入</h2>
          <el-tag size="small" effect="plain" round>{{ totalWords }} 个词语</el-tag>
        </header>

        <p class="card__hint">
          <code>#</code> 开头为标题，每个标题开启一段新题目；空格分隔词语或句子（不带空格的整句视为一个整体）；标点会单独占一格且不注音；需要指定拼音时在词语后加括号，声调用数字表示，如
          <code>绿色(lv4 se4)</code>；在行尾或词语之间加 <code>\n</code> 可手动换行。
        </p>

        <el-input
          v-model="input"
          type="textarea"
          :rows="12"
          resize="none"
          spellcheck="false"
          placeholder="#一、看拼音写词语。&#10;春天 柳树 桃花 燕子"
        />

        <el-alert v-if="errorText" class="card__alert" type="warning" :closable="false" show-icon>
          <template #title>{{ errorText }}</template>
          <template #default>预览已保留上一次正确的内容</template>
        </el-alert>
      </section>

      <section class="card">
        <header class="card__head">
          <h2 class="card__title">从图片提取</h2>
          <el-button text size="small" :icon="CopyDocument" @click="copyPrompt">
            {{ promptCopied ? '已复制' : '复制提示词' }}
          </el-button>
        </header>

        <p class="card__hint">
          把提示词和题目图片一起发给 AI 视觉模型，即可得到能直接粘贴到左侧的录入文本。
        </p>

        <pre class="prompt">{{ IMAGE_EXTRACT_PROMPT }}</pre>
      </section>

      <section class="card">
        <header class="card__head">
          <h2 class="card__title">样式配置</h2>
          <el-button text size="small" @click="Object.assign(options, DEFAULT_OPTIONS)">恢复默认</el-button>
        </header>

        <div class="fields">
          <div class="field">
            <span class="field__label">字号</span>
            <el-input-number v-model="options.fontSize" :min="10" :max="28" size="small" controls-position="right" />
            <span class="field__unit">px</span>
          </div>

          <div class="field">
            <span class="field__label">田字格</span>
            <el-input-number v-model="options.cellSize" :min="18" :max="60" size="small" controls-position="right" />
            <span class="field__unit">px</span>
          </div>

          <div class="field">
            <span class="field__label">每行</span>
            <el-input-number v-model="options.columns" :min="2" :max="12" size="small" controls-position="right" />
            <span class="field__unit">个</span>
          </div>

          <div class="field">
            <span class="field__label">对齐</span>
            <el-radio-group v-model="options.align" size="small">
              <el-radio-button value="left">左</el-radio-button>
              <el-radio-button value="center">中</el-radio-button>
              <el-radio-button value="right">右</el-radio-button>
            </el-radio-group>
          </div>

          <div class="field">
            <span class="field__label">字体颜色</span>
            <el-color-picker v-model="options.color" size="small" />
          </div>

          <div class="field">
            <span class="field__label">背景颜色</span>
            <el-color-picker v-model="options.background" size="small" />
          </div>

          <div class="field">
            <span class="field__label">显示答案</span>
            <el-switch v-model="options.showAnswer" size="small" />
          </div>

          <div class="field">
            <span class="field__label">答案字体</span>
            <el-select v-model="options.answerFont" size="small" :disabled="!options.showAnswer">
              <el-option
                v-for="font in ANSWER_FONTS"
                :key="font.key"
                :label="font.name"
                :value="font.key"
                :style="{ fontFamily: font.family }"
              />
            </el-select>
          </div>
        </div>
      </section>

      <section class="actions">
        <el-button type="primary" :icon="Download" :loading="exporting" @click="exportImage">导出图片</el-button>
        <el-button :icon="RefreshLeft" @click="useSample">载入示例</el-button>
        <el-button :icon="Delete" @click="clearInput">清空</el-button>
      </section>
    </aside>

    <section class="preview">
      <div class="preview__bar">
        <span>实时预览</span>
        <span class="preview__meta">A4 · {{ scaleText }}</span>
      </div>

      <div ref="scrollRef" class="preview__scroll">
        <el-empty v-if="!totalWords" description="在左侧录入词语，这里会实时生成练习卷" />

        <div v-else class="preview__stage" :style="stageStyle">
          <div ref="scalerRef" class="preview__scaler" :style="{ transform: `scale(${scale})` }">
            <div ref="paperRef">
              <WorksheetPreview :sections="paper.sections" :options="options" />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.worksheet {
  display: grid;
  grid-template-columns: 372px minmax(0, 1fr);
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
  max-height: calc(100vh - #{$header-height} - 32px);
  overflow-y: auto;
  // 滚动条贴边，避免内容被挤压
  padding-right: 2px;

  @include tablet {
    position: static;
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}

.card {
  @include card-surface;
  padding: 16px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
  }

  &__hint {
    margin-bottom: 10px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.8;

    code {
      padding: 1px 4px;
      border-radius: 4px;
      background-color: var(--el-fill-color-light);
      color: var(--el-color-primary);
      font-family: $font-mono;
      font-size: 11px;
    }
  }

  &__alert {
    margin-top: 10px;
  }
}

.prompt {
  max-height: 144px;
  margin: 0;
  padding: 10px 12px;
  overflow: auto;
  border-radius: $radius-sm;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-family: $font-mono;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 10px;
}

.field {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;

  &__label {
    flex-shrink: 0;
    width: 52px;
    color: var(--el-text-color-regular);
    font-size: 12px;
    white-space: nowrap;
  }

  &__unit {
    color: var(--el-text-color-placeholder);
    font-size: 11px;
  }

  :deep(.el-input-number) {
    width: 80px;
  }

  :deep(.el-select) {
    width: 100px;
  }

  :deep(.el-radio-group) {
    flex-wrap: nowrap;
  }
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .el-button {
    margin-left: 0;
  }
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
    padding: 24px;
    max-height: calc(100vh - 232px);
    min-height: 380px;
    overflow: auto;
  }

  &__stage {
    position: relative;
    overflow: hidden;
    margin: 0 auto;
    border-radius: 2px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16);
  }

  &__scaler {
    width: 794px;
    transform-origin: top left;
  }

  @include tablet {
    &__scroll {
      max-height: none;
      padding: 16px;
    }
  }
}
</style>
