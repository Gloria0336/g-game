/**
 * ExplorationSystem.js
 * 探索事件邏輯系統
 *
 * 職責：
 *   - 從地點事件池抽取本次可觸發的事件
 *   - 判定 demon_private_moment 觸發條件
 *   - 判定跨惡魔干擾事件觸發條件
 *   - 套用探索事件的數值效果（輔助 gameReducer）
 */

import { getLocationByTypeId }    from './LocationDB.js'
import { getEventDef, getCrisisNoInterventionDef } from './EventDB.js'

// ────────────────────────────────────────
// 事件池抽取
// ────────────────────────────────────────

/**
 * 從地點事件池中抽取本次可觸發的事件清單
 * 依 triggerChance 與 weight 隨機決定
 *
 * @param {string} locationTypeId
 * @param {Object} state - 完整 gameState（用於條件判定）
 * @param {Object} options
 * @param {number} options.maxEvents - 最多同時觸發幾個事件（預設 2）
 * @returns {string[]} 可觸發的 eventTypeId 陣列（有序）
 */
export function pickEvents(locationTypeId, state, { maxEvents = 2 } = {}) {
  const location = getLocationByTypeId(locationTypeId)
  if (!location?.eventPool) return []

  const { exploration } = state

  // 過濾：條件觸發的事件需先通過條件判定
  const candidates = location.eventPool.filter(entry => {
    // 已完成的事件（全域 completedEvents 記錄的）跳過
    if (exploration.completedEvents.includes(entry.eventTypeId)) return false

    // 休息類：本子層只能用一次
    if (entry.eventTypeId === 'rest_recovery' && exploration.restUsedInSubLayer) return false

    // demon_private_moment：需通過 triggerCondition 判定
    if (entry.eventTypeId === 'demon_private_moment') {
      return checkPrivateMomentCondition(entry.triggerCondition, locationTypeId, state)
    }

    // 條件觸發（triggerChance === null）：通過其他 triggerCondition 判定
    if (entry.triggerChance === null && entry.triggerCondition) {
      return checkTriggerCondition(entry.triggerCondition, state)
    }

    return true
  })

  if (candidates.length === 0) return []

  // 計算總權重
  const totalWeight = candidates.reduce((sum, entry) => sum + (entry.weight ?? 1), 0)
  
  if (totalWeight <= 0) {
    return [candidates[0].eventTypeId]
  }

  // 產生 0 ~ totalWeight 之間的亂數
  let rand = Math.random() * totalWeight

  // 依序扣除權重，決定選中的單一事件
  for (const entry of candidates) {
    const w = entry.weight ?? 1
    rand -= w
    if (rand <= 0) {
      return [entry.eventTypeId]
    }
  }

  // Fallback (理論上不會走到這裡)
  return [candidates[candidates.length - 1].eventTypeId]
}

/**
 * 判定 demon_private_moment 觸發條件
 * @param {Object|null} condition - { minAffection, minWarmedUp }
 * @param {string} locationTypeId
 * @param {Object} state
 * @returns {boolean}
 */
function checkPrivateMomentCondition(condition, locationTypeId, state) {
  if (!condition) return false

  const demonIds = ['demon_a', 'demon_b', 'demon_c']

  return demonIds.some(demonId => {
    const demon = state.demons?.[demonId]
    if (!demon) return false

    // 檢查 affection 門檻
    if ((demon.affection ?? 0) < (condition.minAffection ?? 0)) return false

    // 檢查 warmed_up_count 門檻
    if ((demon.warmed_up_count ?? 0) < (condition.minWarmedUp ?? 0)) return false

    // 檢查此組合是否已觸發過
    const triggeredKey = `${demonId}_${locationTypeId}`
    if (demon.private_moments_triggered?.includes(triggeredKey)) return false

    return true
  })
}

/**
 * 通用條件觸發判定
 * @param {Object} condition
 * @param {Object} state
 * @returns {boolean}
 */
function checkTriggerCondition(condition, state) {
  if (!condition) return true

  if (condition.minAffection !== undefined) {
    return checkPrivateMomentCondition(condition, null, state)
  }

  return true
}

