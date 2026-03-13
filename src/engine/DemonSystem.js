/**
 * DemonSystem — V3.0
 * 惡魔召喚觸發、戰鬥效果、戰後停留與情感變化
 */

import { addEnemyStatus } from './CombatEngine.js'
import { clamp } from './StatsManager.js'

// ─── 惡魔基本資料 ─────────────────────────────────────────────

export const DEMON_DATA = {
  demon_a: {
    id: 'demon_a',
    name: '瑠夜',
    rank: '第七階・束縛惡魔',
    type: '控制 / 封印型',
  },
  demon_b: {
    id: 'demon_b',
    name: '颯牙',
    rank: '第五階・戰鬼惡魔',
    type: '物理爆發型',
  },
  demon_c: {
    id: 'demon_c',
    name: '玄冥',
    rank: '第九階・詛咒惡魔',
    type: '詛咒 / 削弱型',
  },
}

// ─── 召喚條件判斷 ─────────────────────────────────────────────

/**
 * 回傳可召喚的惡魔列表（過濾已召喚、敵對、背叛）
 */
export function getAvailableDemonsToSummon(demons, summonedThisBattle) {
  return ['demon_a', 'demon_b', 'demon_c'].filter(demonId => {
    const d = demons[demonId]
    if (!d) return false
    if (summonedThisBattle.includes(demonId)) return false
    if (d.contract_status === 'hostile') return false
    return true
  })
}

/**
 * 判斷某惡魔是否可召喚（含背叛警告）
 * @returns {'available'|'betrayed'|'hostile'|'already_summoned'}
 */
export function getSummonStatus(demons, demonId, summonedThisBattle) {
  const d = demons[demonId]
  if (!d) return 'hostile'
  if (summonedThisBattle.includes(demonId)) return 'already_summoned'
  if (d.contract_status === 'hostile') return 'hostile'
  if (d.contract_status === 'betrayed') return 'betrayed'
  return 'available'
}

// ─── 召喚戰鬥效果 ─────────────────────────────────────────────

/**
 * 執行惡魔召喚效果，回傳更新後的戰鬥狀態與日誌
 *
 * 瑠夜：封印術 — 敵人下回合跳過 + 回復女主角 20% maxSP
 * 颯牙：獸神衝擊 — ATK × 3 × 1.6 直接傷害（無視 DR%）
 * 玄冥：腐蝕詛咒 — 目標 DR% −20%（3 回合）+ 反傷 10%
 *
 * @param {string} demonId
 * @param {object} heroine
 * @param {object} combat
 * @returns {{ newHeroine, combatUpdate, logs }}
 */
export function executeDemonSummonEffect(demonId, heroine, combat) {
  const logs = []
  let newHeroine = { ...heroine }
  let combatUpdate = {}
  let newEnemyStatuses = [...(combat.enemyStatuses ?? [])]

  switch (demonId) {
    case 'demon_a': {
      // 封印術：敵人下回合跳過 + 回復 20% maxSP
      newEnemyStatuses = addEnemyStatus(newEnemyStatuses, {
        type: 'seal',
        duration: 1,
        value: 0,
      })
      const spRestore = Math.floor(newHeroine.maxSP * 0.2)
      newHeroine.SP = Math.min(newHeroine.maxSP, newHeroine.SP + spRestore)
      logs.push(`【瑠夜】封印術發動——敵人下回合被封印`)
      logs.push(`【瑠夜】靈力補給：SP +${spRestore}`)
      combatUpdate.enemyStatuses = newEnemyStatuses
      break
    }

    case 'demon_b': {
      // 獸神衝擊：ATK × 3 × 1.6 無視 DR%
      const rawDmg = heroine.ATK * 3 * 1.6
      const damage = Math.max(1, Math.round(rawDmg * (0.9 + Math.random() * 0.2)))
      combatUpdate.enemyHP = Math.max(0, combat.enemyHP - damage)
      logs.push(`【颯牙】獸神衝擊——造成 ${damage} 點傷害（無視防禦）`)
      break
    }

    case 'demon_c': {
      // 腐蝕詛咒：DR% −20%（3 回合）+ 反傷 10%
      newEnemyStatuses = addEnemyStatus(newEnemyStatuses, {
        type: 'corrode',
        duration: 3,
        drReduction: 20,
      })
      newEnemyStatuses = addEnemyStatus(newEnemyStatuses, {
        type: 'reflect',
        duration: 3,
        value: 10,
      })
      logs.push(`【玄冥】腐蝕詛咒——敵人防禦降低 20%，並施加反傷`)
      combatUpdate.enemyStatuses = newEnemyStatuses
      break
    }

    default:
      logs.push(`召喚失敗：未知惡魔 ${demonId}`)
  }

  // 背叛的惡魔作為敵方援軍（暫時以日誌提示）
  // Phase D 實作時擴充

  return { newHeroine, combatUpdate: { ...combatUpdate, log: logs }, logs }
}

// ─── 主動召喚效果 ─────────────────────────────────────────────

