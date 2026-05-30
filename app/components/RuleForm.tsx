'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { buildRulesFromForm } from '@/lib/engine/rule-builder'
import { RuleFormData } from '@/lib/engine/rule-types'
import { unzipDocx } from '@/lib/parser/docx-unzip'
import { extractDocument, extractStyles } from '@/lib/parser/xml-extractor'
import { checkRules } from '@/lib/engine/rule-checker'
import RuleAccordion from './RuleAccordion'
import ProgressBar from './ProgressBar'
import FormInput from './FormInput'
import FormSelect from './FormSelect'

const PAPER_OPTIONS = ['A4', 'Letter', 'A3']
const ORIENTATION_OPTIONS = [
  { value: 'portrait', label: '纵向' },
  { value: 'landscape', label: '横向' },
]
const FONT_CN_OPTIONS = ['宋体', '黑体', '仿宋', '楷体', '微软雅黑']
const FONT_EN_OPTIONS = ['Times New Roman', 'Arial', 'Calibri']
const FONT_SIZE_OPTIONS = ['小四 12pt', '四号 14pt', '五号 10.5pt', '12pt', '14pt', '16pt']
const LINE_SPACING_OPTIONS = ['1.0', '1.15', '1.5', '2.0', '固定值 20 磅', '固定值 24 磅']
const ALIGNMENT_OPTIONS = [
  { value: 'left', label: '左对齐' },
  { value: 'center', label: '居中' },
  { value: 'right', label: '右对齐' },
]

const marginLabels: Record<string, string> = {
  marginTop: '上',
  marginBottom: '下',
  marginLeft: '左',
  marginRight: '右',
}

