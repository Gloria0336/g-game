/**
 * AISettingsPanel — AI 文本生成設定面板
 *
 * 功能：
 * - 開關 AI 模式
 * - 輸入 OpenRouter API Key（存於 localStorage，不上傳）
 * - 選擇模型（Gemini 2.5 Flash / Grok 4.1 Fast）
 * - 驗證 API Key 連線
 */
import { useState } from 'react'
import { MODELS, verifyAPIKey } from '../engine/AIWriter.js'

export default function AISettingsPanel({ settings, onUpdate, onClose }) {
  const [showKey, setShowKey] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)

  const handleVerify = async () => {
    if (!settings.apiKey) return
    setVerifying(true)
    setVerifyResult(null)
    const result = await verifyAPIKey(settings.apiKey)
    setVerifyResult(result)
    setVerifying(false)
  }

  const handleKeyChange = (e) => {
    onUpdate({ apiKey: e.target.value })
    setVerifyResult(null)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="game-panel p-6 max-w-md w-full animate-fade-in">

        {/* 標題列 */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-game-accent font-medium">AI 文本生成</h2>
            <p className="text-gray-500 text-xs mt-0.5">由 OpenRouter 驅動・場景預生成方案</p>
          </div>
          <button className="text-gray-400 hover:text-white text-lg leading-none" onClick={onClose}>✕</button>
        </div>

        {/* 開關 */}
        <div
          className="flex items-center justify-between p-3 rounded border border-game-border bg-black/20 mb-5 cursor-pointer"
          onClick={() => onUpdate({ enabled: !settings.enabled })}
        >
          <div>
            <div className="text-sm text-white">啟用 AI 動態生成</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {settings.enabled ? '每次換場景時呼叫 AI 生成對話文字' : '使用預寫劇情文本（靜態模式）'}
            </div>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ml-4 ${settings.enabled ? 'bg-purple-600' : 'bg-gray-700'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.enabled ? 'left-6' : 'left-1'}`} />
          </div>
        </div>

        {/* API Key 輸入 */}
        <div className="mb-5">
          <label className="block text-xs text-gray-400 mb-1.5">
            OpenRouter API Key
            <span className="ml-2 text-gray-600">（僅存於本機 localStorage）</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={handleKeyChange}
                placeholder="sk-or-v1-..."
                className="w-full bg-black/40 border border-game-border rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-game-accent pr-9"
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
                onClick={() => setShowKey(v => !v)}
                tabIndex={-1}
              >
                {showKey ? '隱' : '顯'}
              </button>
            </div>
            <button
              className="px-3 py-2 text-xs rounded bg-purple-900/80 hover:bg-purple-800 text-white disabled:opacity-40 shrink-0 transition-colors"
              onClick={handleVerify}
              disabled={!settings.apiKey || verifying}
            >
              {verifying ? '驗證中…' : '驗證'}
            </button>
          </div>

          {/* 驗證結果 */}
          {verifyResult && (
            <p className={`text-xs mt-2 ${verifyResult.ok ? 'text-green-400' : 'text-red-400'}`}>
              {verifyResult.ok ? '✓' : '✗'} {verifyResult.message}
            </p>
          )}
        </div>

        {/* 模型選擇 */}
        <div className="mb-6">
          <label className="block text-xs text-gray-400 mb-2">模型選擇</label>
          <div className="flex flex-col gap-2">
            {MODELS.map(m => {
              const active = settings.modelId === m.id
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
                    active
                      ? 'border-game-accent bg-purple-900/30'
                      : 'border-game-border bg-black/20 hover:border-gray-500'
                  }`}
                  onClick={() => onUpdate({ modelId: m.id })}
                >
                  <div className={`w-3.5 h-3.5 mt-0.5 rounded-full border-2 shrink-0 transition-colors ${
                    active ? 'border-game-accent bg-game-accent' : 'border-gray-600'
                  }`} />
                  <div>
                    <div className="text-sm text-white">{m.label}</div>
                    <div className="text-xs text-gray-500">{m.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 提示 */}
        {settings.enabled && !settings.apiKey && (
          <p className="text-xs text-yellow-500 mb-4">
            ⚠ 啟用 AI 模式需要填入有效的 API Key，否則將自動回退至靜態文本。
          </p>
        )}

        <button
          className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 rounded text-white text-sm transition-colors"
          onClick={onClose}
        >
          確認
        </button>
      </div>
    </div>
  )
}
