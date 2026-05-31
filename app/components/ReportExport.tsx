'use client'

import { useRef } from 'react'
import { useApp } from '@/lib/context/AppContext'
import { generateHtmlReport } from '@/lib/exporter/html-exporter'
import { generateDocxReportBlob } from '@/lib/exporter/docx-exporter'

export default function ReportExport() {
  const { state } = useApp()
  const urlRef = useRef<string | null>(null)

  const cleanup = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }

  const thesisName = state.thesisFileName || '未命名'

  const handleExportHtml = () => {
    if (!state.report) return
    try {
      cleanup()
      const html = generateHtmlReport(thesisName, state.report)
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      const a = document.createElement('a')
      a.href = url
      a.download = `格式检测报告-${thesisName.replace('.docx', '')}.html`
      a.click()
      setTimeout(cleanup, 1000)
    } catch (err) {
      alert('HTML 导出失败')
    }
  }

  const handleExportDocx = async () => {
    if (!state.report) return
    try {
      cleanup()
      const blob = await generateDocxReportBlob(thesisName, state.report)
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      const a = document.createElement('a')
      a.href = url
      a.download = `格式检测报告-${thesisName.replace('.docx', '')}.docx`
      a.click()
      setTimeout(cleanup, 1000)
    } catch (err) {
      alert('DOCX 导出失败')
    }
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-6 pb-12">
      <button
        onClick={handleExportHtml}
        className="px-5 py-3 rounded-md text-sm font-semibold border border-hairline bg-canvas text-ink h-11"
      >
        导出 HTML 报告
      </button>
      <button
        onClick={handleExportDocx}
        className="px-5 py-3 rounded-md text-sm font-semibold border border-hairline bg-canvas text-ink h-11"
      >
        导出 DOCX 报告
      </button>
    </div>
  )
}
