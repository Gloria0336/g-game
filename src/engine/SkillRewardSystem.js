/**
 * SkillRewardSystem — 戰後技能掉落邏輯
 */

import { drawSkillCandidates } from './SkillDB.js'

/**
 * 計算當前章節對應的技能 Tier
 */
export function getChapterTier(chapter) {
  if (chapter <= 3) return 1
  if (chapter <= 7) return 2
  return 3
}

/**
 * 戰鬥勝利後觸發技能獎勵：從對應 Tier 抽 3 個候選
 * @param {object} state  GameState
 * @returns {string[]}    技能 ID 陣列（最多 3 個）
 */
export function rollSkillReward(state) {
  const tier = getChapterTier(state.currentChapter)
  const owned = [
    ...state.skills.active,
    ...state.skills.inventory,
  ]
  return drawSkillCandidates(tier, owned, 3)
}
