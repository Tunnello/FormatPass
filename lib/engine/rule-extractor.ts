import { FormatRule, RuleValue } from './rule-types'
import { ExtractedDocument, StyleData } from '../parser/xml-extractor'
import { resolveEffectiveStyle, resolveParagraphStyle } from '../parser/style-resolver'
import { twipToCm, twipToPt, halfPointToPt } from '../utils/unit-converter'
import { getTargetParagraphs } from './rule-checker'

export function extractRulesFromTemplate(
  doc: ExtractedDocument,
  styles: Map<string, StyleData>
): FormatRule[] {
  const rules: FormatRule[] = []

  // Page rules
  rules.push(
    {
      id: 'page-margin-top',
      category: 'page',
      name: '页边距-上',
      target: { type: 'page-margin', side: 'top' },
      expected: { kind: 'length', value: parseFloat(twipToCm(doc.pageSetup.marginTop).toFixed(2)), unit: 'cm' },
      status: 'pending',
    },
    {
      id: 'page-margin-bottom',
      category: 'page',
      name: '页边距-下',
      target: { type: 'page-margin', side: 'bottom' },
      expected: { kind: 'length', value: parseFloat(twipToCm(doc.pageSetup.marginBottom).toFixed(2)), unit: 'cm' },
      status: 'pending',
    },
    {
      id: 'page-margin-left',
      category: 'page',
      name: '页边距-左',
      target: { type: 'page-margin', side: 'left' },
      expected: { kind: 'length', value: parseFloat(twipToCm(doc.pageSetup.marginLeft).toFixed(2)), unit: 'cm' },
      status: 'pending',
    },
    {
      id: 'page-margin-right',
      category: 'page',
      name: '页边距-右',
      target: { type: 'page-margin', side: 'right' },
      expected: { kind: 'length', value: parseFloat(twipToCm(doc.pageSetup.marginRight).toFixed(2)), unit: 'cm' },
      status: 'pending',
    },
    {
      id: 'page-orientation',
      category: 'page',
      name: '页面方向',
      target: { type: 'page-orientation' },
      expected: { kind: 'enum', value: doc.pageSetup.orientation },
      status: 'pending',
    },
    {
      id: 'page-size-width',
      category: 'page',
      name: '纸张宽度',
      target: { type: 'page-size', dimension: 'width' },
      expected: { kind: 'length', value: parseFloat(twipToCm(doc.pageSetup.width).toFixed(2)), unit: 'cm' },
      status: 'pending',
    },
    {
      id: 'page-size-height',
      category: 'page',
      name: '纸张高度',
      target: { type: 'page-size', dimension: 'height' },
      expected: { kind: 'length', value: parseFloat(twipToCm(doc.pageSetup.height).toFixed(2)), unit: 'cm' },
      status: 'pending',
    }
  )

  // Body rules
  const bodyParagraphs = getTargetParagraphs(doc, 'body')
  if (bodyParagraphs.length > 0) {
    const firstBody = bodyParagraphs[0]
    const rPr = resolveEffectiveStyle(firstBody, styles, doc.defaultStyles)
    const pPr = resolveParagraphStyle(firstBody.pPr, firstBody.styleId, styles, doc.defaultStyles)

    rules.push(
      {
        id: 'body-font-cn',
        category: 'body',
        name: '正文字体-中文',
        target: { type: 'font', scope: 'body', script: 'eastAsia' },
        expected: rPr.fontEastAsia ? { kind: 'string', value: rPr.fontEastAsia } : { kind: 'string', value: '' },
        status: 'pending',
      },
      {
        id: 'body-font-en',
        category: 'body',
        name: '正文字体-西文',
        target: { type: 'font', scope: 'body', script: 'ascii' },
        expected: rPr.fontAscii ? { kind: 'string', value: rPr.fontAscii } : { kind: 'string', value: '' },
        status: 'pending',
      },
      {
        id: 'body-font-size',
        category: 'body',
        name: '正文字号',
        target: { type: 'font-size', scope: 'body', script: 'eastAsia' },
        expected: rPr.fontSize ? { kind: 'length', value: halfPointToPt(rPr.fontSize), unit: 'pt' } : { kind: 'length', value: 0, unit: 'pt' },
        status: 'pending',
      },
      {
        id: 'body-line-spacing',
        category: 'body',
        name: '正文行距',
        target: { type: 'paragraph-spacing', scope: 'body', kind: 'line' },
        expected: pPr.lineSpacing ? convertLineSpacing(pPr.lineSpacing) : { kind: 'lineSpacing' as const, value: 0, rule: 'auto' as const },
        status: 'pending',
      },
      {
        id: 'body-space-before',
        category: 'body',
        name: '正文段前间距',
        target: { type: 'paragraph-spacing', scope: 'body', kind: 'before' },
        expected: pPr.spaceBefore !== null ? { kind: 'length', value: twipToPt(pPr.spaceBefore), unit: 'pt' } : { kind: 'length', value: 0, unit: 'pt' },
        status: 'pending',
      },
      {
        id: 'body-space-after',
        category: 'body',
        name: '正文段后间距',
        target: { type: 'paragraph-spacing', scope: 'body', kind: 'after' },
        expected: pPr.spaceAfter !== null ? { kind: 'length', value: twipToPt(pPr.spaceAfter), unit: 'pt' } : { kind: 'length', value: 0, unit: 'pt' },
        status: 'pending',
      }
    )
  }

  // Heading rules
  for (let level = 1; level <= 3; level++) {
    const headingParagraphs = getTargetParagraphs(doc, 'heading', level)
    if (headingParagraphs.length === 0) continue

    const firstHeading = headingParagraphs[0]
    const rPr = resolveEffectiveStyle(firstHeading, styles, doc.defaultStyles)
    const pPr = resolveParagraphStyle(firstHeading.pPr, firstHeading.styleId, styles, doc.defaultStyles)
    const prefix = `heading-${level}`

    rules.push(
      {
        id: `${prefix}-font`,
        category: 'heading',
        name: `${level}级标题字体`,
        target: { type: 'font', scope: 'heading', level, script: 'eastAsia' },
        expected: rPr.fontEastAsia ? { kind: 'string', value: rPr.fontEastAsia } : { kind: 'string', value: '' },
        status: 'pending',
      },
      {
        id: `${prefix}-font-size`,
        category: 'heading',
        name: `${level}级标题字号`,
        target: { type: 'font-size', scope: 'heading', level, script: 'eastAsia' },
        expected: rPr.fontSize ? { kind: 'length', value: halfPointToPt(rPr.fontSize), unit: 'pt' } : { kind: 'length', value: 0, unit: 'pt' },
        status: 'pending',
      },
      {
        id: `${prefix}-space-before`,
        category: 'heading',
        name: `${level}级标题段前间距`,
        target: { type: 'paragraph-spacing', scope: 'heading', level, kind: 'before' },
        expected: pPr.spaceBefore !== null ? { kind: 'length', value: twipToPt(pPr.spaceBefore), unit: 'pt' } : { kind: 'length', value: 0, unit: 'pt' },
        status: 'pending',
      },
      {
        id: `${prefix}-space-after`,
        category: 'heading',
        name: `${level}级标题段后间距`,
        target: { type: 'paragraph-spacing', scope: 'heading', level, kind: 'after' },
        expected: pPr.spaceAfter !== null ? { kind: 'length', value: twipToPt(pPr.spaceAfter), unit: 'pt' } : { kind: 'length', value: 0, unit: 'pt' },
        status: 'pending',
      },
      {
        id: `${prefix}-alignment`,
        category: 'heading',
        name: `${level}级标题对齐方式`,
        target: { type: 'alignment', scope: 'heading', level },
        expected: pPr.alignment ? { kind: 'enum', value: pPr.alignment } : { kind: 'enum', value: 'left' },
        status: 'pending',
      }
    )
  }

  return rules
}

function convertLineSpacing(ls: { value: number; rule: 'auto' | 'exact' }): RuleValue {
  if (ls.rule === 'auto') {
    return { kind: 'lineSpacing', value: ls.value / 240, rule: 'auto' }
  }
  return { kind: 'lineSpacing', value: twipToPt(ls.value), rule: 'exact' }
}
