/**
 * TitleScreen — 主選單畫面
 */
export default function TitleScreen({ onStart, onLoadSave, onAISettings, aiEnabled }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center
                    bg-gradient-to-b from-slate-950 via-purple-950/60 to-slate-950">
      {/* 標題 */}
      <div className="text-center mb-16">
        <h1 className="text-6xl font-thin tracking-[0.3em] text-white mb-3">心鎖</h1>
        <p className="text-game-accent text-sm tracking-widest">HEARTLOCK</p>
      </div>

      {/* 選單 */}
      <div className="flex flex-col gap-4 min-w-[200px]">
        <button
          className="px-8 py-3 border border-game-border rounded text-white
                     hover:bg-purple-900/40 hover:border-game-accent transition-all"
          onClick={onStart}
        >
          開始遊戲
        </button>
        <button
          className="px-8 py-3 border border-game-border rounded text-gray-400
                     hover:bg-purple-900/40 hover:border-game-accent hover:text-white transition-all"
          onClick={onLoadSave}
        >
          讀取存檔
        </button>
        <button
          className={`px-8 py-3 border rounded transition-all text-sm ${
            aiEnabled
              ? 'border-purple-600 text-purple-400 hover:bg-purple-900/40 hover:border-game-accent hover:text-white'
              : 'border-game-border text-gray-600 hover:bg-purple-900/20 hover:border-gray-500 hover:text-gray-400'
          }`}
          onClick={onAISettings}
        >
          ✦ AI 設定{aiEnabled ? '　●' : ''}
        </button>
      </div>

      <p className="absolute bottom-6 text-gray-700 text-xs">
        本作品含有成人內容，請確認您已年滿 18 歲。
      </p>
    </div>
  )
}
