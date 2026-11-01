import { toPinyinArray, toneNumberToMark } from './pinyin'

/** A4 纸张尺寸（96dpi） */
export const PAPER_WIDTH = 794
export const PAPER_HEIGHT = 1123

const HANZI_PATTERN = /[\u4e00-\u9fa5]/
/** 允许出现在句子中的标点（含全角、半角） */
const PUNCT_PATTERN = /[,.;:?!"'()[\]{}<>~\-_/\\|，。、；：？！“”‘’（）《》〈〉【】〔〕…—～·]/
/** 数字直接占格显示，不需要拼音 */
const DIGIT_PATTERN = /[0-9]/
const SYLLABLE_PATTERN = /^[a-zA-ZüÜ:]+[0-5]?$/
const SPACE_PATTERN = /[\s\u3000]/
/** 手动换行标记：\n */
const BREAK_PATTERN = /\\[nN]/
/** 词语末尾的括号拼音注释，允许注释后还有标点 */
const ANNOTATION_PATTERN = /^(.*?)[（(]\s*([a-zA-ZüÜ:0-9\s]+)\s*[)）]([^()（）]*)$/

/** 拼音字体：Andika 为识字字体，a / g 为单层写法，且覆盖全部拼音声调字符 */
export const PINYIN_FONT = "'Andika', 'Kaiti SC', KaiTi, 'Times New Roman', serif"

/** 答案（汉字）可选字体 */
export const ANSWER_FONTS = [
  { key: 'kai', name: '楷体', family: "'Kaiti SC', KaiTi, STKaiti, 'KaiTi_GB2312', 'Songti SC', serif" },
  { key: 'song', name: '宋体', family: "'Songti SC', SimSun, NSimSun, STSong, serif" },
  { key: 'hei', name: '黑体', family: "'PingFang SC', 'Heiti SC', SimHei, 'Microsoft YaHei', sans-serif" }
]

export function getAnswerFontFamily(key) {
  return ANSWER_FONTS.find((item) => item.key === key)?.family ?? ANSWER_FONTS[0].family
}

/** 试卷样式默认值，左侧配置面板会直接修改这些字段 */
export const DEFAULT_OPTIONS = {
  fontSize: 14,
  cellSize: 46,
  color: '#333333',
  background: '#ffffff',
  align: 'left',
  columns: 6,
  rowGap: 28,
  columnGap: 12,
  cellGap: 2,
  padding: 40,
  showAnswer: false,
  answerFont: 'kai'
}

/** 图片转录入格式的提示词，配合视觉模型使用 */
export const IMAGE_EXTRACT_PROMPT = `你是小学语文题目录入助手。请把图片中的内容整理成下面的纯文本格式，直接输出文本，不要解释、不要使用代码块。

规则：
1. 每个大题标题单独一行，以 # 开头，保留原有序号，如：#一、看拼音写词语。
2. 标题下按原图的行输出内容，同一行的词语之间用 1 个半角空格分隔；句子整句输出，不要拆字。
3. 需要固定换行位置时，在该行末尾加 \\n（反斜杠加 n），如：春天 柳树 桃花 \\n
4. 保留句子中的标点（，。？！等），标点会单独占用田字格。
5. 去掉题号、页眉页脚、田字格与装饰线。
6. 图片标有拼音时，在词语后用半角括号补充：词语(ci2 yu3)，音节用空格分隔、数字表示声调；图片只有拼音没有汉字时，按拼音推断词语并同样附带拼音。
7. 无法辨认的汉字用「□」代替，不要猜测。

输出示例：
#一、看拼音写词语。
春天 柳树 桃花 燕子 \\n
绿色(lv4 se4) 故乡 朋友 故事
#二、读句子，写词语。
永远都像初次见你那样，使我心荡漾。`

/** 快捷录入示例 */
export const SAMPLE_TEXT = `#一、看拼音写词语。
春天 柳树 桃花 燕子 小溪 蓝天 白云 阳光
早晨 教室 同学 老师 黑板 铅笔 作业 快乐
绿色(lv4 se4) 故乡 朋友 故事 田野 农民 稻谷 丰收
#二、读拼音，写词语。
拔苗助长 守株待兔 \\n 亡羊补牢 井底之蛙
#三、读句子，写词语。
永远都像初次见你那样，使我心荡漾。`

/** 按空格拆分词语，括号内的空格（自定义拼音）不拆分 */
function splitTokens(line) {
  const tokens = []
  let buffer = ''
  let depth = 0

  for (const char of line) {
    if (char === '(' || char === '（') depth += 1
    if (char === ')' || char === '）') depth = Math.max(0, depth - 1)

    if (depth === 0 && SPACE_PATTERN.test(char)) {
      if (buffer) {
        tokens.push(buffer)
        buffer = ''
      }
      continue
    }

    buffer += char
  }

  if (buffer) tokens.push(buffer)

  return tokens
}

/** 拆出词语末尾的括号拼音注释 */
function splitAnnotation(token) {
  const matched = token.match(ANNOTATION_PATTERN)
  if (!matched) return { body: token, syllables: [] }

  return {
    body: `${matched[1]}${matched[3]}`,
    syllables: matched[2].split(SPACE_PATTERN).filter(Boolean)
  }
}

/**
 * 把一段文字拆成田字格单元：
 * - 汉字：占格 + 拼音（未指定时自动注音）
 * - 标点/数字：占格、显示字符，但没有拼音
 * 返回 null 表示包含不支持的字符
 */
function buildGlyphs(body, syllables, lineNumber, errors) {
  const glyphs = []
  const hanzi = []

  for (const char of body) {
    if (HANZI_PATTERN.test(char)) {
      glyphs.push({ char, pinyin: '', hanzi: true })
      hanzi.push(char)
      continue
    }

    if (PUNCT_PATTERN.test(char) || DIGIT_PATTERN.test(char)) {
      glyphs.push({ char, pinyin: null, hanzi: false })
      continue
    }

    errors.push({
      line: lineNumber,
      message: `「${body}」中包含不支持的字符「${char}」，只支持汉字、常用标点和数字`
    })
    return null
  }

  if (!hanzi.length) {
    errors.push({
      line: lineNumber,
      message: `「${body}」中没有汉字，请补充词语内容`
    })
    return null
  }

  if (syllables.length) {
    if (syllables.length !== hanzi.length) {
      errors.push({
        line: lineNumber,
        message: `「${body}」的拼音有 ${syllables.length} 个音节，与 ${hanzi.length} 个汉字数量不一致`
      })
      return null
    }

    const invalid = syllables.find((syllable) => !SYLLABLE_PATTERN.test(syllable))
    if (invalid) {
      errors.push({
        line: lineNumber,
        message: `「${body}」的拼音「${invalid}」格式不正确：应为字母加 0-5 的声调数字，如 pin1 yin2`
      })
      return null
    }

    let index = 0
    glyphs.forEach((glyph) => {
      if (!glyph.hanzi) return
      glyph.pinyin = toneNumberToMark(syllables[index]) ?? syllables[index]
      index += 1
    })

    return glyphs
  }

  // 未指定拼音时按整段注音，多音字识别更准确
  const pinyinList = toPinyinArray(hanzi.join(''))
  let index = 0
  glyphs.forEach((glyph) => {
    if (!glyph.hanzi) return
    glyph.pinyin = pinyinList[index] ?? ''
    index += 1
  })

  return glyphs
}

/**
 * 解析快捷录入文本
 *
 * 规则：
 * - `#` 开头为标题，每个标题开启一段新的题目，可以写多个
 * - 其余每行按空格拆分：没有空格的整句视为一个整体
 * - 汉字后可跟括号自定义拼音，音节用空格分隔、数字表示声调，如 `词语(ci2 yu3)`
 * - 标点与数字会单独占一个田字格，但没有拼音
 *
 * 返回值中的 errors 为空数组时，sections 才是合法结果
 */
export function parseWorksheet(text) {
  const lines = String(text ?? '').split(/\r?\n/)
  const sections = []
  const errors = []
  let current = null
  let itemCount = 0

  const ensureSection = () => {
    if (!current) {
      current = { id: sections.length + 1, title: '', items: [] }
      sections.push(current)
    }
    return current
  }

  lines.forEach((raw, index) => {
    const lineNumber = index + 1
    const line = raw.trim()
    if (!line) return

    if (line.startsWith('#')) {
      const value = line.replace(/^#+/, '').trim()
      if (!value) {
        errors.push({
          line: lineNumber,
          message: '标题内容为空，可写成「#一、看拼音写词语。」的形式'
        })
        return
      }

      current = { id: sections.length + 1, title: value, items: [] }
      sections.push(current)
      return
    }

    const section = ensureSection()

    splitTokens(line).forEach((token) => {
      // \n 为手动换行标记，可以单独占一个词，也可以贴在词语末尾
      const segments = token.split(BREAK_PATTERN)

      segments.forEach((segment, index) => {
        const breakAfter = index < segments.length - 1

        if (!segment) {
          if (!breakAfter) return
          const previous = section.items[section.items.length - 1]
          if (previous) previous.breakAfter = true
          return
        }

        const { body, syllables } = splitAnnotation(segment)
        const glyphs = buildGlyphs(body, syllables, lineNumber, errors)
        if (!glyphs) return

        itemCount += 1

        section.items.push({
          id: `${lineNumber}-${itemCount}`,
          word: body,
          glyphs,
          breakAfter
        })
      })
    })
  })

  const filled = sections.filter((section) => section.title || section.items.length)

  if (!itemCount && !errors.length) {
    errors.push({
      line: 0,
      message: '还没有识别到词语，按「春天 柳树 桃花」的方式录入，词与词之间用空格分隔'
    })
  }

  filled.forEach((section, index) => {
    section.id = index + 1
  })

  return { sections: filled, errors }
}
