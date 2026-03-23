import { useState, useEffect } from 'react'
import { ACTION } from '../engine/GameEngine.js'
import { pickEvents, applyNoIntervention, applyTrapEffect, applyCombatStatBoost, getPrivateMomentDemon } from '../engine/ExplorationSystem.js'
import { canAdvanceSubLayer, advanceToNextSubLayer, shouldTriggerFinalEval, getLayerTierDesc, LOCATIONS_PER_SUBLAYER } from '../engine/MapEngine.js'
import { getLocationByTypeId } from '../engine/LocationDB.js'
import { getRandomMonsterByTier } from '../engine/MonsterDB.js'

export default function WorldMapScreen({ state, dispatch }) {
  const [selectedEventLogs, setSelectedEventLogs] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { exploration, demons } = state
  
  const totalSubLayers = { 1: 1, 2: 5, 3: 5, 4: 5, 5: 3 }[exploration.currentLayer] || 1
  
  // 計算推進狀態
  const advanceInfo = canAdvanceSubLayer(exploration)
  
  const handleLocationClick = async (index, typeId) => {
    if (isProcessing) return
    if (exploration.completedLocations.includes(index)) return
    
    setIsProcessing(true)
    const newLogs = []
    
    const location = getLocationByTypeId(typeId)
    newLogs.push(`>> 進入：${location?.name || typeId}`)
    
    // 抽取事件
    const events = pickEvents(typeId, state, { maxEvents: 2 })
    
    if (events.length === 0) {
      newLogs.push('沒有發生特別的事情。')
    }
    
    for (const eventId of events) {
      // 這裡做簡化的事件處理，實際可能需要切換 phase 給玩家選擇
      // 但為了展示，我們暫時全自動處理，或只處理 encounter_combat 讓玩家能玩
      const [type, subType] = eventId.split('.')
      
      switch (type) {
        case 'encounter_combat': {
          newLogs.push('遭遇戰鬥！')
          // 決定 Tier
          let tier = 'A'
          if (exploration.currentLayer === 2 && Math.random() < 0.2) tier = 'B'
          else if (exploration.currentLayer === 3) tier = 'B'
          else if (exploration.currentLayer === 4 && Math.random() < 0.2) tier = 'C'
          else if (exploration.currentLayer === 4) tier = 'B'
          else if (exploration.currentLayer === 5) tier = Math.random() < 0.5 ? 'B' : 'C'
            
          const monster = getRandomMonsterByTier(tier)
          if (monster) {
             dispatch({ type: ACTION.START_COMBAT, enemyData: monster })
             // 進入戰鬥會切換 phase，這裡可以先跳出
             dispatch({ type: ACTION.COMPLETE_LOCATION, index })
             return 
          }
          break
        }
        case 'rest_recovery': {
          newLogs.push('發現安全的休息點。HP/SP 恢復！')
          dispatch({ type: ACTION.USE_REST_IN_SUBLAYER })
          // 簡化休息邏輯，直接回一點血
          dispatch({ type: ACTION.REST }) // 共用 GameEngine 裡的簡單 REST
          break
        }
        case 'investigation': {
          newLogs.push('進行調查...獲得線索！')
          break
        }
        case 'trap': {
          newLogs.push(`觸發陷阱 (${subType})！受到傷害。`)
          const updates = applyTrapEffect(state, eventId, 'full')
          // 手動派發更新 heroine
          if(updates.heroine) {
            dispatch({ type: ACTION.COMBAT_APPLY_LOG, heroineUpdate: updates.heroine, combatUpdate: {} })
          }
          break
        }
        case 'item_discovery': {
          newLogs.push('找到了一些物資！')
          break
        }
        case 'demon_private_moment': {
          const demonId = getPrivateMomentDemon(typeId, state)
          if (demonId) {
            newLogs.push(`惡魔 ${demonId} 似乎有話想說...`)
            dispatch({ type: ACTION.MARK_PRIVATE_MOMENT, demonId, key: `${demonId}_${typeId}` })
            // 簡化版的 private moment 處理：加點好感
            dispatch({ type: ACTION.UPDATE_DEMON_RELATION, demonId, trustDelta: 2, affectionDelta: 3 })
          }
          break
        }
        case 'crisis_rescue': {
           newLogs.push(`遇到危機事件，但你選擇快速通過。`)
           const updates = applyNoIntervention(state)
           if(updates.heroine) {
             dispatch({ type: ACTION.COMBAT_APPLY_LOG, heroineUpdate: updates.heroine, combatUpdate: {} })
           }
           break
        }
        case 'rift_anomaly': {
           newLogs.push(`遭遇裂隙異變，驚險躲過！`)
           break
        }
        default:
          newLogs.push(`觸發了未知的事件: ${eventId}`)
      }
      
      dispatch({ type: ACTION.COMPLETE_EVENT, eventId })
    }
    
    setSelectedEventLogs(newLogs)
    dispatch({ type: ACTION.COMPLETE_LOCATION, index })
    setIsProcessing(false)
  }
  
  const handleAdvance = () => {
    if (!advanceInfo.canAdvance) return
    const newExploration = advanceToNextSubLayer(exploration)
    dispatch({ type: ACTION.ADVANCE_SUBLAYER, newExploration })
    setSelectedEventLogs([])
  }

  return (
    <div className="w-full h-full flex flex-col bg-game-dark text-white p-8 overflow-hidden relative">
      {/* 頂部資訊區 */}
      <div className="flex justify-between items-center mb-8 border-b border-game-border pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-wider text-game-accent">
            第 {exploration.currentLayer} 層：{exploration.currentLayer === 1 ? '小鎮' : '裂隙'}
          </h1>
          <p className="text-gray-400 mt-2">
            深度進度：{exploration.currentSubLayer} / {totalSubLayers}
          </p>
          <p className="text-sm text-gray-500 mt-1">環境威脅: {getLayerTierDesc(exploration.currentLayer)}</p>
        </div>
        <div className="text-right">
           <div className="text-xl font-bold">HP: {state.heroine.HP}/{state.heroine.maxHP}</div>
           <div className="text-lg">SP: {state.heroine.SP}/{state.heroine.maxSP}</div>
           <div className="text-sm text-red-400">DES: {state.heroine.DES}</div>
        </div>
      </div>

      <div className="flex-1 flex gap-8">
        {/* 左側：地點節點 */}
        <div className="flex-1 flex flex-col justify-center items-center gap-6">
          <h2 className="text-2xl mb-4">當前區域</h2>
          <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
            {exploration.currentSubLayerLocations.map((typeId, idx) => {
              const isCompleted = exploration.completedLocations.includes(idx)
              const locData = getLocationByTypeId(typeId)
              const name = locData?.name || typeId
              
              return (
                <button
                  key={idx}
                  onClick={() => handleLocationClick(idx, typeId)}
                  disabled={isCompleted || isProcessing}
                  className={`
                    p-6 rounded-lg border-2 transition-all text-center h-32 flex flex-col justify-center
                    ${isCompleted 
                      ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed opacity-60' 
                      : 'border-game-border focus:border-game-accent hover:border-game-accent bg-game-panel shadow-md hover:shadow-game-accent/20 cursor-pointer'}
                  `}
                >
                  <div className="text-xl font-bold mb-2">{name}</div>
                  <div className="text-sm opacity-80">
                    {isCompleted ? '已探索' : '點擊探索'}
                  </div>
                </button>
              )
            })}
          </div>
          
          {/* 進入下一層按鈕 */}
          <div className="mt-12 w-full max-w-lg">
            <button
              onClick={handleAdvance}
              disabled={!advanceInfo.canAdvance}
              className={`
                w-full py-4 text-xl font-bold rounded shadow transition-all
                ${advanceInfo.canAdvance
                  ? 'bg-game-accent hover:bg-red-700 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
              `}
            >
              {advanceInfo.canAdvance ? '深入下一層' : '至少需探索3個地點...'}
            </button>
          </div>
        </div>

        {/* 右側：事件紀錄 */}
        <div className="w-1/3 bg-black/40 border-l border-game-border p-6 rounded-r-lg overflow-y-auto">
          <h3 className="text-xl text-game-accent border-b border-gray-700 pb-2 mb-4">探索日誌</h3>
          {selectedEventLogs.length === 0 ? (
            <p className="text-gray-500 italic">尚未深入探索...</p>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedEventLogs.map((log, i) => (
                <div key={i} className={`p-2 rounded ${i === 0 ? 'text-gray-300 font-bold' : 'text-gray-400 hover:text-white transition-colors'}`}>
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
