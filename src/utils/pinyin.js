import { pinyin } from 'pinyin-pro'

/** 1-4 声的元音对照表 */
const TONE_VOWELS = {
  a: ['ā', 'á', 'ǎ', 'à'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ']
}

const SYLLABLE_PATTERN = /^([a-zA-ZüÜ:]+)([0-5])?$/

/** 定位需要标调的元音：a、e 优先，ou 标在 o 上，其余标在最后一个元音 */
function findToneIndex(syllable) {
  if (syllable.includes('a')) return syllable.indexOf('a')
  if (syllable.includes('e')) return syllable.indexOf('e')

  const ouIndex = syllable.indexOf('ou')
  if (ouIndex > -1) return ouIndex

  for (let i = syllable.length - 1; i >= 0; i -= 1) {
    if ('aeiouü'.includes(syllable[i])) return i
  }

  return -1
}

/**
 * 数字声调转声调符号：lv4 → lǜ、pin1 → pīn、de5 → de
 * 格式不合法时返回 null
 */
export function toneNumberToMark(input) {
  const matched = String(input ?? '')
    .trim()
    .match(SYLLABLE_PATTERN)

  if (!matched) return null

  const syllable = matched[1].toLowerCase().replace(/u:/g, 'ü').replace(/v/g, 'ü')
  const tone = matched[2] ? Number(matched[2]) : 0
  if (!tone || tone === 5) return syllable

  const index = findToneIndex(syllable)
  if (index < 0) return syllable

  const marked = TONE_VOWELS[syllable[index]]?.[tone - 1]
  if (!marked) return syllable

  return `${syllable.slice(0, index)}${marked}${syllable.slice(index + 1)}`
}

/** 汉字转带声调符号的拼音数组，一个字一个音节（自动处理多音字） */
export function toPinyinArray(word) {
  return pinyin(word, { toneType: 'symbol', type: 'array' })
}
