/**
 * useAIR18Settings — R-18 AI 設定狀態管理（持久化至 localStorage）
 * 完全獨立於 useAISettings，儲存於不同的 key。
 * 不包含 apiKey（共用一般 AI 的 API 金鑰）。
 */
import { useState, useCallback } from 'react'
import { MODELS_R18 } from '../engine/AIWriterR18.js'

const STORAGE_KEY = 'heartlock_ai_r18'

const DEFAULTS = {
  enabled: false,
  modelId: MODELS_R18[0].id,
}

export function useAIR18Settings() {
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
