'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RuleForm from '../components/RuleForm'
import { useApp } from '@/lib/context/AppContext'

export default function RulesPage() {
  const router = useRouter()
  const { state } = useApp()

  useEffect(() => {
    if (!state.fileBuffer) {
      router.replace('/')
    }
  }, [state.fileBuffer, router])

  if (!state.fileBuffer) return null

  return (
    <main className="min-h-screen">
      <nav className="h-16 flex items-center px-6 bg-canvas">
        <div className="text-lg font-semibold">FormatPass</div>
      </nav>
      <RuleForm />
    </main>
  )
}
