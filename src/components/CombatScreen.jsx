/**
 * CombatScreen — 戰鬥主畫面
 * 顯示 HP/SP 條、裝備耐久、技能列、敵人資訊、行動按鈕
 */
import { getSkillData } from '../engine/SkillDB.js'
import { canTriggerSummon } from '../engine/CombatEngine.js'
import CombatLog from './CombatLog.jsx'

// ── 數值條元件 ────────────────────────────────────────────────

function StatBar({ label, value, max, color = 'bg-red-500', thin = false }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  const danger = pct <= 30

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-xs w-8 shrink-0">{label}</span>
      <div className={`flex-1 bg-gray-800 rounded-full overflow-hidden ${thin ? 'h-1.5' : 'h-2.5'}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            danger ? 'bg-red-700 animate-pulse' : color
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-gray-400 text-xs w-16 text-right shrink-0">
        {value}/{max}
      </span>
    </div>
  )
}

// ── 裝備耐久條 ─────────────────────────────────────────────────

function DurabilityBar({ label, value }) {
  const pct = Math.max(0, Math.min(100, value))
  const color =
    pct >= 60 ? 'bg-blue-500' :
    pct >= 30 ? 'bg-yellow-500' :
    'bg-red-700'

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-500 text-xs w-6 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-800 rounded h-1.5 overflow-hidden">
        <div className={`h-full rounded transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-500 text-xs w-6 text-right">{value}</span>
    </div>
  )
}

// ── 技能按鈕 ──────────────────────────────────────────────────

function SkillButton({ skillId, heroine, onUse }) {
  const skill = getSkillData(skillId)
  if (!skill) return null

  const canAfford = heroine.SP >= skill.spCost
  const meetsHP = !skill.requireHPBelow || (heroine.HP / heroine.maxHP) < skill.requireHPBelow

  const disabled = !canAfford || !meetsHP

  return (
    <button
      onClick={() => !disabled && onUse(skillId)}
      disabled={disabled}
      title={skill.description}
      className={`
        flex-1 min-w-0 px-2 py-2 rounded text-xs text-center transition-all border
        ${disabled
          ? 'border-gray-700 text-gray-600 cursor-not-allowed bg-gray-900/50'
          : 'border-game-border text-game-accent hover:border-game-accent hover:bg-game-accent/10 cursor-pointer'
        }
      `}
    >
      <div className="font-semibold truncate">{skill.name}</div>
      <div className={`text-xs mt-0.5 ${canAfford ? 'text-blue-400' : 'text-red-600'}`}>
        SP {skill.spCost}
      </div>
    </button>
  )
}

// ── 場上惡魔浮動面板 ─────────────────────────────────────────

