import { useState } from 'react'
import { ACTION } from '../engine/GameEngine.js'
import { pickEvents, applyNoIntervention, applyTrapEffect, getPrivateMomentDemon } from '../engine/ExplorationSystem.js'
import { canAdvanceSubLayer, advanceToNextSubLayer, getLayerTierDesc, LOCATIONS_PER_SUBLAYER } from '../engine/MapEngine.js'
import { getLocationByTypeId } from '../engine/LocationDB.js'
import { getRandomMonsterByTier } from '../engine/MonsterDB.js'
import StatsDisplay from './StatsDisplay.jsx'

const LOCATION_ICON = {
  safe_zone: '🏕️',
  ruin: '🏚️',
  rift_node: '🌀',
  monster_den: '⚔️',
  investigation_point: '🔍',
  rest_point: '💤',
  crisis_zone: '⚠️',
  default: '◈',
}

const LAYER_NAMES = {
  1: '第一層・小鎮廢墟',
  2: '第二層・邊緣裂隙',
  3: '第三層・深淵通道',
  4: '第四層・混沌核心',
  5: '第五層・異界深淵',
}

export default function WorldMapScreen({ state, dispatch, revealedDemons }) {
  const [eventLogs, setEventLogs] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { exploration, demons, heroine } = state

  const totalSubLayers = { 1: 1, 2: 5, 3: 5, 4: 5, 5: 3 }[exploration.currentLayer] || 1
  const advanceInfo = canAdvanceSubLayer(exploration)

  const handleLocationClick = async (index, typeId) => {
    if (isProcessing) return
    if (exploration.completedLocations.includes(index)) return

    setIsProcessing(true)
    const newLogs = []

    const location = getLocationByTypeId(typeId)
    newLogs.push({ type: 'header', text: `▶ 進入：${location?.name || typeId}` })

    const events = pickEvents(typeId, state, { maxEvents: 2 })

    if (events.length === 0) {
      newLogs.push({ type: 'normal', text: '沒有發生特別的事情。' })
    }

    for (const eventId of events) {
      const [type, subType] = eventId.split('.')

      switch (type) {
        case 'encounter_combat': {
          newLogs.push({ type: 'danger', text: '⚔ 遭遇敵人！準備戰鬥...' })
          let tier = 'A'
          if (exploration.currentLayer === 2 && Math.random() < 0.2) tier = 'B'
          else if (exploration.currentLayer === 3) tier = 'B'
          else if (exploration.currentLayer === 4 && Math.random() < 0.2) tier = 'C'
          else if (exploration.currentLayer === 4) tier = 'B'
          else if (exploration.currentLayer === 5) tier = Math.random() < 0.5 ? 'B' : 'C'

          const monster = getRandomMonsterByTier(tier)
          if (monster) {
            dispatch({ type: ACTION.START_COMBAT, enemyData: monster })
            dispatch({ type: ACTION.COMPLETE_LOCATION, index })
            return
          }
          break
        }
        case 'rest_recovery': {
          newLogs.push({ type: 'good', text: '💤 發現安全的休息點。HP/SP 恢復！' })
          dispatch({ type: ACTION.USE_REST_IN_SUBLAYER })
          dispatch({ type: ACTION.REST })
          break
        }
        case 'investigation': {
          newLogs.push({ type: 'normal', text: '🔍 進行調查...獲得線索！' })
          break
        }
        case 'trap': {
          newLogs.push({ type: 'danger', text: `⚠ 觸發陷阱 (${subType})！受到傷害。` })
          const updates = applyTrapEffect(state, eventId, 'full')
          if (updates.heroine) {
            dispatch({ type: ACTION.COMBAT_APPLY_LOG, heroineUpdate: updates.heroine, combatUpdate: {} })
          }
          break
        }
        case 'item_discovery': {
          newLogs.push({ type: 'good', text: '✦ 找到了一些物資！' })
          break
        }
        case 'demon_private_moment': {
          const demonId = getPrivateMomentDemon(typeId, state)
          if (demonId) {
            newLogs.push({ type: 'special', text: `💫 惡魔似乎有話想說...` })
            dispatch({ type: ACTION.MARK_PRIVATE_MOMENT, demonId, key: `${demonId}_${typeId}` })
            dispatch({ type: ACTION.UPDATE_DEMON_RELATION, demonId, trustDelta: 2, affectionDelta: 3 })
          }
          break
        }
        case 'crisis_rescue': {
          newLogs.push({ type: 'danger', text: `⚠ 遇到危機事件，快速通過。` })
          const updates = applyNoIntervention(state)
          if (updates.heroine) {
            dispatch({ type: ACTION.COMBAT_APPLY_LOG, heroineUpdate: updates.heroine, combatUpdate: {} })
          }
          break
        }
        case 'rift_anomaly': {
          newLogs.push({ type: 'normal', text: `🌀 遭遇裂隙異變，驚險躲過！` })
          break
        }
        default:
          newLogs.push({ type: 'normal', text: `觸發未知事件: ${eventId}` })
      }

      dispatch({ type: ACTION.COMPLETE_EVENT, eventId })
    }

    setEventLogs(newLogs)
    dispatch({ type: ACTION.COMPLETE_LOCATION, index })
    setIsProcessing(false)
  }

  const handleAdvance = () => {
    if (!advanceInfo.canAdvance) return
    const newExploration = advanceToNextSubLayer(exploration)
    dispatch({ type: ACTION.ADVANCE_SUBLAYER, newExploration })
    setEventLogs([])
  }

  const completedCount = exploration.completedLocations.length
  const totalLocations = exploration.currentSubLayerLocations.length

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-game-dark text-white flex flex-col">

      {/* ── 頂部 HUD（與章節畫面相同） ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {/* 地圖位置資訊 */}
        <div className="px-3 py-1 game-panel rounded text-xs text-gray-300 flex items-center gap-2">
          <span className="text-game-accent font-semibold">
            {LAYER_NAMES[exploration.currentLayer] ?? `第 ${exploration.currentLayer} 層`}
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">
            深度 {exploration.currentSubLayer}/{totalSubLayers}
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-500 text-[0.65rem]">
            {getLayerTierDesc(exploration.currentLayer)}
          </span>
        </div>
      </div>

      {/* 右側：StatsDisplay（與章節畫面完全相同） */}
      <StatsDisplay
        heroine={heroine}
        demons={demons}
        mainRoute={state.mainRoute}
        revealedDemons={revealedDemons ?? new Set()}
      />

      {/* ── 中央：探索日誌 ── */}
      <div className="flex-1 flex items-center justify-center px-8 py-24">
        <div className="game-panel p-6 max-w-2xl w-full min-h-[200px]">
          {/* 標題列 */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-game-accent text-xs font-medium tracking-wider uppercase">
              ◆ 探索日誌
            </span>
            <span className="text-gray-600 text-xs">
              已探索 {completedCount} / {totalLocations} 個地點
            </span>
          </div>

          {/* 日誌內容 */}
          {eventLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <p className="text-gray-500 italic text-sm">選擇下方地點開始探索...</p>
              <p className="text-gray-700 text-xs">
                {advanceInfo.canAdvance
                  ? '✦ 已可深入下一層'
                  : `需再探索 ${Math.max(0, (LOCATIONS_PER_SUBLAYER ?? 3) - completedCount)} 個地點才能推進`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {eventLogs.map((log, i) => {
                const colorClass =
                  log.type === 'header' ? 'text-gray-200 font-semibold' :
                  log.type === 'danger' ? 'text-red-400' :
                  log.type === 'good' ? 'text-emerald-400' :
                  log.type === 'special' ? 'text-purple-300' :
                  'text-gray-400'
                return (
                  <div
                    key={i}
                    className={`text-sm leading-relaxed ${colorClass} ${i === 0 ? '' : 'pl-2 border-l border-gray-800'}`}
                  >
                    {log.text}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 底部：地點選項面板（模仿 ChoicePanel） ── */}
      <div className="px-6 pb-6 z-10">
        <div className="game-panel p-5 max-w-4xl mx-auto animate-slide-up">
          {/* 提示文字 */}
          <p className="text-gray-400 text-sm mb-3 italic">
            {advanceInfo.canAdvance
              ? '已完成足夠探索，可以深入下一層，或繼續探索當前區域。'
              : '選擇一個地點進行探索：'}
          </p>

          <div className="flex flex-col gap-2">
            {/* 地點按鈕 */}
            {exploration.currentSubLayerLocations.map((typeId, idx) => {
              const isCompleted = exploration.completedLocations.includes(idx)
              const locData = getLocationByTypeId(typeId)
              const name = locData?.name || typeId
              const icon = LOCATION_ICON[typeId] ?? LOCATION_ICON.default

              return (
                <button
                  key={idx}
                  onClick={() => handleLocationClick(idx, typeId)}
                  disabled={isCompleted || isProcessing}
                  className="choice-btn group text-left"
                  style={isCompleted ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                >
                  <div className="flex items-center gap-3">
                    {/* 圖示標籤 */}
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded border mt-0.5
                      ${isCompleted
                        ? 'border-gray-700 text-gray-600'
                        : 'border-game-border text-game-accent group-hover:bg-purple-900/40'
                      }`}>
                      {icon} {isCompleted ? '已探索' : '前往'}
                    </span>
                    {/* 地點名稱 */}
                    <span className={isCompleted ? 'text-gray-600' : 'text-gray-100'}>
                      {name}
                      {locData?.description && (
                        <span className="ml-2 text-xs text-gray-500">— {locData.description}</span>
                      )}
                    </span>
                  </div>
                </button>
              )
            })}

            {/* 分隔線 */}
            <div className="border-t border-gray-800 my-1" />

            {/* 深入下一層按鈕 */}
            <button
              onClick={handleAdvance}
              disabled={!advanceInfo.canAdvance}
              className="choice-btn group text-left"
              style={!advanceInfo.canAdvance ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
            >
              <div className="flex items-center gap-3">
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded border mt-0.5
                  ${advanceInfo.canAdvance
                    ? 'border-red-700 text-red-400 group-hover:bg-red-900/40'
                    : 'border-gray-700 text-gray-600'
                  }`}>
                  ▶ 深入
                </span>
                <span className={advanceInfo.canAdvance ? 'text-gray-100' : 'text-gray-600'}>
                  {advanceInfo.canAdvance
                    ? '深入下一層'
                    : `尚需再探索 ${Math.max(0, (LOCATIONS_PER_SUBLAYER ?? 3) - completedCount)} 個地點...`}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
