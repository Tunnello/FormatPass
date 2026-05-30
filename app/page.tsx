'use client'

import { useRouter } from 'next/navigation'
import UploadZone from './components/UploadZone'
import { useApp } from '@/lib/context/AppContext'

export default function Home() {
  const router = useRouter()
  const { state } = useApp()

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="h-16 flex items-center justify-between px-6" style={{ backgroundColor: '#fffaf0' }}>
        <div className="text-lg font-semibold">FormatPass</div>
        <div className="text-sm text-muted">关于</div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-4xl font-medium tracking-tight text-center mb-3" style={{ color: '#0a0a0a', letterSpacing: '-1px' }}>
          毕业论文格式检测
        </h1>
        <p className="text-base text-center mb-10" style={{ color: '#3a3a3a' }}>
          上传论文，一键排查格式问题
        </p>

        <UploadZone />

        <button
          onClick={() => {
            if (state.fileBuffer) router.push('/rules')
          }}
          disabled={!state.fileBuffer}
          className="mt-8 px-5 py-3 rounded-md text-white font-semibold text-sm transition-opacity disabled:opacity-40"
          style={{ backgroundColor: '#1a3a2a', height: 44 }}
        >
          开始检测
        </button>
      </div>
    </main>
  )
}
