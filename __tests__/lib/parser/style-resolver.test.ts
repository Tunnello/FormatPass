import { resolveEffectiveStyle } from '@/lib/parser/style-resolver'
import { StyleData } from '@/lib/parser/xml-extractor'

describe('style-resolver', () => {
  const mockStyles = new Map<string, StyleData>()

  beforeEach(() => {
    mockStyles.clear()
    const normalRPr = new DOMParser().parseFromString(
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:styleId="Normal"><w:rPr><w:sz w:val="24"/></w:rPr></w:style></w:styles>',
      'application/xml'
    ).getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'style')[0].getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'rPr')[0]

    mockStyles.set('Normal', {
      styleId: 'Normal',
      type: 'paragraph',
      name: 'Normal',
      rPr: normalRPr,
      pPr: null,
    })
  })

  test('resolves font size from paragraph rPr directly', () => {
    const pRPr = new DOMParser().parseFromString(
      '<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:sz w:val="28"/></w:rPr>',
      'application/xml'
    ).documentElement

    const result = resolveEffectiveStyle({ rPr: pRPr, styleId: 'Normal' }, mockStyles, { pPr: null, rPr: null })
    expect(result.fontSize).toBe(28)
  })

  test('falls back to style rPr when paragraph has no direct formatting', () => {
    const result = resolveEffectiveStyle({ rPr: null, styleId: 'Normal' }, mockStyles, { pPr: null, rPr: null })
    expect(result.fontSize).toBe(24)
  })

  test('returns null for missing properties', () => {
    const result = resolveEffectiveStyle({ rPr: null, styleId: 'Unknown' }, mockStyles, { pPr: null, rPr: null })
    expect(result.fontSize).toBeNull()
  })
})
