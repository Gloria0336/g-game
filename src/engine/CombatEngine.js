/**
 * CombatEngine — V3.0
 * 移植自 Dungen TRPG combatEngine，去除 TypeScript，適配心鎖數值規格
 *
 * 核心公式：
 *   最終傷害 = (Raw ATK × [0.95–1.05]) × (1 + Amp%) × (1 − DR%) × (1 − SkillDR%) − FlatDR
 *   最低傷害 = 1
 */

import { getEquipmentData } from './EquipmentDB.js'
import { clamp } from './StatsManager.js'

// ─── 骰點工具 ─────────────────────────────────────────────────

/** 回傳 [min, max] 範圍內的隨機整數 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** ATK 浮動 0.95–1.05 */
function atkFlutter() {
  return 0.95 + Math.random() * 0.1
}

// ─── DR 計算 ──────────────────────────────────────────────────

/**
 * 計算裝備耐久對應 DR%
 * @param {object} equipment  { upper: {id, durability}, lower: {id, durability} }
 * @returns {number} DR%（0–100）
 */
export function calcDR(equipment) {
  if (!equipment) return 0

  let totalDR = 0

  for (const slot of ['upper', 'lower']) {
    const equip = equipment[slot]
    if (!equip) continue

    const data = getEquipmentData(equip.id)
    if (!data) continue

    const dur = equip.durability ?? 0
    const base = data[slot === 'upper' ? 'drU' : 'drL'] ?? 0
    const steps = data.tierSteps ?? {}

    let penalty = 0
    if (dur >= 80)      penalty = steps['100_80'] ?? 0
    else if (dur >= 60) penalty = steps['79_60']  ?? 0
    else if (dur >= 30) penalty = steps['59_30']  ?? 0
    else                penalty = steps['30_0']   ?? 0

    totalDR += base + penalty
  }

  return Math.max(0, totalDR)
}

// ─── 傷害計算 ─────────────────────────────────────────────────

/**
 * 計算一次攻擊的最終傷害
 *
 * @param {object} params
 * @param {number} params.atk        攻擊方 ATK
 * @param {number} params.ampPercent 傷害倍率加成%（普通攻擊固定 +15）
 * @param {number} params.drPercent  防禦方 DR%（裝備計算值）
 * @param {number} params.skillDR    技能/狀態臨時 DR%
 * @param {number} params.flatDR     固定減傷值
 * @param {boolean} params.ignoreDRPercent  是否忽略 DR%（如本能突刺的 10%）
 * @param {number}  params.ignoreDRAmount   無視 DR% 的比例（如 0.1 = 無視 10%）
 * @returns {number} 最終傷害（整數，最小 1）
 */
export function calcDamage({
  atk,
  ampPercent = 0,
  drPercent = 0,
  skillDR = 0,
  flatDR = 0,
  ignoreDRAmount = 0,
}) {
  const rawATK = atk * atkFlutter()
  const effectiveDR = Math.max(0, drPercent - ignoreDRAmount * 100)
  const damage =
    rawATK
    * (1 + ampPercent / 100)
    * (1 - effectiveDR / 100)
    * (1 - skillDR / 100)
    - flatDR

  return Math.max(1, Math.round(damage))
}

// ─── 命中判定 ─────────────────────────────────────────────────

/**
 * D100 命中判定
 * @param {number} hitThreshold  命中閾值（1–99）
 * @returns {{ roll, hit }}
 */
export function rollHit(hitThreshold) {
  const threshold = clamp(hitThreshold, 5, 99)
  const roll = randInt(1, 100)
  return { roll, hit: roll <= threshold }
}

/**
 * D100 迴避判定
 * @param {number} evadeRate  迴避率（0–100）
 * @param {boolean} isControlled  被封印時無法迴避
 * @returns {{ roll, evaded }}
 */
export function rollEvade(evadeRate, isControlled = false) {
  if (isControlled) return { roll: 0, evaded: false }
  const roll = randInt(1, 100)
  return { roll, evaded: roll <= evadeRate }
}

// ─── 耐久傷害 ─────────────────────────────────────────────────

/**
 * 對裝備施加耐久傷害
 * @param {object} equipment
 * @param {{ amount, target }} durDmg  target: 'upper'|'lower'|'both'|'none'
 * @returns {{ newEquipment, desGain }} 更新後的裝備與 DES 增加量
 */
