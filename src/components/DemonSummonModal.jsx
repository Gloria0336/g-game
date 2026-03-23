/**
 * DemonSummonModal — 惡魔召喚選擇畫面
 * 在 HP ≤ 30% 或 DES ≥ 80 時彈出，供玩家選擇召喚或不召喚
 */
import { DEMON_DATA, getSummonStatus } from '../engine/DemonSystem.js'

const DEMON_IDS = ['demon_a', 'demon_b', 'demon_c']

const DEMON_STYLE = {
  demon_a: {
    border: 'border-indigo-700',
    glow:   'hover:border-indigo-400 hover:shadow-indigo-400/20',
    tag:    'text-indigo-300 bg-indigo-900/40',
    type:   '控制 / 封印',
    effect: '封印術：敵人跳過下回合 + 回復 20% SP',
  },
  demon_b: {
    border: 'border-red-800',
    glow:   'hover:border-red-500 hover:shadow-red-500/20',
    tag:    'text-red-300 bg-red-900/40',
    type:   '物理爆發',
    effect: '獸神衝擊：ATK × 3 × 1.6 無視 DR',
  },
  demon_c: {
    border: 'border-emerald-800',
    glow:   'hover:border-emerald-500 hover:shadow-emerald-500/20',
    tag:    'text-emerald-300 bg-emerald-900/40',
    type:   '詛咒 / 削弱',
    effect: '腐蝕詛咒：DR −20%（3 回合）+ 反傷 10%',
  },
}

export default function DemonSummonModal({
  heroine,
  demons,
  summonedThisBattle = [],
  onSummon,
  onSkip,
  isActiveSummon = false,
  onActiveSummon,
  lockedDemon = null,
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 game-panel rounded-lg overflow-hidden shadow-2xl">

        {/* 標題 */}
        <div className="px-6 py-4 border-b border-game-border text-center">
          <p className={`text-xs tracking-widest mb-1 ${isActiveSummon ? 'text-violet-400' : 'text-game-accent'}`}>
            {isActiveSummon ? 'ACTIVE SUMMON' : 'CONTRACT'}
          </p>
          <h2 className="text-white text-lg font-bold">
            {isActiveSummon ? '主動召喚' : '召喚惡魔'}
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            {isActiveSummon
              ? '消耗靈力（80 SP）強行呼喚——將獲得 DES+5 與 契約軸+8'
              : '危機已至——契約書在颤動'}
          </p>
        </div>

        {/* 惡魔選項 */}
        <div className="p-4 grid grid-cols-3 gap-3">
          {DEMON_IDS.map(demonId => {
            const status = getSummonStatus(demons, demonId, summonedThisBattle)
            const data   = DEMON_DATA[demonId]
            const style  = DEMON_STYLE[demonId]
            const demon  = demons[demonId] ?? {}

            const spInsufficient = isActiveSummon && heroine.SP < 80
            const axisInsufficient = isActiveSummon && (demon.demon_axis ?? 0) < 15
            const isLockedOut = lockedDemon !== null && demonId !== lockedDemon
            const isDisabled = isLockedOut || (isActiveSummon
              ? (status === 'hostile' || spInsufficient)
              : status !== 'available')
            const isBetray = status === 'betrayed'

            const handleClick = () => {
              if (isDisabled) return
              if (isActiveSummon) onActiveSummon?.(demonId)
              else onSummon(demonId)
            }

            return (
              <button
                key={demonId}
                onClick={handleClick}
                disabled={isDisabled}
                className={`
                  relative flex flex-col p-3 rounded-lg border text-left transition-all duration-200 shadow
                  ${isDisabled
                    ? 'border-gray-700 opacity-40 cursor-not-allowed'
                    : `${style.border} ${style.glow} hover:shadow-lg cursor-pointer active:scale-95`
                  }
                  bg-gray-900/80
                `}
              >
                {/* 惡魔名稱 */}
                <div className="text-white font-bold text-sm mb-0.5">{data.name}</div>
                <div className="text-gray-500 text-xs mb-2">{data.rank}</div>

                {/* 類型標籤 */}
                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium mb-2 ${style.tag}`}>
                  {style.type}
                </span>

                {/* 召喚效果 */}
                <p className="text-gray-400 text-xs leading-relaxed">{style.effect}</p>

                {/* 關係數值 */}
                <div className="mt-2 pt-2 border-t border-gray-700/50 grid grid-cols-2 gap-x-2 text-xs text-gray-500">
                  <span>信賴 {demon.trust ?? 0}</span>
                  <span>好感 {demon.affection ?? 0}</span>
                  {isActiveSummon && (
                    <div className="col-span-2 mt-1 space-y-0.5">
                      <div className={axisInsufficient ? 'text-red-500' : 'text-violet-400'}>
                        契約軸 {demon.demon_axis ?? 0}{axisInsufficient ? ' ⚠ 不足' : ' ✓'}
                      </div>
                      {spInsufficient && (
                        <div className="text-red-500">靈力不足（需 80 SP）</div>
                      )}
                    </div>
                  )}
                </div>

                {/* 狀態標記 */}
                {status === 'already_summoned' && (
                  <div className="absolute top-2 right-2 text-xs text-gray-600">已出戰</div>
                )}
                {isBetray && (
                  <div className="absolute top-2 right-2 text-xs text-red-600">⚠ 警告</div>
                )}
                {status === 'hostile' && (
                  <div className="absolute top-2 right-2 text-xs text-red-700">敵對</div>
                )}
                {isLockedOut && (
                  <div className="absolute top-2 right-2 text-xs text-gray-600">🔒 鎖定</div>
                )}
                {lockedDemon === demonId && (
                  <div className="absolute top-2 left-2 text-xs text-purple-400">⚠ 強制</div>
                )}
              </button>
            )
          })}
        </div>

        {/* 不召喚選項 */}
        <div className="px-4 pb-4">
          <button
            onClick={onSkip}
            className="w-full py-2.5 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 rounded text-sm transition-all"
          >
            不召喚——獨力應對
            <span className="ml-2 text-xs text-gray-600">（獨立心 +3）</span>
          </button>
        </div>

      </div>
    </div>
  )
}
