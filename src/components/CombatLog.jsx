/**
 * CombatLog — 戰鬥訊息捲動顯示
 */
import { useEffect, useRef } from 'react'

export default function CombatLog({ logs = [] }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="w-full h-full overflow-y-auto px-3 py-2 space-y-1 text-xs font-mono">
      {logs.map((log, i) => {
        // 依關鍵字上色
        const color =
          log.includes('造成') || log.includes('命中') ? 'text-red-300' :
          log.includes('回復') || log.includes('補給') ? 'text-green-400' :
          log.includes('未命中') || log.includes('迴避') ? 'text-gray-500' :
          log.includes('DES') || log.includes('受損') ? 'text-orange-400' :
          log.includes('【') ? 'text-purple-300 font-semibold' :
          'text-gray-300'

        return (
          <p key={i} className={color}>
            {log}
          </p>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
