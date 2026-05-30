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

  test('escapes XSS in rule name', () => {
    const malicious: FormatRule[] = [
      {
        id: 'xss',
        category: 'body',
        name: '<script>alert(1)</script>',
        target: { type: 'font', scope: 'body', script: 'eastAsia' },
        expected: { kind: 'string', value: '宋体' },
        actual: { kind: 'string', value: '黑体' },
        status: 'fail',
      },
    ]
    const html = generateHtmlReport('test.docx', malicious)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  test('formats lineSpacing correctly', () => {
    const rules: FormatRule[] = [
      {
        id: 'line-spacing-auto',
        category: 'body',
        name: '行距',
        target: { type: 'lineSpacing' },
        expected: { kind: 'lineSpacing', value: 1.5, rule: 'auto' },
        actual: { kind: 'lineSpacing', value: 1.5, rule: 'auto' },
        status: 'pass',
      },
      {
        id: 'line-spacing-fixed',
        category: 'body',
        name: '行距固定值',
        target: { type: 'lineSpacing' },
        expected: { kind: 'lineSpacing', value: 20, rule: 'fixed' },
        actual: { kind: 'lineSpacing', value: 22, rule: 'fixed' },
        status: 'fail',
      },
    ]
    const html = generateHtmlReport('test.docx', rules)
    expect(html).toContain('1.5 倍')
    expect(html).toContain('20 磅')
    expect(html).toContain('22 磅')
  })

  test('shows 未检测到 when actual is undefined', () => {
    const rules: FormatRule[] = [
      {
        id: 'missing',
        category: 'heading',
        name: '标题字体',
        target: { type: 'font', scope: 'heading', level: 1, script: 'eastAsia' },
        expected: { kind: 'string', value: '黑体' },
        status: 'fail',
      },
    ]
    const html = generateHtmlReport('test.docx', rules)
    expect(html).toContain('未检测到')
  })
})
