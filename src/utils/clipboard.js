/**
 * 复制文本到剪贴板，优先使用 Clipboard API，失败时回退到临时 textarea
 * @returns {Promise<boolean>} 是否复制成功
 */
export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      // 非安全上下文或权限被拒时继续走回退方案
    }
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.cssText = 'position: fixed; top: -1000px; opacity: 0'
    document.body.appendChild(textarea)
    textarea.select()

    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)

    return copied
  } catch (error) {
    return false
  }
}
