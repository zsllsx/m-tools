<script setup>
import { computed } from 'vue'
// 拼音识字字体：a / g 为单层写法，声调字符覆盖完整
import '@fontsource/andika/400.css'
import { PAPER_HEIGHT, PAPER_WIDTH, PINYIN_FONT, getAnswerFontFamily } from '@/utils/worksheet'

const props = defineProps({
  sections: {
    type: Array,
    default: () => []
  },
  options: {
    type: Object,
    required: true
  }
})

/** 版心宽度（页面宽度去掉左右内边距） */
const contentWidth = computed(() => PAPER_WIDTH - props.options.padding * 2)

/** 单列宽度 */
const columnWidth = computed(() => {
  const { columns, columnGap } = props.options
  const gaps = Math.max(0, columns - 1) * columnGap
  return Math.max(1, (contentWidth.value - gaps) / columns)
})

/** 一行最多能放多少个田字格 */
const lineCapacity = computed(() => {
  const { cellSize, cellGap } = props.options
  return Math.max(1, Math.floor((contentWidth.value + cellGap) / (cellSize + cellGap)))
})

const paperStyle = computed(() => ({
  width: `${PAPER_WIDTH}px`,
  minHeight: `${PAPER_HEIGHT}px`,
  padding: `${props.options.padding}px`,
  backgroundColor: props.options.background,
  color: props.options.color
}))

const titleStyle = computed(() => ({
  fontSize: `${Math.round(props.options.fontSize * 1.35)}px`,
  fontFamily: getAnswerFontFamily(props.options.answerFont),
  textAlign: props.options.align,
  marginBottom: `${Math.round(props.options.fontSize * 1.1)}px`
}))

const alignFlex = computed(() =>
  props.options.align === 'center' ? 'center' : props.options.align === 'right' ? 'flex-end' : 'flex-start'
)

const itemStyle = computed(() => ({ justifyContent: alignFlex.value }))

const pinyinRowStyle = computed(() => ({
  display: 'flex',
  gap: `${props.options.cellGap}px`,
  fontFamily: PINYIN_FONT,
  fontSize: `${props.options.fontSize}px`,
  lineHeight: 1.25
}))

const syllableStyle = computed(() => ({
  flex: 'none',
  width: `${props.options.cellSize}px`,
  textAlign: 'center',
  whiteSpace: 'nowrap'
}))

const cellsStyle = computed(() => ({
  display: 'flex',
  gap: `${props.options.cellGap}px`,
  marginTop: `${Math.max(2, Math.round(props.options.fontSize * 0.3))}px`
}))

const cellStyle = computed(() => ({
  width: `${props.options.cellSize}px`,
  height: `${props.options.cellSize}px`
}))

const charStyle = computed(() => ({
  fontFamily: getAnswerFontFamily(props.options.answerFont),
  fontSize: `${Math.round(props.options.cellSize * 0.62)}px`,
  lineHeight: 1
}))

/** 指定格子数时的实际宽度 */
function widthOf(count) {
  const { cellSize, cellGap } = props.options
  return count * cellSize + (count - 1) * cellGap
}

/** 该宽度需要占用多少列 */
function spanOf(count) {
  const { columns, columnGap } = props.options
  const span = Math.ceil((widthOf(count) + columnGap) / (columnWidth.value + columnGap))
  return Math.max(1, Math.min(columns, span))
}

/** 占位槽宽度，与网格列一一对应，保证各行左右对齐 */
function slotOf(span) {
  const { columnGap } = props.options
  return span * columnWidth.value + (span - 1) * columnGap
}

/** 句子过长时按行拆分，保证不会超出页面宽度 */
function splitLines(glyphs) {
  const capacity = lineCapacity.value
  if (glyphs.length <= capacity) return [glyphs]

  const lines = []
  for (let index = 0; index < glyphs.length; index += capacity) {
    lines.push(glyphs.slice(index, index + capacity))
  }
  return lines
}