/**
 * 主動召喚：消耗全部 SP，demon_axis < 15 時召喚失敗
 * 成功時套用一般戰鬥效果，heroine_axis +10 由 App 透過 UPDATE_DEMON_AXIS 處理
 */
export function executeActiveSummonEffect(demonId, heroine, combat, demons) {
  const spConsumed = heroine.SP
  const newHeroine = { ...heroine, SP: 0 }
  const logs = [`消耗全部靈力（${spConsumed} SP）以嘗試主動召喚……`]

  const demonAxis = demons[demonId]?.demon_axis ?? 0
  if (demonAxis < 15) {
    logs.push(
      `【召喚失敗】${DEMON_DATA[demonId]?.name ?? demonId} 的契約連結尚不足夠（契約軸 ${demonAxis} < 15）`
    )
    return { success: false, newHeroine, combatUpdate: { log: logs } }
  }

  const effect = executeDemonSummonEffect(demonId, newHeroine, combat)
  return {
    success: true,
    newHeroine: effect.newHeroine,
    combatUpdate: {
      ...effect.combatUpdate,
      log: [...logs, ...effect.logs],
    },
  }
}

// ─── 召喚後情感更新 ───────────────────────────────────────────

/**
 * 惡魔援助成功後更新關係數值
 */
export function applyPostSummonAffection(demons, demonId) {
  const d = demons[demonId]
  if (!d) return demons

  return {
    ...demons,
    [demonId]: {
      ...d,
      trust:      clamp(d.trust + 2),
      affection:  clamp(d.affection + 2, -50, 100),
      demon_axis: clamp(d.demon_axis + 5),
    },
  }
}

// ─── 戰後停留計算 ─────────────────────────────────────────────

/**
 * 計算召喚後惡魔是否停留對話
 * 首次召喚：強制停留
 * 後續：summon_count 決定停留機率
 */
export function calcDemonStay(demonId, demons) {
  const d = demons[demonId]
  if (!d) return false

  if (d.summon_count <= 1) return true          // 首次強制
  if (d.summon_count <= 3) return Math.random() < 0.8
  return Math.random() < 0.5
}

// ─── 惡魔停留對話類型判定 ────────────────────────────────────

/**
 * 判斷惡魔停留對話的類型
 * @returns {'regular'|'concern'|'taunt'|'boundary'}
 */
export function getDemonDialogueType(demonId, demons, heroine) {
  const d = demons[demonId]
  if (!d) return 'regular'

  // 越界行動（DES ≥ 120 + lust ≥ 50）— Phase C 解鎖 18+ 設定後
  if (heroine.DES >= 120 && d.lust >= 50) return 'boundary'

  // 挑釁嘲諷（heroine_axis < 20）
  if (d.heroine_axis < 20) return 'taunt'

  // 關心確認（trust ≥ 30）
  if (d.trust >= 30) return 'concern'

  return 'regular'
}

// ─── 四向分歧判定（每章章末） ────────────────────────────────

/**
 * 判定當前各惡魔路徑走向
 * @returns {'romantic'|'obsessed'|'hostile'|'betrayal_warning'|'active'}
 */
export function judgePathDirection(demonId, demons) {
  const d = demons[demonId]
  if (!d) return 'active'

  const { heroine_axis, demon_axis, contract_status } = d

  if (contract_status === 'hostile')          return 'hostile'
  if (contract_status === 'betrayed')         return 'betrayal_warning'

  // 「傾心」路徑
  if (heroine_axis >= 70 && demon_axis >= 40) return 'romantic'

  // 「惡魔傾心」路徑
  if (demon_axis >= 80 && heroine_axis >= 20 && heroine_axis < 70) return 'obsessed'

  // 「敵對」初兆
  if (heroine_axis <= -30) return 'hostile'

  // 「背叛」初兆
  if (demon_axis >= 90 && Math.abs(heroine_axis) <= 10) return 'betrayal_warning'

  return 'active'
}

// ─── 主選惡魔輔助函式 ─────────────────────────────────────────

/**
 * 回傳 demon_axis 最高的惡魔 ID（平手時取字典序最小者）
 * @param {object} demons  state.demons
 * @returns {string|null}
 */
export function getPrimaryDemonId(demons) {
  let bestId   = null
  let bestAxis = -1
  for (const id of Object.keys(demons).sort()) {
    const axis = demons[id]?.demon_axis ?? 0
    if (axis > bestAxis) {
      bestAxis = axis
      bestId   = id
    }
  }
  return bestId
}

// ─── 道具資料 ──────────────────────────────────────────────────

export const ITEM_DATA = {
  shroud_balm: {
    id:          'shroud_balm',
    name:        '遮掩劑',
    description: '施加後 3 次場景轉換內，惡魔注意度被動上升無效。',
    type:        'consumable',
    effect:      'shroud',
  },
  bait_bell: {
    id:          'bait_bell',
    name:        '挑釁鈴鐺',
    description: '刻意散播氣息，主選惡魔注意度大幅上升。',
    type:        'consumable',
    effect:      'bait',
  },
}
