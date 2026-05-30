import { generateDocxReportBlob } from '@/lib/exporter/docx-exporter'
import { FormatRule } from '@/lib/engine/rule-types'

describe('docx-exporter', () => {
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
    },
  ]

  test('generates a Blob without throwing', async () => {
    const blob = await generateDocxReportBlob('test.docx', sampleRules)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toContain('officedocument')
  })
})
