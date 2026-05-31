import { FormatRule, RuleFormData, RuleValue } from './rule-types'

export function buildRulesFromForm(form: RuleFormData): FormatRule[] {
  const rules: FormatRule[] = []

  // Page rules
  rules.push(
    {
      id: 'page-margin-top',
      category: 'page',
      name: '页边距-上',
      target: { type: 'page-margin', side: 'top' },
      expected: { kind: 'length', value: form.page.marginTop, unit: 'cm' },
      status: 'pending',
    },
    {
      id: 'page-margin-bottom',
      category: 'page',
      name: '页边距-下',
      target: { type: 'page-margin', side: 'bottom' },
      expected: { kind: 'length', value: form.page.marginBottom, unit: 'cm' },
      status: 'pending',
    },
    {
      id: 'page-margin-left',
      category: 'page',
      name: '页边距-左',
      target: { type: 'page-margin', side: 'left' },
      expected: { kind: 'length', value: form.page.marginLeft, unit: 'cm' },
      status: 'pending',
    },
    {
      id: 'page-margin-right',
      category: 'page',
      name: '页边距-右',
      target: { type: 'page-margin', side: 'right' },
      expected: { kind: 'length', value: form.page.marginRight, unit: 'cm' },
      status: 'pending',
    },
    {
      id: 'page-orientation',
      category: 'page',
      name: '页面方向',
      target: { type: 'page-orientation' },
      expected: { kind: 'enum', value: form.page.orientation },
      status: 'pending',
    }
  )

  // Paper size expected dimensions
  const paperDimensions: Record<string, { width: number; height: number }> = {
    A4: { width: 21.0, height: 29.7 },
    Letter: { width: 21.59, height: 27.94 },
    A3: { width: 29.7, height: 42.0 },
  }
  const dim = paperDimensions[form.page.paperSize]
  if (!dim) {
    throw new Error('Unsupported paper size')
  }
  rules.push(
    {
      id: 'page-size-width',
      category: 'page',
      name: '纸张宽度',
      target: { type: 'page-size', dimension: 'width' },
      expected: { kind: 'length', value: dim.width, unit: 'cm' },
      status: 'pending',
    },
    {
      id: 'page-size-height',
      category: 'page',
      name: '纸张高度',
      target: { type: 'page-size', dimension: 'height' },
      expected: { kind: 'length', value: dim.height, unit: 'cm' },
      status: 'pending',
    }
  )

  // Body rules
  const bodyFontSize = parseFloat(form.body.fontSize)
  if (Number.isNaN(bodyFontSize)) {
    throw new Error('Invalid font size value')
  }
  rules.push(
    {
      id: 'body-font-cn',
      category: 'body',
      name: '正文字体-中文',
      target: { type: 'font', scope: 'body', script: 'eastAsia' },
      expected: { kind: 'string', value: form.body.fontCn },
      status: 'pending',
    },
    {
      id: 'body-font-en',
      category: 'body',
      name: '正文字体-西文',
      target: { type: 'font', scope: 'body', script: 'ascii' },
      expected: { kind: 'string', value: form.body.fontEn },
      status: 'pending',
    },
    {
      id: 'body-font-size',
      category: 'body',
      name: '正文字号',
      target: { type: 'font-size', scope: 'body', script: 'eastAsia' },
      expected: { kind: 'length', value: bodyFontSize, unit: 'pt' },
      status: 'pending',
    },
    {
      id: 'body-line-spacing',
      category: 'body',
      name: '正文行距',
      target: { type: 'paragraph-spacing', scope: 'body', kind: 'line' },
      expected: parseLineSpacing(form.body.lineSpacing),
      status: 'pending',
    },
    {
      id: 'body-space-before',
      category: 'body',
      name: '正文段前间距',
      target: { type: 'paragraph-spacing', scope: 'body', kind: 'before' },
      expected: { kind: 'length', value: form.body.spaceBefore, unit: 'pt' },
      status: 'pending',
    },
    {
      id: 'body-space-after',
      category: 'body',
      name: '正文段后间距',
      target: { type: 'paragraph-spacing', scope: 'body', kind: 'after' },
      expected: { kind: 'length', value: form.body.spaceAfter, unit: 'pt' },
      status: 'pending',
    }
  )

  // Heading rules
  for (const h of form.headings) {
    const headingFontSize = parseFloat(h.fontSize)
    if (Number.isNaN(headingFontSize)) {
      throw new Error('Invalid heading font size value')
    }
    const prefix = `heading-${h.level}`
    rules.push(
      {
        id: `${prefix}-font`,
        category: 'heading',
        name: `${h.level}级标题字体`,
        target: { type: 'font', scope: 'heading', level: h.level, script: 'eastAsia' },
        expected: { kind: 'string', value: h.font },
        status: 'pending',
      },
      {
        id: `${prefix}-font-size`,
        category: 'heading',
        name: `${h.level}级标题字号`,
        target: { type: 'font-size', scope: 'heading', level: h.level, script: 'eastAsia' },
        expected: { kind: 'length', value: headingFontSize, unit: 'pt' },
        status: 'pending',
      },
      {
        id: `${prefix}-space-before`,
        category: 'heading',
        name: `${h.level}级标题段前间距`,
        target: { type: 'paragraph-spacing', scope: 'heading', level: h.level, kind: 'before' },
        expected: { kind: 'length', value: h.spaceBefore, unit: 'pt' },
        status: 'pending',
      },
      {
        id: `${prefix}-space-after`,
        category: 'heading',
        name: `${h.level}级标题段后间距`,
        target: { type: 'paragraph-spacing', scope: 'heading', level: h.level, kind: 'after' },
        expected: { kind: 'length', value: h.spaceAfter, unit: 'pt' },
        status: 'pending',
      },
      {
        id: `${prefix}-alignment`,
        category: 'heading',
        name: `${h.level}级标题对齐方式`,
        target: { type: 'alignment', scope: 'heading', level: h.level },
        expected: { kind: 'enum', value: h.alignment },
        status: 'pending',
      }
    )
  }

  return rules
}

