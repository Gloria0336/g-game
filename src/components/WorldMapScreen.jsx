import { ACTION } from '../engine/GameEngine.js'
import { pickEvents, applyNoIntervention, applyTrapEffect, getPrivateMomentDemon } from '../engine/ExplorationSystem.js'
import { canAdvanceSubLayer, advanceToNextSubLayer, getLayerTierDesc, LOCATIONS_TO_UNLOCK_NEXT, SCENE_DRAW_COUNT } from '../engine/MapEngine.js'
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

const EVENT_PROGRESSION_OPTIONS = {
  rest_recovery:        [{ label: '💤 確認休息', key: 'confirm' }],
  investigation:        [{ label: '🔍 仔細調查', key: 'thorough' }, { label: '👀 快速查看', key: 'quick' }],
  item_discovery:       [{ label: '✦ 仔細搜索物資', key: 'confirm' }],
  npc_encounter:        [{ label: '💬 上前接觸', key: 'approach' }, { label: '👤 保持距離', key: 'distance' }],
  demon_private_moment: [{ label: '💫 傾聽惡魔', key: 'listen' }],
  rift_anomaly:         [{ label: '🌀 繼續探索', key: 'confirm' }],
  crisis_rescue:        [{ label: '⚠ 快速通過', key: 'confirm' }],
}

function getEventOptions(eventId) {
  if (!eventId) return [{ label: '繼續', key: 'confirm' }]
  const [type] = eventId.split('.')
  if (type === 'trap') return [{ label: '⚠ 繼續前進', key: 'confirm' }]
  if (type === 'rescue') return [{ label: '⚠ 確認', key: 'confirm' }]
  return EVENT_PROGRESSION_OPTIONS[type] ?? [{ label: '繼續', key: 'confirm' }]
}

function getEventDescription(eventId, locData) {
  if (!eventId) return '沒有發生特別的事情。'
  const [type] = eventId.split('.')
  if (type === 'investigation') return locData?.investigationHint ?? '進行仔細調查...'
  if (type === 'rest_recovery') return '發現安全的休息點。HP/SP 已恢復。'
  if (type === 'item_discovery') return '找到了一些物資遺留！'
  if (type === 'npc_encounter') return '遭遇一名倖存者...'
  if (type === 'demon_private_moment') return '惡魔似乎有話想說...'
  if (type === 'rift_anomaly') return '裂隙能量異常波動，需要謹慎應對。'
  if (type === 'crisis_rescue') return '遭遇危機事件。'
  if (type === 'rescue') return '發現需要援助的對象。'
  if (type === 'trap') return `觸發了陷阱！已受到傷害。`
  return '發生了未知事件。'
}

