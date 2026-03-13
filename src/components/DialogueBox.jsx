/**
 * DialogueBox — 對話框 UI（含打字機效果）
 */
import { useState, useEffect, useRef } from 'react'
import charactersData from '../data/characters.json'

const SPEAKER_NAMES = {
  narrator: null,
  heroine: '妳',
  ...Object.fromEntries(
    (charactersData?.characters ?? []).map((c) => [c.id, c.name])
  ),
}

export default function DialogueBox({ dialogue, onAdvance, isChoiceNext = false }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const fullText = dialogue?.text ?? ''
  const timerRef = useRef(null)

  // 打字機效果
  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    timerRef.current = setInterval(() => {
      i++
      setDisplayed(fullText.slice(0, i))
      if (i >= fullText.length) {
        clearInterval(timerRef.current)
        setDone(true)
      }
    }, 35)
    return () => clearInterval(timerRef.current)
  }, [fullText])

  const handleClick = () => {
    if (!done) {
      // 點擊跳過打字機，立即顯示全文
      clearInterval(timerRef.current)
      setDisplayed(fullText)
      setDone(true)
    } else {
      onAdvance()
    }
  }

  if (!dialogue) return null

  const speakerName = SPEAKER_NAMES[dialogue.speaker] ?? dialogue.speaker
  const isNarrator = dialogue.speaker === 'narrator'

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 px-6 pb-6"
      onClick={handleClick}
    >
      <div className="game-panel p-5 max-w-4xl mx-auto cursor-pointer select-none">
        {/* 說話者名稱 */}
        {speakerName && !isNarrator && (
          <div className="mb-2">
            <span className="px-3 py-1 bg-purple-900/60 border border-game-border rounded text-sm text-game-accent font-medium">
              {speakerName}
            </span>
          </div>
        )}

        {/* 對話文字 */}
        <p className={`leading-relaxed text-base ${isNarrator ? 'text-gray-300 italic' : 'text-white'}`}>
          {displayed}
          {!done && <span className="animate-pulse">▌</span>}
        </p>

        {/* 提示點擊繼續 */}
        {done && (
          <div className="text-right mt-2">
            <span className="text-game-accent text-xs animate-bounce inline-block">
              {isChoiceNext ? '▶ 選擇' : '▼'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
