import { toCanvas } from 'html-to-image'
import { renderAsync } from 'docx-preview'

/** 单次处理的最大页数 */
export const MAX_PAGES = 30
/** 输出长图的最大高度（像素），超出时自动等比缩小 */
export const MAX_OUTPUT_HEIGHT = 20000
/** 输出长图的最大面积（像素），避免 canvas 占用过多内存 */
export const MAX_OUTPUT_AREA = 60_000_000
/** 截图倍率，2 倍可保证打印清晰度 */
const CAPTURE_RATIO = 2
/** 判定为空白页边的灰度阈值 */
const WHITE_THRESHOLD = 244
/** 自动裁边时上下保留的留白（CSS px），截图是 2 倍图，实际像素会再乘 CAPTURE_RATIO */
const CONTENT_PADDING = 16
/** 预览图显示宽度基准，略大于右侧拼接预览的展示宽度，缩放后更锐利 */
const PREVIEW_WIDTH = 760
/** 预览图最大宽度，避免高分屏下解码占用过多内存 */
const PREVIEW_MAX_WIDTH = 1440

/** 透明占位图：用于替换没有有效来源的图片 */
const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()))

/**
 * 解析 docx-preview 从 VML 搬过来的颜色值。
 * 可能是「#A0A0A0」、带主题索引的「#000000 [3213]」或字符串「null」。
 */
function parseSvgPaint(raw) {
  const value = (raw || '').trim()
  if (!value || value === 'null' || value === 'none' || value === 'transparent') return ''

  const hex = value.match(/#[0-9a-fA-F]{3,8}/)
  if (hex) return hex[0]

  return /^[a-zA-Z]+$/.test(value) ? value : ''
}

/**
 * 清理没有有效来源的图片资源。
 * WPS 导出的文档常用 VML 画横线，docx-preview 会渲染成没有 href 的 <svg><image>；
 * 空 src / href 会被浏览器解析成当前页面地址，截图时去加载 HTML 就会失败。
 */
function sanitizeResources(root) {
  root.querySelectorAll('img').forEach((img) => {
    const src = (img.getAttribute('src') || '').trim()

    if (!src || src.startsWith('about:')) {
      img.setAttribute('src', TRANSPARENT_PIXEL)
    }
  })

  // 空白 href 的 svg 图片是 VML 图形，整体换成等价的 HTML 盒子：
  // 截图工具会把内联 svg 序列化后重新渲染，容易把无 href 的 image 变成实心灰块
  root.querySelectorAll('svg image').forEach((image) => {
    const href = image.getAttribute('href') || image.getAttribute('xlink:href')
    const svg = image.parentNode

    if (href || !svg || svg.nodeName.toLowerCase() !== 'svg') {
      return
    }

    const fill = parseSvgPaint(image.getAttribute('fill'))
    const stroke = parseSvgPaint(image.getAttribute('stroke'))
    const strokeWidth = (image.getAttribute('stroke-width') || '1pt').trim()
    const style = svg.getAttribute('style') || ''

    // 大尺寸图形（Word 里用浮动形状画的表格框等）docx-preview 排不出原来的位置，
    // 留着只会压在正文上变成一块色块，直接去掉；只有横线这类细长图形才还原
    if (svg.getBoundingClientRect().height > 8) {
      svg.remove()
      return
    }

    const box = document.createElement('div')
    box.setAttribute('style', style)
    box.style.boxSizing = 'border-box'

    // 原来是行内 svg 的保持行内显示，避免撑出额外的块级换行
    if (!/position\s*:\s*absolute/i.test(style)) {
      box.style.display = 'inline-block'
      box.style.verticalAlign = 'middle'
    }

    if (fill) {
      box.style.backgroundColor = fill
    }

    if (stroke) {
      box.style.border = `${strokeWidth} solid ${stroke}`
    }

    svg.replaceWith(box)
  })

  // 其他空 href（如 <use>、<a>）直接去掉，避免被当成待抓取资源
  root.querySelectorAll('[href]').forEach((node) => {
    if (!(node.getAttribute('href') || '').trim()) {
      node.removeAttribute('href')
    }
  })
}

/** A4 高度（96dpi 像素），section 没有 min-height 时的兜底分页高度 */
const A4_HEIGHT_PX = 1123

/**
 * docx-preview 只按分页符 / 分节符分页，没有分页标记的长文档会全部挤在一页里。
 * 这里按 A4 的正文高度，把超出的内容拆到新的页里。
 */
function splitIntoPages(section) {
  const article = section.querySelector('article')
  if (!article || article.children.length < 2) return [section]

  const computed = getComputedStyle(section)
  const pageHeight = parseFloat(computed.minHeight) || A4_HEIGHT_PX
  const paddingTop = parseFloat(computed.paddingTop) || 0
  const paddingBottom = parseFloat(computed.paddingBottom) || 0
  const innerHeight = pageHeight - paddingTop - paddingBottom

  if (innerHeight <= 0) return [section]

  const children = Array.from(article.children)
  const articleTop = article.getBoundingClientRect().top
  const groups = []
  let start = 0
  let page = 0

  children.forEach((child, index) => {
    const bottom = child.getBoundingClientRect().bottom - articleTop
    const pageOfChild = Math.max(0, Math.floor((bottom - 1) / innerHeight))

    if (pageOfChild > page) {
      groups.push(children.slice(start, index))
      start = index
      page = pageOfChild
    }
  })
  groups.push(children.slice(start))

  if (groups.length < 2) return [section]

  const pages = [section]

  for (let index = 1; index < groups.length; index += 1) {
    const nextSection = section.cloneNode(false)
    const nextArticle = article.cloneNode(false)
    nextSection.appendChild(nextArticle)
    pages[pages.length - 1].after(nextSection)
    pages.push(nextSection)
  }

  groups.forEach((group, index) => {
    const target = pages[index].querySelector('article')
    group.forEach((child) => target.appendChild(child))
  })

  return pages
}

/**
 * 分页后如果单页内容仍然超出（例如一个超高表格），把容器撑到内容高度，
 * 避免后半段被裁掉。
 */
function expandToContent(section) {
  const clientHeight = section.clientHeight
  const scrollHeight = section.scrollHeight

  if (scrollHeight <= clientHeight + 2) return

  section.style.height = 'auto'
  section.style.minHeight = `${clientHeight}px`
}

/** 等待节点内所有图片解码完成 */
async function waitForImages(root) {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true })
            img.addEventListener('error', resolve, { once: true })
          })
    )
  )
}

