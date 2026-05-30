import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/lib/context/AppContext'

export const metadata: Metadata = {
  title: 'FormatPass - 毕业论文格式检测',
  description: '上传论文，一键排查格式问题',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-canvas text-ink">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
