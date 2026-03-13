/**
 * SkillManageScreen — Phase B
 * 技能槽管理畫面（據點 / 章節間）
 * active（最多 4）↔ inventory（最多 12）互換、丟棄
 */
import { useState } from 'react'
import { getSkillData } from '../engine/SkillDB.js'

const TIER_TEXT = { 1: 'I', 2: 'II', 3: 'III' }

function SkillSlot({ skillId, index, label, isActive, selected, onSelect }) {
  const skill = skillId ? getSkillData(skillId) : null
  const isSelected = selected?.id === skillId && selected?.from === (isActive ? 'active' : 'inventory') && selected?.index === index

  return (
    <button
      onClick={() => onSelect({ id: skillId, from: isActive ? 'active' : 'inventory', index })}
      className={`
        relative w-full text-left p-3 rounded border transition-all
        ${!skillId
          ? 'border-dashed border-gray-700 text-gray-700 cursor-default'
          : isSelected
            ? 'border-game-accent bg-game-accent/10 text-white'
            : 'border-game-border hover:border-game-accent/60 text-gray-300'
        }
      `}
      disabled={!skillId}
    >
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      {skill ? (
        <>
          <div className="font-semibold text-sm flex items-center gap-1.5">
            {skill.name}
            <span className="text-xs text-gray-500">T{TIER_TEXT[skill.tier]}</span>
          </div>
          <div className="text-blue-400 text-xs mt-0.5">SP {skill.spCost}</div>
        </>
      ) : (
        <div className="text-xs italic">（空槽）</div>
      )}
      {isSelected && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-game-accent" />
      )}
    </button>
  )
}

export default function SkillManageScreen({ skills, onConfirm, onClose }) {
  const [active, setActive]       = useState([...skills.active])
  const [inventory, setInventory] = useState([...skills.inventory])
  const [selected, setSelected]   = useState(null)
  const [detail, setDetail]       = useState(null)

  // 點擊槽位邏輯
  const handleSelect = (slot) => {
    if (!slot.id) return

    // 顯示技能詳情
    setDetail(getSkillData(slot.id))

    if (!selected) {
      setSelected(slot)
      return
    }

    // 同一個槽 → 取消選擇
    if (selected.id === slot.id && selected.from === slot.from && selected.index === slot.index) {
      setSelected(null)
      return
    }

    // 交換邏輯
    const newActive    = [...active]
    const newInventory = [...inventory]

    if (selected.from === 'active' && slot.from === 'inventory') {
      // active → inventory 交換
      const tmp = newActive[selected.index]
      newActive[selected.index] = newInventory[slot.index]
      newInventory[slot.index]  = tmp

    } else if (selected.from === 'inventory' && slot.from === 'active') {
      // inventory → active 交換
      const tmp = newInventory[selected.index]
      newInventory[selected.index] = newActive[slot.index]
      newActive[slot.index]         = tmp

    } else if (selected.from === 'active' && slot.from === 'active') {
      // active ↔ active
      const tmp = newActive[selected.index]
      newActive[selected.index] = newActive[slot.index]
      newActive[slot.index]     = tmp

    } else {
      // inventory ↔ inventory
      const tmp = newInventory[selected.index]
      newInventory[selected.index] = newInventory[slot.index]
      newInventory[slot.index]     = tmp
    }

    setActive(newActive)
    setInventory(newInventory)
    setSelected(null)
  }

  // 從 active 丟入 inventory（僅當 inventory 未滿）
  const handleDiscard = (index) => {
    const skillId = active[index]
    if (!skillId) return
    if (inventory.filter(Boolean).length >= 12) return
    const newActive    = [...active]
    const newInventory = [...inventory]
    newActive[index] = null
    newInventory.push(skillId)
    setActive(newActive.filter(s => s !== null))  // compact
    setInventory(newInventory)
    setSelected(null)
  }

  const handleConfirm = () => {
    onConfirm({
      active:    active.filter(Boolean).slice(0, 4),
      inventory: inventory.filter(Boolean).slice(0, 12),
    })
  }

  // 填充 active 到 4 槽（顯示空槽）
  const activeSlots    = [...active,    ...Array(Math.max(0, 4  - active.length)).fill(null)]
  const inventorySlots = [...inventory, ...Array(Math.max(0, 12 - inventory.length)).fill(null)]

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl game-panel rounded-lg p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">

        {/* 標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">技能管理</h2>
            <p className="text-gray-500 text-xs mt-0.5">點擊兩個技能槽進行交換，戰鬥中不可更換</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl px-2">✕</button>
        </div>

        {/* Active 技能槽 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-game-accent text-xs font-semibold tracking-wider">ACTIVE</span>
            <span className="text-gray-600 text-xs">{active.filter(Boolean).length}/4</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {activeSlots.map((id, i) => (
              <SkillSlot
                key={i}
                skillId={id}
                index={i}
                label={`技能槽 ${i + 1}`}
                isActive
                selected={selected}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-gray-800" />

        {/* Inventory */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-400 text-xs font-semibold tracking-wider">INVENTORY</span>
            <span className="text-gray-600 text-xs">{inventory.filter(Boolean).length}/12</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {inventorySlots.map((id, i) => (
              <SkillSlot
                key={i}
                skillId={id}
                index={i}
                label={`庫存 ${i + 1}`}
                isActive={false}
                selected={selected}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>

        {/* 技能詳情 */}
        {detail && (
          <div className="p-3 rounded bg-gray-900/60 border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-semibold">{detail.name}</span>
              <span className="text-xs text-blue-400">SP {detail.spCost}</span>
              <span className="text-xs text-gray-600">Tier {TIER_TEXT[detail.tier]}</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">{detail.description}</p>
          </div>
        )}

        {/* 操作提示 + 確認 */}
        {selected && (
          <p className="text-game-accent text-xs text-center animate-pulse">
            已選擇「{getSkillData(selected.id)?.name}」→ 點擊另一個槽位進行交換
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-700 text-gray-400
              hover:text-gray-200 rounded text-sm transition-all"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 border border-game-accent text-game-accent
              hover:bg-game-accent/15 rounded text-sm font-semibold transition-all"
          >
            確認配置
          </button>
        </div>
      </div>
    </div>
  )
}
