import { FormatRule } from '../engine/rule-types'

export function generateHtmlReport(fileName: string, rules: FormatRule[]): string {
  const now = new Date().toLocaleString('zh-CN')
  const passedCount = rules.filter((r) => r.status === 'pass').length
  const failedCount = rules.filter((r) => r.status === 'fail').length

  const categories = [
    { key: 'page', label: '📄 页面设置' },
    { key: 'body', label: '✍️ 正文格式' },
    { key: 'heading', label: '📌 标题格式' },
  ]

  const categoryHtml = categories
    .map((cat) => {
      const catRules = rules.filter((r) => r.category === cat.key)
      if (catRules.length === 0) return ''
      const rows = catRules
        .map((rule) => {
          const isPass = rule.status === 'pass'
          const color = isPass ? '#22c55e' : '#ef4444'
          const icon = isPass ? '✅' : '❌'
          const detail = isPass
            ? formatValue(rule.actual)
            : `预期 ${formatValue(rule.expected)}，实际 ${formatValue(rule.actual)}`
          const location = rule.location ? `（${rule.location}）` : ''
          return `
            <div style="margin: 8px 0; color: ${isPass ? '#3a3a3a' : '#ef4444'};">
              <span style="color: ${color};">${icon}</span>
              <strong>${rule.name}</strong>：${detail}${location}
            </div>
          `
        })
        .join('')
      return `
        <div style="margin-bottom: 24px; padding: 16px; background: #faf5e8; border-radius: 16px;">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #0a0a0a;">${cat.label}</h3>
          ${rows}
        </div>
      `
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>格式检测报告 - ${fileName}</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; background: #fffaf0; color: #0a0a0a; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    .meta { color: #6a6a6a; margin-bottom: 24px; }
    .summary { display: flex; gap: 24px; margin-bottom: 32px; }
    .summary-item { padding: 12px 20px; background: #f5f0e0; border-radius: 12px; }
  </style>
</head>
<body>
  <h1>📋 格式检测报告</h1>
  <div class="meta">
    <div>论文文件：${fileName}</div>
    <div>检测时间：${now}</div>
  </div>
  <div class="summary">
    <div class="summary-item" style="color: #22c55e;">✅ 合格 ${passedCount} 项</div>
    <div class="summary-item" style="color: #ef4444;">❌ 不合格 ${failedCount} 项</div>
  </div>
  ${categoryHtml}
</body>
</html>`
}

function formatValue(v: { kind: string; value: number | string; unit?: string; rule?: string } | undefined): string {
  if (!v) return '未检测到'
  if (v.kind === 'length') return `${v.value} ${v.unit}`
  if (v.kind === 'lineSpacing') return v.rule === 'auto' ? `${v.value} 倍` : `${v.value} 磅`
  return String(v.value)
}
