import { FormatRule, RuleFormData } from './rule-types'

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
  if (dim) {
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
  }

  // Body rules
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
      expected: { kind: 'length', value: parseFloat(form.body.fontSize), unit: 'pt' },
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
        expected: { kind: 'length', value: parseFloat(h.fontSize), unit: 'pt' },
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
    return { kind: 'lineSpacing' as const, value: num, rule: 'exact' as const }
  }
  return { kind: 'lineSpacing' as const, value: parseFloat(value), rule: 'auto' as const }
}
