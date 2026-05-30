export interface FormatRule {
  id: string
  category: 'page' | 'body' | 'heading'
  name: string
  target: RuleTarget
  expected: RuleValue
  actual?: RuleValue
  status: 'pending' | 'pass' | 'fail'
  location?: string
}

export type RuleTarget =
  | { type: 'page-margin'; side: 'top' | 'bottom' | 'left' | 'right' }
  | { type: 'page-size'; dimension: 'width' | 'height' }
  | { type: 'page-orientation' }
  | { type: 'font'; scope: 'body' | 'heading'; level?: number; script: 'ascii' | 'eastAsia' }
  | { type: 'font-size'; scope: 'body' | 'heading'; level?: number; script: 'ascii' | 'eastAsia' }
  | { type: 'paragraph-spacing'; scope: 'body' | 'heading'; level?: number; kind: 'before' | 'after' | 'line' }
  | { type: 'alignment'; scope: 'body' | 'heading'; level?: number }

export type RuleValue =
  | { kind: 'length'; value: number; unit: 'cm' | 'pt' | 'twip' }
  | { kind: 'string'; value: string }
  | { kind: 'enum'; value: string }
  | { kind: 'lineSpacing'; value: number; rule: 'auto' | 'exact' }

export interface RuleFormData {
  page: {
    marginTop: number
    marginBottom: number
    marginLeft: number
    marginRight: number
    paperSize: 'A4' | 'Letter' | 'A3'
    orientation: 'portrait' | 'landscape'
  }
  body: {
    fontCn: string
    fontEn: string
    fontSize: string
    lineSpacing: string
    spaceBefore: number
    spaceAfter: number
  }
  headings: {
    level: number
    font: string
    fontSize: string
    spaceBefore: number
    spaceAfter: number
    alignment: string
  }[]
}