export function applyDurabilityDamage(equipment, durDmg) {
  if (!durDmg || durDmg.target === 'none' || !durDmg.amount) {
    return { newEquipment: equipment, desGain: 0 }
  }

  const amount = Math.floor(durDmg.amount * 1.3)
  let newEquipment = { ...equipment }
  let desGain = 0

  const applyToPart = (slot) => {
    const current = newEquipment[slot]
    if (!current) return
    const prev = current.durability
    const next = Math.max(0, prev - amount)
    newEquipment[slot] = { ...current, durability: next }

    // DES 觸發
    if (prev >= 60 && next < 60) desGain += 5
    if (prev >= 30 && next < 30) desGain += 10
  }

  if (durDmg.target === 'upper' || durDmg.target === 'both') applyToPart('upper')
  if (durDmg.target === 'lower' || durDmg.target === 'both') applyToPart('lower')

  return { newEquipment, desGain }
}

// ─── 狀態效果處理 ─────────────────────────────────────────────

/**
 * 回合開始時處理 dot 狀態（流血、重毒、詛咒等）
 * @param {object} heroine
 * @param {object[]} statuses  狀態陣列 [{ type, value, duration }]
 * @returns {{ newHeroine, newStatuses, logs }}
 */
export function processStatusEffects(heroine, statuses) {
  let newHeroine = { ...heroine }
  const logs = []
  const newStatuses = []

  for (const status of statuses) {
    const remaining = (status.duration ?? 1) - 1

    switch (status.type) {
      case 'bleed':
        newHeroine.HP = Math.max(0, newHeroine.HP - status.value)
        logs.push(`流血：損失 ${status.value} HP`)
        break
      case 'poison':
        const poisonDmg = Math.floor(newHeroine.HP * 0.08)
        newHeroine.HP = Math.max(0, newHeroine.HP - poisonDmg)
        logs.push(`重毒：損失 ${poisonDmg} HP`)
        break
      case 'curse':
        // 詛咒在使用技能時才觸發，此處僅保留持續時間
        break
    }

    if (remaining > 0) {
      newStatuses.push({ ...status, duration: remaining })
    }
  }

  return { newHeroine, newStatuses, logs }
}

/**
 * 為敵人施加狀態（返回新的 statuses 陣列）
 */
export function addEnemyStatus(statuses, newStatus) {
  // 同類型狀態更新 duration，不疊加
  const existing = statuses.findIndex(s => s.type === newStatus.type)
  if (existing >= 0) {
    const updated = [...statuses]
    updated[existing] = { ...updated[existing], duration: newStatus.duration }
    return updated
  }
  return [...statuses, newStatus]
}

// ─── 防禦行動（玩家） ─────────────────────────────────────────

/**
 * 執行玩家防禦
 * 本回合受到傷害 -60%，AGI+5（紀錄在 heroineStatuses 中）
 */
export function executeDefend(_heroine, combat) {
  const newStatuses = [
    ...(combat.heroineStatuses ?? []).filter(s => s.type !== 'defend'),
    { type: 'defend', damageReduction: 60, agiBonus: 5, duration: 1 },
  ]
  return {
    combatUpdate: {
      heroineStatuses: newStatuses,
      log: ['防禦姿態！本回合傷害 -60%，AGI+5'],
    },
  }
}

// ─── 普通攻擊（玩家） ─────────────────────────────────────────

/**
 * 執行玩家普通攻擊
 * @param {object} heroine
 * @param {object} combat      當前戰鬥狀態
 * @returns {{ damage, hit, newHeroine, combatUpdate, logs }}
 */
export function executeBasicAttack(heroine, combat) {
  const hitBase = 70
  const spBonus = (() => {
    const ratio = heroine.SP / heroine.maxSP
    if (ratio > 0.6)  return 5
    if (ratio >= 0.3) return 0
    if (heroine.SP === 0) return -25
    return -10
  })()

  const { hit } = rollHit(hitBase + spBonus)
  const logs = []

  if (!hit) {
    logs.push('普通攻擊：未命中！')
    return { damage: 0, hit: false, combatUpdate: { log: logs }, newHeroine: heroine }
  }

  const enemyMarkStatus = combat.enemyStatuses.find(s => s.type === 'mark')
  const markAmp = enemyMarkStatus ? 25 : 0

  const corrodeStatus = combat.enemyStatuses.find(s => s.type === 'corrode')
  const effectiveEnemyDR = Math.max(0, (combat.enemyDR ?? 0) - (corrodeStatus?.drReduction ?? 0))

  const damage = calcDamage({
    atk: heroine.ATK,
    ampPercent: 0 + markAmp,
    drPercent: effectiveEnemyDR,
  })

  const newEnemyHP = Math.max(0, combat.enemyHP - damage)
  logs.push(`普通攻擊：命中，造成 ${damage} 傷害`)

  return {
    damage,
    hit: true,
    newHeroine: heroine,
    combatUpdate: {
      enemyHP: newEnemyHP,
      log: logs,
    },
  }
}

