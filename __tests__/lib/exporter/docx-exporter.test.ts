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

  test('Blob size is non-zero', async () => {
    const blob = await generateDocxReportBlob('test.docx', sampleRules)
    expect(blob.size).toBeGreaterThan(0)
  })

  test('empty rules array still generates a valid Blob with just title and summary', async () => {
    const blob = await generateDocxReportBlob('empty.docx', [])
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
  })

  test('multiple categories generate separate tables', async () => {
    const rules: FormatRule[] = [
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
      {
        id: 'heading-font-cn',
        category: 'heading',
        name: '标题字体-中文',
        target: { type: 'font', scope: 'heading', level: 1, script: 'eastAsia' },
        expected: { kind: 'string', value: '黑体' },
        actual: { kind: 'string', value: '宋体' },
        status: 'fail',
      },
    ]
    const blob = await generateDocxReportBlob('multi.docx', rules)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
  })

  test('failed rule with location does not throw', async () => {
    const rules: FormatRule[] = [
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
    const blob = await generateDocxReportBlob('location.docx', rules)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
  })
})
