/**
 * SkillRewardScreen — Phase B
 * 戰鬥勝利後技能選擇全螢幕畫面
 * 顯示 3 張技能卡片，玩家選 1 或略過
 */
import { getSkillData } from '../engine/SkillDB.js'

const TIER_COLOR = {
  1: 'border-blue-700 hover:border-blue-400',
  2: 'border-purple-700 hover:border-purple-400',
  3: 'border-amber-600 hover:border-amber-400',
}

const TIER_BADGE = {
  1: 'bg-blue-900/60 text-blue-300',
  2: 'bg-purple-900/60 text-purple-300',
  3: 'bg-amber-900/60 text-amber-300',
}

function SkillCard({ skillId, onPick }) {
  const skill = getSkillData(skillId)
  if (!skill) return null

  return (
    <button
      onClick={() => onPick(skillId)}
      className={`
        flex flex-col p-4 rounded-lg border-2 bg-gray-900/80 text-left
        transition-all duration-200 hover:scale-[1.02] hover:bg-gray-800/80 active:scale-95
        ${TIER_COLOR[skill.tier] ?? 'border-game-border hover:border-game-accent'}
      `}
    >
      {/* Tier badge */}
      <span className={`self-start text-xs px-2 py-0.5 rounded mb-3 font-semibold ${TIER_BADGE[skill.tier] ?? ''}`}>
        Tier {skill.tier === 1 ? 'I' : skill.tier === 2 ? 'II' : 'III'}
      </span>

      {/* 技能名稱 */}
      <div className="text-white font-bold text-base mb-1">{skill.name}</div>

      {/* SP 消耗 */}
      <div className="text-blue-400 text-xs mb-3">SP 消耗：{skill.spCost}</div>

      {/* 描述 */}
      <p className="text-gray-400 text-xs leading-relaxed flex-1">{skill.description}</p>

      {/* 選擇提示 */}
      <div className="mt-4 text-center text-xs text-gray-600 group-hover:text-gray-400">
        點擊選擇
      </div>
    </button>
  )
}

export default function SkillRewardScreen({ candidates = [], onPick, onSkip }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm px-4">

      {/* 標題 */}
      <div className="text-center mb-8">
        <p className="text-game-accent text-xs tracking-widest mb-2">SKILL ACQUIRED</p>
        <h2 className="text-white text-xl font-bold">獲得新技能</h2>
        <p className="text-gray-500 text-sm mt-1">從以下三個技能中選擇一個加入技能庫</p>
      </div>

      {/* 技能卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-6">
        {candidates.map(id => (
          <SkillCard key={id} skillId={id} onPick={onPick} />
        ))}
      </div>

      {/* 略過按鈕 */}
      <button
        onClick={onSkip}
        className="px-6 py-2 border border-gray-700 text-gray-500
          hover:text-gray-300 hover:border-gray-500 rounded text-sm transition-all"
      >
        略過（不選擇）
      </button>
    </div>
  )
}