/**
 * 扫描画布像素，找出内容上下边界（用于自动裁掉页边空白）
 * 返回图片像素坐标
 */
export function detectContentBounds(canvas) {
  const { width, height } = canvas
  const fallback = { top: 0, bottom: height - 1 }

  // 缩小后再扫描：整页全分辨率取像素太占内存，也不需要 1px 级的精度
  const scale = Math.min(1, 260 / width)
  const sampleWidth = Math.max(1, Math.round(width * scale))
  const sampleHeight = Math.max(1, Math.round(height * scale))

  const sample = document.createElement('canvas')
  sample.width = sampleWidth
  sample.height = sampleHeight

  const context = sample.getContext('2d', { willReadFrequently: true })
  if (!context) return fallback

  context.drawImage(canvas, 0, 0, sampleWidth, sampleHeight)
  const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight)

  const hasInk = (y) => {
    const offset = y * sampleWidth * 4
    for (let x = 0; x < sampleWidth; x += 1) {
      const index = offset + x * 4
      if (
        data[index] < WHITE_THRESHOLD ||
        data[index + 1] < WHITE_THRESHOLD ||
        data[index + 2] < WHITE_THRESHOLD
      ) {
        return true
      }
    }
    return false
  }

  let top = -1
  for (let y = 0; y < sampleHeight; y += 1) {
    if (hasInk(y)) {
      top = y
      break
    }
  }
  if (top < 0) return fallback

  let bottom = sampleHeight - 1
  for (let y = sampleHeight - 1; y >= 0; y -= 1) {
    if (hasInk(y)) {
      bottom = y
      break
    }
  }

  const ratio = height / sampleHeight
  // 采样扫描的边界会落在采样行上，按比例补偿后再叠加一段视觉留白
  const padding = Math.max(CONTENT_PADDING * CAPTURE_RATIO, Math.ceil(ratio * 2))

  return {
    top: Math.max(0, Math.round(top * ratio) - padding),
    bottom: Math.min(height - 1, Math.round(bottom * ratio) + padding)
  }
}

/**
 * 生成预览图。
 * 宽度跟随屏幕像素比（1~2 倍），保证二倍屏下右侧拼接预览也不发虚；
 * 同时限制上限，避免多页时解码占用过多内存。
 */
function createPreview(canvas) {
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
  const width = Math.min(
    canvas.width,
    PREVIEW_MAX_WIDTH,
    Math.round(PREVIEW_WIDTH * dpr)
  )
  const height = Math.max(1, Math.round((canvas.height / canvas.width) * width))

  const preview = document.createElement('canvas')
  preview.width = width
  preview.height = height

  const context = preview.getContext('2d')
  if (!context) return canvas.toDataURL('image/png')

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(canvas, 0, 0, width, height)

  // 预览图用 PNG，文字边缘没有 JPEG 压缩噪点
  return preview.toDataURL('image/png')
}

