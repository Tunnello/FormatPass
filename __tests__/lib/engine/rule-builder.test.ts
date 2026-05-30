import { buildRulesFromForm } from '@/lib/engine/rule-builder'
import { RuleFormData } from '@/lib/engine/rule-types'

describe('rule-builder', () => {
  const minimalForm: RuleFormData = {
    page: {
      marginTop: 2.54,
      marginBottom: 2.54,
      marginLeft: 3.17,
      marginRight: 3.17,
      paperSize: 'A4',
      orientation: 'portrait',
    },
    body: {
      fontCn: '宋体',
      fontEn: 'Times New Roman',
      fontSize: '12pt',
      lineSpacing: '1.5',
      spaceBefore: 0,
      spaceAfter: 0,
    },
    headings: [
      { level: 1, font: '黑体', fontSize: '16pt', spaceBefore: 24, spaceAfter: 12, alignment: 'center' },
    ],
  }

  test('builds rules from form data', () => {
    const rules = buildRulesFromForm(minimalForm)
    expect(rules.length).toBeGreaterThan(0)
    expect(rules.some((r) => r.category === 'page')).toBe(true)
    expect(rules.some((r) => r.category === 'body')).toBe(true)
    expect(rules.some((r) => r.category === 'heading')).toBe(true)
  })

  test('page margin rules have correct targets', () => {
    const rules = buildRulesFromForm(minimalForm)
    const topMargin = rules.find((r) => r.target.type === 'page-margin' && r.target.side === 'top')
    expect(topMargin).toBeDefined()
    expect(topMargin!.expected).toEqual({ kind: 'length', value: 2.54, unit: 'cm' })
  })

  test('heading rules include level in target', () => {
    const rules = buildRulesFromForm(minimalForm)
    const h1Font = rules.find(
      (r) => r.target.type === 'font' && r.target.scope === 'heading' && r.target.level === 1
    )
    expect(h1Font).toBeDefined()
    expect(h1Font!.expected).toEqual({ kind: 'string', value: '黑体' })
  })

  test('generates all 4 margin sides with correct expected values', () => {
    const rules = buildRulesFromForm(minimalForm)
    const sides = ['top', 'bottom', 'left', 'right'] as const
    const values = {
      top: minimalForm.page.marginTop,
      bottom: minimalForm.page.marginBottom,
      left: minimalForm.page.marginLeft,
      right: minimalForm.page.marginRight,
    }
    for (const side of sides) {
      const rule = rules.find((r) => r.target.type === 'page-margin' && r.target.side === side)
      expect(rule).toBeDefined()
      expect(rule!.expected).toEqual({ kind: 'length', value: values[side], unit: 'cm' })
    }
  })

  test('generates paper size dimensions for A4', () => {
    const rules = buildRulesFromForm(minimalForm)
    const widthRule = rules.find((r) => r.target.type === 'page-size' && r.target.dimension === 'width')
    const heightRule = rules.find((r) => r.target.type === 'page-size' && r.target.dimension === 'height')
    expect(widthRule).toBeDefined()
    expect(widthRule!.expected).toEqual({ kind: 'length', value: 21.0, unit: 'cm' })
    expect(heightRule).toBeDefined()
    expect(heightRule!.expected).toEqual({ kind: 'length', value: 29.7, unit: 'cm' })
  })

  test('body rules include fontEn, lineSpacing, spaceBefore, spaceAfter', () => {
    const rules = buildRulesFromForm(minimalForm)
    const fontEn = rules.find((r) => r.id === 'body-font-en')
    const lineSpacing = rules.find((r) => r.id === 'body-line-spacing')
    const spaceBefore = rules.find((r) => r.id === 'body-space-before')
    const spaceAfter = rules.find((r) => r.id === 'body-space-after')
    expect(fontEn).toBeDefined()
    expect(fontEn!.expected).toEqual({ kind: 'string', value: 'Times New Roman' })
    expect(lineSpacing).toBeDefined()
    expect(lineSpacing!.expected).toEqual({ kind: 'lineSpacing', value: 1.5, rule: 'auto' })
    expect(spaceBefore).toBeDefined()
    expect(spaceBefore!.expected).toEqual({ kind: 'length', value: 0, unit: 'pt' })
    expect(spaceAfter).toBeDefined()
    expect(spaceAfter!.expected).toEqual({ kind: 'length', value: 0, unit: 'pt' })
  })

  test('parseLineSpacing handles auto and exact correctly', () => {
    const autoForm: RuleFormData = {
      ...minimalForm,
      body: { ...minimalForm.body, lineSpacing: '1.5' },
      headings: [
        { level: 1, font: '黑体', fontSize: '16pt', spaceBefore: 24, spaceAfter: 12, alignment: 'center' },
      ],
    }
    const exactForm: RuleFormData = {
      ...minimalForm,
      body: { ...minimalForm.body, lineSpacing: '固定值 20 磅' },
      headings: [
        { level: 1, font: '黑体', fontSize: '16pt', spaceBefore: 24, spaceAfter: 12, alignment: 'center' },
      ],
    }
    const autoRules = buildRulesFromForm(autoForm)
    const exactRules = buildRulesFromForm(exactForm)
    const autoLineSpacing = autoRules.find((r) => r.id === 'body-line-spacing')
    const exactLineSpacing = exactRules.find((r) => r.id === 'body-line-spacing')
    expect(autoLineSpacing!.expected).toEqual({ kind: 'lineSpacing', value: 1.5, rule: 'auto' })
    expect(exactLineSpacing!.expected).toEqual({ kind: 'lineSpacing', value: 20, rule: 'exact' })
  })

  test('3 heading levels each have 5 rules', () => {
    const form: RuleFormData = {
      ...minimalForm,
      headings: [
        { level: 1, font: '黑体', fontSize: '16pt', spaceBefore: 24, spaceAfter: 12, alignment: 'center' },
        { level: 2, font: '黑体', fontSize: '14pt', spaceBefore: 18, spaceAfter: 9, alignment: 'left' },
        { level: 3, font: '楷体', fontSize: '12pt', spaceBefore: 12, spaceAfter: 6, alignment: 'left' },
      ],
    }
    const rules = buildRulesFromForm(form)
    for (const level of [1, 2, 3]) {
      const headingRules = rules.filter((r) => r.category === 'heading' && r.target.level === level)
      expect(headingRules.length).toBe(5)
    }
  })

  test('unsupported paper size throws error', () => {
    const form: RuleFormData = {
      ...minimalForm,
      page: { ...minimalForm.page, paperSize: 'B5' },
    }
    expect(() => buildRulesFromForm(form)).toThrow('Unsupported paper size')
  })

  test('invalid fontSize throws error', () => {
    const form: RuleFormData = {
      ...minimalForm,
      body: { ...minimalForm.body, fontSize: 'invalid' },
    }
    expect(() => buildRulesFromForm(form)).toThrow('Invalid font size value')
  })
})
