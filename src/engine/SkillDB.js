/**
 * SkillDB — 45 技能完整資料庫（V3.0）
 * Tier I（18 個）/ Tier II（17 個）/ Tier III（10 個）
 */

const SKILL_DB = {
  // ══════════════════════════════════════════
  // TIER I — 初階技能（第 1–3 章掉落）
  // ══════════════════════════════════════════

  T1_01: {
    id: 'T1_01', tier: 1, name: '弱點標記', spCost: 14, cd: 2,
    effect: {
      type: 'debuff_hit',
      ampPercent: 25,          // 本回合傷害 +25%
      nextTurnAmp: 25,         // 下回合傷害 +25%
      applyStatus: { type: 'mark', duration: 2, value: 25 },
      evadeReduction: 10,      // 移除迴避率 10%
    },
    description: '本回合及下回合對目標傷害 +25%，移除目標 10% 迴避率',
  },

  T1_02: {
    id: 'T1_02', tier: 1, name: '靈壓壓制', spCost: 12, cd: 2,
    effect: {
      type: 'debuff_hit',
      requireWIL: 8,
      applyStatus: { type: 'blind', duration: 2, hitPenalty: 20 },
    },
    description: '目標命中率 −20%（2 回合），需 WIL ≥ 8 維持效果',
  },

  T1_03: {
    id: 'T1_03', tier: 1, name: '本能突刺', spCost: 18,
    effect: {
      type: 'attack',
      ampPercent: 80,          // ×1.8 → +80% over baseline
      ignoreDR: 0.1,           // 無視 10% DR
    },
    description: '傷害倍率 ×1.8，忽略目標 10% 減傷',
  },

  T1_04: {
    id: 'T1_04', tier: 1, name: '契約脈衝', spCost: 15,
    effect: {
      type: 'attack_heal_sp',
      ampPercent: 20,          // ×1.2
      spRestore: 10,
    },
    description: '傷害倍率 ×1.2，回復自身 10 SP',
  },

  T1_05: {
    id: 'T1_05', tier: 1, name: '快速連打', spCost: 20,
    effect: {
      type: 'multi_attack',
      hits: 2,
      ampPercent: -30,         // 各 60% 傷害（+15 基礎，-40）≈ -25
      durabilityDamage: { amount: 0, target: 'none' },
    },
    description: '攻擊 2 次，各 70% 傷害，命中獨立判定',
  },

  T1_06: {
    id: 'T1_06', tier: 1, name: '護盾展開', spCost: 15, cd: 1,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'shield', duration: 1, value: 12 },
    },
    description: '本回合受到傷害 -12',
  },

  T1_07: {
    id: 'T1_07', tier: 1, name: '創口加深', spCost: 22,
    effect: {
      type: 'attack',
      ampPercent: 0,
      applyStatus: { type: 'bleed', duration: 3, value: 5 },
    },
    description: '攻擊後施加「流血」：每回合 −5 HP（3 回合）',
  },

  T1_08: {
    id: 'T1_08', tier: 1, name: '迴避步法', spCost: 10, cd: 1,
    noAttack: true,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'evasion', duration: 1, value: 30 },
    },
    description: '本回合迴避率 +30%（不可與攻擊同回合使用）',
  },

  T1_09: {
    id: 'T1_09', tier: 1, name: '靈力回充', spCost: 0, cd: 3, maxUses: 2,
    noAttack: true,
    effect: {
      type: 'heal_sp',
      amount: 30,
    },
    description: '回復 30 SP（消耗行動，不攻擊）',
  },

  T1_10: {
    id: 'T1_10', tier: 1, name: '震盪拳', spCost: 18, cd: 2,
    effect: {
      type: 'attack',
      ampPercent: 30,
      applyStatus: { type: 'delay', duration: 1, value: 0 },
    },
    description: '傷害倍率 ×1.3，目標本回合行動延遲至回合末',
  },

  T1_11: {
    id: 'T1_11', tier: 1, name: '致盲術', spCost: 14, cd: 2,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'blind', duration: 2, hitPenalty: 25 },
    },
    description: '目標命中率 −25%（2 回合）',
  },

  T1_12: {
    id: 'T1_12', tier: 1, name: '重擊', spCost: 30,
    effect: {
      type: 'attack',
      ampPercent: 100,
      durabilityDamage: { amount: 6, target: 'upper' },
    },
    description: '傷害倍率 ×2，目標上裝耐久 −6',
  },

  T1_13: {
    id: 'T1_13', tier: 1, name: '纏縛術', spCost: 16, cd: 2,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'entangle', duration: 2, evadePenalty: 30 },
    },
    description: '目標迴避率 −30%（2 回合）',
  },

  T1_14: {
    id: 'T1_14', tier: 1, name: '輕傷自癒', spCost: 15, cd: 3,
    noAttack: true,
    effect: {
      type: 'heal_hp',
      percent: 0.15,
    },
    description: '回復 15% 最大生命值',
  },

  T1_15: {
    id: 'T1_15', tier: 1, name: '魔力碎片', spCost: 20,
    effect: {
      type: 'attack',
      ampPercent: 10,
      ignoreDR: 0.5,   // 無視 50% 物理 DR（魔法屬性）
      magic: true,
    },
    description: '魔法攻擊，無視 50% 物理減傷，傷害倍率 ×1.1',
  },

  T1_16: {
    id: 'T1_16', tier: 1, name: '衝刺突擊', spCost: 20,
    effect: {
      type: 'attack',
      ampPercent: 80,
      selfPenalty: { type: 'hit_down', duration: 1, value: 20 },
    },
    description: '傷害倍率 ×1.8，但自身下回合命中 −20%',
  },

  T1_17: {
    id: 'T1_17', tier: 1, name: '靈盾罩', spCost: 25, cd: 3,
    noAttack: true,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'absorb_shield', duration: 99, value: 0 },  // 持續到觸發
    },
    description: '抵消下一次受到的傷害（持續到被觸發）',
  },

  T1_18: {
    id: 'T1_18', tier: 1, name: '猛踏', spCost: 18,
    effect: {
      type: 'attack',
      ampPercent: 20,
      durabilityDamage: { amount: 5, target: 'lower' },
    },
    description: '傷害倍率 ×1.2，目標下裝耐久 −5',
  },

  // ══════════════════════════════════════════
  // TIER II — 中階技能（第 4–7 章掉落）
  // ══════════════════════════════════════════

  T2_01: {
    id: 'T2_01', tier: 2, name: '貫穿之刃', spCost: 28,
    effect: { type: 'attack', ampPercent: 0, ignoreDR: 0.5 },
    description: '傷害計算無視目標 50% 減傷',
  },

  T2_02: {
    id: 'T2_02', tier: 2, name: '連鎖術式', spCost: 35,
    effect: { type: 'multi_attack', hits: 3, ampPercent: -40 },
    description: '攻擊 3 次，各 60% 傷害，命中獨立判定',
  },

  T2_03: {
    id: 'T2_03', tier: 2, name: '上位護盾', spCost: 20, cd: 2,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'shield', duration: 1, value: 20 },
      skillDR: 10,
    },
    description: '本回合 受到傷害-20 且 技能減傷+10%',
  },

  T2_04: {
    id: 'T2_04', tier: 2, name: '毒素侵蝕', spCost: 20, cd: 3,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'poison', duration: 4, value: 0.1 },
    },
    description: '施加「重毒」：每回合損失 10% 現存 HP（4 回合）',
  },

  T2_05: {
    id: 'T2_05', tier: 2, name: '意志壓制', spCost: 24, cd: 4,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'weaken', duration: 3, atkReduction: 25 },
    },
    description: '目標傷害 −25%（3 回合）',
  },

  T2_06: {
    id: 'T2_06', tier: 2, name: '反制之術', spCost: 24, cd: 3,
    noAttack: true,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'counter', duration: 99, value: 1.5 },
    },
    description: '反彈下次受到攻擊的 150% 傷害（一次性）',
  },

  T2_07: {
    id: 'T2_07', tier: 2, name: '消耗汲取', spCost: 26,
    effect: { type: 'attack_heal', ampPercent: 20, healRatio: 0.3 },
    description: '傷害倍率 ×1.2，回復等同傷害 30% 的 HP',
  },

  T2_08: {
    id: 'T2_08', tier: 2, name: '迴旋斬', spCost: 30,
    effect: {
      type: 'attack',
      ampPercent: 120,
      durabilityDamage: { amount: 4, target: 'both' },
    },
    description: '傷害倍率 ×2.2，目標上下裝耐久各 −4',
  },

  T2_09: {
    id: 'T2_09', tier: 2, name: '中位自癒', spCost: 25, cd: 5,
    noAttack: true,
    effect: { type: 'heal_hp', percent: 0.35 },
    description: '回復 35% 最大生命值P',
  },

  T2_10: {
    id: 'T2_10', tier: 2, name: '時間延遲', spCost: 25, cd: 4,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'delay', duration: 2, value: 0 },
    },
    description: '目標下次行動推延 2 個回合',
  },

  T2_11: {
    id: 'T2_11', tier: 2, name: '屬性強化', spCost: 20, cd: 5,
    noAttack: true,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'atk_up', duration: 3, value: 5 },
    },
    description: 'ATK +5（3 回合，可疊加）',
  },

  T2_12: {
    id: 'T2_12', tier: 2, name: '精神滿溢', spCost: 0, cd: 4, maxUses: 2,
    noAttack: true,
    effect: {
      type: 'heal_sp',
      amount: 50,
      nextTurnDmgBonus: 15,
    },
    description: '回復 50 SP，下回合技能傷害 +15%',
  },

  T2_13: {
    id: 'T2_13', tier: 2, name: '精準注視', spCost: 22, cd: 3,
    effect: {
      type: 'attack',
      ampPercent: 10,
      hitBonus: 40,
    },
    description: '本回合命中率 +40%，傷害 +10%',
  },

  T2_14: {
    id: 'T2_14', tier: 2, name: '破甲衝擊', spCost: 32,
    effect: {
      type: 'attack',
      ampPercent: 140,
      durabilityDamage: { amount: 8, target: 'both' },
    },
    description: '傷害倍率 ×2.4，目標上下裝耐久各 −8',
  },

  T2_15: {
    id: 'T2_15', tier: 2, name: '詛咒纏繞', spCost: 28, cd: 3,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'curse', duration: 3, value: 8 },
    },
    description: '目標每使用 1 個技能額外消耗 8 SP（3 回合）',
  },

  T2_16: {
    id: 'T2_16', tier: 2, name: '鋼鐵意志', spCost: 0, cd: 2,
    requireHPBelow: 0.3,
    effect: {
      type: 'attack',
      ampPercent: 50,
    },
    description: '僅 HP < 30% 可用，本回合傷害 +50%',
  },

  T2_17: {
    id: 'T2_17', tier: 2, name: '身法幻影', spCost: 25, cd: 2,
    effect: {
      type: 'attack',
      ampPercent: 0,
      applyStatus: { type: 'evasion', duration: 1, value: 50 },
      canAttack: true,
    },
    description: '本回合迴避率 +50%，且可同時進行攻擊',
  },

  // ══════════════════════════════════════════
  // TIER III — 高階技能（第 8–10 章 / 惡魔贈與）
  // ══════════════════════════════════════════

  T3_01: {
    id: 'T3_01', tier: 3, name: '滅世一擊', spCost: 50,
    effect: { type: 'attack', ampPercent: 200, ignoreDR: 1.0 },
    description: '傷害倍率 ×3.0，完全無視 DR% 和 FlatDR',
    source: 'drop',
  },

  T3_02: {
    id: 'T3_02', tier: 3, name: '不死之心', spCost: 40, maxUses: 1,
    noAttack: true,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'undying', duration: 99, hpRestorePercent: 0.25 },
    },
    description: '本戰一次：受致命傷害時 HP 回復至 25%',
    source: 'drop',
  },

  T3_03: {
    id: 'T3_03', tier: 3, name: '時間靜止', spCost: 75, cd: 8,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'seal', duration: 4, value: 0 },
    },
    description: '目標跳過下 4 回合行動',
    source: 'drop',
  },

  T3_04: {
    id: 'T3_04', tier: 3, name: '完全壁障', spCost: 45, cd: 5,
    noAttack: true,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'perfect_shield', duration: 99, value: 0 },
    },
    description: '完全免疫下一次受到的任何傷害',
    source: 'drop',
  },

  T3_05: {
    id: 'T3_05', tier: 3, name: '靈魂共鳴', spCost: 40, cd: 4,
    noAttack: true,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'resonance', duration: 3, atkBonus: 0.25, agiBonus: 0.25, wilBonus: 0.25 },
    },
    description: 'ATK / AGI / WIL 全部 +25%（3 回合）',
    source: 'drop',
  },

  T3_06: {
    id: 'T3_06', tier: 3, name: '絕命詛咒', spCost: 48, cd: 2,
    effect: {
      type: 'percent_damage',
      percent: 0.35,
      ignoreDR: 1.0,
    },
    description: '造成目標當前 HP 35% 的傷害（無視 DR，最低 1）',
    source: 'drop',
  },

  T3_07: {
    id: 'T3_07', tier: 3, name: '束縛之印', spCost: 40, cd: 5,
    locked: true, lockSource: 'demon_a', trustRequired: 70,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'seal', duration: 3, value: 0 },
      drReduction: 20,
    },
    description: '封印目標 3 回合 + 目標 減傷 −20%',
    source: 'demon_a',
  },

  T3_08: {
    id: 'T3_08', tier: 3, name: '獸神爆裂', spCost: 60, cd: 3,
    locked: true, lockSource: 'demon_b', trustRequired: 70,
    effect: {
      type: 'attack',
      ampPercent: 300,
      durabilityDamage: { amount: 15, target: 'both' },
      applyStatus: { type: 'delay', duration: 1, value: 0 },
    },
    description: '傷害倍率 ×4，上下裝耐久各 −15，附加延遲行動',
    source: 'demon_b',
  },

  T3_09: {
    id: 'T3_09', tier: 3, name: '腐蝕詛印', spCost: 60,
    locked: true, lockSource: 'demon_c', trustRequired: 70,
    effect: {
      type: 'debuff_hit',
      applyStatus: [
        { type: 'corrode', duration: 999, drReduction: 30 },
        { type: 'reflect', duration: 999, value: 15 },
      ],
    },
    description: '目標 減傷% −30%（全戰鬥）+ 反傷 15%（全戰鬥）',
    source: 'demon_c',
  },

  T3_10: {
    id: 'T3_10', tier: 3, name: '契約覺醒', spCost: 90, cd: 8, maxUses: 2,
    locked: true, lockSource: 'all', trustRequired: 50,
    effect: {
      type: 'ultimate',
      atkMultiplier: 2,
      agiMultiplier: 2,
      duration: 2,
      demonAssist: ['demon_a', 'demon_b', 'demon_c'],
    },
    description: 'ATK ×2 + AGI ×2（2 回合），同時三惡魔各攻擊一次',
    source: 'all_demons',
  },
}

/**
 * 取得技能資料
 */
export function getSkillData(skillId) {
  return SKILL_DB[skillId] ?? null
}

/**
 * 取得某 tier 的所有技能 ID
 */
export function getSkillsByTier(tier) {
  return Object.values(SKILL_DB)
    .filter(s => s.tier === tier && !s.locked)
    .map(s => s.id)
}

/**
 * 從 tier pool 中隨機抽取 N 個技能（排除已擁有）
 */
export function drawSkillCandidates(tier, ownedSkills, count = 3) {
  const pool = getSkillsByTier(tier).filter(id => !ownedSkills.includes(id))
  const shuffled = pool.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export default SKILL_DB
