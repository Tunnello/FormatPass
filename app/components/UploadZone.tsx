'use client'

import React, { useCallback, useRef, useState } from 'react'
import { useApp } from '@/lib/context/AppContext'

const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30MB

interface UploadZoneProps {
  role: 'thesis' | 'template'
  label: string
}

export default function UploadZone({ role, label }: UploadZoneProps) {
  const { state, dispatch } = useApp()
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSuccess = useCallback(() => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current)
      successTimerRef.current = null
    }
  }, [])

  const validateAndSetFile = useCallback(
    (file: File) => {
      setError(null)
      clearSuccess()
      setUploadSuccess(false)
      if (!file.name.endsWith('.docx')) {
        setError('请上传 .docx 格式的文件')
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('文件过大，建议拆分为章节分别检测（限制 30MB）')
        return
      }
      const reader = new FileReader()
      reader.onloadstart = () => {
        setIsUploading(true)
        setUploadProgress(0)
      }
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer
        dispatch({ type: 'SET_FILE', role, fileName: file.name, fileBuffer: buffer })
        setUploadSuccess(true)
        successTimerRef.current = setTimeout(() => {
          setUploadSuccess(false)
        }, 3000)
      }
      reader.onloadend = () => {
        setIsUploading(false)
      }
      reader.onerror = () => {
        setError('文件读取失败')
        setIsUploading(false)
      }
      reader.readAsArrayBuffer(file)
    },
    [dispatch, clearSuccess, role]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

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

  const fileName = role === 'thesis' ? state.thesisFileName : state.templateFileName

  return (
    <div className="w-full">
      <p className="text-sm font-medium text-ink mb-2">{label}</p>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center
          border-2 border-dashed rounded-xl p-12
          transition-colors cursor-pointer
          ${isDragging ? 'border-[#1a3a2a] bg-[#faf5e8]' : 'border-[#e5e5e5] bg-[#f5f0e0]'}
          ${state.isProcessing || isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          type="file"
          accept=".docx"
          onChange={handleChange}
          disabled={state.isProcessing || isUploading}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby="upload-error"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {isUploading ? (
          <div className="w-full px-8 flex flex-col items-center">
            <p className="text-sm font-medium text-ink mb-3">读取中...</p>
            <div className="w-full bg-surface-strong rounded-full h-2 overflow-hidden max-w-[200px]">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-100"
                style={{ width: `${uploadProgress}%` }}
                role="progressbar"
                aria-valuenow={uploadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="text-xs text-muted mt-2">{uploadProgress}%</p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-3">📄</div>
            <p className="text-lg font-medium text-ink">拖拽或点击上传</p>
            <p className="text-sm text-muted mt-1">支持 .docx 格式</p>
          </>
        )}
      </div>
      {fileName && !isUploading && (
        <p className="mt-3 text-sm text-muted text-center truncate">已选择：{fileName}</p>
      )}
      {uploadSuccess && !error && (
        <p className="mt-3 text-sm text-success text-center font-medium">✅ 上传完成</p>
      )}
      {error && (
        <p id="upload-error" className="mt-3 text-sm text-error text-center">{error}</p>
      )}
    </div>
  )
}
