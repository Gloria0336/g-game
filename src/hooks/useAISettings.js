/**
 * useAISettings — AI 設定狀態管理（持久化至 localStorage）
 */
import { useState, useCallback } from 'react'
import { MODELS } from '../engine/AIWriter.js'

const STORAGE_KEY = 'heartlock_ai'

const DEFAULTS = {
  enabled: false,
  apiKey: '',
  modelId: MODELS[0].id,
}

export function useAISettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS }
    } catch {
      return { ...DEFAULTS }
    }
  })

  const update = useCallback((patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { settings, update }
}
