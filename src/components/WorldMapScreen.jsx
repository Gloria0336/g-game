import { useState, useEffect, useRef } from 'react'
import { ACTION } from '../engine/GameEngine.js'
import { pickEvents, applyNoIntervention, applyTrapEffect, getPrivateMomentDemon } from '../engine/ExplorationSystem.js'
import { canAdvanceSubLayer, advanceToNextSubLayer, getLayerTierDesc, LOCATIONS_TO_UNLOCK_NEXT, SCENE_DRAW_COUNT } from '../engine/MapEngine.js'
import { getLocationByTypeId } from '../engine/LocationDB.js'
import { getRandomMonsterByTier } from '../engine/MonsterDB.js'
import { RIFT_ANOMALY_SUBTYPES, CRISIS_RESCUE_SUBTYPES, INVESTIGATION, TRAP_SUBTYPES, drawItemFromPool, REST_RECOVERY } from '../engine/EventDB.js'
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

function getEventOptions(eventId, state) {
  if (!eventId) return [{ label: '繼續', key: 'confirm' }]
  const [type] = eventId.split('.')

  // rest_recovery：動態依惡魔狀態產生選項
  if (type === 'rest_recovery') {
    const opts = [{ label: '😴 獨自休息', key: 'solo_rest' }]
    REST_RECOVERY.options.filter(o => o.demonId).forEach(o => {
      const demon = state?.demons?.[o.demonId]
      if (demon?.contract_status !== 'hostile') opts.push({ label: `💞 ${o.label}`, key: o.id })
    })
    return opts
  }

    // anomaly.* 子類型：從 EventDB 讀取真實選項
  if (type === 'anomaly') {
    const def = RIFT_ANOMALY_SUBTYPES[eventId]
    if (def?.options) return def.options.map(o => ({ label: o.label, key: o.id }))
  }

  // rescue.* 子類型：介入 / 不介入
  if (type === 'rescue') {
    return [
      { label: '⚔ 介入救援', key: 'intervene' },
      { label: '💨 選擇不介入', key: 'no_intervene' },
    ]
  }

  return EVENT_PROGRESSION_OPTIONS[eventId]
    ?? EVENT_PROGRESSION_OPTIONS[type]
    ?? [{ label: '繼續', key: 'confirm' }]
}

function getEventDescription(eventId, locData) {
  if (!eventId) return '沒有發生特別的事情。'
  const [type] = eventId.split('.')
  if (type === 'investigation') return locData?.investigationHint ?? '進行仔細調查...'
  if (type === 'rest_recovery') return '發現安全的休息點。HP/SP 已恢復。'
  if (type === 'item_discovery') return '找到了一些物資遺留！'
  if (type === 'npc_encounter') return '遭遇一名倖存者...'
  if (type === 'demon_private_moment') return '惡魔似乎有話想說...'
  if (type === 'anomaly') {
    const def = RIFT_ANOMALY_SUBTYPES[eventId]
    return def ? `【${def.name}】${def.description}` : '裂隙能量異常波動，需要謹慎應對。'
  }
  if (type === 'rescue') {
    const def = CRISIS_RESCUE_SUBTYPES[eventId]
    return def ? `【${def.name}】${def.scenario}` : '遭遇危機事件，有人需要援助。'
  }
  if (type === 'trap') {
    if (eventId === 'trap.ambush') return '遭遇伏擊！魔物從暗處突襲。'
    const def = TRAP_SUBTYPES[eventId]
    return def ? `【${def.name}】${def.description}　觸發了陷阱，選擇迴避方式。` : '觸發了陷阱！選擇迴避方式。'
  }
  return '發生了未知事件。'
}

/**
 * D100 陷阱迴避骰點（roll-high；total >= dcAvoid→avoid, >= dcHalf→half, else→full）
 * AGI/WIL: bonus = floor(stat/5)*3；insight: bonus = floor(insight/10)*5
 */
function rollTrapDice(statValue, statKey, dcAvoid, dcHalf) {
  const roll = Math.floor(Math.random() * 100) + 1
  const bonus = statKey === 'insight'
    ? Math.floor((statValue ?? 0) / 10) * 5
    : Math.floor((statValue ?? 0) / 5) * 3
  const total = roll + bonus
  const outcome = total >= dcAvoid ? 'avoid' : total >= dcHalf ? 'half' : 'full'
  return { roll, bonus, total, outcome }
}

