import { generateHtmlReport } from '@/lib/exporter/html-exporter'
import { FormatRule } from '@/lib/engine/rule-types'

describe('html-exporter', () => {
  const sampleRules: FormatRule[] = [
    {
      id: 'page-margin-top',
      category: 'page',
      name: '页边距-上',
      target: { type: 'page-margin', side: 'top' },
      expected: { kind: 'length', value: 2.54, unit: 'cm' },
      actual: { kind: 'length', value: 2.54, unit: 'cm' },
      status: 'pass',
    },
    {
      id: 'body-font-cn',
      category: 'body',
      name: '正文字体-中文',
      target: { type: 'font', scope: 'body', script: 'eastAsia' },
      expected: { kind: 'string', value: '宋体' },
      actual: { kind: 'string', value: '黑体' },
      status: 'fail',
      location: '第 1 个正文段落',
    },
  ]

  test('generates HTML string containing report title', () => {
    const html = generateHtmlReport('test.docx', sampleRules)
    expect(html).toContain('格式检测报告')
    expect(html).toContain('test.docx')
  })

  test('includes passed rule in green', () => {
    const html = generateHtmlReport('test.docx', sampleRules)
    expect(html).toContain('页边距-上')
    expect(html).toContain('#22c55e')
  })

  test('includes failed rule in red', () => {
    const html = generateHtmlReport('test.docx', sampleRules)
    expect(html).toContain('正文字体-中文')
    expect(html).toContain('#ef4444')
  })
})
