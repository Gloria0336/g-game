/**
 * ChoicePanel — 選項面板（含條件鎖定提示）
 */

const TYPE_ICON = {
  resist: '🛡️',
  evade: '🌊',
  waver: '💫',
  accept: '💕',
  seduce: '💋',
  succumb: '⛓️',
  dice_choice: '🎲',
}

const TYPE_LABEL = {
  resist: '抵抗',
  evade: '周旋',
  waver: '動搖',
  accept: '接受',
  seduce: '誘惑',
  succumb: '屈服',
  dice_choice: '骰點',
}

export default function ChoicePanel({ choices, prompt, onSelect }) {
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center pb-6 px-6 bg-black/30">
      <div className="game-panel p-5 max-w-2xl w-full animate-slide-up">
        {prompt && (
          <p className="text-gray-200 text-sm mb-4 leading-relaxed italic">{prompt}</p>
        )}

        <div className="flex flex-col gap-2">
          {choices.map((choice, idx) => {
            const icon = TYPE_ICON[choice.type] ?? '◆'
            const label = TYPE_LABEL[choice.type] ?? choice.type
            const locked = choice.available === false

            return (
              <button
                key={idx}
                className="choice-btn group"
                disabled={locked}
                onClick={() => !locked && onSelect(choice)}
              >
                <div className="flex items-start gap-3">
                  {/* 類型標籤 */}
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded border mt-0.5
                    ${locked
                      ? 'border-gray-700 text-gray-600'
                      : 'border-game-border text-game-accent group-hover:bg-purple-900/40'
                    }`}>
                    {icon} {label}
                  </span>

                  {/* 選項文字 */}
                  <span className={locked ? 'text-gray-600' : 'text-gray-100'}>
                    {choice.text}
                    {locked && choice.condition && (
                      <span className="ml-2 text-xs text-red-400">[條件不足]</span>
                    )}
                    {choice.type === 'dice_choice' && choice.dc && (
                      <span className="ml-2 text-xs text-yellow-400">DC {choice.dc}</span>
                    )}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
