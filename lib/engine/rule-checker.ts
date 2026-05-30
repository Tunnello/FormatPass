import { FormatRule, RuleValue } from './rule-types'
import { ExtractedDocument, StyleData } from '../parser/xml-extractor'
import { resolveEffectiveStyle, resolveParagraphStyle } from '../parser/style-resolver'
import { twipToCm, twipToPt, halfPointToPt } from '../utils/unit-converter'

const TOLERANCE_CM = 0.06
const TOLERANCE_PT = 0.6

export function checkRules(
  rules: FormatRule[],
  doc: ExtractedDocument,
  styles: Map<string, StyleData>
): FormatRule[] {
  return rules.map((rule) => checkSingleRule(rule, doc, styles))
}

function getLocation(scope: string, level?: number): string {
  return `第 1 个${scope === 'heading' ? level + '级标题' : '正文段落'}`
}

function checkSingleRule(rule: FormatRule, doc: ExtractedDocument, styles: Map<string, StyleData>): FormatRule {
  const target = rule.target
  let actual: RuleValue | undefined
  let location: string | undefined

  if (target.type === 'page-margin') {
    const marginMap: Record<string, number> = {
      top: doc.pageSetup.marginTop,
      bottom: doc.pageSetup.marginBottom,
      left: doc.pageSetup.marginLeft,
      right: doc.pageSetup.marginRight,
    }
    const twip = marginMap[target.side]
    actual = { kind: 'length', value: parseFloat(twipToCm(twip).toFixed(2)), unit: 'cm' }
  } else if (target.type === 'page-size') {
    const sizeMap: Record<string, number> = {
      width: doc.pageSetup.width,
      height: doc.pageSetup.height,
    }
    actual = { kind: 'length', value: parseFloat(twipToCm(sizeMap[target.dimension]).toFixed(2)), unit: 'cm' }
  } else if (target.type === 'page-orientation') {
    actual = { kind: 'enum', value: doc.pageSetup.orientation }
  } else if (target.type === 'font' || target.type === 'font-size' || target.type === 'alignment' || target.type === 'paragraph-spacing') {
    const paragraphs = getTargetParagraphs(doc, target.scope, target.level)
    if (paragraphs.length === 0) {
      return { ...rule, status: 'fail', actual: undefined, location: '未检测到目标段落' }
    }

    const firstP = paragraphs[0]
    const effectiveRPr = resolveEffectiveStyle(firstP, styles, doc.defaultStyles)
    const effectivePPr = resolveParagraphStyle(firstP.pPr, firstP.styleId, styles, doc.defaultStyles)

    if (target.type === 'font') {
      const font = target.script === 'eastAsia' ? effectiveRPr.fontEastAsia : effectiveRPr.fontAscii
      actual = font ? { kind: 'string', value: font } : undefined
      location = getLocation(target.scope, target.level)
    } else if (target.type === 'font-size') {
      const size = effectiveRPr.fontSize
      actual = size ? { kind: 'length', value: halfPointToPt(size), unit: 'pt' } : undefined
      location = getLocation(target.scope, target.level)
    } else if (target.type === 'alignment') {
      const align = effectivePPr.alignment
      actual = align ? { kind: 'enum', value: align } : undefined
      location = getLocation(target.scope, target.level)
    } else if (target.type === 'paragraph-spacing') {
      let val: number | null = null
      if (target.kind === 'before') val = effectivePPr.spaceBefore
      else if (target.kind === 'after') val = effectivePPr.spaceAfter
      else if (target.kind === 'line' && effectivePPr.lineSpacing) {
        if (effectivePPr.lineSpacing.rule === 'auto') {
          actual = { kind: 'lineSpacing', value: effectivePPr.lineSpacing.value / 240, rule: 'auto' }
        } else {
          actual = { kind: 'lineSpacing', value: twipToPt(effectivePPr.lineSpacing.value), rule: 'exact' }
        }
      }
      if (val !== null) {
        actual = { kind: 'length', value: twipToPt(val), unit: 'pt' }
      }
      location = getLocation(target.scope, target.level)
    }
  }

  const status = compareValues(rule.expected, actual) ? 'pass' : 'fail'
  return { ...rule, status, actual, location }
}

function getTargetParagraphs(doc: ExtractedDocument, scope: string, level?: number) {
  if (scope === 'body') {
    return doc.paragraphs.filter((p) => {
      if (!p.styleId) return true
      const lower = p.styleId.toLowerCase()
      return !lower.includes('heading') && p.outlineLvl === undefined
    })
  }
  if (scope === 'heading' && level !== undefined) {
    return doc.paragraphs.filter((p) => {
      if (p.outlineLvl === level) return true
      const lower = (p.styleId || '').toLowerCase()
      return lower === `heading${level}` || lower === `heading ${level}` || lower === `标题${level}`
    })
  }
  return []
}

function compareValues(expected: RuleValue, actual: RuleValue | undefined): boolean {
  if (!actual) return false

  if (expected.kind === 'length' && actual.kind === 'length') {
    return compareLength(expected, actual)
  }

  if (expected.kind === 'string' && actual.kind === 'string') {
    return expected.value.toLowerCase().trim() === actual.value.toLowerCase().trim()
  }

  if (expected.kind === 'enum' && actual.kind === 'enum') {
    return expected.value === actual.value
  }

  if (expected.kind === 'lineSpacing' && actual.kind === 'lineSpacing') {
    if (expected.rule !== actual.rule) return false
    const diff = Math.abs(expected.value - actual.value)
    if (expected.rule === 'auto') return diff < 0.05
    return diff < TOLERANCE_PT
  }

  return false
}

function compareLength(expected: { value: number; unit: string }, actual: { value: number; unit: string }): boolean {
  let aVal: number
  if (actual.unit === expected.unit) {
    aVal = actual.value
  } else if (expected.unit === 'cm' && actual.unit === 'pt') {
    aVal = actual.value * 2.54 / 72
  } else if (expected.unit === 'pt' && actual.unit === 'cm') {
    aVal = actual.value * 72 / 2.54
  } else if (expected.unit === 'cm' && actual.unit === 'twip') {
    aVal = actual.value * 2.54 / 1440
  } else if (expected.unit === 'pt' && actual.unit === 'twip') {
    aVal = actual.value / 20
  } else {
    aVal = actual.value
  }
  const diff = Math.abs(expected.value - aVal)
  if (expected.unit === 'cm') return diff < TOLERANCE_CM
  if (expected.unit === 'pt') return diff < TOLERANCE_PT
  return diff < TOLERANCE_PT
}