// ────────────────────────────────────────
// 私下互動觸發判定
// ────────────────────────────────────────

/**
 * 取得在當前地點可觸發私下互動的惡魔 ID（若有多個取 warmed_up_count 最高者）
 * @param {string} locationTypeId
 * @param {Object} state
 * @returns {string|null} demonId 或 null
 */
export function getPrivateMomentDemon(locationTypeId, state) {
  const location = getLocationByTypeId(locationTypeId)
  if (!location) return null

  const pmEntry = location.eventPool.find(e => e.eventTypeId === 'demon_private_moment')
  if (!pmEntry) return null

  const condition = pmEntry.triggerCondition
  const demonIds = ['demon_a', 'demon_b', 'demon_c']

  const eligible = demonIds.filter(demonId => {
    const demon = state.demons?.[demonId]
    if (!demon) return false
    if ((demon.affection ?? 0) < (condition?.minAffection ?? 0)) return false
    if ((demon.warmed_up_count ?? 0) < (condition?.minWarmedUp ?? 0)) return false
    const key = `${demonId}_${locationTypeId}`
    if (demon.private_moments_triggered?.includes(key)) return false
    return true
  })

  if (eligible.length === 0) return null

  // 取 warmed_up_count 最高的
  return eligible.sort((a, b) =>
    (state.demons[b].warmed_up_count ?? 0) - (state.demons[a].warmed_up_count ?? 0)
  )[0]
}

// ────────────────────────────────────────
// 跨惡魔干擾觸發判定
// ────────────────────────────────────────

/**
 * 判定是否觸發跨惡魔干擾事件
 * 已觸發的記錄在 state.flags.interference_triggered[]
 *
 * @param {Object} state
 * @returns {Array<{ demonId: string, interferenceType: string }>}
 */
export function checkInterferenceEvents(state) {
  const { demons, flags } = state
  const triggered = flags?.interference_triggered ?? []
  const results = []

  const demonIds = ['demon_a', 'demon_b', 'demon_c']

  // 確定目前主導惡魔（affection+trust最高者）
  const dominantId = getDominantDemon(state)

  for (const demonId of demonIds) {
    if (triggered.includes(demonId)) continue  // 已觸發過，跳過

    const demon = demons?.[demonId]
    if (!demon) continue

    // 條件一：非主導惡魔 affection ≥ 30 → 「第三者出現」對話
    if (demonId !== dominantId && (demon.affection ?? 0) >= 30) {
      results.push({ demonId, interferenceType: 'affection_interference' })
      continue
    }

    // 條件二：非主導惡魔 heroine_axis ≤ −25 → 非主導惡魔臨時盟友介入
    if (demonId !== dominantId && (demon.heroine_axis ?? 0) <= -25) {
      results.push({ demonId, interferenceType: 'hostile_ally' })
      continue
    }

    // 條件三：任一惡魔 demon_axis ≥ 70 且 warmed_up_count = 0 → 強制對話
    if ((demon.demon_axis ?? 0) >= 70 && (demon.warmed_up_count ?? 0) === 0) {
      results.push({ demonId, interferenceType: 'obsession_appear' })
    }
  }

  return results
}

/**
 * 取得主導惡魔 ID（affection + trust 合計最高）
 * @param {Object} state
 * @returns {string|null}
 */
export function getDominantDemon(state) {
  const demons = state.demons
  if (!demons) return null

  let topId = null
  let topScore = -Infinity

  for (const id of ['demon_a', 'demon_b', 'demon_c']) {
    const d = demons[id]
    if (!d) continue
    const score = (d.affection ?? 0) + (d.trust ?? 0)
    if (score > topScore) {
      topScore = score
      topId = id
    }
  }

  return topId
}

// ────────────────────────────────────────
// 探索事件效果套用（輔助 gameReducer）
// ────────────────────────────────────────

/**
 * 套用不介入救援的效果
 * @param {Object} state
 * @returns {Object} 更新後的 state 片段
 */
