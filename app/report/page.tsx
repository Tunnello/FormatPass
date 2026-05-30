'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReportView from '../components/ReportView'
import ReportExport from '../components/ReportExport'
import { useApp } from '@/lib/context/AppContext'

export default function ReportPage() {
  const router = useRouter()
  const { state } = useApp()

  useEffect(() => {
    if (!state.report) {
      router.replace('/')
    }
  }, [state.report, router])

  if (!state.report) return null

  return (
    <main className="min-h-screen">
      <nav className="h-16 flex items-center justify-between px-6 bg-canvas">
        <div className="text-lg font-semibold">FormatPass</div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/rules')}
            className="text-sm font-medium text-accent"
          >
            ← 修改规则重新检测
          </button>
        </div>
      </nav>
      <ReportView rules={state.report} />
      <ReportExport />
    </main>
  )
}