// ─── 技能攻擊（玩家） ─────────────────────────────────────────

/**
 * 執行玩家技能
 * @param {object} heroine
 * @param {object} skillData   SkillDB 中的技能物件
 * @param {object} combat      當前戰鬥狀態
 * @returns {{ damage, hit, newHeroine, newEnemyStatuses, combatUpdate, logs }}
 */
export function executeSkill(heroine, skillData, combat) {
  const logs = []

  // SP 消耗（詛咒狀態額外 +8）
  const cursed = (combat.heroineStatuses ?? []).find(s => s.type === 'curse')
  const spCost = skillData.spCost + (cursed ? 8 : 0)

  if (heroine.SP < spCost) {
    logs.push(`${skillData.name}：SP 不足！`)
    return { damage: 0, hit: false, combatUpdate: { log: logs }, newHeroine: heroine }
  }

  const newHeroine = { ...heroine, SP: heroine.SP - spCost }

  const effect = skillData.effect ?? {}
  let combatUpdate = {}
  let newEnemyStatuses = [...combat.enemyStatuses]
  let damage = 0
  let hit = true

  // 依 effect.type 執行不同邏輯
  switch (effect.type) {
    case 'attack':
    case 'multi_attack': {
      const hits = effect.hits ?? 1
      let totalDmg = 0

      const corrodeStatus = combat.enemyStatuses.find(s => s.type === 'corrode')
      const effectiveEnemyDR = Math.max(0, (combat.enemyDR ?? 0) - (corrodeStatus?.drReduction ?? 0))

      for (let i = 0; i < hits; i++) {
        const spBonus = newHeroine.SP / newHeroine.maxSP > 0.6 ? 5 : 0
        const { hit: thisHit } = rollHit(70 + spBonus)
        if (!thisHit) { logs.push(`${skillData.name} 第${i+1}擊：未命中`); continue }

        const markAmp = combat.enemyStatuses.find(s => s.type === 'mark') ? 25 : 0
        const dmg = calcDamage({
          atk: newHeroine.ATK,
          ampPercent: (effect.ampPercent ?? 0) + markAmp,
          drPercent: effectiveEnemyDR,
          ignoreDRAmount: effect.ignoreDR ?? 0,
        })
        totalDmg += dmg
        logs.push(`${skillData.name} 第${i+1}擊：命中 ${dmg}`)
      }

      damage = totalDmg
      combatUpdate.enemyHP = Math.max(0, combat.enemyHP - totalDmg)

      // 攻擊命中後附加狀態（如流血、遲滯）
      if (effect.applyStatus && totalDmg > 0) {
        newEnemyStatuses = addEnemyStatus(newEnemyStatuses, effect.applyStatus)
        logs.push(`${skillData.name}：附加 ${effect.applyStatus.type} 狀態`)
      }
      break
    }

    case 'debuff_hit': {
      // 命中判定 + 狀態附加
      const { hit: h } = rollHit(70)
      hit = h
      if (h && effect.applyStatus) {
        newEnemyStatuses = addEnemyStatus(newEnemyStatuses, effect.applyStatus)
        logs.push(`${skillData.name}：${effect.applyStatus.type} 狀態附加`)
      }
      break
    }

    case 'buff_self': {
      if (effect.applyStatus) {
        const existing = (combat.heroineStatuses ?? []).filter(s => s.type !== effect.applyStatus.type)
        combatUpdate.heroineStatuses = [...existing, effect.applyStatus]
        logs.push(`${skillData.name}：${effect.description ?? '自身強化（' + effect.applyStatus.type + '）'}`)
      } else {
        logs.push(`${skillData.name}：${effect.description ?? '自身強化'}`)
      }
      break
    }

    case 'heal_hp': {
      const healAmt = Math.floor(newHeroine.maxHP * (effect.percent ?? 0.15))
      newHeroine.HP = Math.min(newHeroine.maxHP, newHeroine.HP + healAmt)
      logs.push(`${skillData.name}：回復 ${healAmt} HP`)
      break
    }

    case 'heal_sp': {
      const spAmt = effect.amount ?? 30
      newHeroine.SP = Math.min(newHeroine.maxSP, newHeroine.SP + spAmt)
      logs.push(`${skillData.name}：回復 ${spAmt} SP`)
      break
    }

    case 'attack_heal': {
      // 攻擊 + 回血（如消耗汲取）
      const { hit: h2 } = rollHit(70)
      hit = h2
      if (h2) {
        const dmg = calcDamage({
          atk: newHeroine.ATK,
          ampPercent: effect.ampPercent ?? 0,
          drPercent: combat.enemyDR ?? 0,
        })
        damage = dmg
        combatUpdate.enemyHP = Math.max(0, combat.enemyHP - dmg)
        const healAmt = Math.floor(dmg * (effect.healRatio ?? 0.3))
        newHeroine.HP = Math.min(newHeroine.maxHP, newHeroine.HP + healAmt)
        logs.push(`${skillData.name}：造成 ${dmg} 傷害，回復 ${healAmt} HP`)
      }
      break
    }

    case 'attack_heal_sp': {
      // 攻擊 + 回靈（如契約脈衝）
      const { hit: h3 } = rollHit(70)
      hit = h3
      if (h3) {
        const dmg = calcDamage({
          atk: newHeroine.ATK,
          ampPercent: effect.ampPercent ?? 0,
          drPercent: combat.enemyDR ?? 0,
        })
        damage = dmg
        combatUpdate.enemyHP = Math.max(0, combat.enemyHP - dmg)
        const spAmt = effect.spRestore ?? 15
        newHeroine.SP = Math.min(newHeroine.maxSP, newHeroine.SP + spAmt)
        logs.push(`${skillData.name}：造成 ${dmg} 傷害，回復 ${spAmt} SP`)
      }
      break
    }

    case 'percent_damage': {
      // 百分比傷害（如絕命詛咒，無視 DR）
      const dmg = Math.max(1, Math.floor(combat.enemyHP * (effect.percent ?? 0.35)))
      damage = dmg
      combatUpdate.enemyHP = Math.max(0, combat.enemyHP - dmg)
      logs.push(`${skillData.name}：造成 ${dmg} 傷害（目標 HP 35%）`)
      break
    }

    default:
      logs.push(`${skillData.name}：已使用`)
  }

  // 耐久傷害
  if (effect.durabilityDamage && effect.durabilityDamage.target !== 'none') {
    const { newEquipment, desGain } = applyDurabilityDamage(
      combat.heroineEquipment ?? newHeroine.equipment,
      effect.durabilityDamage
    )
    combatUpdate.heroineEquipment = newEquipment
    newHeroine.equipment = newEquipment  // 同步持久化
    if (desGain > 0) {
      newHeroine.DES = Math.min(200, (newHeroine.DES ?? 0) + desGain)
      logs.push(`裝備受損！DES +${desGain}`)
    }
  }

  return {
    damage,
    hit,
    newHeroine,
    newEnemyStatuses,
    combatUpdate: { ...combatUpdate, log: logs },
  }
}

