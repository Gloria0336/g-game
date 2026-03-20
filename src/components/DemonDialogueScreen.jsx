/**
 * DemonDialogueScreen — 惡魔戰後對話畫面
 * Phase: demon_dialogue
 * - 顯示 AI 生成的惡魔台詞
 * - 提供 3 個玩家回應選項
 * - AI 生成中顯示 loading 動畫；失敗時使用靜態 fallback
 */
import CharacterSprite from './CharacterSprite.jsx'

const DEMON_NAME = { demon_a: '瑠夜', demon_b: '颯牙', demon_c: '玄冥' }

const STATIC_FALLBACK = {
  lines: ['……'],
  choices: [
    { text: '（點頭，不說話）',    effects: {} },
    { text: '「謝謝你。」',        effects: { heroine_axis: 3 } },
    { text: '「契約履行完畢。」',  effects: { heroine_axis: -2 } },
  ],
}

export default function DemonDialogueScreen({ demonId, dialogue, onSelect }) {
  const data    = dialogue ?? STATIC_FALLBACK
  const name    = DEMON_NAME[demonId] ?? demonId
  const loading = !dialogue

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      {/* 惡魔立繪 */}
      {demonId && (
        <CharacterSprite charId={demonId} expression="default" position="center" active />
      )}

      {/* 對話區 */}
      <div className="relative z-10 mx-4 mb-4 game-panel rounded-lg p-5">

        {/* 說話者名稱 */}
        <div className="text-game-accent text-xs font-semibold tracking-wider mb-3">
          {name}
        </div>

        {/* Loading 動畫 */}
        {loading && (
          <div className="flex gap-1.5 mb-4 items-center">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="h-1.5 w-8 bg-gray-700 rounded animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
            <span className="text-gray-600 text-xs ml-2">AI 生成中…</span>
          </div>
        )}

        {/* 台詞 */}
        <div className="mb-4 space-y-2">
          {data.lines.map((line, i) => (
            <p key={i} className="text-gray-200 text-sm leading-relaxed">{line}</p>
          ))}
        </div>

        {/* 玩家回應選項 */}
        <div className="flex flex-col gap-2">
          {data.choices.map((choice, i) => (
            <button
              key={i}
              disabled={loading}
              onClick={() => onSelect(i)}
              className="w-full text-left px-4 py-2.5 border border-gray-700 rounded
                         text-gray-300 text-sm transition-all
                         hover:border-game-accent hover:text-game-accent
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {choice.text}
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
