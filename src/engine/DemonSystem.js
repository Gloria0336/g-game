/**
 * DemonSystem — V4.0
 * 惡魔作為持久場上單位的完整戰鬥系統
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
    rank: '第九階・生死惡魔',
    type: '詛咒 / 生死型',
  },
}

// ─── 惡魔戰鬥數值 ─────────────────────────────────────────────

export const DEMON_COMBAT_STATS = {
  demon_a: {
    maxHP: 60,
    ATK: 12,
    AGI: 8,
    skills: [
      { id: 'seal_strike', name: '封印術', maxCooldown: 3 },
    ],
  },
  demon_b: {
    maxHP: 80,
    ATK: 25,
    AGI: 12,
    skills: [
      { id: 'beast_impact', name: '獸神衝擊', maxCooldown: 4 },
    ],
  },
  demon_c: {
    maxHP: 50,
    ATK: 10,
    AGI: 6,
    skills: [
      { id: 'corrode_curse', name: '腐蝕詛咒', maxCooldown: 4 },
    ],
  },
}

// ─── 召喚條件判斷 ─────────────────────────────────────────────

export function getAvailableDemonsToSummon(demons, summonedThisBattle) {
  return ['demon_a', 'demon_b', 'demon_c'].filter(demonId => {
    const d = demons[demonId]
    if (!d) return false
    if (summonedThisBattle.includes(demonId)) return false
    if (d.contract_status === 'hostile') return false
    return true
  })
}

export function getSummonStatus(demons, demonId, summonedThisBattle) {
  const d = demons[demonId]
  if (!d) return 'hostile'
  if (summonedThisBattle.includes(demonId)) return 'already_summoned'
  if (d.contract_status === 'hostile') return 'hostile'
  if (d.contract_status === 'betrayed') return 'betrayed'
  return 'available'
}

// ─── 場上單位建立 ─────────────────────────────────────────────

/**
 * 建立惡魔場上單位，技能冷卻初始為 0（召喚後立即可用）
 */
export function createDemonUnit(demonId) {
  const stats = DEMON_COMBAT_STATS[demonId]
  const data  = DEMON_DATA[demonId]
  if (!stats || !data) return null

  const skills = {}
  for (const s of stats.skills) {
    skills[s.id] = { name: s.name, cooldown: 0, maxCooldown: s.maxCooldown }
  }

  return {
    id:        demonId,
    name:      data.name,
    currentHP: stats.maxHP,
    maxHP:     stats.maxHP,
    ATK:       stats.ATK,
    AGI:       stats.AGI,
    skills,
  }
}

// ─── 惡魔技能效果 ─────────────────────────────────────────────

/**
 * 執行惡魔技能，回傳戰鬥更新與女主角更新
 * 技能冷卻由呼叫方（executeDemonTurn）負責重置
 */
export function executeDemonSkill(demonId, demonUnit, combat, heroine) {
  const logs = []
  let combatUpdate = {}
  let heroineUpdate = null
  let newEnemyStatuses = [...(combat.enemyStatuses ?? [])]

  switch (demonId) {
    case 'demon_a': {
      // 封印術：敵人下回合跳過 + 回復女主角 20% maxSP
      newEnemyStatuses = addEnemyStatus(newEnemyStatuses, {
        type: 'seal',
        duration: 1,
        value: 0,
      })
      const spRestore = Math.floor((heroine?.maxSP ?? 0) * 0.2)
      logs.push(`【瑠夜・封印術】敵人被封印，跳過下回合！`)
      if (spRestore > 0) {
        logs.push(`【瑠夜】靈力補給：SP +${spRestore}`)
        heroineUpdate = { SP: Math.min(heroine.maxSP, (heroine.SP ?? 0) + spRestore) }
      }
      combatUpdate.enemyStatuses = newEnemyStatuses
      break
    }

    case 'demon_b': {
      // 獸神衝擊：ATK × 3 × 1.6 無視 DR%
      const rawDmg = demonUnit.ATK * 3 * 1.6
      const damage = Math.max(1, Math.round(rawDmg * (0.9 + Math.random() * 0.2)))
      combatUpdate.enemyHP = Math.max(0, combat.enemyHP - damage)
      logs.push(`【颯牙・獸神衝擊】無視防禦——造成 ${damage} 點傷害！`)
      break
    }

    case 'demon_c': {
      // 腐蝕詛咒：DR% −20%（3 回合）+ 反傷 10% + 回復主角 30% maxHP
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
      const hpRestore = Math.floor((heroine?.maxHP ?? 0) * 0.3)
      logs.push(`【玄冥・腐蝕詛咒】敵人防禦降低 20%，施加反傷！`)
      if (hpRestore > 0) {
        logs.push(`【玄冥】生死之力：HP +${hpRestore}`)
        heroineUpdate = { HP: Math.min(heroine.maxHP, (heroine.HP ?? 0) + hpRestore) }
      }
      combatUpdate.enemyStatuses = newEnemyStatuses
      break
    }

    default:
      logs.push(`【${demonUnit.name}】技能發動失敗`)
  }

  return { combatUpdate: { ...combatUpdate, log: logs }, heroineUpdate }
}

// ─── 惡魔普通攻擊 ─────────────────────────────────────────────

export function executeDemonBasicAttack(demonUnit, combat) {
  const effectiveDR = Math.max(0, (combat.enemyDR ?? 0) / 100)
  const rawDmg = demonUnit.ATK * (0.9 + Math.random() * 0.2)
  const damage = Math.max(1, Math.round(rawDmg * (1 - effectiveDR)))
  const newEnemyHP = Math.max(0, combat.enemyHP - damage)
  return {
    combatUpdate: {
      enemyHP: newEnemyHP,
      log: [`【${demonUnit.name}】攻擊——造成 ${damage} 點傷害`],
    },
  }
}

