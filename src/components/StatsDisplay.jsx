/**
 * StatsDisplay — 數值面板（可收合）V2
 * - V3 heroine 欄位（情感 + 戰鬥數值）
 * - 未召喚的惡魔以亂碼遮蓋，召喚後解鎖
 */
import { useState, useMemo } from 'react'

const DEMON_NAMES = {
  demon_a: '瑠夜',
  demon_b: '颯牙',
  demon_c: '玄冥',
}

const EMOTIONAL_LABELS = {
  heart_guard:   '心防',
  heart_flutter: '心動',
  insight:       '洞察',
  independence:  '魅力',
  desire:        '慾望',
}

const EMOTIONAL_COLORS = {
  heart_guard:   'bg-blue-400',
  heart_flutter: 'bg-pink-400',
  insight:       'bg-cyan-400',
  independence:  'bg-yellow-400',
  desire:        'bg-red-400',
}

const CHAR_LABELS = {
  affection: '好感',
  progress:  '進度',
  trust:     '信賴',
  lust:      '情慾',
}

const CHAR_COLORS = {
  affection: 'bg-pink-500',
  progress:  'bg-purple-400',
  trust:     'bg-emerald-400',
  lust:      'bg-orange-400',
}

const GLITCH_CHARS = 'アイウエオカキクケコサシスセソタチツテト█▓▒░▪◆◇※＃＄'

function makeGlitch(len) {
  return Array.from({ length: len }, () =>
    GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
  ).join('')
}

function StatBar({ label, value, max = 100, color }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 text-gray-400 shrink-0">{label}</span>
      <div className="stat-bar flex-1">
        <div className={`stat-bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-gray-300">{value}</span>
    </div>
  )
}

export default function StatsDisplay({ heroine, demons, mainRoute, revealedDemons }) {
  const [open, setOpen] = useState(false)

  // 穩定亂碼：useMemo 保證同一次開啟期間不變動
  const glitchData = useMemo(() => {
    const charKeys = Object.keys(CHAR_LABELS)
    return Object.fromEntries(
      ['demon_a', 'demon_b', 'demon_c'].map(id => [
        id,
        {
          name: makeGlitch(3),
          vals: Object.fromEntries(charKeys.map(k => [k, makeGlitch(5)])),
        },
      ])
    )
  }, [])

  const revealed = revealedDemons ?? new Set()

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

          {/* ── 女主角情感數值 ── */}
          <p className="text-game-accent text-xs font-medium mb-2">◆ 女主角</p>
          <div className="flex flex-col gap-1.5">
            {Object.entries(EMOTIONAL_LABELS).map(([key, label]) => (
              <StatBar
                key={key}
                label={label}
                value={heroine[key] ?? 0}
                max={100}
                color={EMOTIONAL_COLORS[key]}
              />
            ))}

            {/* HP / SP — 同層級 */}
            <StatBar label="HP" value={heroine.HP ?? 0} max={heroine.maxHP ?? 100} color="bg-rose-500" />
            <StatBar label="SP" value={heroine.SP ?? 0} max={heroine.maxSP ?? 100} color="bg-blue-500" />
          </div>

          {/* ATK / AGI / WIL — 小字數字，無 bar */}
          <div className="flex gap-3 mt-2 mb-4 text-gray-600" style={{ fontSize: '0.65rem' }}>
            <span>ATK <span className="text-gray-400">{heroine.ATK ?? 0}</span></span>
            <span>AGI <span className="text-gray-400">{heroine.AGI ?? 0}</span></span>
            <span>WIL <span className="text-gray-400">{heroine.WIL ?? 0}</span></span>
          </div>

          {/* ── 各惡魔數值 ── */}
          {['demon_a', 'demon_b', 'demon_c'].map((demonId) => {
            const charStats = demons?.[demonId]
            if (!charStats) return null
            const isRevealed = revealed.has(demonId)
            const isActive = !mainRoute || mainRoute === demonId
            const glitch = glitchData[demonId]

            return (
              <div key={demonId} className={isActive ? '' : 'opacity-40'}>
                <p className={`text-xs font-medium mb-2 ${isRevealed ? 'text-game-accent' : 'text-gray-600'}`}>
                  ◆ {isRevealed ? DEMON_NAMES[demonId] : glitch.name}
                </p>
                <div className="flex flex-col gap-1.5 mb-4">
                  {Object.entries(CHAR_LABELS).map(([key, label]) =>
                    isRevealed ? (
                      <StatBar key={key} label={label} value={charStats[key] ?? 0} max={100} color={CHAR_COLORS[key]} />
                    ) : (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className="w-8 text-gray-700 shrink-0">{label}</span>
                        <span className="flex-1 text-gray-700 tracking-widest truncate font-mono">
                          {glitch.vals[key]}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )
          })}

        </div>
      )}
    </div>
  )
}