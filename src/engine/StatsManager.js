/**
 * StatsManager — 負責所有數值的讀寫、邊界約束與條件判定
 */

export const HEROINE_STATS = ['guard', 'flutter', 'insight', 'charm', 'desire']
export const CHAR_STATS = ['affection', 'progress', 'trust', 'lust']

/** 初始女主角數值（Phase 1 預設值） */
export const INITIAL_HEROINE = {
  guard: 50,
  flutter: 20,
  insight: 30,
  charm: 30,
  desire: 0,
}

/** 初始角色數值 */
export const INITIAL_CHARACTER = {
  affection: 0,
  progress: 0,
  trust: 0,
  lust: 0,
}

/** 將數值限制在 0–100 */
function clamp(value) {
  return Math.max(0, Math.min(100, value))
}

/**
 * 套用數值變化效果
 * @param {object} state   當前 GameState
 * @param {object} effects { heroine: {...}, char_a: {...}, char_b: {...}, char_c: {...} }
 * @returns {object} 更新後的 state（immutable）
 */
export function applyEffects(state, effects) {
  if (!effects) return state

  let newState = { ...state }

  // 更新女主角數值
  if (effects.heroine) {
    const newHeroine = { ...newState.heroine }
    for (const [key, delta] of Object.entries(effects.heroine)) {
      if (key in newHeroine) {
        newHeroine[key] = clamp(newHeroine[key] + delta)
      }
    }
    newState = { ...newState, heroine: newHeroine }
  }

  // 更新各攻略角色數值
  const charIds = ['char_a', 'char_b', 'char_c']
  for (const charId of charIds) {
    if (effects[charId]) {
      const newChars = { ...newState.characters }
      const newChar = { ...newChars[charId] }
      for (const [key, delta] of Object.entries(effects[charId])) {
        if (key in newChar) {
          newChar[key] = clamp(newChar[key] + delta)
        }
      }
      newChars[charId] = newChar
      newState = { ...newState, characters: newChars }
    }
  }

  return newState
}

/**
 * 判定條件是否滿足
 * @param {object} state       當前 GameState
 * @param {object} condition   條件物件（格式同 JSON schema）
 * @returns {boolean}
 */
export function checkCondition(state, condition) {
  if (!condition) return true

  // 女主角條件
  if (condition.heroine) {
    for (const [stat, range] of Object.entries(condition.heroine)) {
      const val = state.heroine[stat] ?? 0
      if (range.min !== undefined && val < range.min) return false
      if (range.max !== undefined && val > range.max) return false
    }
  }

  // 角色條件
  const charIds = ['char_a', 'char_b', 'char_c']
  for (const charId of charIds) {
    if (condition[charId]) {
      const charStats = state.characters[charId] ?? {}
      for (const [stat, range] of Object.entries(condition[charId])) {
        const val = charStats[stat] ?? 0
        if (range.min !== undefined && val < range.min) return false
        if (range.max !== undefined && val > range.max) return false
      }
    }
  }

  // flag 條件
  if (condition.flags) {
    for (const [flag, expected] of Object.entries(condition.flags)) {
      if (state.flags[flag] !== expected) return false
    }
  }

  return true
}

/**
 * 取得數值的數值加成（每 10 點 +1）
 * @param {object} state
 * @param {string[]} bonusStats  加成來源的數值 key 陣列
 * @param {string} charId        角色 ID（如果來源是角色數值）
 * @returns {number}
 */
export function calcStatsBonus(state, bonusStats, charId = null) {
  let total = 0
  for (const statKey of bonusStats) {
    let val = 0
    if (HEROINE_STATS.includes(statKey)) {
      val = state.heroine[statKey] ?? 0
    } else if (charId && CHAR_STATS.includes(statKey)) {
      val = state.characters[charId]?.[statKey] ?? 0
    }
    total += Math.floor(val / 10)
  }
  return total
}
