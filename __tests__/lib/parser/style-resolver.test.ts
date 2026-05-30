import { resolveEffectiveStyle, resolveParagraphStyle } from '@/lib/parser/style-resolver'
import { StyleData } from '@/lib/parser/xml-extractor'

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

function makeRPr(xml: string): Element {
  return new DOMParser().parseFromString(xml, 'application/xml').documentElement
}

function makePPr(xml: string): Element {
  return new DOMParser().parseFromString(xml, 'application/xml').documentElement
}

describe('style-resolver', () => {
  const mockStyles = new Map<string, StyleData>()

  beforeEach(() => {
    mockStyles.clear()
    const normalRPr = new DOMParser().parseFromString(
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:styleId="Normal"><w:rPr><w:sz w:val="24"/></w:rPr></w:style></w:styles>',
      'application/xml'
    ).getElementsByTagNameNS(NS, 'style')[0].getElementsByTagNameNS(NS, 'rPr')[0]

    mockStyles.set('Normal', {
      styleId: 'Normal',
      type: 'paragraph',
      name: 'Normal',
      rPr: normalRPr,
      pPr: null,
    })
  })

  test('resolves font size from paragraph rPr directly', () => {
    const pRPr = makeRPr('<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:sz w:val="28"/></w:rPr>')

    const result = resolveEffectiveStyle({ rPr: pRPr, pPr: null, styleId: 'Normal' }, mockStyles, { pPr: null, rPr: null })
    expect(result.fontSize).toBe(28)
  })

  test('falls back to style rPr when paragraph has no direct formatting', () => {
    const result = resolveEffectiveStyle({ rPr: null, pPr: null, styleId: 'Normal' }, mockStyles, { pPr: null, rPr: null })
    expect(result.fontSize).toBe(24)
  })

  test('returns null for missing properties', () => {
    const result = resolveEffectiveStyle({ rPr: null, pPr: null, styleId: 'Unknown' }, mockStyles, { pPr: null, rPr: null })
    expect(result.fontSize).toBeNull()
  })

  test('docDefaults fallback for font size', () => {
    const docDefaultsRPr = makeRPr('<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:sz w:val="20"/></w:rPr>')
    const result = resolveEffectiveStyle({ rPr: null, pPr: null, styleId: 'Unknown' }, mockStyles, { pPr: null, rPr: docDefaultsRPr })
    expect(result.fontSize).toBe(20)
  })

  test('resolveParagraphStyle resolves alignment, spacing, and lineSpacing from pPr chain', () => {
    const stylePPr = makePPr('<w:pPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:jc w:val="center"/><w:spacing w:before="120" w:after="80" w:line="360" w:lineRule="auto"/></w:pPr>')
    mockStyles.set('Heading1', {
      styleId: 'Heading1',
      type: 'paragraph',
      name: 'Heading 1',
      rPr: null,
      pPr: stylePPr,
    })

    const result = resolveParagraphStyle(null, 'Heading1', mockStyles, { pPr: null })
    expect(result.alignment).toBe('center')
    expect(result.spaceBefore).toBe(120)
    expect(result.spaceAfter).toBe(80)
    expect(result.lineSpacing).toEqual({ value: 360, rule: 'auto' })
  })

  test('fontAscii and fontEastAsia resolution from direct > style > default chain', () => {
    const defaultRPr = makeRPr('<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:rFonts w:ascii="DefaultFont" w:eastAsia="DefaultEA"/></w:rPr>')
    const styleRPr = makeRPr('<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:rFonts w:ascii="StyleFont" w:eastAsia="StyleEA"/></w:rPr>')
    mockStyles.set('Styled', {
      styleId: 'Styled',
      type: 'paragraph',
      name: 'Styled',
      rPr: styleRPr,
      pPr: null,
    })

    const directRPr = makeRPr('<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:rFonts w:ascii="DirectFont" w:eastAsia="DirectEA"/></w:rPr>')

    const directResult = resolveEffectiveStyle({ rPr: directRPr, pPr: null, styleId: 'Styled' }, mockStyles, { pPr: null, rPr: defaultRPr })
    expect(directResult.fontAscii).toBe('DirectFont')
    expect(directResult.fontEastAsia).toBe('DirectEA')

    const styleResult = resolveEffectiveStyle({ rPr: null, pPr: null, styleId: 'Styled' }, mockStyles, { pPr: null, rPr: defaultRPr })
    expect(styleResult.fontAscii).toBe('StyleFont')
    expect(styleResult.fontEastAsia).toBe('StyleEA')

    const defaultResult = resolveEffectiveStyle({ rPr: null, pPr: null, styleId: 'Unknown' }, mockStyles, { pPr: null, rPr: defaultRPr })
    expect(defaultResult.fontAscii).toBe('DefaultFont')
    expect(defaultResult.fontEastAsia).toBe('DefaultEA')
  })

  test('bold edge cases: val="0" returns false, presence without val returns true', () => {
    const rPrFalse = makeRPr('<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:b w:val="0"/></w:rPr>')
    const resultFalse = resolveEffectiveStyle({ rPr: rPrFalse, pPr: null, styleId: 'Normal' }, mockStyles, { pPr: null, rPr: null })
    expect(resultFalse.bold).toBe(false)

    const rPrTrue = makeRPr('<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:b/></w:rPr>')
    const resultTrue = resolveEffectiveStyle({ rPr: rPrTrue, pPr: null, styleId: 'Normal' }, mockStyles, { pPr: null, rPr: null })
    expect(resultTrue.bold).toBe(true)
  })

  test('missing bold tag returns null', () => {
    const result = resolveEffectiveStyle({ rPr: null, pPr: null, styleId: 'Normal' }, mockStyles, { pPr: null, rPr: null })
    expect(result.bold).toBeNull()
  })
})
