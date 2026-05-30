'use client'

import { FormatRule } from '@/lib/engine/rule-types'

export default function ReportView({ rules }: { rules: FormatRule[] }) {
  const passed = rules.filter((r) => r.status === 'pass')
  const failed = rules.filter((r) => r.status === 'fail')

  const categories = [
    { key: 'page', label: '📄 页面设置' },
    { key: 'body', label: '✍️ 正文格式' },
    { key: 'heading', label: '📌 标题格式' },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-xl p-6 mb-8 bg-surface-card">
        <h2 className="text-xl font-semibold mb-2 text-ink">检测完成</h2>
        <div className="flex gap-6">
          <span className="text-sm font-medium text-success">✅ 合格 {passed.length} 项</span>
          <span className="text-sm font-medium text-error">❌ 不合格 {failed.length} 项</span>
        </div>
      </div>

      {categories.map((cat) => {
        const catRules = rules.filter((r) => r.category === cat.key)
        if (catRules.length === 0) return null
        return (
          <div key={cat.key} className="rounded-xl p-5 mb-6 bg-surface-soft">
            <h3 className="text-base font-semibold mb-4 text-ink">{cat.label}</h3>
            <div className="space-y-3">
              {catRules.map((rule) => (
                <div key={rule.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5">{rule.status === 'pass' ? '✅' : '❌'}</span>
                  <div className="flex-1">
                    <span className={`font-medium ${rule.status === 'fail' ? 'text-error' : 'text-body-text'}`}>
                      {rule.name}
                    </span>
                    {rule.status === 'pass' ? (
                      <span className="ml-2 text-muted">{formatValue(rule.actual)}</span>
                    ) : (
                      <span className="ml-2 text-error">
                        预期 {formatValue(rule.expected)}，实际 {formatValue(rule.actual)}
                        {rule.location && <span className="ml-1 text-muted-soft">（{rule.location}）</span>}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatValue(v: { kind: string; value: number | string; unit?: string; rule?: string } | undefined): string {
  if (!v) return '未检测到'
  if (v.kind === 'length') return `${v.value} ${v.unit}`
  if (v.kind === 'lineSpacing') return v.rule === 'auto' ? `${v.value} 倍` : `${v.value} 磅`
  return String(v.value)
}
