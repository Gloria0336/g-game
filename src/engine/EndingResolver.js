/**
 * EndingResolver — 根據最終數值與 flag 判定結局
 */
import endingsData from '../data/endings.json'
import { checkCondition } from './StatsManager.js'

/**
 * 判定當前狀態對應的結局
 * @param {object} state        GameState
 * @param {string} charId       目前攻略角色
 * @returns {object|null}       結局物件（含 id, name, icon 等欄位）
 */
export function resolveEnding(state, charId) {
  const charEndings = endingsData.endings

  // 依優先度排序（數字越大越優先）
  const sorted = [...charEndings].sort((a, b) => b.priority - a.priority)

  for (const ending of sorted) {
    // 將條件中的 character 展開為實際 charId
    const condition = expandCharacterCondition(ending.conditions, charId)
    if (checkCondition(state, condition)) {
      return ending
    }
  }

  // fallback：未完待續
  return charEndings.find((e) => e.id === 'unfinished') ?? null
}

/**
 * 將 conditions.character 轉換為 conditions[charId]
 */
function expandCharacterCondition(conditions, charId) {
  if (!conditions) return {}
  const expanded = { ...conditions }
  if (expanded.character) {
    expanded[charId] = expanded.character
    delete expanded.character
  }
  return expanded
}
