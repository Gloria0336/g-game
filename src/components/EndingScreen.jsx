/**
 * EndingScreen — 結局演出畫面
 */
export default function EndingScreen({ ending, onRestart }) {
  if (!ending) return null

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 animate-fade-in">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">{ending.icon}</div>
        <h2 className="text-3xl font-light text-game-accent mb-3">
          {ending.name}
        </h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          {ending.description ?? '故事在這裡畫下了句點。'}
        </p>
        <button
          className="px-8 py-2.5 bg-purple-800 hover:bg-purple-700 rounded text-white text-sm transition-colors"
          onClick={onRestart}
        >
          回到主選單
        </button>
      </div>
    </div>
  )
}
