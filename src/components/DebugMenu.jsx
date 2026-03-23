import React, { useState } from 'react'

/**
 * DebugMenu — 開發者調試工具
 */
export default function DebugMenu({ state, dispatch, goToScene, onClose }) {
  const [jumpId, setJumpId] = useState('')

  const updateStat = (category, key, value) => {
    dispatch({
      type: 'DEBUG_MODIFY_STATE',
      payload: {
        [category]: { [key]: value }
      }
    })
  }

  const handleJump = () => {
    if (jumpId) goToScene(jumpId)
  }

  const quickWin = () => {
    dispatch({
      type: 'DEBUG_MODIFY_STATE',
      payload: { combat: { enemyHP: 0 } }
    })
  }

  const fullHeal = () => {
    dispatch({
      type: 'DEBUG_MODIFY_STATE',
      payload: {
        heroine: { HP: state.heroine.maxHP, SP: state.heroine.maxSP, DES: 0 }
      }
    })
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] w-72 bg-slate-900/95 border-2 border-red-500/50 rounded-lg shadow-2xl p-4 text-xs text-white font-mono overflow-y-auto max-h-[90vh]">
      <div className="flex justify-between items-center mb-4 border-b border-red-500/30 pb-2">
        <h3 className="text-red-400 font-bold uppercase tracking-wider">Debug Terminal</h3>
        <button onClick={onClose} className="hover:text-red-400">✕</button>
      </div>

      {/* 場景跳轉 */}
      <section className="mb-4">
        <div className="text-gray-400 mb-1 italic">Scene Jumper</div>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-black border border-gray-700 px-2 py-1 rounded"
            placeholder="e.g. 1-4"
            value={jumpId}
            onChange={e => setJumpId(e.target.value)}
          />
          <button onClick={handleJump} className="bg-red-900/40 border border-red-700 px-2 py-1 rounded hover:bg-red-800/60">GO</button>
        </div>
      </section>

      {/* 技能與裝備 */}
      <section className="mb-4 space-y-3">
        <div className="text-gray-400 mb-1 border-b border-gray-800">Cheats & Presets</div>
        
        {/* 增加技能 */}
        <div>
          <div className="text-[10px] text-gray-500 mb-1">Add Skill (ID)</div>
          <div className="flex gap-2">
            <input id="dbg-skill-id" type="text" className="flex-1 bg-black border border-gray-700 px-2 py-1 rounded" placeholder="T3_01" />
            <button onClick={() => window.game.addSkill(document.getElementById('dbg-skill-id').value)} className="bg-purple-900/40 border border-purple-700 px-2 py-1 rounded hover:bg-purple-800/60">ADD</button>
          </div>
        </div>

        {/* 增加裝備 */}
        <div>
          <div className="text-[10px] text-gray-500 mb-1">Equip Item (ID)</div>
          <div className="flex gap-2 mb-1">
            <input id="dbg-equip-id" type="text" className="flex-1 bg-black border border-gray-700 px-2 py-1 rounded" placeholder="heaven_sword" />
            <button onClick={() => {
              const id = document.getElementById('dbg-equip-id').value;
              const slot = document.getElementById('dbg-equip-slot').value;
              window.game.addEquip(id, slot);
            }} className="bg-yellow-900/40 border border-yellow-700 px-2 py-1 rounded hover:bg-yellow-800/60">EQUIP</button>
          </div>
          <select id="dbg-equip-slot" className="w-full bg-black border border-gray-700 px-2 py-1 rounded text-[10px]">
            <option value="weapon">Weapon</option>
            <option value="accessory">Accessory</option>
          </select>
        </div>

        {/* 預設組合 */}
        <div className="pt-2 border-t border-gray-800">
          <div className="text-[10px] text-gray-500 mb-1">Quick Presets</div>
          <button onClick={() => {
            window.game.addEquip('heaven_sword', 'weapon');
            window.game.addEquip('demon_armband', 'accessory');
            ['T3_01', 'T3_03', 'T3_04', 'T3_10'].forEach(id => window.game.addSkill(id));
            window.game.setStat({ HP: 999, maxHP: 999, SP: 999, maxSP: 999, ATK: 100, AGI: 100, WIL: 100 });
          }} className="w-full bg-red-600/40 border border-red-500 p-1 rounded hover:bg-red-500/60 text-[10px] font-bold">GOD MODE (T3 Gear + Skills)</button>
        </div>
      </section>

      {/* 快捷按鈕 */}
      <section className="mb-4 grid grid-cols-2 gap-2">
        <button onClick={fullHeal} className="bg-blue-900/40 border border-blue-700 p-2 rounded hover:bg-blue-800/60 transition-colors">FULL HEAL</button>
        <button onClick={quickWin} className="bg-green-900/40 border border-green-700 p-2 rounded hover:bg-green-800/60 transition-colors">INSTANT WIN</button>
      </section>

      {/* 女主角數值 */}
      <section className="mb-4">
        <div className="text-gray-400 mb-1 border-b border-gray-800">Heroine Stats</div>
        <div className="space-y-2 mt-2">
          {['HP', 'SP', 'DES', 'ATK', 'AGI', 'WIL', 'heart', 'insight', 'independence'].map(stat => (
            <div key={stat} className="flex items-center justify-between">
              <span>{stat}</span>
              <input
                type="number"
                className="w-16 bg-black border border-gray-800 px-1 py-0.5 rounded text-right"
                value={state.heroine[stat] ?? 0}
                onChange={e => updateStat('heroine', stat, parseInt(e.target.value) || 0)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 惡魔關係 */}
      <section className="mb-4">
        <div className="text-gray-400 mb-1 border-b border-gray-800">Demon Relations</div>
        {['demon_a', 'demon_b', 'demon_c'].map(id => (
          <div key={id} className="mt-2">
            <div className="text-red-400/70 text-[10px]">{id.toUpperCase()}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
              {['affection', 'trust', 'lust', 'demon_axis', 'heroine_axis'].map(stat => (
                <div key={stat} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-gray-500">{stat}</span>
                  <input
                    type="number"
                    className="w-10 bg-black border border-gray-800 px-1 py-0.5 rounded text-right"
                    value={state.demons[id]?.[stat] ?? 0}
                    onChange={e => {
                      const newDemons = { ...state.demons }
                      newDemons[id] = { ...newDemons[id], [stat]: parseInt(e.target.value) || 0 }
                      dispatch({ type: 'DEBUG_MODIFY_STATE', payload: { demons: newDemons } })
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="text-[9px] text-gray-600 mt-4 text-center">
        Press [~] or [ESC] to leave debug mode
      </div>
    </div>
  )
}