export default function WorldMapScreen({ state, dispatch, revealedDemons }) {
  const { exploration, demons, heroine } = state

  const totalSubLayers = { 1: 1, 2: 5, 3: 5, 4: 5, 5: 3 }[exploration.currentLayer] || 1
  const advanceInfo = canAdvanceSubLayer(exploration)
  const completedCount = (exploration.subLayerUsedScenes ?? []).length
  const isEventMode = exploration.activeScene !== null

  const handleSceneSelect = async (typeId) => {
    if ((exploration.subLayerUsedScenes ?? []).includes(typeId)) return

    const events = pickEvents(typeId, state, { maxEvents: 1 })
    const eventId = events[0] ?? null

    // 戰鬥：立即進入，不顯示事件面板
    if (eventId === 'encounter_combat') {
      let tier = 'A'
      if (exploration.currentLayer === 2 && Math.random() < 0.2) tier = 'B'
      else if (exploration.currentLayer === 3) tier = 'B'
      else if (exploration.currentLayer === 4 && Math.random() < 0.2) tier = 'C'
      else if (exploration.currentLayer === 4) tier = 'B'
      else if (exploration.currentLayer === 5) tier = Math.random() < 0.5 ? 'B' : 'C'

      const monster = getRandomMonsterByTier(tier)
      if (monster) {
        dispatch({ type: ACTION.SELECT_SCENE, typeId, eventId })
        dispatch({ type: ACTION.START_COMBAT, enemyData: monster })
        return
      }
    }

    // 立即效果事件（在顯示事件面板前套用）
    if (eventId) {
      const [evType] = eventId.split('.')
      if (evType === 'trap') {
        const updates = applyTrapEffect(state, eventId, 'full')
        if (updates.heroine) {
          dispatch({ type: ACTION.COMBAT_APPLY_LOG, heroineUpdate: updates.heroine, combatUpdate: {} })
        }
      } else if (evType === 'rest_recovery') {
        dispatch({ type: ACTION.USE_REST_IN_SUBLAYER })
        dispatch({ type: ACTION.REST })
      } else if (evType === 'demon_private_moment') {
        const demonId = getPrivateMomentDemon(typeId, state)
        if (demonId) {
          dispatch({ type: ACTION.MARK_PRIVATE_MOMENT, demonId, key: `${demonId}_${typeId}` })
          dispatch({ type: ACTION.UPDATE_DEMON_RELATION, demonId, trustDelta: 2, affectionDelta: 3 })
        }
      } else if (evType === 'crisis_rescue') {
        const updates = applyNoIntervention(state)
        if (updates.heroine) {
          dispatch({ type: ACTION.COMBAT_APPLY_LOG, heroineUpdate: updates.heroine, combatUpdate: {} })
        }
      }
    }

    // 切換至事件進程模式
    dispatch({ type: ACTION.SELECT_SCENE, typeId, eventId })
  }

  const handleEventOption = () => {
    dispatch({ type: ACTION.CONFIRM_SCENE_EVENT })
  }

  const handleAdvance = () => {
    if (!advanceInfo.canAdvance) return
    const newExploration = advanceToNextSubLayer(exploration)
    dispatch({ type: ACTION.ADVANCE_SUBLAYER, newExploration })
  }

  // 事件面板資料
  const activeLocData = isEventMode ? getLocationByTypeId(exploration.activeScene) : null
  const activeEventId = exploration.activeEventId

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-game-dark text-white flex flex-col">

      {/* ── 頂部 HUD ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
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

      {/* 右側：StatsDisplay */}
      <StatsDisplay
        heroine={heroine}
        demons={demons}
        mainRoute={state.mainRoute}
        revealedDemons={revealedDemons ?? new Set()}
      />

      {/* ── 中央：場景資訊 / 探索日誌 ── */}
      <div className="flex-1 flex items-center justify-center px-8 py-24">
        <div className="game-panel p-6 max-w-2xl w-full min-h-[200px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-game-accent text-xs font-medium tracking-wider uppercase">
              {isEventMode ? `◆ ${activeLocData?.name ?? exploration.activeScene}` : '◆ 探索日誌'}
            </span>
            <span className="text-gray-600 text-xs">
              已探索 {completedCount} / {LOCATIONS_TO_UNLOCK_NEXT} 個地點
            </span>
          </div>

          {isEventMode ? (
            <div className="flex flex-col gap-2">
              <p className="text-gray-300 text-sm leading-relaxed mb-2">
                {getEventDescription(activeEventId, activeLocData)}
              </p>
              {activeLocData?.description && (
                <p className="text-gray-600 text-xs italic leading-relaxed">
                  {activeLocData.description}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <p className="text-gray-500 italic text-sm">選擇下方地點開始探索...</p>
              <p className="text-gray-700 text-xs">
                {advanceInfo.canAdvance
                  ? '✦ 已可深入下一層'
                  : `需再探索 ${Math.max(0, LOCATIONS_TO_UNLOCK_NEXT - completedCount)} 個地點才能推進`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── 底部：場景選擇 / 事件進程面板 ── */}
      <div className="px-6 pb-6 z-10">
        <div className="game-panel p-5 max-w-4xl mx-auto animate-slide-up">

          {isEventMode ? (
            /* Mode B：事件進程選項 */
            <>
              <p className="text-gray-400 text-sm mb-3 italic">
                在 {activeLocData?.name ?? exploration.activeScene} 中，你要怎麼做？
              </p>
              <div className="flex flex-col gap-2">
                {getEventOptions(activeEventId).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={handleEventOption}
                    className="choice-btn group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded border border-game-border text-game-accent group-hover:bg-purple-900/40 mt-0.5">
                        ▶ 選擇
                      </span>
                      <span className="text-gray-100">{opt.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Mode A：場景選擇 */
            <>
              <p className="text-gray-400 text-sm mb-3 italic">
                {advanceInfo.canAdvance
                  ? '已完成足夠探索，可以深入下一層，或繼續探索當前區域。'
                  : '選擇一個地點進行探索：'}
              </p>
              <div className="flex flex-col gap-2">
                {(exploration.drawnScenes ?? []).map((typeId) => {
                  const isUsed = (exploration.subLayerUsedScenes ?? []).includes(typeId)
                  const locData = getLocationByTypeId(typeId)
                  const name = locData?.name || typeId
                  const icon = LOCATION_ICON[typeId] ?? LOCATION_ICON.default

                  return (
                    <button
                      key={typeId}
                      onClick={() => handleSceneSelect(typeId)}
                      disabled={isUsed}
                      className="choice-btn group text-left"
                      style={isUsed ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded border mt-0.5
                          ${isUsed
                            ? 'border-gray-700 text-gray-600'
                            : 'border-game-border text-game-accent group-hover:bg-purple-900/40'
                          }`}>
                          {icon} {isUsed ? '已探索' : '前往'}
                        </span>
                        <span className={isUsed ? 'text-gray-600' : 'text-gray-100'}>
                          {name}
                          {locData?.description && (
                            <span className="ml-2 text-xs text-gray-500">— {locData.description}</span>
                          )}
                        </span>
                      </div>
                    </button>
                  )
                })}

                {(exploration.drawnScenes ?? []).length === 0 && (
                  <div className="text-gray-600 text-sm italic py-2">本回合無可用場景，請深入下一層。</div>
                )}

                <div className="border-t border-gray-800 my-1" />

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
                        : `尚需再探索 ${Math.max(0, LOCATIONS_TO_UNLOCK_NEXT - completedCount)} 個地點...`}
                    </span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
