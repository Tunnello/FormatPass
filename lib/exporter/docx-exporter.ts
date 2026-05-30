import { FormatRule } from '../engine/rule-types'
import { formatValue } from './format-value'
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  AlignmentType,
  HeadingLevel,
  TextRun,
  ShadingType,
} from 'docx'

export async function generateDocxReportBlob(fileName: string, rules: FormatRule[]): Promise<Blob> {
  const now = new Date().toLocaleString('zh-CN')
  const passedCount = rules.filter((r) => r.status === 'pass').length
  const failedCount = rules.filter((r) => r.status === 'fail').length

  const categories = [
    { key: 'page' as const, label: '📄 页面设置' },
    { key: 'body' as const, label: '✍️ 正文格式' },
    { key: 'heading' as const, label: '📌 标题格式' },
  ]

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: '格式检测报告',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ children: [new TextRun(`论文文件：${fileName}`)] }),
    new Paragraph({ children: [new TextRun(`检测时间：${now}`)] }),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({ text: `✅ 合格 ${passedCount} 项`, color: '22c55e' }),
        new TextRun('    '),
        new TextRun({ text: `❌ 不合格 ${failedCount} 项`, color: 'ef4444' }),
      ],
    }),
    new Paragraph({ text: '' }),
  ]

  for (const cat of categories) {
    const catRules = rules.filter((r) => r.category === cat.key)
    if (catRules.length === 0) continue

    children.push(
      new Paragraph({
        text: cat.label,
        heading: HeadingLevel.HEADING_2,
      })
    )

    const tableRows = [
      new TableRow({
        children: ['规则名称', '预期值', '实际值', '结果', '位置'].map(
          (header) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
              shading: { fill: 'f5f0e0', type: ShadingType.CLEAR },
            })
        ),
      }),
      ...catRules.map((rule) => {
        const isPass = rule.status === 'pass'
        return new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(rule.name)] }),
            new TableCell({ children: [new Paragraph(formatValue(rule.expected))] }),
            new TableCell({ children: [new Paragraph(formatValue(rule.actual))] }),
            new TableCell({
              children: [new Paragraph(isPass ? '通过' : '不通过')],
              shading: {
                fill: isPass ? '22c55e' : 'ef4444',
                type: ShadingType.CLEAR,
              },
            }),
            new TableCell({ children: [new Paragraph(rule.location ?? '')] }),
          ],
        })
      }),
    ]

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      })
    )

    children.push(new Paragraph({ text: '' }))
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  return await Packer.toBlob(doc)
}

