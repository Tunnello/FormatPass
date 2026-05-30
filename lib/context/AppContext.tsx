'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { FormatRule } from '../engine/rule-types'

interface AppState {
  fileName: string
  fileBuffer: ArrayBuffer | null
  rules: FormatRule[]
  report: FormatRule[] | null
  isProcessing: boolean
  error: string | null
}

type AppAction =
  | { type: 'SET_FILE'; fileName: string; fileBuffer: ArrayBuffer }
  | { type: 'SET_RULES'; rules: FormatRule[] }
  | { type: 'SET_REPORT'; report: FormatRule[] }
  | { type: 'START_PROCESSING' }
  | { type: 'STOP_PROCESSING' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' }

const initialState: AppState = {
  fileName: '',
  fileBuffer: null,
  rules: [],
  report: null,
  isProcessing: false,
  error: null,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, fileName: action.fileName, fileBuffer: action.fileBuffer, error: null }
    case 'SET_RULES':
      return { ...state, rules: action.rules }
    case 'SET_REPORT':
      return { ...state, report: action.report, isProcessing: false, error: null }
    case 'START_PROCESSING':
      return { ...state, isProcessing: true, error: null }
    case 'STOP_PROCESSING':
      return { ...state, isProcessing: false }
    case 'SET_ERROR':
      return { ...state, error: action.error, isProcessing: false }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'RESET':
      return { ...initialState }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
