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
    <div className="rounded-lg border border-hairline bg-canvas mb-4 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-sm text-ink"
        aria-expanded={isOpen}
        aria-controls="accordion-panel"
      >
        <span>{title}</span>
        <span className={`text-lg transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && <div id="accordion-panel" className="px-5 pb-5">{children}</div>}
    </div>
  )
}
