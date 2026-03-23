/**
 * MapEngine.js
 * 五層地牢地圖狀態管理
 *
 * 職責：
 *   - 子層地點隨機生成
 *   - 子層 / 層間解鎖條件判定
 *   - 探索進度追蹤
 *   - Ch.E1 觸發判定
 */

import { randomPickLocations } from './LocationDB.js'

// ────────────────────────────────────────
// 地圖常數
// ────────────────────────────────────────

/** 每個子層包含的地點數 */
export const LOCATIONS_PER_SUBLAYER = 4

/** 推進至下一子層所需的最少已探索地點數 */
export const LOCATIONS_TO_UNLOCK_NEXT = 3

/** 各層的子層數 */
export const SUBLAYER_COUNT = {
  1: 1,  // 第一層小鎮為固定地點，視為單一子層
  2: 5,
  3: 5,
  4: 5,
  5: 3,
}

/**
 * 各層→下一層的特殊解鎖條件
 * （滿足條件才能在最後一個子層解鎖下一層入口）
 */
export const LAYER_TRANSITION_CONDITIONS = {
  // 第一層 → 第二層：進入 town_outskirts 後自動
  '1→2': {
    type: 'location_visit',
    locationTypeId: 'town_outskirts',
    note: '進入小鎮外圍後自動解鎖第二層入口',
  },
  // 第二層 → 第三層
  '2→3': {
    type: 'battle_count',
    minBattles: 3,
    note: '至少完成 3 場戰鬥後，在 2-5 解鎖第三層入口',
  },
  // 第三層 → 第四層
  '3→4': {
    type: 'battle_count',
    minBattles: 3,
    note: '至少完成 3 場戰鬥後，在 3-5 解鎖第四層入口',
  },
  // 第四層 → 第五層
  '4→5': {
    type: 'battle_and_tierc',
    minBattles: 3,
    minTierCKills: 1,
    note: '至少完成 3 場戰鬥且至少擊殺 1 名 Tier C 魔物後，在 4-5 解鎖第五層入口',
  },
  // 第五層 → Ch.E1（自動，無特殊條件）
  '5→E1': {
    type: 'auto',
    note: '完成 5-3 後自動觸發 Ch.E1',
  },
}

// ────────────────────────────────────────
// 初始探索狀態（供 GameEngine INITIAL_STATE 使用）
// ────────────────────────────────────────

export function createInitialExplorationState() {
  return {
    currentLayer: 1,
    currentSubLayer: 1,
    visitedSubLayers: [],            // 已完成的子層 ['2-1', '2-2', ...]
    currentSubLayerLocations: [],    // 當前子層的 LocationType ID 陣列（隨機生成）
    completedLocations: [],          // 本子層已探索完畢的地點索引（0-based）
    completedEvents: [],             // 全域已完成事件 ID（防重複觸發）
    restUsedInSubLayer: false,       // 本子層是否已使用休息
    layerBattleCount: 0,             // 當前層累積戰鬥場數
    tierCKillCount: 0,               // 當前層擊殺 Tier C 數
    subLayerUnlocked: false,         // 當前子層是否已滿足推進條件
    town_outskirts_visited: false,   // 第一層特殊追蹤
  }
}

// ────────────────────────────────────────
// 子層生成
// ────────────────────────────────────────

/**
 * 為當前子層隨機生成地點清單
 * @param {number} layer
 * @returns {string[]} LocationType ID 陣列
 */
export function generateSubLayerLocations(layer) {
  // 第一層為固定地點，由 App.jsx 直接使用 TOWN_LOCATIONS
  if (layer === 1) return ['town_market', 'town_shelter', 'town_outskirts']
  return randomPickLocations(layer, LOCATIONS_PER_SUBLAYER)
}

// ────────────────────────────────────────
// 解鎖條件判定
// ────────────────────────────────────────

/**
 * 判定當前子層是否可推進到下一子層
 * @param {Object} exploration - state.exploration
 * @returns {{ canAdvance: boolean, reason: string }}
 */
