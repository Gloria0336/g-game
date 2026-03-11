/**
 * BackgroundLayer — 場景背景顯示層
 */
export default function BackgroundLayer({ background }) {
  // 嘗試從 /assets/backgrounds/ 載入對應圖片
  const bgSrc = background ? `/assets/backgrounds/${background}.jpg` : null

  return (
    <div className="absolute inset-0 z-0">
      {bgSrc ? (
        <img
          src={bgSrc}
          alt=""
          className="w-full h-full object-cover transition-opacity duration-700"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      ) : (
        // 佔位漸層背景
        <div className="w-full h-full bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950" />
      )}
      {/* 遮罩層，讓對話框區域更易閱讀 */}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  )
}
