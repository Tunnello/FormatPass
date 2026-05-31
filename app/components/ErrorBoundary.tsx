'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <h2 className="text-xl font-semibold mb-2 text-ink">出错了</h2>
          <p className="text-sm text-muted mb-4">应用遇到意外错误，请刷新页面重试。</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-3 rounded-md text-white text-sm font-semibold bg-accent h-11"
          >
            刷新页面
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
