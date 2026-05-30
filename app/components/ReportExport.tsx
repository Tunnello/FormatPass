'use client'

import { useApp } from '@/lib/context/AppContext'
import { generateHtmlReport } from '@/lib/exporter/html-exporter'
import { generateDocxReportBlob } from '@/lib/exporter/docx-exporter'

export default function ReportExport() {
  const { state } = useApp()

  const handleExportHtml = () => {
    if (!state.report) return
    const html = generateHtmlReport(state.fileName, state.report)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `格式检测报告-${state.fileName.replace('.docx', '')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportDocx = async () => {
    if (!state.report) return
    try {
      const blob = await generateDocxReportBlob(state.fileName, state.report)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `格式检测报告-${state.fileName.replace('.docx', '')}.docx`
      a.click()
      URL.revokeObjectURL(url)
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