export function canAdvanceSubLayer(exploration) {
  const { currentLayer, currentSubLayer, completedLocations, subLayerUnlocked } = exploration

  if (subLayerUnlocked) return { canAdvance: true, reason: 'already_unlocked' }

  const totalSubLayers = SUBLAYER_COUNT[currentLayer] ?? 1
  const isLastSubLayer = currentSubLayer >= totalSubLayers

  // 預設：完成 3 個地點後解鎖
  const defaultUnlocked = completedLocations.length >= LOCATIONS_TO_UNLOCK_NEXT

  if (!isLastSubLayer) {
    return {
      canAdvance: defaultUnlocked,
      reason: defaultUnlocked ? 'completed_locations' : 'need_more_locations',
    }
  }

  // 最後一個子層：需額外判定層間條件
  const condKey = `${currentLayer}→${currentLayer + 1}`
  const cond = LAYER_TRANSITION_CONDITIONS[condKey]

  if (!cond) {
    return { canAdvance: defaultUnlocked, reason: 'no_special_condition' }
  }

  return checkLayerTransitionCondition(cond, exploration, defaultUnlocked)
}

/**
 * 判定層間特殊解鎖條件
 * @private
 */
function checkLayerTransitionCondition(cond, exploration, defaultLocationsMet) {
  if (!defaultLocationsMet) {
    return { canAdvance: false, reason: 'need_more_locations' }
  }

  switch (cond.type) {
    case 'auto':
      return { canAdvance: true, reason: 'auto' }

    case 'location_visit': {
      const visited = exploration.town_outskirts_visited
      return {
        canAdvance: visited,
        reason: visited ? 'town_outskirts_visited' : 'need_town_outskirts',
      }
    }

    case 'battle_count': {
      const met = exploration.layerBattleCount >= cond.minBattles
      return {
        canAdvance: met,
        reason: met ? 'battle_count_met' : `need_${cond.minBattles}_battles`,
      }
    }

    case 'battle_and_tierc': {
      const battlesMet = exploration.layerBattleCount >= cond.minBattles
      const tierCMet   = exploration.tierCKillCount  >= cond.minTierCKills
      const met = battlesMet && tierCMet
      return {
        canAdvance: met,
        reason: met
          ? 'battle_and_tierc_met'
          : !battlesMet
            ? `need_${cond.minBattles}_battles`
            : 'need_tierc_kill',
      }
    }

    default:
      return { canAdvance: defaultLocationsMet, reason: 'default' }
  }
}

/**
 * 判定是否達到 Ch.E1 觸發條件（完成第五層 5-3）
 * @param {Object} exploration
 * @returns {boolean}
 */
export function shouldTriggerFinalEval(exploration) {
  const { currentLayer, currentSubLayer, completedLocations } = exploration
  return (
    currentLayer === 5 &&
    currentSubLayer === 3 &&
    completedLocations.length >= LOCATIONS_TO_UNLOCK_NEXT
  )
}

// ────────────────────────────────────────
// 狀態更新函式（純函式，不直接 mutate state）
// ────────────────────────────────────────

/**
 * 標記地點為已探索，回傳更新後的 exploration
 * @param {Object} exploration
 * @param {number} locationIndex - 地點在 currentSubLayerLocations 中的索引
 * @returns {Object} 新的 exploration 物件
 */
export function markLocationCompleted(exploration, locationIndex) {
  if (exploration.completedLocations.includes(locationIndex)) return exploration

  const updated = {
    ...exploration,
    completedLocations: [...exploration.completedLocations, locationIndex],
  }

  // 第三個地點完成時，檢查並更新 subLayerUnlocked
  if (updated.completedLocations.length >= LOCATIONS_TO_UNLOCK_NEXT) {
    const { canAdvance } = canAdvanceSubLayer(updated)
    updated.subLayerUnlocked = canAdvance
  }

  return updated
}

/**
 * 推進至下一子層（或下一層第一個子層）
 * @param {Object} exploration
 * @returns {Object} 新的 exploration 物件
 */
