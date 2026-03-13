/**
 * CombatLog — 戰鬥訊息捲動顯示
 */
import { useState, useEffect, useRef } from 'react'

export default function CombatLog({ logs = [] }) {
  const [displayLogs, setDisplayLogs] = useState([]) // 已打字完成的行
  const [typingText, setTypingText] = useState('')   // 目前正在打字的文字
  const [queue, setQueue] = useState([])             // 尚未處理的日誌隊列
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)
  const processedCountRef = useRef(0)

  // 當外部 logs 更新時，將新增加的 logs 放入隊列
  useEffect(() => {
    // logs 縮短代表新戰鬥開始（START_COMBAT 重置），清空顯示
    if (logs.length < processedCountRef.current) {
      processedCountRef.current = 0
      setDisplayLogs([])
      setTypingText('')
      setIsTyping(false)
      setQueue([])
    }
    const newEntries = logs.slice(processedCountRef.current)
    if (newEntries.length > 0) {
      processedCountRef.current = logs.length   // 同步更新，Strict Mode 第二次執行不會重複
      setQueue(prev => [...prev, ...newEntries])
    }
  }, [logs])

  // 處理隊列
  useEffect(() => {
    if (!isTyping && queue.length > 0) {
      const next = queue[0]
      setQueue(prev => prev.slice(1))
      startTyping(next)
    }
  }, [isTyping, queue])

  const startTyping = (text) => {
    setIsTyping(true)
    let i = 0
    const interval = setInterval(() => {
      i++
      setTypingText(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setTimeout(() => {
          setDisplayLogs(prev => [...prev, text])
          setTypingText('')
          setIsTyping(false)
        }, 150) // 行與行之間的短暫停頓
      }
    }, 20) // 打字速度
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayLogs, typingText])

  const getLogColor = (log) => {
    if (log.includes('造成') || log.includes('命中')) return 'text-red-300'
    if (log.includes('回復') || log.includes('補給')) return 'text-green-400'
    if (log.includes('未命中') || log.includes('迴避')) return 'text-gray-500'
    if (log.includes('DES') || log.includes('受損')) return 'text-orange-400'
    if (log.includes('【')) return 'text-purple-300 font-semibold'
    return 'text-gray-300'
  }

  return (
    <div className="w-full h-full overflow-y-auto px-3 py-2 space-y-1 text-xs font-mono">
      {displayLogs.map((log, i) => (
        <p key={`done-${i}`} className={getLogColor(log)}>{log}</p>
      ))}
      {typingText && (
        <p className={`${getLogColor(typingText)} border-r-2 border-game-accent animate-pulse inline-block pr-1`}>
          {typingText}
        </p>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