function parseLineSpacing(value: string) {
  if (value.startsWith('固定值')) {
    const num = parseFloat(value.replace('固定值', '').trim())
    if (Number.isNaN(num)) {
      throw new Error('Invalid line spacing value')
    }
    return { kind: 'lineSpacing' as const, value: num, rule: 'exact' as const }
  }
  const num = parseFloat(value)
  if (Number.isNaN(num)) {
    throw new Error('Invalid line spacing value')
  }
  return { kind: 'lineSpacing' as const, value: num, rule: 'auto' as const }
}

export function rulesToFormData(rules: FormatRule[]): RuleFormData {
  const findExpected = (idPrefix: string) => rules.find((r) => r.id === idPrefix)?.expected
  const getLength = (rv: RuleValue | undefined) => rv?.kind === 'length' ? rv.value : 0
  const getString = (rv: RuleValue | undefined) => rv?.kind === 'string' ? rv.value : ''
  const getEnum = (rv: RuleValue | undefined) => rv?.kind === 'enum' ? rv.value : ''
  const getLineSpacing = (rv: RuleValue | undefined) => rv?.kind === 'lineSpacing' ? rv : { value: 1.5, rule: 'auto' as const }

  const width = getLength(findExpected('page-size-width'))
  const height = getLength(findExpected('page-size-height'))

  const bodyLineSpacing = getLineSpacing(findExpected('body-line-spacing'))

  const headings: RuleFormData['headings'] = []
  for (let level = 1; level <= 3; level++) {
    const font = getString(findExpected(`heading-${level}-font`))
    const fontSize = getLength(findExpected(`heading-${level}-font-size`))
    const spaceBefore = getLength(findExpected(`heading-${level}-space-before`))
    const spaceAfter = getLength(findExpected(`heading-${level}-space-after`))
    const alignment = getEnum(findExpected(`heading-${level}-alignment`))
    if (font || fontSize > 0) {
      headings.push({
        level,
        font: font || '黑体',
        fontSize: ptToFontSizeOption(fontSize || 12),
        spaceBefore: spaceBefore || 0,
        spaceAfter: spaceAfter || 0,
        alignment: alignment || 'left',
      })
    }
  }

  return {
    page: {
      marginTop: getLength(findExpected('page-margin-top')) || 2.54,
      marginBottom: getLength(findExpected('page-margin-bottom')) || 2.54,
      marginLeft: getLength(findExpected('page-margin-left')) || 3.17,
      marginRight: getLength(findExpected('page-margin-right')) || 3.17,
      paperSize: inferPaperSize(width, height),
      orientation: (getEnum(findExpected('page-orientation')) || 'portrait') as 'portrait' | 'landscape',
    },
    body: {
      fontCn: getString(findExpected('body-font-cn')) || '宋体',
      fontEn: getString(findExpected('body-font-en')) || 'Times New Roman',
      fontSize: ptToFontSizeOption(getLength(findExpected('body-font-size')) || 12),
      lineSpacing: lineSpacingToOption(bodyLineSpacing),
      spaceBefore: getLength(findExpected('body-space-before')) || 0,
      spaceAfter: getLength(findExpected('body-space-after')) || 0,
    },
    headings,
  }
}

function inferPaperSize(width: number, height: number): 'A4' | 'Letter' | 'A3' {
  const sizes: { name: 'A4' | 'Letter' | 'A3'; width: number; height: number }[] = [
    { name: 'A4', width: 21.0, height: 29.7 },
    { name: 'Letter', width: 21.59, height: 27.94 },
    { name: 'A3', width: 29.7, height: 42.0 },
  ]
  for (const s of sizes) {
    if (Math.abs(width - s.width) < 0.5 && Math.abs(height - s.height) < 0.5) {
      return s.name
    }
  }
  return 'A4'
}

function ptToFontSizeOption(pt: number): string {
  if (Math.abs(pt - 10.5) < 0.5) return '五号 10.5pt'
  if (Math.abs(pt - 12) < 0.5) return '小四 12pt'
  if (Math.abs(pt - 14) < 0.5) return '四号 14pt'
  return `${pt}pt`
}

function lineSpacingToOption(value: { value: number; rule: 'auto' | 'exact' }): string {
  if (value.rule === 'auto') {
    if (Math.abs(value.value - 1.0) < 0.05) return '1.0'
    if (Math.abs(value.value - 1.15) < 0.05) return '1.15'
    if (Math.abs(value.value - 1.5) < 0.05) return '1.5'
    if (Math.abs(value.value - 2.0) < 0.05) return '2.0'
    return String(value.value)
  }
  return `固定值 ${Math.round(value.value)} 磅`
}
