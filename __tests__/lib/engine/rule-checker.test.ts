import { checkRules } from '@/lib/engine/rule-checker'
import { FormatRule, ExtractedDocument, StyleData } from '@/lib/engine/rule-types'
import { ParagraphData } from '@/lib/parser/xml-extractor'

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

function makeRPr(xml: string): Element {
  return new DOMParser().parseFromString(xml, 'application/xml').documentElement
}

function makePPr(xml: string): Element {
  return new DOMParser().parseFromString(xml, 'application/xml').documentElement
}

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

  describe('font comparison', () => {
    test('passes when font case differs', () => {
      const doc: ExtractedDocument = {
        paragraphs: [
          {
            text: '正文',
            styleId: 'Normal',
            pPr: null,
            rPr: makeRPr('<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:rFonts w:ascii="SimSun" w:eastAsia="SimSun"/></w:rPr>'),
          } as ParagraphData,
        ],
        pageSetup: mockDoc.pageSetup,
        defaultStyles: { pPr: null, rPr: null },
      }
      const rules: FormatRule[] = [
        {
          id: 'font-body',
          category: 'body',
          name: '正文字体',
          target: { type: 'font', scope: 'body', script: 'eastAsia' },
          expected: { kind: 'string', value: 'simsun' },
          status: 'pending',
        },
      ]
      const result = checkRules(rules, doc, mockStyles)
      expect(result[0].status).toBe('pass')
    })

    test('fails when fonts differ', () => {
      const doc: ExtractedDocument = {
        paragraphs: [
          {
            text: '正文',
            styleId: 'Normal',
            pPr: null,
            rPr: makeRPr('<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:rFonts w:ascii="Arial" w:eastAsia="SimHei"/></w:rPr>'),
          } as ParagraphData,
        ],
        pageSetup: mockDoc.pageSetup,
        defaultStyles: { pPr: null, rPr: null },
      }
      const rules: FormatRule[] = [
        {
          id: 'font-body',
          category: 'body',
          name: '正文字体',
          target: { type: 'font', scope: 'body', script: 'eastAsia' },
          expected: { kind: 'string', value: 'simsun' },
          status: 'pending',
        },
      ]
      const result = checkRules(rules, doc, mockStyles)
      expect(result[0].status).toBe('fail')
    })
  })

  describe('font-size comparison', () => {
    test('passes when font-size in pt matches', () => {
      const doc: ExtractedDocument = {
        paragraphs: [
          {
            text: '正文',
            styleId: 'Normal',
            pPr: null,
            rPr: makeRPr('<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:sz w:val="24"/></w:rPr>'),
          } as ParagraphData,
        ],
        pageSetup: mockDoc.pageSetup,
        defaultStyles: { pPr: null, rPr: null },
      }
      const rules: FormatRule[] = [
        {
          id: 'font-size-body',
          category: 'body',
          name: '正文字号',
          target: { type: 'font-size', scope: 'body', script: 'ascii' },
          expected: { kind: 'length', value: 12, unit: 'pt' },
          status: 'pending',
        },
      ]
      const result = checkRules(rules, doc, mockStyles)
      expect(result[0].status).toBe('pass')
    })

    test('fails when font-size in pt does not match', () => {
      const doc: ExtractedDocument = {
        paragraphs: [
          {
            text: '正文',
            styleId: 'Normal',
            pPr: null,
            rPr: makeRPr('<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:sz w:val="22"/></w:rPr>'),
          } as ParagraphData,
        ],
        pageSetup: mockDoc.pageSetup,
        defaultStyles: { pPr: null, rPr: null },
      }
      const rules: FormatRule[] = [
        {
          id: 'font-size-body',
          category: 'body',
          name: '正文字号',
          target: { type: 'font-size', scope: 'body', script: 'ascii' },
          expected: { kind: 'length', value: 12, unit: 'pt' },
          status: 'pending',
        },
      ]
      const result = checkRules(rules, doc, mockStyles)
      expect(result[0].status).toBe('fail')
    })
  })

  describe('alignment comparison', () => {
    test('passes when alignment is center', () => {
      const doc: ExtractedDocument = {
        paragraphs: [
          {
            text: '标题',
            styleId: 'Heading1',
            pPr: makePPr('<w:pPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:jc w:val="center"/></w:pPr>'),
            rPr: null,
          } as ParagraphData,
        ],
        pageSetup: mockDoc.pageSetup,
        defaultStyles: { pPr: null, rPr: null },
      }
      const rules: FormatRule[] = [
        {
          id: 'alignment-heading1',
          category: 'heading',
          name: '一级标题对齐',
          target: { type: 'alignment', scope: 'heading', level: 1 },
          expected: { kind: 'enum', value: 'center' },
          status: 'pending',
        },
      ]
      const result = checkRules(rules, doc, mockStyles)
      expect(result[0].status).toBe('pass')
    })

    test('fails when alignment is not center', () => {
      const doc: ExtractedDocument = {
        paragraphs: [
          {
            text: '标题',
            styleId: 'Heading1',
            pPr: makePPr('<w:pPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:jc w:val="left"/></w:pPr>'),
            rPr: null,
          } as ParagraphData,
        ],
        pageSetup: mockDoc.pageSetup,
        defaultStyles: { pPr: null, rPr: null },
      }
      const rules: FormatRule[] = [
        {
          id: 'alignment-heading1',
          category: 'heading',
          name: '一级标题对齐',
          target: { type: 'alignment', scope: 'heading', level: 1 },
          expected: { kind: 'enum', value: 'center' },
          status: 'pending',
        },
      ]
      const result = checkRules(rules, doc, mockStyles)
      expect(result[0].status).toBe('fail')
    })
  })

  describe('paragraph-spacing line (auto)', () => {
    test('passes when line spacing is auto 1.5', () => {
      const doc: ExtractedDocument = {
        paragraphs: [
          {
            text: '正文',
            styleId: 'Normal',
            pPr: makePPr('<w:pPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:spacing w:line="360" w:lineRule="auto"/></w:pPr>'),
            rPr: null,
          } as ParagraphData,
        ],
        pageSetup: mockDoc.pageSetup,
        defaultStyles: { pPr: null, rPr: null },
      }
      const rules: FormatRule[] = [
        {
          id: 'line-spacing-body',
          category: 'body',
          name: '正文行距',
          target: { type: 'paragraph-spacing', scope: 'body', kind: 'line' },
          expected: { kind: 'lineSpacing', value: 1.5, rule: 'auto' },
          status: 'pending',
        },
      ]
      const result = checkRules(rules, doc, mockStyles)
      expect(result[0].status).toBe('pass')
    })

    test('fails when line spacing auto value differs', () => {
      const doc: ExtractedDocument = {
        paragraphs: [
          {
            text: '正文',
            styleId: 'Normal',
            pPr: makePPr('<w:pPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:spacing w:line="240" w:lineRule="auto"/></w:pPr>'),
            rPr: null,
          } as ParagraphData,
        ],
        pageSetup: mockDoc.pageSetup,
        defaultStyles: { pPr: null, rPr: null },
      }
      const rules: FormatRule[] = [
        {
          id: 'line-spacing-body',
          category: 'body',
          name: '正文行距',
          target: { type: 'paragraph-spacing', scope: 'body', kind: 'line' },
          expected: { kind: 'lineSpacing', value: 1.5, rule: 'auto' },
          status: 'pending',
        },
      ]
      const result = checkRules(rules, doc, mockStyles)
      expect(result[0].status).toBe('fail')
    })
  })

  describe('paragraph-spacing before/after', () => {
    test('passes when spaceBefore in pt matches', () => {
      const doc: ExtractedDocument = {
        paragraphs: [
          {
            text: '正文',
            styleId: 'Normal',
            pPr: makePPr('<w:pPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:spacing w:before="200"/></w:pPr>'),
            rPr: null,
          } as ParagraphData,
        ],
        pageSetup: mockDoc.pageSetup,
        defaultStyles: { pPr: null, rPr: null },
      }
      const rules: FormatRule[] = [
        {
          id: 'space-before-body',
          category: 'body',
          name: '正文段前间距',
          target: { type: 'paragraph-spacing', scope: 'body', kind: 'before' },
          expected: { kind: 'length', value: 10, unit: 'pt' },
          status: 'pending',
        },
      ]
      const result = checkRules(rules, doc, mockStyles)
      expect(result[0].status).toBe('pass')
    })

    test('passes when spaceAfter in pt matches', () => {
      const doc: ExtractedDocument = {
        paragraphs: [
          {
            text: '正文',
            styleId: 'Normal',
            pPr: makePPr('<w:pPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:spacing w:after="200"/></w:pPr>'),
            rPr: null,
          } as ParagraphData,
        ],
        pageSetup: mockDoc.pageSetup,
        defaultStyles: { pPr: null, rPr: null },
      }
      const rules: FormatRule[] = [
        {
          id: 'space-after-body',
          category: 'body',
          name: '正文段后间距',
          target: { type: 'paragraph-spacing', scope: 'body', kind: 'after' },
          expected: { kind: 'length', value: 10, unit: 'pt' },
          status: 'pending',
        },
      ]
      const result = checkRules(rules, doc, mockStyles)
      expect(result[0].status).toBe('pass')
    })
  })

  describe('page-size comparison', () => {
    test('passes when page width matches', () => {
      const rules: FormatRule[] = [
        {
          id: 'page-size-width',
          category: 'page',
          name: '纸张宽度',
          target: { type: 'page-size', dimension: 'width' },
          expected: { kind: 'length', value: 21.0, unit: 'cm' },
          status: 'pending',
        },
      ]
      const result = checkRules(rules, mockDoc, mockStyles)
      expect(result[0].status).toBe('pass')
    })

    test('fails when page width does not match', () => {
      const rules: FormatRule[] = [
        {
          id: 'page-size-width',
          category: 'page',
          name: '纸张宽度',
          target: { type: 'page-size', dimension: 'width' },
          expected: { kind: 'length', value: 22.0, unit: 'cm' },
          status: 'pending',
        },
      ]
      const result = checkRules(rules, mockDoc, mockStyles)
      expect(result[0].status).toBe('fail')
    })
  })

  describe('tolerance boundary', () => {
    test('passes when value is just within tolerance', () => {
      const doc: ExtractedDocument = {
        paragraphs: [
          {
            text: '正文',
            styleId: 'Normal',
            pPr: makePPr('<w:pPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:spacing w:after="212"/></w:pPr>'),
            rPr: null,
          } as ParagraphData,
        ],
        pageSetup: mockDoc.pageSetup,
        defaultStyles: { pPr: null, rPr: null },
      }
      const rules: FormatRule[] = [
        {
          id: 'space-after-body',
          category: 'body',
          name: '正文段后间距',
          target: { type: 'paragraph-spacing', scope: 'body', kind: 'after' },
          expected: { kind: 'length', value: 10.6, unit: 'pt' },
          status: 'pending',
        },
      ]
      const result = checkRules(rules, doc, mockStyles)
      expect(result[0].status).toBe('pass')
    })

    test('fails when value is just outside tolerance', () => {
      const doc: ExtractedDocument = {
        paragraphs: [
          {
            text: '正文',
            styleId: 'Normal',
            pPr: makePPr('<w:pPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:spacing w:after="233"/></w:pPr>'),
            rPr: null,
          } as ParagraphData,
        ],
        pageSetup: mockDoc.pageSetup,
        defaultStyles: { pPr: null, rPr: null },
      }
      const rules: FormatRule[] = [
        {
          id: 'space-after-body',
          category: 'body',
          name: '正文段后间距',
          target: { type: 'paragraph-spacing', scope: 'body', kind: 'after' },
          expected: { kind: 'length', value: 10.6, unit: 'pt' },
          status: 'pending',
        },
      ]
      const result = checkRules(rules, doc, mockStyles)
      expect(result[0].status).toBe('fail')
    })
  })

  describe('missing paragraphs', () => {
    test('fails with location 未检测到目标段落 when no target paragraphs exist', () => {
      const doc: ExtractedDocument = {
        paragraphs: [],
        pageSetup: mockDoc.pageSetup,
        defaultStyles: { pPr: null, rPr: null },
      }
      const rules: FormatRule[] = [
        {
          id: 'font-body',
          category: 'body',
          name: '正文字体',
          target: { type: 'font', scope: 'body', script: 'eastAsia' },
          expected: { kind: 'string', value: 'simsun' },
          status: 'pending',
        },
      ]
      const result = checkRules(rules, doc, mockStyles)
      expect(result[0].status).toBe('fail')
      expect(result[0].location).toBe('未检测到目标段落')
    })
  })
})
