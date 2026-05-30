import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FormatPass - 毕业论文格式检测',
  description: '上传论文，一键排查格式问题',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen bg-canvas text-ink`}>
        {children}
      </body>
    </html>
  )
}
