import { checkRules } from '@/lib/engine/rule-checker'
import { FormatRule, ExtractedDocument, StyleData } from '@/lib/engine/rule-types'
import { ParagraphData } from '@/lib/parser/xml-extractor'

describe('rule-checker', () => {
  const mockDoc: ExtractedDocument = {
    paragraphs: [
      {
        text: '正文段落',
        styleId: 'Normal',
        pPr: null,
        rPr: null,
      } as ParagraphData,
      {
        text: '第一章',
        styleId: 'Heading1',
        pPr: null,
        rPr: null,
      } as ParagraphData,
    ],
    pageSetup: {
      width: 11906,
      height: 16838,
      orientation: 'portrait',
      marginTop: 1440,
      marginBottom: 1440,
      marginLeft: 1800,
      marginRight: 1800,
    },
    defaultStyles: { pPr: null, rPr: null },
  }

  const mockStyles = new Map<string, StyleData>()

  test('passes when page margin matches', () => {
    const rules: FormatRule[] = [
      {
        id: 'page-margin-top',
        category: 'page',
        name: '页边距-上',
        target: { type: 'page-margin', side: 'top' },
        expected: { kind: 'length', value: 2.54, unit: 'cm' },
        status: 'pending',
      },
    ]
    const result = checkRules(rules, mockDoc, mockStyles)
    expect(result[0].status).toBe('pass')
  })

  test('fails when page margin does not match', () => {
    const rules: FormatRule[] = [
      {
        id: 'page-margin-top',
        category: 'page',
        name: '页边距-上',
        target: { type: 'page-margin', side: 'top' },
        expected: { kind: 'length', value: 3.0, unit: 'cm' },
        status: 'pending',
      },
    ]
    const result = checkRules(rules, mockDoc, mockStyles)
    expect(result[0].status).toBe('fail')
    expect(result[0].actual).toBeDefined()
  })

  test('passes when orientation matches', () => {
    const rules: FormatRule[] = [
      {
        id: 'page-orientation',
        category: 'page',
        name: '页面方向',
        target: { type: 'page-orientation' },
        expected: { kind: 'enum', value: 'portrait' },
        status: 'pending',
      },
    ]
    const result = checkRules(rules, mockDoc, mockStyles)
    expect(result[0].status).toBe('pass')
  })
})