export default function RuleForm() {
  const router = useRouter()
  const { state, dispatch } = useApp()
  const [progress, setProgress] = useState(0)

  const [form, setForm] = useState<RuleFormData>({
    page: { marginTop: 2.54, marginBottom: 2.54, marginLeft: 3.17, marginRight: 3.17, paperSize: 'A4', orientation: 'portrait' },
    body: { fontCn: '宋体', fontEn: 'Times New Roman', fontSize: '小四 12pt', lineSpacing: '1.5', spaceBefore: 0, spaceAfter: 0 },
    headings: [
      { level: 1, font: '黑体', fontSize: '16pt', spaceBefore: 24, spaceAfter: 12, alignment: 'center' },
      { level: 2, font: '黑体', fontSize: '14pt', spaceBefore: 18, spaceAfter: 6, alignment: 'left' },
      { level: 3, font: '黑体', fontSize: '12pt', spaceBefore: 12, spaceAfter: 6, alignment: 'left' },
    ],
  })

  const updatePage = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, page: { ...prev.page, [field]: value } }))
  const updateBody = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, body: { ...prev.body, [field]: value } }))
  const updateHeading = (index: number, field: string, value: string | number) =>
    setForm((prev) => {
      const next = [...prev.headings]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, headings: next }
    })

  const handleCheck = async () => {
    if (!state.fileBuffer) return
    dispatch({ type: 'START_PROCESSING' })
    setProgress(10)

    try {
      const { documentXml, stylesXml } = await unzipDocx(state.fileBuffer)
      setProgress(40)
      const doc = extractDocument(documentXml)
      const styles = stylesXml ? extractStyles(stylesXml) : new Map()
      setProgress(60)
      const rules = buildRulesFromForm(form)
      setProgress(80)
      const report = checkRules(rules, doc, styles)
      setProgress(100)
      dispatch({ type: 'SET_REPORT', report })
      router.push('/report')
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err.message || '检测失败' })
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium mb-1 text-ink">填写格式规则</h2>
          <p className="text-sm text-muted">文件：{state.fileName}</p>
        </div>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="text-sm underline text-muted"
        >
          更换文件
        </button>
      </div>

      {state.isProcessing && <ProgressBar progress={progress} />}

      <RuleAccordion title="📄 页面设置" defaultOpen>
        <div className="grid grid-cols-2 gap-4">
          {['marginTop', 'marginBottom', 'marginLeft', 'marginRight'].map((field) => (
            <FormInput
              key={field}
              id={`page-${field}`}
              label={`页边距-${marginLabels[field]} (cm)`}
              type="number"
              step={0.01}
              value={form.page[field as keyof typeof form.page] as number}
              onChange={(e) => updatePage(field, parseFloat(e.target.value))}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormSelect
            id="page-paperSize"
            label="纸张大小"
            value={form.page.paperSize}
            onChange={(e) => updatePage('paperSize', e.target.value)}
          >
            {PAPER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </FormSelect>
          <FormSelect
            id="page-orientation"
            label="页面方向"
            value={form.page.orientation}
            onChange={(e) => updatePage('orientation', e.target.value)}
          >
            {ORIENTATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </FormSelect>
        </div>
      </RuleAccordion>

      <RuleAccordion title="✍️ 正文格式" defaultOpen>
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            id="body-fontCn"
            label="正文中文字体"
            value={form.body.fontCn}
            onChange={(e) => updateBody('fontCn', e.target.value)}
          >
            {FONT_CN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </FormSelect>
          <FormSelect
            id="body-fontEn"
            label="正文西文字体"
            value={form.body.fontEn}
            onChange={(e) => updateBody('fontEn', e.target.value)}
          >
            {FONT_EN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </FormSelect>
          <FormSelect
            id="body-fontSize"
            label="正文字号"
            value={form.body.fontSize}
            onChange={(e) => updateBody('fontSize', e.target.value)}
          >
            {FONT_SIZE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </FormSelect>
          <FormSelect
            id="body-lineSpacing"
            label="行距"
            value={form.body.lineSpacing}
            onChange={(e) => updateBody('lineSpacing', e.target.value)}
          >
            {LINE_SPACING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </FormSelect>
          <FormInput
            id="body-spaceBefore"
            label="段前间距 (pt)"
            type="number"
            value={form.body.spaceBefore}
            onChange={(e) => updateBody('spaceBefore', parseFloat(e.target.value))}
          />
          <FormInput
            id="body-spaceAfter"
            label="段后间距 (pt)"
            type="number"
            value={form.body.spaceAfter}
            onChange={(e) => updateBody('spaceAfter', parseFloat(e.target.value))}
          />
        </div>
      </RuleAccordion>

      <RuleAccordion title="📌 标题格式">
        {form.headings.map((h, idx) => (
          <div key={idx} className="mb-6 pb-6 border-b border-[#f0f0f0]">
            <h4 className="font-semibold text-sm mb-3 text-body-strong">{h.level}级标题</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                id={`heading-${h.level}-font`}
                label="字体"
                value={h.font}
                onChange={(e) => updateHeading(idx, 'font', e.target.value)}
              >
                {FONT_CN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </FormSelect>
              <FormSelect
                id={`heading-${h.level}-fontSize`}
                label="字号"
                value={h.fontSize}
                onChange={(e) => updateHeading(idx, 'fontSize', e.target.value)}
              >
                {FONT_SIZE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </FormSelect>
              <FormInput
                id={`heading-${h.level}-spaceBefore`}
                label="段前间距 (pt)"
                type="number"
                value={h.spaceBefore}
                onChange={(e) => updateHeading(idx, 'spaceBefore', parseFloat(e.target.value))}
              />
              <FormInput
                id={`heading-${h.level}-spaceAfter`}
                label="段后间距 (pt)"
                type="number"
                value={h.spaceAfter}
                onChange={(e) => updateHeading(idx, 'spaceAfter', parseFloat(e.target.value))}
              />
              <FormSelect
                id={`heading-${h.level}-alignment`}
                label="对齐方式"
                value={h.alignment}
                onChange={(e) => updateHeading(idx, 'alignment', e.target.value)}
              >
                {ALIGNMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </FormSelect>
            </div>
          </div>
        ))}
      </RuleAccordion>

      {state.error && <p className="my-4 text-sm text-center text-error">{state.error}</p>}

      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={handleCheck}
          disabled={state.isProcessing}
          className="flex-1 px-5 py-3 rounded-md text-white font-semibold text-sm transition-opacity disabled:opacity-40 bg-accent h-11"
        >
          {state.isProcessing ? '检测中…' : '开始检测'}
        </button>
        <button
          onClick={() => setForm({
            page: { marginTop: 2.54, marginBottom: 2.54, marginLeft: 3.17, marginRight: 3.17, paperSize: 'A4', orientation: 'portrait' },
            body: { fontCn: '宋体', fontEn: 'Times New Roman', fontSize: '小四 12pt', lineSpacing: '1.5', spaceBefore: 0, spaceAfter: 0 },
            headings: [
              { level: 1, font: '黑体', fontSize: '16pt', spaceBefore: 24, spaceAfter: 12, alignment: 'center' },
              { level: 2, font: '黑体', fontSize: '14pt', spaceBefore: 18, spaceAfter: 6, alignment: 'left' },
              { level: 3, font: '黑体', fontSize: '12pt', spaceBefore: 12, spaceAfter: 6, alignment: 'left' },
            ],
          })}
          className="px-5 py-3 rounded-md text-sm font-semibold border border-hairline bg-canvas h-11 text-ink"
        >
          重置规则
        </button>
      </div>
    </div>
  )
}
