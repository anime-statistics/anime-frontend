export function noteFileName(content: string, fallback: string): string {
  const firstLine = content.split('\n').find((line) => line.trim().length > 0) ?? fallback
  const cleaned = firstLine.replace(/^#+\s*/, '').trim().slice(0, 60)
  return (cleaned || fallback).replace(/[\\/:*?"<>|]/g, '-')
}

export function downloadMarkdown(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${fileName}.md`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

// Printing from a detached iframe avoids popup blockers and leaves the page intact;
// the browser's print dialog is what produces the PDF.
export function printHtml(html: string, title: string): void {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  document.body.append(frame)

  const doc = frame.contentDocument
  if (!doc) {
    frame.remove()
    return
  }

  doc.open()
  doc.write(
    `<!doctype html><html><head><title>${title}</title>`
    + '<style>body{font-family:system-ui,sans-serif;margin:2rem;line-height:1.6}'
    + 'img{max-width:100%}pre{white-space:pre-wrap;background:#f5f5f5;padding:.5rem}'
    + 'table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:.25rem .5rem}</style>'
    + `</head><body>${html}</body></html>`,
  )
  doc.close()

  frame.contentWindow?.focus()
  frame.contentWindow?.print()
  setTimeout(() => frame.remove(), 1000)
}
