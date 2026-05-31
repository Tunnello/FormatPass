'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RuleForm from '../components/RuleForm'
import { useApp } from '@/lib/context/AppContext'
import { unzipDocx } from '@/lib/parser/docx-unzip'
import { extractDocument, extractStyles } from '@/lib/parser/xml-extractor'
import { extractRulesFromTemplate } from '@/lib/engine/rule-extractor'

export default function RulesPage() {
  const router = useRouter()
  const { state, dispatch } = useApp()

  useEffect(() => {
    if (!state.thesisFileBuffer) {
      router.replace('/')
    }
  }, [state.thesisFileBuffer, router])

  useEffect(() => {
    if (state.templateFileBuffer && state.rules.length === 0) {
      unzipDocx(state.templateFileBuffer)
        .then(({ documentXml, stylesXml }) => {
          const doc = extractDocument(documentXml)
          const styles = stylesXml ? extractStyles(stylesXml) : new Map()
          const extracted = extractRulesFromTemplate(doc, styles)
          dispatch({ type: 'SET_RULES', rules: extracted })
        })
        .catch((err) => {
          dispatch({ type: 'SET_ERROR', error: err.message || '模板规则提取失败' })
        })
    }
  }, [state.templateFileBuffer, state.rules.length, dispatch])

  if (!state.thesisFileBuffer) return null

  return (
    <main className="min-h-screen">
      <nav className="h-16 flex items-center px-6 bg-canvas">
        <div className="text-lg font-semibold">FormatPass</div>
      </nav>
      <RuleForm />
    </main>
  )
}
