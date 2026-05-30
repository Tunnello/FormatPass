'use client'

import { useRouter } from 'next/navigation'
import UploadZone from './components/UploadZone'
import { useApp } from '@/lib/context/AppContext'

export default function Home() {
  const router = useRouter()
  const { state } = useApp()

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="h-16 flex items-center justify-between px-6 bg-canvas">
        <div className="text-lg font-semibold">FormatPass</div>
        <div className="text-sm text-muted">关于</div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-4xl font-medium tracking-tight text-center mb-3 text-ink">
          毕业论文格式检测
        </h1>
        <p className="text-base text-center mb-10 text-body-text">
          上传论文，一键排查格式问题
        </p>

        <UploadZone />

        <button
          onClick={() => {
            if (state.fileBuffer) router.push('/rules')
          }}
          disabled={!state.fileBuffer}
          className="mt-8 px-5 py-3 rounded-md text-white font-semibold text-sm transition-opacity disabled:opacity-40 h-11 bg-accent"
        >
          开始检测
        </button>
      </div>
    </main>
  )
}
