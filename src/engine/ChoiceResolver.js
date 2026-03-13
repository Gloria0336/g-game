/**
 * ChoiceResolver — 選項條件判定與骰點結果解析
 */
import { checkCondition, calcStatsBonus, applyEffects } from './StatsManager.js'
import { performDiceCheck } from './DiceSystem.js'
import { getPrimaryDemonId } from './DemonSystem.js'

/**
 * 過濾可用選項（依條件判定）
 * @param {object[]} choices   劇情 JSON 中的 choices 陣列
 * @param {object}   state     當前 GameState
 * @returns {object[]} 帶有 available 標記的選項陣列
 */
export function resolveChoices(choices, state) {
  return choices.map((choice) => ({
    ...choice,
    available: checkCondition(state, choice.condition ?? null),
  }))
}

/**
 * 執行一個選項（包含骰點邏輯）
 * @param {object} choice   選項物件
 * @param {object} state    當前 GameState
 * @param {string} charId   當前攻略角色 ID（骰點加成用）
 * @returns {{ nextScene, newState, diceResult|null }}
 */
export function executeChoice(choice, state, charId = null) {
  // 骰點選項
  if (choice.type === 'dice_choice') {
    const statsBonus = calcStatsBonus(state, choice.bonus_stats ?? [], charId)
    const diceResult = performDiceCheck(choice.dc, statsBonus)

    const branch = diceResult.success ? choice.on_success : choice.on_failure
    const newState = applyEffects(state, branch.effects ?? null)

    return {
      nextScene: branch.next,
      newState,
      diceResult,
    }
  }

  // 一般選項
  let newState = applyEffects(state, choice.effects ?? null)

  // 靈魂香氣：正向選項（殘酷/極端理性）→ 主選惡魔 +4；負向（善良/平庸）→ −3
  if (choice.soul_aroma) {
    const primaryId = getPrimaryDemonId(newState.demons)
    if (primaryId) {
      const delta = choice.soul_aroma === 'positive' ? 4 : -3
      const cur   = newState.demons[primaryId].demon_axis ?? 0
      newState = {
        ...newState,
        demons: {
          ...newState.demons,
          [primaryId]: {
            ...newState.demons[primaryId],
            demon_axis: Math.min(100, Math.max(0, cur + delta)),
          },
        },
      }
    }
  }

  return {
    nextScene: choice.next,
    newState,
    diceResult: null,
  }
}
