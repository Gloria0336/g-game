/**
 * DiceModal — 骰點結果展示 Modal
 */
import { useState, useEffect } from 'react'

export default function DiceModal({ diceResult, onContinue }) {
  const [animating, setAnimating] = useState(true)
  const [shownRoll, setShownRoll] = useState(1)

  // 骰點滾動動畫
  useEffect(() => {
    let count = 0
    const total = 15
    const interval = setInterval(() => {
      setShownRoll(Math.floor(Math.random() * 20) + 1)
      count++
      if (count >= total) {
        clearInterval(interval)
        setShownRoll(diceResult.roll)
        setAnimating(false)
      }
    }, 60)
    return () => clearInterval(interval)
  }, [diceResult.roll])

  const { roll, bonus, total, dc, isCritSuccess, isCritFailure, success } = diceResult

  const resultColor = isCritSuccess
    ? 'text-yellow-300'
    : isCritFailure
    ? 'text-red-400'
    : success
    ? 'text-green-400'
    : 'text-red-400'

  const resultText = isCritSuccess
    ? '✨ 大成功！'
    : isCritFailure
    ? '💀 大失敗！'
    : success
    ? '✓ 成功'
    : '✗ 失敗'

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="game-panel p-8 max-w-sm w-full text-center animate-fade-in">
        <h3 className="text-game-accent text-lg font-medium mb-6">🎲 骰點判定</h3>

        {/* 骰子數字 */}
        <div className="text-7xl font-bold text-white mb-2 tabular-nums">
          {animating ? shownRoll : roll}
        </div>

        {!animating && (
          <>
            {/* 計算過程 */}
            <p className="text-gray-400 text-sm mb-1">
              {roll} + {bonus} (數值加成) = <span className="text-white font-bold">{total}</span>
            </p>
            <p className="text-gray-400 text-sm mb-4">
              難度 DC <span className="text-white">{dc}</span>
            </p>

            {/* 結果 */}
            <div className={`text-2xl font-bold ${resultColor} mb-6`}>
              {resultText}
            </div>

            <button
              className="px-6 py-2 bg-purple-800 hover:bg-purple-700 rounded-md text-white text-sm transition-colors"
              onClick={onContinue}
            >
              繼續
            </button>
          </>
        )}
      </div>
    </div>
  )
}
