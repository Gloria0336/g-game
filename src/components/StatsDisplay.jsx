/**
 * StatsDisplay — 數值面板（可收合）
 */
import { useState } from 'react'
import charactersData from '../data/characters.json'

const CHAR_NAMES = Object.fromEntries(
  (charactersData?.characters ?? []).map((c) => [c.id, c.name])
)

const HEROINE_LABELS = {
  guard: '心防',
  flutter: '心動',
  insight: '洞察',
  charm: '魅力',
  desire: '慾望',
}

const CHAR_LABELS = {
  affection: '好感',
  progress: '進度',
  trust: '信賴',
  lust: '情慾',
}

const BAR_COLORS = {
  guard: 'bg-blue-400',
  flutter: 'bg-pink-400',
  insight: 'bg-cyan-400',
  charm: 'bg-yellow-400',
  desire: 'bg-red-400',
  affection: 'bg-pink-500',
  progress: 'bg-purple-400',
  trust: 'bg-emerald-400',
  lust: 'bg-orange-400',
}

function StatBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 text-gray-400 shrink-0">{label}</span>
      <div className="stat-bar flex-1">
        <div
          className={`stat-bar-fill ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-6 text-right text-gray-300">{value}</span>
    </div>
  )
}

export default function StatsDisplay({ heroine, characters, mainRoute }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="absolute top-4 right-4 z-20 text-xs">
      <button
        className="px-3 py-1 game-panel text-gray-400 hover:text-game-accent text-xs rounded transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '▲ 收合數值' : '▼ 查看數值'}
      </button>

      {open && (
        <div className="game-panel mt-2 p-4 w-56 animate-slide-up">
          {/* 女主角數值 */}
          <p className="text-game-accent text-xs font-medium mb-2">◆ 女主角</p>
          <div className="flex flex-col gap-1.5 mb-4">
            {Object.entries(HEROINE_LABELS).map(([key, label]) => (
              <StatBar key={key} label={label} value={heroine[key] ?? 0} color={BAR_COLORS[key]} />
            ))}
          </div>

          {/* 各攻略角色數值 */}
          {['char_a', 'char_b', 'char_c'].map((charId) => {
            const charStats = characters[charId]
            if (!charStats) return null
            const isActive = !mainRoute || mainRoute === charId
            return (
              <div key={charId} className={isActive ? '' : 'opacity-40'}>
                <p className="text-game-accent text-xs font-medium mb-2">
                  ◆ {CHAR_NAMES[charId] ?? charId}
                </p>
                <div className="flex flex-col gap-1.5 mb-4">
                  {Object.entries(CHAR_LABELS).map(([key, label]) => (
                    <StatBar key={key} label={label} value={charStats[key] ?? 0} color={BAR_COLORS[key]} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