/** 按当前配置把题目排成若干行，遇到 breakAfter 或排满时换行 */
function groupRows(items) {
  const columns = props.options.columns
  const rows = []
  let current = []
  let used = 0

  const flush = () => {
    if (!current.length) return
    rows.push(current)
    current = []
    used = 0
  }

  items.forEach((item) => {
    if (item.span >= columns) {
      flush()
      rows.push([item])
      return
    }

    if (used + item.span > columns) flush()

    current.push(item)
    used += item.span

    if (item.breakAfter || used >= columns) flush()
  })

  flush()

  return rows
}

const renderedSections = computed(() =>
  props.sections.map((section) => {
    const items = section.items.map((item) => {
      const chunks = splitLines(item.glyphs)
      const span = chunks.length > 1 ? props.options.columns : spanOf(item.glyphs.length)
      const lines = chunks.map((glyphs, index) => ({
        key: `${item.id}-${index}`,
        glyphs,
        width: widthOf(glyphs.length),
        marginTop: index === 0 ? 0 : Math.round(props.options.rowGap * 0.5)
      }))

      return {
        id: item.id,
        breakAfter: Boolean(item.breakAfter),
        span,
        slot: slotOf(span),
        width: Math.max(...lines.map((line) => line.width)),
        lines
      }
    })

    return {
      id: section.id,
      title: section.title,
      rows: groupRows(items)
    }
  })
)

const sectionStyles = computed(() =>
  renderedSections.value.map((section, index) => {
    const isLast = index === renderedSections.value.length - 1
    return { marginBottom: isLast ? '0px' : `${Math.round(props.options.rowGap * 0.8)}px` }
  })
)

const rowStyle = (index) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: `${props.options.columnGap}px`,
  marginTop: index === 0 ? '0px' : `${props.options.rowGap}px`
})

const lineStyle = (line) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: alignFlex.value,
  marginTop: `${line.marginTop}px`
})

/** 标点与数字始终显示，汉字按「显示答案」开关决定 */
function shouldShowChar(glyph) {
  return !glyph.hanzi || props.options.showAnswer
}
</script>

<template>
  <div class="paper" :style="paperStyle">
    <section
      v-for="(section, sectionIndex) in renderedSections"
      :key="section.id"
      :style="sectionStyles[sectionIndex]"
    >
      <h1 v-if="section.title" class="paper__title" :style="titleStyle">{{ section.title }}</h1>

      <div v-if="section.rows.length" class="paper__rows">
        <div v-for="(row, rowIndex) in section.rows" :key="rowIndex" :style="rowStyle(rowIndex)">
          <div v-for="item in row" :key="item.id" class="item" :style="[itemStyle, { width: `${item.slot}px` }]">
            <div class="item__body" :style="{ width: `${item.width}px` }">
              <div v-for="line in item.lines" :key="line.key" class="item__line" :style="lineStyle(line)">
                <div class="item__pinyin" :style="pinyinRowStyle">
                  <span v-for="(glyph, index) in line.glyphs" :key="index" :style="syllableStyle">
                    {{ glyph.pinyin || '' }}
                  </span>
                </div>

                <div class="item__cells" :style="cellsStyle">
                  <span v-for="(glyph, index) in line.glyphs" :key="index" class="cell" :style="cellStyle">
                    <i class="cell__line cell__line--h"></i>
                    <i class="cell__line cell__line--v"></i>
                    <span v-if="shouldShowChar(glyph)" class="cell__char" :style="charStyle">{{ glyph.char }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.paper {
  box-sizing: border-box;
  font-family: 'Kaiti SC', KaiTi, 'Songti SC', SimSun, serif;
  line-height: 1.4;
}

.paper__title {
  font-weight: 700;
  letter-spacing: 0.5px;
}

.item {
  display: flex;
  flex-shrink: 0;
  min-width: 0;
}

.item__body {
  flex: none;
}

.item__pinyin {
  overflow: visible;
}

.cell {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid #c2c2c2;
  background-color: transparent;
}

.cell__line {
  position: absolute;
}

.cell__line--h {
  top: 50%;
  right: 5%;
  left: 5%;
  border-top: 1px dashed #cdcdcd;
}

.cell__line--v {
  top: 5%;
  bottom: 5%;
  left: 50%;
  border-left: 1px dashed #cdcdcd;
}

.cell__char {
  position: relative;
  z-index: 1;
}
</style>
