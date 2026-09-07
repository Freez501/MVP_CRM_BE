/**
 * Скопировать текст в буфер обмена и переключить флаг состояния с таймаутом
 */
export function copyToClipboard(text: string, setCopied: (v: boolean) => void, timeout = 2000) {
  navigator.clipboard.writeText(text)
  setCopied(true)
  setTimeout(() => setCopied(false), timeout)
}

/**
 * Скачать текстовый файл в браузере
 */
export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
