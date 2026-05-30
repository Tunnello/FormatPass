'use client'

import React, { useCallback, useState } from 'react'
import { useApp } from '@/lib/context/AppContext'

const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30MB

export default function UploadZone() {
  const { dispatch } = useApp()
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateAndSetFile = useCallback(
    (file: File) => {
      setError(null)
      if (!file.name.endsWith('.docx')) {
        setError('请上传 .docx 格式的文件')
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('文件过大，建议拆分为章节分别检测（限制 30MB）')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer
        dispatch({ type: 'SET_FILE', fileName: file.name, fileBuffer: buffer })
      }
      reader.onerror = () => setError('文件读取失败')
      reader.readAsArrayBuffer(file)
    },
    [dispatch]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) validateAndSetFile(file)
    },
    [validateAndSetFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) validateAndSetFile(file)
    },
    [validateAndSetFile]
  )

  return (
    <div className="w-full max-w-lg">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center
          border-2 border-dashed rounded-xl p-12
          transition-colors cursor-pointer
          ${isDragging ? 'border-accent bg-surface-soft' : 'border-hairline bg-surface-card'}
        `}
        style={{ borderColor: isDragging ? '#1a3a2a' : '#e5e5e5', backgroundColor: isDragging ? '#faf5e8' : '#f5f0e0' }}
      >
        <input
          type="file"
          accept=".docx"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-4xl mb-3">📄</div>
        <p className="text-lg font-medium text-ink">拖拽或点击上传</p>
        <p className="text-sm text-muted mt-1">支持 .docx 格式</p>
      </div>
      {error && (
        <p className="mt-3 text-sm text-error text-center">{error}</p>
      )}
    </div>
  )
}
