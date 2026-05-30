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
          <h2 className="text-2xl font-medium mb-1" style={{ color: '#0a0a0a' }}>填写格式规则</h2>
          <p className="text-sm text-muted">文件：{state.fileName}</p>
        </div>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="text-sm underline"
          style={{ color: '#6a6a6a' }}
        >
          更换文件
        </button>
      </div>

      {state.isProcessing && <ProgressBar progress={progress} />}

      <RuleAccordion title="📄 页面设置" defaultOpen>
        <div className="grid grid-cols-2 gap-4">
          {['marginTop', 'marginBottom', 'marginLeft', 'marginRight'].map((field) => (
            <label key={field} className="flex flex-col text-sm">
              <span className="mb-1 text-muted">页边距-{field.replace('margin', '').replace('Top','上').replace('Bottom','下').replace('Left','左').replace('Right','右')} (cm)</span>
              <input
                type="number"
                step={0.01}
                value={form.page[field as keyof typeof form.page] as number}
                onChange={(e) => updatePage(field, parseFloat(e.target.value))}
                className="px-3 py-2 rounded-md border text-sm"
                style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
              />
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">纸张大小</span>
            <select
              value={form.page.paperSize}
              onChange={(e) => updatePage('paperSize', e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            >
              {PAPER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">页面方向</span>
            <select
              value={form.page.orientation}
              onChange={(e) => updatePage('orientation', e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            >
              {ORIENTATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
      </RuleAccordion>

      <RuleAccordion title="✍️ 正文格式" defaultOpen>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">正文中文字体</span>
            <select
              value={form.body.fontCn}
              onChange={(e) => updateBody('fontCn', e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            >
              {FONT_CN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">正文西文字体</span>
            <select
              value={form.body.fontEn}
              onChange={(e) => updateBody('fontEn', e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            >
              {FONT_EN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">正文字号</span>
            <select
              value={form.body.fontSize}
              onChange={(e) => updateBody('fontSize', e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            >
              {FONT_SIZE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">行距</span>
            <select
              value={form.body.lineSpacing}
              onChange={(e) => updateBody('lineSpacing', e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            >
              {LINE_SPACING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">段前间距 (pt)</span>
            <input
              type="number"
              value={form.body.spaceBefore}
              onChange={(e) => updateBody('spaceBefore', parseFloat(e.target.value))}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">段后间距 (pt)</span>
            <input
              type="number"
              value={form.body.spaceAfter}
              onChange={(e) => updateBody('spaceAfter', parseFloat(e.target.value))}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            />
          </label>
        </div>
      </RuleAccordion>

      <RuleAccordion title="📌 标题格式">
        {form.headings.map((h, idx) => (
          <div key={h.level} className="mb-6 pb-6 border-b" style={{ borderColor: '#f0f0f0' }}>
            <h4 className="font-semibold text-sm mb-3" style={{ color: '#1a1a1a' }}>{h.level}级标题</h4>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-muted">字体</span>
                <select
                  value={h.font}
                  onChange={(e) => updateHeading(idx, 'font', e.target.value)}
                  className="px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
                >
                  {FONT_CN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-muted">字号</span>
                <select
                  value={h.fontSize}
                  onChange={(e) => updateHeading(idx, 'fontSize', e.target.value)}
                  className="px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
                >
                  {FONT_SIZE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-muted">段前间距 (pt)</span>
                <input
                  type="number"
                  value={h.spaceBefore}
                  onChange={(e) => updateHeading(idx, 'spaceBefore', parseFloat(e.target.value))}
                  className="px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
                />
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-muted">段后间距 (pt)</span>
                <input
                  type="number"
                  value={h.spaceAfter}
                  onChange={(e) => updateHeading(idx, 'spaceAfter', parseFloat(e.target.value))}
                  className="px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
                />
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-muted">对齐方式</span>
                <select
                  value={h.alignment}
                  onChange={(e) => updateHeading(idx, 'alignment', e.target.value)}
                  className="px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
                >
                  {ALIGNMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>
          </div>
        ))}
      </RuleAccordion>

      {state.error && <p className="my-4 text-sm text-center" style={{ color: '#ef4444' }}>{state.error}</p>}

      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={handleCheck}
          disabled={state.isProcessing}
          className="flex-1 px-5 py-3 rounded-md text-white font-semibold text-sm transition-opacity disabled:opacity-40"
          style={{ backgroundColor: '#1a3a2a', height: 44 }}
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
          className="px-5 py-3 rounded-md text-sm font-semibold border"
          style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44, color: '#0a0a0a' }}
        >
          重置规则
        </button>
      </div>
    </div>
  )
}
