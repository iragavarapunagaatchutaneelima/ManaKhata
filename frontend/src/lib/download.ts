// Save a generated file (CSV, etc.). Uses the Web Share sheet on phones that
// support sharing files (incl. the Android app), else a normal browser download.
export async function saveFile(name: string, content: string, mime = 'text/csv') {
  const blob = new Blob(['﻿' + content], { type: `${mime};charset=utf-8` }) // BOM so Excel reads ₹ correctly
  const file = typeof File !== 'undefined' ? new File([blob], name, { type: mime }) : null
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (file && nav.canShare?.({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try { await nav.share({ files: [file], title: name }); return } catch { /* user cancelled: fall back */ }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
