'use client'

import React, { useState, ReactNode } from 'react'

interface RuleAccordionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export default function RuleAccordion({ title, children, defaultOpen = false }: RuleAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border mb-4 overflow-hidden" style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-sm"
        style={{ color: '#0a0a0a' }}
      >
        <span>{title}</span>
        <span className="text-lg transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>
      {isOpen && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}