// ─── 敵人攻擊 ─────────────────────────────────────────────────

/**
 * 執行敵人攻擊
 * @param {object} heroine
 * @param {object} combat
 * @returns {{ damage, newHeroine, combatUpdate }}
 */
export function executeEnemyAttack(heroine, combat) {
  const logs = []
  let currentHeroineStatuses = [...(combat.heroineStatuses ?? [])]

  // 敵人技能觸發判定
  const skillDefs = combat.enemySkillDefs ?? {}
  let useSkill = null
  for (const key of Object.keys(skillDefs)) {
    if (Math.random() < (skillDefs[key].chance ?? 0)) {
      useSkill = skillDefs[key]
      break
    }
  }

  const enemyHitRate = useSkill ? (useSkill.hitRate ?? 65) : 65

  const { hit } = rollHit(enemyHitRate)

  // 迴避判定
  const evasionStatus = currentHeroineStatuses.find(s => s.type === 'evasion')
  const evadeRate = evasionStatus ? evasionStatus.value : 0
  const { evaded } = rollEvade(evadeRate)

  if (!hit) {
    logs.push(useSkill ? `${useSkill.name}：未命中！` : '敵人攻擊：未命中')
    return { damage: 0, newHeroine: heroine, combatUpdate: { log: logs, heroineStatuses: currentHeroineStatuses } }
  }

  if (evaded) {
    logs.push('敵人攻擊：成功迴避！')
    return { damage: 0, newHeroine: heroine, combatUpdate: { log: logs, heroineStatuses: currentHeroineStatuses } }
  }

  // DR 計算
  const drPercent = calcDR(heroine.equipment)

  // 護盾判定
  const shieldStatus = currentHeroineStatuses.find(s => s.type === 'shield')
  const flatDR = shieldStatus ? (shieldStatus.value ?? 12) : 0

  // 防禦狀態判定
  const defendStatus = currentHeroineStatuses.find(s => s.type === 'defend')
  const skillDR = defendStatus ? (defendStatus.damageReduction ?? 60) : 0
  if (defendStatus) {
    currentHeroineStatuses = currentHeroineStatuses.filter(s => s.type !== 'defend')
    logs.push('防禦生效！傷害大幅降低')
  }

  const damage = calcDamage({
    atk: combat.enemyATK ?? 10,
    ampPercent: useSkill ? (useSkill.ampPercent ?? 0) : 0,
    drPercent,
    skillDR,
    flatDR,
  })

  let newHeroine = { ...heroine, HP: Math.max(0, heroine.HP - damage) }

  // 裝備耐久被動損耗（敵人攻擊有 30% 機率各損耗 1 點）
  if (Math.random() < 0.3) {
    const slot = Math.random() < 0.5 ? 'upper' : 'lower'
    const equip = newHeroine.equipment[slot]
    if (equip) {
      const prev = equip.durability
      const next = Math.max(0, prev - 1)
      newHeroine = {
        ...newHeroine,
        equipment: { ...newHeroine.equipment, [slot]: { ...equip, durability: next } }
      }
      if (prev >= 60 && next < 60) newHeroine.DES = Math.min(200, newHeroine.DES + 5)
      if (prev >= 30 && next < 30) newHeroine.DES = Math.min(200, newHeroine.DES + 10)
    }
  }

  // HP < 30% → DES +8
  if (newHeroine.HP / newHeroine.maxHP < 0.3 && heroine.HP / heroine.maxHP >= 0.3) {
    newHeroine.DES = Math.min(200, newHeroine.DES + 8)
    logs.push(`HP 危急！DES +8`)
  }

  if (useSkill) {
    logs.push(`${useSkill.log ?? useSkill.name}，造成 ${damage} 傷害`)
  } else {
    logs.push(`敵人攻擊：命中，造成 ${damage} 傷害`)
  }

  // reflect 反傷：敵人攻擊命中後，傷害的 N% 反彈回敵人
  const reflectStatus = (combat.enemyStatuses ?? []).find(s => s.type === 'reflect')
  let newEnemyHP = combat.enemyHP
  if (reflectStatus && damage > 0) {
    const reflectDmg = Math.max(1, Math.floor(damage * (reflectStatus.value ?? 10) / 100))
    newEnemyHP = Math.max(0, combat.enemyHP - reflectDmg)
    logs.push(`反傷：${reflectDmg} 傷害反射回敵人！`)
  }

  return {
    damage,
    newHeroine,
    combatUpdate: {
      log: logs,
      heroineStatuses: currentHeroineStatuses,
      ...(newEnemyHP < combat.enemyHP ? { enemyHP: newEnemyHP } : {}),
    },
  }
}