function ActiveDemonsPanel({ activeDemons }) {
  const demons = Object.values(activeDemons)
  if (demons.length === 0) return null

  return (
    <div className="absolute bottom-2 right-2 flex flex-col gap-1.5 pointer-events-none z-10">
      {demons.map(demon => {
        const hpPct = Math.max(0, Math.min(100, (demon.currentHP / demon.maxHP) * 100))
        return (
          <div key={demon.id} className="w-28 bg-gray-900/90 border border-violet-800/70 rounded p-1.5 shadow-lg">
            <div className="text-violet-300 font-semibold mb-1" style={{ fontSize: '0.65rem' }}>
              ◈ {demon.name}
            </div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-gray-500 shrink-0" style={{ fontSize: '0.55rem' }}>HP</span>
              <div className="flex-1 bg-gray-800 rounded-full overflow-hidden" style={{ height: '4px' }}>
                <div
                  className="h-full bg-violet-600 rounded-full transition-all duration-300"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <span className="text-gray-400 shrink-0" style={{ fontSize: '0.55rem' }}>{demon.currentHP}</span>
            </div>
            <div className="flex gap-2" style={{ fontSize: '0.6rem' }}>
              <span className="text-gray-500">ATK <span className="text-rose-300">{demon.ATK}</span></span>
              <span className="text-gray-500">AGI <span className="text-amber-300">{demon.AGI}</span></span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── 主元件 ────────────────────────────────────────────────────

export default function CombatScreen({
  heroine,
  combat,
  skills,
  onBasicAttack,
  onUseSkill,
  onDefend,
  onOpenSummon,
  onFlee,
  isPlayerTurn,
  isProcessing,
  allowSummon = true,
}) {
  const { enemyId, enemyName, enemyHP, enemyMaxHP, enemyStatuses = [], heroineStatuses = [], log = [] } = combat
  const canSummon = allowSummon && combat.summonedThisBattle?.length === 0
  const isPassiveSummon = canTriggerSummon(heroine)

  const activeSkills = skills?.active ?? []
  const equip = heroine.equipment ?? {}

  const disabled = !isPlayerTurn || isProcessing

  return (
    <div className="absolute inset-0 flex flex-col bg-gray-950/95 text-white select-none">

      {/* ── 頂部：敵人資訊 ── */}
      <div className="px-6 pt-5 pb-3 border-b border-gray-800">
        <div className="flex items-start justify-between gap-4">
          {/* 敵人 HP */}
          <div className="flex-1">
            <div className="text-sm text-gray-300 mb-1 font-semibold">
              {enemyName ?? enemyId ?? '未知魔物'}
            </div>
            <StatBar label="HP" value={enemyHP} max={enemyMaxHP} color="bg-rose-600" />
            <div className="flex gap-3 mt-1">
              <span className="text-gray-500 text-xs">AGI <span className="text-amber-300 font-mono">{combat.enemyAGI ?? '—'}</span></span>
              <span className="text-gray-500 text-xs">ATK <span className="text-rose-300 font-mono">{combat.enemyATK ?? '—'}</span></span>
            </div>

            {/* 敵人狀態 */}
            {enemyStatuses.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {enemyStatuses.map((s, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-purple-900/60 border border-purple-700 text-purple-300 text-xs rounded">
                    {statusLabel(s.type)} {s.duration > 0 && s.duration < 99 ? `×${s.duration}` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 回合指示 */}
          <div className={`shrink-0 px-3 py-1 rounded text-xs font-bold border ${
            isPlayerTurn
              ? 'border-game-accent text-game-accent'
              : 'border-gray-600 text-gray-500'
          }`}>
            {isProcessing ? '處理中…' : isPlayerTurn ? '你的回合' : '敵人回合'}
          </div>
        </div>
      </div>

      {/* ── 中間：戰鬥日誌 ── */}
      <div className="flex-1 overflow-hidden game-panel mx-4 my-3 rounded relative">
        <CombatLog logs={log} />
        <ActiveDemonsPanel activeDemons={combat.activeDemons ?? {}} />
      </div>

      {/* ── 底部：女主角數值 + 行動列 ── */}
      <div className="border-t border-gray-800 px-4 pt-3 pb-4 space-y-3">

        {/* 女主角數值 */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <StatBar label="HP" value={heroine.HP}    max={heroine.maxHP} color="bg-rose-500" />
          <StatBar label="SP" value={heroine.SP}    max={heroine.maxSP} color="bg-blue-500" />
          <DurabilityBar label="上" value={equip.upper?.durability ?? 0} />
          <DurabilityBar label="下" value={equip.lower?.durability ?? 0} />
        </div>
        <div className="flex gap-4 text-xs">
          <span className="text-gray-500">AGI <span className="text-amber-400 font-mono">{heroine.AGI ?? '—'}</span></span>
          <span className="text-gray-500">WIL <span className="text-cyan-400 font-mono">{heroine.WIL ?? '—'}</span></span>
          <span className="text-gray-500">ATK <span className="text-rose-400 font-mono">{heroine.ATK ?? '—'}</span></span>
        </div>

        {/* 女主角狀態標籤 */}
        {heroineStatuses.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {heroineStatuses.map((s, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-cyan-900/60 border border-cyan-700 text-cyan-300 text-xs rounded">
                {statusLabel(s.type)}
              </span>
            ))}
          </div>
        )}

        {/* DES 值 */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">絕望值</span>
          <div className="flex-1 bg-gray-800 rounded h-1.5 overflow-hidden">
            <div
              className="h-full rounded bg-purple-700 transition-all"
              style={{ width: `${Math.min(100, (heroine.DES / 200) * 100)}%` }}
            />
          </div>
          <span className="text-gray-500 text-xs">{heroine.DES}/200</span>
        </div>

        {/* 技能列 */}
        <div className="flex gap-1.5">
          {activeSkills.length > 0
            ? activeSkills.map(id => (
                <SkillButton
                  key={id}
                  skillId={id}
                  heroine={heroine}
                  onUse={onUseSkill}
                />
              ))
            : <p className="text-gray-600 text-xs self-center">（尚未習得主動技能）</p>
          }
        </div>

        {/* 行動按鈕 */}
        <div className="flex gap-2">
          <button
            onClick={onBasicAttack}
            disabled={disabled}
            className={`flex-1 py-2.5 rounded text-sm font-semibold border transition-all ${
              disabled
                ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                : 'border-game-accent text-game-accent hover:bg-game-accent/15 active:scale-95'
            }`}
          >
            普通攻擊
          </button>

          <button
            onClick={onDefend}
            disabled={disabled}
            className={`flex-1 py-2.5 rounded text-sm font-semibold border transition-all ${
              disabled
                ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                : 'border-cyan-600 text-cyan-300 hover:bg-cyan-600/15 active:scale-95'
            }`}
          >
            防禦
          </button>

          {canSummon && (
            <button
              onClick={onOpenSummon}
              disabled={disabled}
              className={`flex-1 py-2.5 rounded text-sm font-semibold border transition-all leading-tight ${
                disabled
                  ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                  : isPassiveSummon
                    ? 'border-purple-500 text-purple-300 hover:bg-purple-500/15 active:scale-95 animate-pulse'
                    : 'border-violet-700 text-violet-400 hover:bg-violet-700/15 active:scale-95'
              }`}
            >
              <div>{isPassiveSummon ? '✦ 召喚惡魔' : '◈ 召喚惡魔'}</div>
              {!isPassiveSummon && (
                <div className="text-gray-500 font-normal" style={{ fontSize: '0.6rem' }}>耗盡 SP</div>
              )}
            </button>
          )}

          <button
            onClick={onFlee}
            disabled={disabled}
            className={`px-4 py-2.5 rounded text-sm border transition-all ${
              disabled
                ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                : 'border-gray-600 text-gray-400 hover:border-gray-400 active:scale-95'
            }`}
          >
            逃離
          </button>
        </div>
      </div>
    </div>
  )
}

// 狀態類型中文對照
function statusLabel(type) {
  const map = {
    seal: '封印', bleed: '流血', poison: '重毒', curse: '詛咒',
    mark: '標記', corrode: '腐蝕', reflect: '反傷',
    blind: '致盲', entangle: '纏縛', delay: '延遲',
    weaken: '削弱', evasion: '迴避', shield: '護盾',
    absorb_shield: '靈盾', counter: '反制', undying: '不死',
    perfect_shield: '壁障', resonance: '共鳴', atk_up: 'ATK↑',
    defend: '防禦中',
  }
  return map[type] ?? type
}
