/**
 * CharacterSprite — 角色立繪顯示
 * 支援多角色同時顯示，依 position 排列：left / center / right
 */
export default function CharacterSprite({ charId, expression, position = 'center', active = true }) {
  if (!charId) return null

  const spriteSrc = `/assets/sprites/${charId}_${expression ?? 'default'}.png`

  const posMap = {
    left: 'left-8',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-8',
  }

  return (
    <div
      className={`absolute bottom-0 ${posMap[position] ?? posMap.center} z-10
                  transition-all duration-500`}
      style={{ filter: active ? 'none' : 'brightness(0.5) grayscale(0.3)' }}
    >
      <img
        src={spriteSrc}
        alt={charId}
        className="h-[70vh] max-h-[600px] object-contain select-none animate-fade-in"
        onError={(e) => { e.target.style.display = 'none' }}
        draggable={false}
      />
    </div>
  )
}