// ─── 召喚觸發條件 ─────────────────────────────────────────────

/**
 * 判斷是否可以觸發召喚面板
 */
export function canTriggerSummon(heroine) {
  return (
    heroine.HP / heroine.maxHP <= 0.3 ||
    heroine.DES >= 80
  )
}

// ─── 回合佇列建立 ─────────────────────────────────────────────

/**
 * 為新回合建立行動順序佇列（AGI×10 + randInt(0,19)，整數確保同分可觸發）
 * 同分時：玩家 > 惡魔 > 敵人
 * @returns {string[]}  有序的行動者 ID 陣列，例如 ['heroine', 'demon_a', 'enemy']
 */
export function buildTurnQueue(heroine, activeDemons, combat) {
  const roll = () => Math.floor(Math.random() * 20)

  const units = [
    { id: 'heroine', score: (heroine.AGI ?? 5) * 10 + roll(), priority: 0 },
    ...Object.entries(activeDemons)
      .filter(([, unit]) => unit.currentHP > 0)
      .map(([id, unit]) => ({ id, score: (unit.AGI ?? 5) * 10 + roll(), priority: 1 })),
    { id: 'enemy', score: (combat.enemyAGI ?? 5) * 10 + roll(), priority: 2 },
  ]

  units.sort((a, b) => b.score - a.score || a.priority - b.priority)
  return units.map(u => u.id)
}