export function applyNoIntervention(state) {
  const def = getCrisisNoInterventionDef()
  const updates = { heroine: { ...state.heroine } }

  // independence +1
  updates.heroine.independence = Math.min(100, (state.heroine.independence ?? 30) + (def.rewards?.independence ?? 1))

  return updates
}

/**
 * 套用陷阱效果（完整觸發或半規避）
 * @param {Object} state
 * @param {string} trapTypeId - e.g. 'trap.physical'
 * @param {'full'|'half'} severity
 * @returns {Object} 更新後的 heroine / demons 片段
 */
export function applyTrapEffect(state, trapTypeId, severity = 'full') {
  const { getEventDef: _ } = { getEventDef }
  const trapDef = getEventDef(trapTypeId)
  if (!trapDef) return {}

  const effectKey = severity === 'full' ? 'fullTrigger' : 'halfTrigger'
  const effect = trapDef[effectKey]
  if (!effect) return {}

  const heroine = { ...state.heroine }
  const updates = { heroine }

  if (effect.HP)              heroine.HP = Math.max(0, heroine.HP + Math.round(heroine.maxHP * effect.HP))
  if (effect.SP)              heroine.SP = Math.max(0, heroine.SP + Math.round(heroine.maxSP * effect.SP))
  if (effect.DES !== undefined) heroine.DES = Math.max(0, Math.min(200, (heroine.DES ?? 0) + effect.DES))
  if (effect.durability)      {
    // 套用至上下裝耐久（各減半）
    const upperDur = Math.max(0, heroine.equipment?.upper?.durability - Math.abs(effect.durability))
    const lowerDur = Math.max(0, heroine.equipment?.lower?.durability - Math.abs(effect.durability))
    heroine.equipment = {
      ...heroine.equipment,
      upper: { ...heroine.equipment?.upper, durability: upperDur },
      lower: { ...heroine.equipment?.lower, durability: lowerDur },
    }
  }
  if (effect.heroine_axis) {
    // 套用至指定惡魔（最高 affection 惡魔）
    const targetId = effect.target === 'highest_affection_demon'
      ? getHighestAffectionDemon(state)
      : null
    if (targetId) {
      updates.demons = {
        ...state.demons,
        [targetId]: {
          ...state.demons[targetId],
          heroine_axis: clamp(
            (state.demons[targetId].heroine_axis ?? 0) + effect.heroine_axis,
            -100, 100
          ),
        },
      }
    }
  }

  return updates
}

/**
 * 套用戰鬥獎勵（固定隨機數值加成）
 * @param {Object} state
 * @param {number} layer - 所在層（影響數值加成幅度）
 * @returns {Object} 更新後的 heroine 片段
 */
export function applyCombatStatBoost(state, layer) {
  const STAT_MAP = {
    ATK:   'ATK',
    MaxHP: 'maxHP',
    MaxSP: 'maxSP',
    AGI:   'AGI',
    WIL:   'WIL',
  }
  const POOL = Object.keys(STAT_MAP)
  const layerScale = Math.max(1, Math.min(layer, 5))    // 1–5 層倍率

  // 抽 2 個不重複數值
  const shuffled = [...POOL].sort(() => Math.random() - 0.5)
  const picks = shuffled.slice(0, 2)

  const heroine = { ...state.heroine }
  picks.forEach(stat => {
    const baseMin = 1, baseMax = 3
    const gain = Math.round((baseMin + Math.random() * (baseMax - baseMin)) * (1 + (layerScale - 1) * 0.5))
    const key = STAT_MAP[stat]
    heroine[key] = (heroine[key] ?? 0) + gain
  })

  return { heroine }
}

// ────────────────────────────────────────
// 工具函式
// ────────────────────────────────────────

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function getHighestAffectionDemon(state) {
  const demons = state.demons
  if (!demons) return null

  let topId = null
  let topAff = -Infinity

  for (const id of ['demon_a', 'demon_b', 'demon_c']) {
    const aff = demons[id]?.affection ?? 0
    if (aff > topAff) {
      topAff = aff
      topId = id
    }
  }
  return topId
}
