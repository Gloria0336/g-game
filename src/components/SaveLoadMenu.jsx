/**
 * SaveLoadMenu — 存讀檔介面
 */
import { useState, useEffect } from 'react'
import { listSaves, saveGame, loadGame, deleteSave } from '../engine/SaveSystem.js'

export default function SaveLoadMenu({ state, onLoad, onClose }) {
  const [saves, setSaves] = useState([])
  const [mode, setMode] = useState('save') // 'save' | 'load'

  useEffect(() => {
    setSaves(listSaves())
  }, [])

  const handleSave = (slot) => {
    saveGame(slot, state)
    setSaves(listSaves())
  }

  const handleLoad = (slot) => {
    const data = loadGame(slot)
    if (data) {
      onLoad(data)
    }
  }

  const handleDelete = (slot) => {
    deleteSave(slot)
    setSaves(listSaves())
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="game-panel p-6 max-w-lg w-full animate-fade-in">
        {/* 標題列 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-game-accent text-lg font-medium">存讀檔</h2>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>✕</button>
        </div>

        {/* 模式切換 */}
        <div className="flex gap-2 mb-5">
          {['save', 'load'].map((m) => (
            <button
              key={m}
              className={`px-4 py-1.5 rounded text-sm transition-colors ${
                mode === m
                  ? 'bg-purple-700 text-white'
                  : 'bg-black/30 text-gray-400 hover:text-white'
              }`}
              onClick={() => setMode(m)}
            >
              {m === 'save' ? '儲存' : '讀取'}
            </button>
          ))}
        </div>

        {/* 槽位列表 */}
        <div className="flex flex-col gap-2">
          {saves.map((save, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-md border border-game-border bg-black/30">
              <span className="text-gray-500 text-xs w-10 shrink-0">#{idx + 1}</span>
              <div className="flex-1 text-sm">
                {save ? (
                  <span className="text-gray-200">
                    第 {save.chapter} 章 · {save.scene}
                    {save.route && <span className="ml-2 text-game-accent text-xs">[{save.route}]</span>}
                    <span className="ml-2 text-gray-500 text-xs">
                      {new Date(save.savedAt).toLocaleString('zh-TW')}
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-600">— 空槽位 —</span>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                {mode === 'save' ? (
                  <button
                    className="px-3 py-1 text-xs rounded bg-purple-800 hover:bg-purple-700 text-white"
                    onClick={() => handleSave(idx)}
                  >
                    存入
                  </button>
                ) : (
                  save && (
                    <button
                      className="px-3 py-1 text-xs rounded bg-emerald-800 hover:bg-emerald-700 text-white"
                      onClick={() => handleLoad(idx)}
                    >
                      讀取
                    </button>
                  )
                )}
                {save && (
                  <button
                    className="px-2 py-1 text-xs rounded bg-red-900/60 hover:bg-red-800 text-red-300"
                    onClick={() => handleDelete(idx)}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