/**
 * 把 docx 渲染为逐页图片
 * @param {File|Blob} file
 * @param {{ maxPages?: number, onProgress?: (state: { done: number, total: number }) => void }} options
 */
export async function renderDocxToPages(file, { maxPages = MAX_PAGES, onProgress } = {}) {
  if (!file) throw new Error('请选择 docx 文件')

  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = [
    'position: fixed',
    'left: -20000px',
    'top: 0',
    'width: 1400px',
    'background: #ffffff',
    'pointer-events: none',
    'z-index: -1'
  ].join(';')
  document.body.appendChild(host)

  try {
    await renderAsync(file, host, undefined, {
      className: 'docx',
      inWrapper: true,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      // 图片转成 base64，截图时无需再处理跨域/临时链接
      useBase64URL: true,
      experimental: true
    })

    const baseSections = Array.from(host.querySelectorAll('section.docx'))
    if (!baseSections.length) throw new Error('没有解析到任何页面，请确认为有效的 .docx 文件')

    // 等待字体就绪再测量高度，否则分页位置会随字体加载而偏移
    await document.fonts?.ready

    const sections = baseSections.flatMap((section) => splitIntoPages(section))

    const limit = Math.min(sections.length, maxPages)
    const pages = []
    onProgress?.({ done: 0, total: limit })

    for (let index = 0; index < limit; index += 1) {
      const section = sections[index]
      sanitizeResources(section)
      expandToContent(section)
      await waitForImages(section)

      let canvas
      try {
        canvas = await toCanvas(section, {
          pixelRatio: CAPTURE_RATIO,
          backgroundColor: '#ffffff'
        })
      } catch (error) {
        console.error('[wordDoc] 页面截图失败', error)
        throw new Error(
          `第 ${index + 1} 页截图失败，文档里可能有暂不支持的图形对象，可尝试在 Word 中另存为新的 .docx 后重试`
        )
      }

      const bounds = detectContentBounds(canvas)

      pages.push({
        id: `page-${index + 1}`,
        index: index + 1,
        width: canvas.width,
        height: canvas.height,
        dataUrl: canvas.toDataURL('image/png'),
        preview: createPreview(canvas),
        // 默认保留整页，需要时用「自动裁边」按内容裁剪
        cropTop: 0,
        cropBottom: 0,
        contentTop: bounds.top,
        contentBottom: bounds.bottom
      })

      onProgress?.({ done: index + 1, total: limit })
      await nextFrame()
    }

    return { pages, total: sections.length }
  } finally {
    host.remove()
  }
}

/** 参与拼接的页面（裁切后仍有可见内容） */
export function pickExportablePages(pages) {
  return pages.filter((page) => page.height - page.cropTop - page.cropBottom > 10)
}

/**
 * 计算导出尺寸，超过高度/面积上限时自动等比缩小
 */
export function measureOutput(pages) {
  const selected = pickExportablePages(pages)
  if (!selected.length) return null

  const width = Math.max(...selected.map((page) => page.width))
  const height = selected.reduce((sum, page) => sum + (page.height - page.cropTop - page.cropBottom), 0)
  const factor = Math.max(
    0.1,
    Math.min(1, MAX_OUTPUT_HEIGHT / height, Math.sqrt(MAX_OUTPUT_AREA / (width * height)))
  )

  return {
    pages: selected.length,
    skipped: pages.length - selected.length,
    rawWidth: width,
    rawHeight: height,
    width: Math.round(width * factor),
    height: Math.round(height * factor),
    factor
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('页面图片加载失败'))
    image.src = src
  })
}

/**
 * 按裁剪区间把选中的页面竖向拼接成一张长图
 */
export async function composeLongImage(pages) {
  const selected = pickExportablePages(pages)
  if (!selected.length) throw new Error('没有可导出的页面，请先调整裁切范围')

  const stats = measureOutput(pages)
  const factor = stats.factor

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, stats.width)
  canvas.height = Math.max(1, stats.height)

  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器不支持 canvas 导出')

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)

  let offsetY = 0
  for (const page of selected) {
    const image = await loadImage(page.dataUrl)
    const sourceTop = page.cropTop
    const sourceHeight = page.height - page.cropTop - page.cropBottom
    const drawWidth = Math.round(page.width * factor)
    // 页面宽度不一致时居中对齐，与预览保持一致
    const drawX = Math.round((canvas.width - drawWidth) / 2)

    context.drawImage(
      image,
      0,
      sourceTop,
      page.width,
      sourceHeight,
      drawX,
      Math.round(offsetY * factor),
      drawWidth,
      Math.round(sourceHeight * factor)
    )

    offsetY += sourceHeight
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('图片生成失败，请减少页数后重试')

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    factor,
    skipped: pages.length - selected.length
  }
}