// ─── 惡魔回合行動 ─────────────────────────────────────────────

/**
 * 自動決定惡魔行動：技能冷卻 = 0 時優先使用技能，否則普攻
 * 回傳 { combatUpdate, heroineUpdate, newDemonUnit }
 */
export function executeDemonTurn(demonId, demonUnit, combat, heroine) {
  const skills = { ...demonUnit.skills }

  // 找出可用技能（cooldown = 0）
  const readySkill = Object.entries(skills).find(([, s]) => s.cooldown === 0)

  let combatUpdate = {}
  let heroineUpdate = null

  if (readySkill) {
    const [skillId] = readySkill
    const skillResult = executeDemonSkill(demonId, demonUnit, combat, heroine)
    combatUpdate = skillResult.combatUpdate
    heroineUpdate = skillResult.heroineUpdate

    // 重置已使用技能冷卻，其他技能 -1
    for (const id of Object.keys(skills)) {
      if (id === skillId) {
        skills[id] = { ...skills[id], cooldown: skills[id].maxCooldown }
      } else {
        skills[id] = { ...skills[id], cooldown: Math.max(0, skills[id].cooldown - 1) }
      }
    }
  } else {
    // 普攻，全部技能 cooldown -1
    const attackResult = executeDemonBasicAttack(demonUnit, combat)
    combatUpdate = attackResult.combatUpdate
    for (const id of Object.keys(skills)) {
      skills[id] = { ...skills[id], cooldown: Math.max(0, skills[id].cooldown - 1) }
    }
  }

  const newDemonUnit = { ...demonUnit, skills }
  return { combatUpdate, heroineUpdate, newDemonUnit }
}

// ─── 敵人攻擊惡魔 ─────────────────────────────────────────────

export function executeEnemyAttackOnDemon(demonUnit, combat) {
  const damage = Math.max(1, Math.round(combat.enemyATK * (0.9 + Math.random() * 0.2)))
  const newDemonHP = Math.max(0, demonUnit.currentHP - damage)
  const logs = [`敵人攻擊【${demonUnit.name}】——造成 ${damage} 點傷害！`]
  if (newDemonHP <= 0) {
    logs.push(`【${demonUnit.name}】力竭退場！`)
  }
  return { damage, newDemonHP, logs }
}

// ─── 主動召喚效果（資源檢查）───────────────────────────────────

/**
 * 主動召喚資源檢查：消耗 80 SP，demon_axis < 15 時失敗
 * 成功時只回傳 { success: true, newHeroine } 供 App.jsx dispatch SUMMON_DEMON
 */
export function executeActiveSummonEffect(demonId, heroine, _combat, demons) {
  const SP_COST = 80
  if (heroine.SP < SP_COST) {
    return {
      success: false,
      newHeroine: heroine,
      combatUpdate: { log: [`靈力不足（需要 ${SP_COST} SP）無法主動召喚！`] },
    }
  }

  const newHeroine = { ...heroine, SP: heroine.SP - SP_COST }
  const logs = [`消耗靈力（${SP_COST} SP）以嘗試主動召喚……`]

  const demonAxis = demons[demonId]?.demon_axis ?? 0
  if (demonAxis < 15) {
    logs.push(
      `【召喚失敗】${DEMON_DATA[demonId]?.name ?? demonId} 的契約連結尚不足夠（契約軸 ${demonAxis} < 15）`
    )
    return { success: false, newHeroine, combatUpdate: { log: logs } }
  }

  logs.push(`${DEMON_DATA[demonId]?.name ?? demonId} 應召而至！`)
  return { success: true, newHeroine, combatUpdate: { log: logs } }
}

// ─── 召喚後情感更新 ───────────────────────────────────────────

export function applyPostSummonAffection(demons, demonId, axisDelta = 5) {
  const d = demons[demonId]
  if (!d) return demons

  return {
    ...demons,
    [demonId]: {
      ...d,
      trust:      clamp(d.trust + 2),
      affection:  clamp(d.affection + 2, -50, 100),
      demon_axis: clamp(d.demon_axis + axisDelta),
    },
  }
}

// ─── 戰後停留計算 ─────────────────────────────────────────────

export function calcDemonStay(demonId, demons) {
  const d = demons[demonId]
  if (!d) return false

  if (d.summon_count <= 1) return true
  if (d.summon_count <= 3) return Math.random() < 0.8
  return Math.random() < 0.5
}

// ─── 惡魔停留對話類型判定 ────────────────────────────────────

export function getDemonDialogueType(demonId, demons, heroine) {
  const d = demons[demonId]
  if (!d) return 'regular'

  if (heroine.DES >= 120 && d.lust >= 50) return 'boundary'
  if (d.heroine_axis < 20) return 'taunt'
  if (d.trust >= 30) return 'concern'
  return 'regular'
}

// ─── 四向分歧判定（每章章末） ────────────────────────────────

export function judgePathDirection(demonId, demons) {
  const d = demons[demonId]
  if (!d) return 'active'

  const { heroine_axis, demon_axis, contract_status } = d

  if (contract_status === 'hostile')          return 'hostile'
  if (contract_status === 'betrayed')         return 'betrayal_warning'

  if (heroine_axis >= 70 && demon_axis >= 40) return 'romantic'
  if (demon_axis >= 80 && heroine_axis >= 20 && heroine_axis < 70) return 'obsessed'
  if (heroine_axis <= -30) return 'hostile'
  if (demon_axis >= 90 && Math.abs(heroine_axis) <= 10) return 'betrayal_warning'

  return 'active'
}

// ─── 主選惡魔輔助函式 ─────────────────────────────────────────

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
