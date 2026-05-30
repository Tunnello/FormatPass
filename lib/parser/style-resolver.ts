import { StyleData } from './xml-extractor'

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

export interface EffectiveStyle {
  fontSize: number | null
  fontAscii: string | null
  fontEastAsia: string | null
  bold: boolean | null
  italic: boolean | null
  alignment: string | null
  spaceBefore: number | null
  spaceAfter: number | null
  lineSpacing: { value: number; rule: 'auto' | 'exact' } | null
}

export function resolveEffectiveStyle(
  paragraph: { rPr: Element | null; pPr: Element | null; styleId?: string },
  styles: Map<string, StyleData>,
  docDefaults: { pPr: Element | null; rPr: Element | null }
): EffectiveStyle {
  const runProps = {
    fontSize: resolveNumericProp(paragraph.rPr, styles.get(paragraph.styleId || '')?.rPr, docDefaults.rPr, 'sz'),
    fontAscii: resolveStringProp(paragraph.rPr, styles.get(paragraph.styleId || '')?.rPr, docDefaults.rPr, 'rFonts', 'ascii'),
    fontEastAsia: resolveStringProp(paragraph.rPr, styles.get(paragraph.styleId || '')?.rPr, docDefaults.rPr, 'rFonts', 'eastAsia'),
    bold: resolveBoolProp(paragraph.rPr, styles.get(paragraph.styleId || '')?.rPr, docDefaults.rPr, 'b'),
    italic: resolveBoolProp(paragraph.rPr, styles.get(paragraph.styleId || '')?.rPr, docDefaults.rPr, 'i'),
  }
  const paraProps = resolveParagraphStyle(paragraph.pPr, paragraph.styleId, styles, docDefaults)
  return { ...runProps, ...paraProps }
}

export function resolveParagraphStyle(
  pPr: Element | null,
  styleId: string | undefined,
  styles: Map<string, StyleData>,
  docDefaults: { pPr: Element | null }
): Pick<EffectiveStyle, 'alignment' | 'spaceBefore' | 'spaceAfter' | 'lineSpacing'> {
  const stylePPr = styles.get(styleId || '')?.pPr
  const defaultPPr = docDefaults.pPr

  const spacingNode =
    pPr?.getElementsByTagNameNS(NS, 'spacing')[0] ||
    stylePPr?.getElementsByTagNameNS(NS, 'spacing')[0] ||
    defaultPPr?.getElementsByTagNameNS(NS, 'spacing')[0] ||
    null

  let lineSpacing: { value: number; rule: 'auto' | 'exact' } | null = null
  if (spacingNode) {
    const line = spacingNode.getAttributeNS(NS, 'line')
    const lineRule = spacingNode.getAttributeNS(NS, 'lineRule')
    if (line) {
      lineSpacing = {
        value: parseInt(line, 10),
        rule: lineRule === 'exact' ? 'exact' : 'auto',
      }
    }
  }

  return {
    alignment:
      pPr?.getElementsByTagNameNS(NS, 'jc')[0]?.getAttributeNS(NS, 'val') ||
      stylePPr?.getElementsByTagNameNS(NS, 'jc')[0]?.getAttributeNS(NS, 'val') ||
      null,
    spaceBefore: resolveAttrFromChain(spacingNode, 'before'),
    spaceAfter: resolveAttrFromChain(spacingNode, 'after'),
    lineSpacing,
  }
}

function resolveNumericProp(
  direct: Element | null,
  style: Element | null | undefined,
  defaultVal: Element | null,
  tag: string
): number | null {
  const val =
    direct?.getElementsByTagNameNS(NS, tag)[0]?.getAttributeNS(NS, 'val') ||
    style?.getElementsByTagNameNS(NS, tag)[0]?.getAttributeNS(NS, 'val') ||
    defaultVal?.getElementsByTagNameNS(NS, tag)[0]?.getAttributeNS(NS, 'val')
  return val ? parseInt(val, 10) : null
}

function resolveStringProp(
  direct: Element | null,
  style: Element | null | undefined,
  defaultVal: Element | null,
  tag: string,
  attr: string
): string | null {
  const node =
    direct?.getElementsByTagNameNS(NS, tag)[0] ||
    style?.getElementsByTagNameNS(NS, tag)[0] ||
    defaultVal?.getElementsByTagNameNS(NS, tag)[0]
  return node?.getAttributeNS(NS, attr) || null
}

function resolveBoolProp(
  direct: Element | null,
  style: Element | null | undefined,
  defaultVal: Element | null,
  tag: string
): boolean | null {
  const node =
    direct?.getElementsByTagNameNS(NS, tag)[0] ||
    style?.getElementsByTagNameNS(NS, tag)[0] ||
    defaultVal?.getElementsByTagNameNS(NS, tag)[0]
  if (!node) return null
  const val = node.getAttributeNS(NS, 'val')
  if (val === '0' || val === 'false') return false
  return true
}

function resolveAttrFromChain(node: Element | null | undefined, attr: string): number | null {
  if (!node) return null
  const val = node.getAttributeNS(NS, attr)
  return val ? parseInt(val, 10) : null
}