export function advanceToNextSubLayer(exploration) {
  const { currentLayer, currentSubLayer } = exploration
  const totalSubLayers = SUBLAYER_COUNT[currentLayer] ?? 1

  const subLayerKey = `${currentLayer}-${currentSubLayer}`

  if (currentSubLayer < totalSubLayers) {
    // 推進至同層下一子層
    const nextSubLayer = currentSubLayer + 1
    return {
      ...exploration,
      currentSubLayer: nextSubLayer,
      currentSubLayerLocations: generateSubLayerLocations(currentLayer),
      completedLocations: [],
      restUsedInSubLayer: false,
      subLayerUnlocked: false,
      visitedSubLayers: [...exploration.visitedSubLayers, subLayerKey],
    }
  } else {
    // 推進至下一層第一子層
    const nextLayer = currentLayer + 1
    return {
      ...exploration,
      currentLayer: nextLayer,
      currentSubLayer: 1,
      currentSubLayerLocations: generateSubLayerLocations(nextLayer),
      completedLocations: [],
      restUsedInSubLayer: false,
      subLayerUnlocked: false,
      layerBattleCount: 0,    // 層戰鬥計數重置
      tierCKillCount: 0,      // 層 TierC 計數重置
      visitedSubLayers: [...exploration.visitedSubLayers, subLayerKey],
    }
  }
}

/**
 * 記錄一場戰鬥完成，更新計數器
 * @param {Object} exploration
 * @param {{ tierC: boolean }} battleResult
 * @returns {Object}
 */
export function recordBattleComplete(exploration, { tierC = false } = {}) {
  const updated = {
    ...exploration,
    layerBattleCount: exploration.layerBattleCount + 1,
  }
  if (tierC) updated.tierCKillCount = exploration.tierCKillCount + 1

  // 重新評估 subLayerUnlocked（如果還沒解鎖）
  if (!updated.subLayerUnlocked && updated.completedLocations.length >= LOCATIONS_TO_UNLOCK_NEXT) {
    const { canAdvance } = canAdvanceSubLayer(updated)
    updated.subLayerUnlocked = canAdvance
  }

  return updated
}

/**
 * 標記小鎮外圍已訪問（第一層 → 第二層解鎖觸發）
 * @param {Object} exploration
 * @returns {Object}
 */
export function markTownOutskirtsVisited(exploration) {
  const updated = { ...exploration, town_outskirts_visited: true }

  // 若目前在第一層的最後子層且地點數滿足，自動解鎖
  if (updated.completedLocations.length >= LOCATIONS_TO_UNLOCK_NEXT) {
    const { canAdvance } = canAdvanceSubLayer(updated)
    updated.subLayerUnlocked = canAdvance
  }

  return updated
}

/**
 * 標記事件為已完成（防重複觸發）
 * @param {Object} exploration
 * @param {string} eventId
 * @returns {Object}
 */
export function markEventCompleted(exploration, eventId) {
  if (exploration.completedEvents.includes(eventId)) return exploration
  return {
    ...exploration,
    completedEvents: [...exploration.completedEvents, eventId],
  }
}

/**
 * 標記休息已使用
 * @param {Object} exploration
 * @returns {Object}
 */
export function markRestUsed(exploration) {
  return { ...exploration, restUsedInSubLayer: true }
}

// ────────────────────────────────────────
// 查詢工具函式
// ────────────────────────────────────────

/**
 * 取得當前子層的標籤（如 '2-3'）
 * @param {Object} exploration
 * @returns {string}
 */
export function getCurrentSubLayerKey(exploration) {
  return `${exploration.currentLayer}-${exploration.currentSubLayer}`
}

/**
 * 取得當前層的魔物 Tier 分布描述
 * @param {number} layer
 * @returns {string}
 */
export function getLayerTierDesc(layer) {
  switch (layer) {
    case 1: return 'Tier A'
    case 2: return 'Tier A + 少量 Tier B'
    case 3: return 'Tier B'
    case 4: return 'Tier B + 少量 Tier C'
    case 5: return 'Tier B + Tier C'
    default: return 'Unknown'
  }
}

/**
 * 判定某 Tier 的魔物是否屬於 Tier C（用於 tierCKillCount 統計）
 * @param {string} tier - 'A' | 'B' | 'C' | 'P'
 * @returns {boolean}
 */
export function isTierC(tier) {
  return tier === 'C'
}
