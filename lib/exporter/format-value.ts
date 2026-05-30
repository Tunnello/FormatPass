export function formatValue(v: { kind: string; value: number | string; unit?: string; rule?: string } | undefined): string {
  if (!v) return '未检测到'
  if (v.kind === 'length') return `${v.value} ${v.unit}`
  if (v.kind === 'lineSpacing') return v.rule === 'auto' ? `${v.value} 倍` : `${v.value} 磅`
  if (v.kind === 'enum') return String(v.value)
  return String(v.value)
}