/**
 * D100 調查骰點（insight 每 10 點 → +5；roll + bonus ≤ dc 視為成功）
 */
function rollInvDice(insight, dc) {
  const roll  = Math.floor(Math.random() * 100) + 1
  const bonus = Math.floor((insight ?? 0) / 10) * 5
  return { roll, bonus, success: roll + bonus <= dc }
}

export default function WorldMapScreen({ state, dispatch, revealedDemons, apiKey, modelId, writer, aiEnabled }) {
  const { exploration, demons, heroine } = state

  const totalSubLayers = { 1: 1, 2: 5, 3: 5, 4: 5, 5: 3 }[exploration.currentLayer] || 1
  const advanceInfo = canAdvanceSubLayer(exploration)
  const completedCount = (exploration.subLayerUsedScenes ?? []).length
  const isEventMode = exploration.activeScene !== null

  // ── 調查子流程本地狀態 ────────────────────────────────────────
  // invState: null | { phase: 'initial' }
  //         | { phase: 'deep_dive', intro: string, objects: string[], loading: boolean }
  //         | { phase: 'result', text: string, success: boolean, trapId: string|null, itemFound: boolean }
  const [invState, setInvState] = useState(null)
  const aiCallRef = useRef(false)

  // ── 陷阱迴避子流程本地狀態 ────────────────────────────────────
  // trapState: null | { phase: 'choosing', trapId }
  //          | { phase: 'result', trapId, outcome, roll, bonus, total, statLabel, option }
  const [trapState, setTrapState] = useState(null)

  // 進入/離開調查事件時重置子流程
  const activeEventId = exploration.activeEventId
  useEffect(() => {
    if (activeEventId === 'investigation' && invState === null) {
      setInvState({ phase: 'initial' })
    }
    if (activeEventId !== 'investigation' && invState !== null) {
      setInvState(null)
    }
    // 陷阱迴避子流程生命週期
    const isTrapEvent = activeEventId?.startsWith('trap.') && activeEventId !== 'trap.ambush'
    if (isTrapEvent && trapState === null) setTrapState({ phase: 'choosing', trapId: activeEventId })
    if (!isTrapEvent && trapState !== null) setTrapState(null)
  }, [activeEventId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 調查選項處理（thorough / quick / abandon）────────────────
  const handleInvestigationOption = async (optionKey) => {
    const locData = getLocationByTypeId(exploration.activeScene)
    const fallback = INVESTIGATION.fallbackTexts[exploration.activeScene] ?? {}

    if (optionKey === 'abandon') {
      const locName = locData?.name ?? '此地'
      setInvState({
        phase: 'result',
        text: `妳無視了${locName}內的異樣，直接離開了。`,
        success: false,
        trapId: null,
        itemFound: false,
      })
      return
    }

    if (optionKey === 'quick') {
      const { success } = rollInvDice(heroine.insight, INVESTIGATION.quick.dc)
      const mode = success ? 'quick_success' : 'quick_failure'
      let narrative = null
      if (aiEnabled) {
        const result = await writer.generateInvestigationText(mode, locData, state, apiKey, modelId)
        narrative = result?.narrative ?? null
      }
      if (!narrative) {
        narrative = success
          ? (fallback.quick_success ?? '快速掃視後，確認了幾個值得注意的地方。')
          : (fallback.quick_failure ?? '快速瀏覽一圈，什麼都沒有發現。')
      }
      const itemFound = success && Math.random() < INVESTIGATION.quick.itemDiscoveryChance
      setInvState({ phase: 'result', text: narrative, success, trapId: null, itemFound })
      return
    }

    if (optionKey === 'thorough') {
      if (aiCallRef.current) return
      aiCallRef.current = true
      setInvState({ phase: 'deep_dive', intro: '', objects: [], loading: true })

      let intro   = fallback.thorough_intro   ?? '妳開始仔細搜查這個地點。'
      let objects = fallback.thorough_objects ?? ['物件 A', '物件 B', '物件 C']

      if (aiEnabled) {
        const result = await writer.generateInvestigationText('thorough', locData, state, apiKey, modelId)
        if (result?.intro) intro = result.intro
        if (result?.objects?.length >= 3) objects = result.objects.slice(0, 3)
      }

      aiCallRef.current = false
      setInvState({ phase: 'deep_dive', intro, objects, loading: false })
    }
  }

  // ── 深入調查子物件 ─────────────────────────────────────────
  const handleDeepDiveObject = async (objectName) => {
    const locData = getLocationByTypeId(exploration.activeScene)
    const fallback = INVESTIGATION.fallbackTexts[exploration.activeScene] ?? {}
    const { success } = rollInvDice(heroine.insight, INVESTIGATION.thorough.dc)
    const mode = success ? 'deep_success' : 'deep_failure'

    let narrative = null
    if (aiEnabled) {
      const result = await writer.generateInvestigationText(mode, locData, state, apiKey, modelId, { objectName })
      narrative = result?.narrative ?? null
    }
    if (!narrative) {
      narrative = success
        ? (fallback.deep_success ?? '仔細調查後，找到了有用的線索。')
        : (fallback.deep_failure ?? '調查無果，什麼都沒有發現。')
    }

    // 陷阱觸發（仔細搜查成功時 15% 機率）
    let trapId = null
    if (success && Math.random() < INVESTIGATION.thorough.trapChance) {
      const trapKeys = Object.keys(TRAP_SUBTYPES)
      trapId = trapKeys[Math.floor(Math.random() * trapKeys.length)]
      const updates = applyTrapEffect(state, trapId, 'half')
      if (updates?.heroine) {
        dispatch({ type: ACTION.COMBAT_APPLY_LOG, heroineUpdate: updates.heroine, combatUpdate: {} })
      }
    }

    const itemFound = success && Math.random() < INVESTIGATION.thorough.itemDiscoveryChance
    setInvState({ phase: 'result', text: narrative, success, trapId, itemFound })
  }

  // ── 調查結果確認（加入物品 → 關閉事件）────────────────────
  const handleInvestigationConfirm = () => {
    if (invState?.itemFound) {
      const drawn = drawItemFromPool(exploration.currentLayer)
      if (drawn) {
        dispatch({ type: ACTION.ADD_ITEM, itemId: drawn.id, source: drawn.source, quantity: 1 })
      }
    }
    dispatch({ type: ACTION.CONFIRM_SCENE_EVENT })
    setInvState(null)
  }

  // ── 陷阱迴避選項處理 ──────────────────────────────────────────
  const handleTrapAvoidOption = (option) => {
    const trapId = trapState?.trapId
    if (!trapId) return
    const statValue = heroine[option.stat] ?? 0
    const { roll, bonus, total, outcome } = rollTrapDice(statValue, option.stat, option.dcAvoid, option.dcHalf)
    if (outcome !== 'avoid') {
      const updates = applyTrapEffect(state, trapId, outcome === 'half' ? 'half' : 'full')
      if (updates?.heroine) dispatch({ type: ACTION.COMBAT_APPLY_LOG, heroineUpdate: updates.heroine, combatUpdate: {} })
    }
    setTrapState({ phase: 'result', trapId, outcome, roll, bonus, total, statLabel: option.statLabel, option })
  }

  const handleTrapConfirm = () => {
    setTrapState(null)
    dispatch({ type: ACTION.CONFIRM_SCENE_EVENT })
  }

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

    // 裂隙異變：隨機選一個子類型，以子類型 ID 進入事件模式
    if (eventId === 'rift_anomaly') {
      const subtypeIds = Object.keys(RIFT_ANOMALY_SUBTYPES)
      const pickedSubtype = subtypeIds[Math.floor(Math.random() * subtypeIds.length)]
      dispatch({ type: ACTION.SELECT_SCENE, typeId, eventId: pickedSubtype })
      return
    }

    // 立即效果事件（在顯示事件面板前套用）
    if (eventId) {
      const [evType] = eventId.split('.')
      if (evType === 'trap') {
        if (eventId === 'trap.ambush') {
          const tier = exploration.currentLayer >= 4 ? (Math.random() < 0.5 ? 'B' : 'C')
                     : exploration.currentLayer === 3 ? 'B' : 'A'
          const monster = getRandomMonsterByTier(tier)
          if (monster) {
            dispatch({ type: ACTION.SELECT_SCENE, typeId, eventId })
            dispatch({ type: ACTION.START_COMBAT, enemyData: monster })
          }
          return
        }
        // 非伏擊陷阱：不立即套用效果，交由 trapState 子流程處理
      } else if (evType === 'rest_recovery') {
        dispatch({ type: ACTION.USE_REST_IN_SUBLAYER })
      } else if (evType === 'demon_private_moment') {
        const demonId = getPrivateMomentDemon(typeId, state)
        if (demonId) {
          dispatch({ type: ACTION.MARK_PRIVATE_MOMENT, demonId, key: `${demonId}_${typeId}` })
          dispatch({ type: ACTION.UPDATE_DEMON_RELATION, demonId, trustDelta: 2, affectionDelta: 3 })
        }
      }
    }

    // 切換至事件進程模式
    dispatch({ type: ACTION.SELECT_SCENE, typeId, eventId })
  }

  const handleEventOption = (optionKey) => {
    // 調查事件由獨立子流程處理
    if (activeEventId === 'investigation') {
      handleInvestigationOption(optionKey)
      return
    }

    if (activeEventId) {
      const [type] = activeEventId.split('.')

      // rescue.*：介入 → 觸發戰鬥；不介入 → independence +1
      if (type === 'rescue') {
        if (optionKey === 'intervene') {
          const tier = exploration.currentLayer <= 2 ? 'A' : exploration.currentLayer <= 4 ? 'B' : 'C'
          const monster = getRandomMonsterByTier(tier)
          if (monster) {
            dispatch({ type: ACTION.SELECT_SCENE, typeId: exploration.activeScene, eventId: activeEventId })
            dispatch({ type: ACTION.START_COMBAT, enemyData: monster })
            return
          }
        } else if (optionKey === 'no_intervene') {
          const updates = applyNoIntervention(state)
          if (updates.heroine) {
            dispatch({ type: ACTION.COMBAT_APPLY_LOG, heroineUpdate: updates.heroine, combatUpdate: {} })
          }
        }
      }

      // rest_recovery：依選項套用回復效果
      if (type === 'rest_recovery') {
        const opt = REST_RECOVERY.options.find(o => o.id === optionKey)
        if (opt) {
          const h = state.heroine
          const heroineUpdate = { ...h }
          if (opt.rewards.HP) heroineUpdate.HP = Math.min(h.maxHP, h.HP + Math.floor(h.maxHP * opt.rewards.HP))
          if (opt.rewards.SP) heroineUpdate.SP = Math.min(h.maxSP, h.SP + Math.floor(h.maxSP * opt.rewards.SP))
          if (opt.rewards.DES !== undefined) heroineUpdate.DES = Math.max(0, h.DES + opt.rewards.DES)
          if (opt.rewards.independence !== undefined) heroineUpdate.independence = Math.min(100, (h.independence ?? 30) + opt.rewards.independence)
          dispatch({ type: ACTION.COMBAT_APPLY_LOG, heroineUpdate, combatUpdate: {} })
          if (opt.demonId) {
            dispatch({ type: ACTION.UPDATE_DEMON_RELATION, demonId: opt.demonId,
              affectionDelta: opt.rewards.affection ?? 0, trustDelta: opt.rewards.trust ?? 0 })
          }
        }
      }

            // anomaly.*：套用選項獎勵（DES、independence）
      if (type === 'anomaly') {
        const def = RIFT_ANOMALY_SUBTYPES[activeEventId]
        const chosenOpt = def?.options?.find(o => o.id === optionKey)
        if (chosenOpt?.chainEvent === 'encounter_combat') {
          let tier = 'A'
          if (exploration.currentLayer === 2 && Math.random() < 0.2) tier = 'B'
          else if (exploration.currentLayer === 3) tier = 'B'
          else if (exploration.currentLayer === 4 && Math.random() < 0.2) tier = 'C'
          else if (exploration.currentLayer === 4) tier = 'B'
          else if (exploration.currentLayer === 5) tier = Math.random() < 0.5 ? 'B' : 'C'
          const monster = getRandomMonsterByTier(tier)
          if (monster) {
            dispatch({ type: ACTION.START_COMBAT, enemyData: monster })
            return
          }
        }
        if (chosenOpt?.rewards) {
          const heroineUpdate = { ...state.heroine }
          if (chosenOpt.rewards.DES !== undefined)
            heroineUpdate.DES = Math.max(0, Math.min(200, (heroineUpdate.DES ?? 0) + chosenOpt.rewards.DES))
          if (chosenOpt.rewards.independence !== undefined)
            heroineUpdate.independence = Math.min(100, (heroineUpdate.independence ?? 30) + chosenOpt.rewards.independence)
          dispatch({ type: ACTION.COMBAT_APPLY_LOG, heroineUpdate, combatUpdate: {} })
        }
      }
    }

    dispatch({ type: ACTION.CONFIRM_SCENE_EVENT })
  }

  const handleAdvance = () => {
    if (!advanceInfo.canAdvance) return
    const newExploration = advanceToNextSubLayer(exploration)
    dispatch({ type: ACTION.ADVANCE_SUBLAYER, newExploration })
  }

  // 事件面板資料
  const activeLocData = isEventMode ? getLocationByTypeId(exploration.activeScene) : null

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

          {isEventMode && activeEventId === 'investigation' ? (
            /* ── Mode B-INV：調查事件三階段子流程 ── */
            <div className="flex flex-col gap-3">

              {/* 階段1：選擇調查方式 */}
              {invState?.phase === 'initial' && (
                <>
                  <p className="text-gray-400 text-sm mb-1 italic">
                    {activeLocData?.investigationHint ?? '進行調查...'}
                  </p>
                  {[
                    { key: 'thorough', label: '🔎 仔細搜查', desc: `深入分析，揭露更多細節（DC ${INVESTIGATION.thorough.dc}，較易）` },
                    { key: 'quick',    label: '👀 快速掃視', desc: `快速確認，效率優先（DC ${INVESTIGATION.quick.dc}，較難）` },
                    { key: 'abandon',  label: '↩ 放棄',     desc: '無視異樣，直接離開' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => handleInvestigationOption(opt.key)}
                      className="choice-btn group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded border border-game-border text-game-accent group-hover:bg-purple-900/40 mt-0.5">
                          ▶ 選擇
                        </span>
                        <div>
                          <span className="text-gray-100">{opt.label}</span>
                          <span className="ml-2 text-xs text-gray-500">— {opt.desc}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                  <p className="text-gray-600 text-xs mt-1">
                    洞察力 {heroine.insight} → 骰點加成 +{Math.floor((heroine.insight ?? 0) / 10) * 5}
                  </p>
                </>
              )}

              {/* 階段2：仔細搜查深入（顯示 3 個子物件） */}
              {invState?.phase === 'deep_dive' && (
                <>
                  {invState.loading ? (
                    <p className="text-gray-400 text-sm italic animate-pulse">正在感知周遭環境...</p>
                  ) : (
                    <>
                      <p className="text-gray-300 text-sm leading-relaxed mb-2">{invState.intro}</p>
                      <p className="text-gray-500 text-xs mb-2">選擇一個調查目標：</p>
                      {invState.objects.map((obj, i) => (
                        <button
                          key={i}
                          onClick={() => handleDeepDiveObject(obj)}
                          className="choice-btn group text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="shrink-0 text-xs px-2 py-0.5 rounded border border-game-border text-game-accent group-hover:bg-purple-900/40 mt-0.5">
                              ▶ 調查
                            </span>
                            <span className="text-gray-100">{obj}</span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}

              {/* 階段3：調查結果 */}
              {invState?.phase === 'result' && (
                <>
                  <p className="text-gray-300 text-sm leading-relaxed mb-2">{invState.text}</p>
                  {invState.trapId && (
                    <p className="text-red-400 text-xs mb-2">
                      ⚠ 觸發了陷阱：{TRAP_SUBTYPES[invState.trapId]?.name ?? '未知陷阱'}（已套用半傷效果）
                    </p>
                  )}
                  {invState.itemFound && (
                    <p className="text-game-accent text-xs mb-2">
                      ✦ 妳在調查中發現了物資！
                    </p>
                  )}
                  <button
                    onClick={handleInvestigationConfirm}
                    className="choice-btn group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded border border-game-border text-game-accent group-hover:bg-purple-900/40 mt-0.5">
                        ▶ 確認
                      </span>
                      <span className="text-gray-100">繼續前進</span>
                    </div>
                  </button>
                </>
              )}

            </div>
          ) : isEventMode && activeEventId?.startsWith('trap.') && activeEventId !== 'trap.ambush' && trapState ? (
            /* ── Mode B-TRAP：陷阱迴避子流程 ── */
            <div className="flex flex-col gap-3">

              {/* 階段1：選擇迴避方式 */}
              {trapState.phase === 'choosing' && (() => {
                const trapDef = TRAP_SUBTYPES[trapState.trapId]
                const opts = trapDef?.avoidOptions ?? []
                return (
                  <>
                    <p className="text-red-400 text-sm mb-1">
                      ⚠ {trapDef?.name ?? '陷阱'}發動！選擇迴避方式：
                    </p>
                    {opts.map(opt => {
                      const statVal = heroine[opt.stat] ?? 0
                      const bonusDisplay = opt.stat === 'insight'
                        ? Math.floor(statVal / 10) * 5
                        : Math.floor(statVal / 5) * 3
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleTrapAvoidOption(opt)}
                          className="choice-btn group text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="shrink-0 text-xs px-2 py-0.5 rounded border border-game-border text-game-accent group-hover:bg-purple-900/40 mt-0.5">
                              ▶ 選擇
                            </span>
                            <div>
                              <span className="text-gray-100">{opt.label}</span>
                              <span className="ml-2 text-xs text-gray-500">
                                — {opt.statLabel} {statVal}（+{bonusDisplay}）　完全迴避DC：{opt.dcAvoid}　半規避DC：{opt.dcHalf}
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </>
                )
              })()}

              {/* 階段2：迴避結果 */}
              {trapState.phase === 'result' && (
                <>
                  <p className="text-gray-400 text-xs mb-1">
                    骰點：D100={trapState.roll} + {trapState.statLabel}加成={trapState.bonus} → 合計 {trapState.total}
                  </p>
                  {trapState.outcome === 'avoid' && (
                    <p className="text-green-400 text-sm mb-2">✦ 完全迴避！妳成功躲開了陷阱，毫髮無傷。</p>
                  )}
                  {trapState.outcome === 'half' && (
                    <p className="text-yellow-400 text-sm mb-2">◑ 部分規避。妳在最後一刻反應過來，減輕了部分傷害。</p>
                  )}
                  {trapState.outcome === 'full' && (
                    <p className="text-red-400 text-sm mb-2">✕ 完全觸發！妳無法迴避，承受了完整的傷害。</p>
                  )}
                  <button
                    onClick={handleTrapConfirm}
                    className="choice-btn group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded border border-game-border text-game-accent group-hover:bg-purple-900/40 mt-0.5">
                        ▶ 確認
                      </span>
                      <span className="text-gray-100">繼續前進</span>
                    </div>
                  </button>
                </>
              )}

            </div>
          ) : isEventMode ? (
            /* Mode B：其他事件進程選項 */
            <>
              <p className="text-gray-400 text-sm mb-3 italic">
                在 {activeLocData?.name ?? exploration.activeScene} 中，你要怎麼做？
              </p>
              <div className="flex flex-col gap-2">
                {getEventOptions(activeEventId, state).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleEventOption(opt.key)}
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
                選擇一個地點進行探索：
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
                  <div className="text-gray-600 text-sm italic py-2">本回合無可用場景。</div>
                )}

                {advanceInfo.canAdvance && (
                  <>
                    <div className="border-t border-gray-800 my-1" />
                    <button
                      onClick={handleAdvance}
                      className="choice-btn group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded border mt-0.5 border-red-700 text-red-400 group-hover:bg-red-900/40">
                          ▶ 深入
                        </span>
                        <span className="text-gray-100">深入下一層</span>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
