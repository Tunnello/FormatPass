const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

export interface ParagraphData {
  text: string
  styleId?: string
  outlineLvl?: number
  pPr: Element | null
  rPr: Element | null
}

export interface StyleData {
  styleId: string
  name?: string
  type: string
  basedOn?: string
  isDefault?: boolean
  pPr: Element | null
  rPr: Element | null
}

export interface PageSetup {
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
}

export interface ExtractedDocument {
  paragraphs: ParagraphData[]
  pageSetup: PageSetup
  defaultStyles: {
    pPr: Element | null
    rPr: Element | null
  }
}

export function extractDocument(xmlString: string): ExtractedDocument {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')

  const body = doc.getElementsByTagNameNS(NS, 'body')[0]
  const paragraphs: ParagraphData[] = []

  if (body) {
    const pElements = body.getElementsByTagNameNS(NS, 'p')
    for (let i = 0; i < pElements.length; i++) {
      const p = pElements[i]
      paragraphs.push(parseParagraph(p))
    }
  }

  const sectPr = doc.getElementsByTagNameNS(NS, 'sectPr')[0]
  const pageSetup = parsePageSetup(sectPr)

  const docDefaults = doc.getElementsByTagNameNS(NS, 'docDefaults')[0]
  const defaultStyles = {
    pPr: docDefaults?.getElementsByTagNameNS(NS, 'pPrDefault')[0]?.getElementsByTagNameNS(NS, 'pPr')[0] ?? null,
    rPr: docDefaults?.getElementsByTagNameNS(NS, 'rPrDefault')[0]?.getElementsByTagNameNS(NS, 'rPr')[0] ?? null,
  }

  return { paragraphs, pageSetup, defaultStyles }
}

function parseParagraph(p: Element): ParagraphData {
  const pPr = p.getElementsByTagNameNS(NS, 'pPr')[0] ?? null
  const runs = p.getElementsByTagNameNS(NS, 'r')
  const texts: string[] = []
  let runRPr: Element | null = null

  for (let i = 0; i < runs.length; i++) {
    const r = runs[i]
    const tNodes = r.getElementsByTagNameNS(NS, 't')
    for (let j = 0; j < tNodes.length; j++) {
      texts.push(tNodes[j].textContent || '')
    }
    if (!runRPr) {
      runRPr = r.getElementsByTagNameNS(NS, 'rPr')[0] ?? null
    }
  }

  const styleId = pPr?.getElementsByTagNameNS(NS, 'pStyle')[0]?.getAttributeNS(NS, 'val') || undefined
  const outlineLvlNode = pPr?.getElementsByTagNameNS(NS, 'outlineLvl')[0]
  const outlineLvl = outlineLvlNode ? parseInt(outlineLvlNode.getAttributeNS(NS, 'val') || '0', 10) : undefined

  return {
    text: texts.join(''),
    styleId,
    outlineLvl,
    pPr,
    rPr: runRPr,
  }
}

function parsePageSetup(sectPr: Element | undefined): PageSetup {
  const defaultSetup: PageSetup = {
    width: 11906,
    height: 16838,
    orientation: 'portrait',
    marginTop: 1440,
    marginBottom: 1440,
    marginLeft: 1440,
    marginRight: 1440,
  }

  if (!sectPr) return defaultSetup

  const pgSz = sectPr.getElementsByTagNameNS(NS, 'pgSz')[0]
  const pgMar = sectPr.getElementsByTagNameNS(NS, 'pgMar')[0]

  if (pgSz) {
    defaultSetup.width = parseInt(pgSz.getAttributeNS(NS, 'w') || '11906', 10)
    defaultSetup.height = parseInt(pgSz.getAttributeNS(NS, 'h') || '16838', 10)
    const orient = pgSz.getAttributeNS(NS, 'orient')
    if (orient === 'landscape') defaultSetup.orientation = 'landscape'
  }

  if (pgMar) {
    defaultSetup.marginTop = parseInt(pgMar.getAttributeNS(NS, 'top') || '1440', 10)
    defaultSetup.marginBottom = parseInt(pgMar.getAttributeNS(NS, 'bottom') || '1440', 10)
    defaultSetup.marginLeft = parseInt(pgMar.getAttributeNS(NS, 'left') || '1440', 10)
    defaultSetup.marginRight = parseInt(pgMar.getAttributeNS(NS, 'right') || '1440', 10)
  }

  return defaultSetup
}

export function extractStyles(xmlString: string): Map<string, StyleData> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')
  const styles = new Map<string, StyleData>()

  const styleElements = doc.getElementsByTagNameNS(NS, 'style')
  for (let i = 0; i < styleElements.length; i++) {
    const s = styleElements[i]
    const styleId = s.getAttributeNS(NS, 'styleId') || ''
    const type = s.getAttributeNS(NS, 'type') || ''
    const isDefault = s.hasAttributeNS(NS, 'default')
    const nameNode = s.getElementsByTagNameNS(NS, 'name')[0]
    const name = nameNode?.getAttributeNS(NS, 'val') || undefined
    const basedOn = s.getElementsByTagNameNS(NS, 'basedOn')[0]?.getAttributeNS(NS, 'val') || undefined
    const pPr = s.getElementsByTagNameNS(NS, 'pPr')[0] ?? null
    const rPr = s.getElementsByTagNameNS(NS, 'rPr')[0] ?? null

    styles.set(styleId, { styleId, name, type, basedOn, isDefault, pPr, rPr })
  }

  return styles
}
