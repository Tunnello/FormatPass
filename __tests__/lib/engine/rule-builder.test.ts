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
})
