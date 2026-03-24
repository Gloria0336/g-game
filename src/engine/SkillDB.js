/**
 * SkillDB — 45 技能完整資料庫（V3.0）
 * Tier I（18 個）/ Tier II（17 個）/ Tier III（10 個）
 */

const SKILL_DB = {
  // ══════════════════════════════════════════
  // TIER I — 初階技能（第 1–3 章掉落）
  // ══════════════════════════════════════════

  T1_01: {
    id: 'T1_01', tier: 1, name: '裂隙標記', spCost: 14, cd: 2,
    effect: {
      type: 'debuff_hit',
      ampPercent: 25,          // 本回合傷害 +25%
      nextTurnAmp: 25,         // 下回合傷害 +25%
      applyStatus: { type: 'mark', duration: 2, value: 25 },
      evadeReduction: 10,      // 移除迴避率 10%
    },
    description: '在目標的存在層上刻下可見的裂縫，下兩回合傷害判定得以精確尋入；同時令目標的迴避本能短暫失去方向感',
  },

  T1_02: {
    id: 'T1_02', tier: 1, name: '存在壓迫術', spCost: 12, cd: 2,
    effect: {
      type: 'debuff_hit',
      requireWIL: 8,
      applyStatus: { type: 'blind', duration: 2, hitPenalty: 20 },
    },
    description: '釋放契約意志的側面壓力，令目標感知到一個「此處的空間拒絕你的行動」的信號，命中率顯著下降（2 回合），需 WIL ≥ 8 維持效果',
  },

  T1_03: {
    id: 'T1_03', tier: 1, name: '原初刺穿', spCost: 18,
    effect: {
      type: 'attack',
      ampPercent: 80,          // ×1.8 → +80% over baseline
      ignoreDR: 0.1,           // 無視 10% DR
    },
    description: '完全放棄防禦意識，讓身體的原始記憶主導攻擊。忽略目標存在的表層防護，直刺核心，傷害倍率 ×1.8',
  },

  T1_04: {
    id: 'T1_04', tier: 1, name: '淵源脈衝', spCost: 15,
    effect: {
      type: 'attack_heal_sp',
      ampPercent: 20,          // ×1.2
      spRestore: 10,
    },
    description: '向深淵中心送出信號，引發契約紋路的共鳴反饋；攻擊的同時，紋路傳回部分靈質能量，回復自身 10 SP',
  },

  T1_05: {
    id: 'T1_05', tier: 1, name: '相位連擊', spCost: 20,
    effect: {
      type: 'multi_attack',
      hits: 2,
      ampPercent: -30,         // 各 60% 傷害（+15 基礎，-40）≈ -25
      durabilityDamage: { amount: 0, target: 'none' },
    },
    description: '在可見相位與不可見相位之間快速交替，連續落下兩次攻擊；各次命中由目標的感知能否追蹤相位切換獨立判定，各 70% 傷害',
  },

  T1_06: {
    id: 'T1_06', tier: 1, name: '法則屏障', spCost: 15, cd: 1,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'shield', duration: 1, value: 12 },
    },
    description: '在身前瞬間展開一層局部法則，強制讓本回合受到的衝擊力沿設計路徑分散，本回合受到傷害 -12',
  },

  T1_07: {
    id: 'T1_07', tier: 1, name: '存在侵蝕', spCost: 22,
    effect: {
      type: 'attack',
      ampPercent: 0,
      applyStatus: { type: 'bleed', duration: 3, value: 5 },
    },
    description: '攻擊後在傷口中殘留一份「記憶正在流失」的信號；目標每回合都在試圖修復，但修復本身消耗存在資源：每回合 −5 HP（3 回合）',
  },

  T1_08: {
    id: 'T1_08', tier: 1, name: '相位偏移', spCost: 10, cd: 1,
    noAttack: true,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'evasion', duration: 1, value: 30 },
    },
    description: '短暫將自身存在偏移至當前相位的邊緣，使大部分攻擊判定從旁掠過，本回合迴避率 +30%（不可與攻擊同回合使用）',
  },

  T1_09: {
    id: 'T1_09', tier: 1, name: '淵源回汲', spCost: 0, cd: 3, maxUses: 2,
    noAttack: true,
    effect: {
      type: 'heal_sp',
      amount: 30,
    },
    description: '暫停行動，進行靈質能量補充，回復 30 SP（消耗行動，不攻擊）',
  },

  T1_10: {
    id: 'T1_10', tier: 1, name: '震盪打擊', spCost: 18, cd: 2,
    effect: {
      type: 'attack',
      ampPercent: 30,
      applyStatus: { type: 'delay', duration: 1, value: 0 },
    },
    description: '攻擊瞬間釋放局部的法則擾動，令目標的時序判定產生偏差，傷害倍率 ×1.3，目標本回合行動延遲至回合末',
  },

  T1_11: {
    id: 'T1_11', tier: 1, name: '感知剝奪', spCost: 14, cd: 2,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'blind', duration: 2, hitPenalty: 25 },
    },
    description: '攻擊目標的感知輸入系統，令其命中判斷在接下來兩回合內只能依賴殘缺的信息，目標命中率 −25%（2 回合）',
  },

  T1_12: {
    id: 'T1_12', tier: 1, name: '衝碎打擊', spCost: 30,
    effect: {
      type: 'attack',
      ampPercent: 100,
      durabilityDamage: { amount: 6, target: 'upper' },
    },
    description: '集中全部意志於一點落下重擊；衝擊同時穿透目標的物質防護與存在連貫性，傷害倍率 ×2，目標上裝耐久 −6',
  },

  T1_13: {
    id: 'T1_13', tier: 1, name: '觸手印纏縛', spCost: 16, cd: 2,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'entangle', duration: 2, evadePenalty: 30 },
    },
    description: '以契約紋路化作無形的纏縛，令目標的迴避系統短暫與現實脫節，目標迴避率 −30%（2 回合）',
  },

  T1_14: {
    id: 'T1_14', tier: 1, name: '持續自我修復', spCost: 15, cd: 4,
    noAttack: true,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'regen', duration: 2, value: 12 },
    },
    description: '喚醒身體組織的原始記憶，引導其往「未受傷」的狀態靠近，每回合回復 12 HP，持續 2 回合',
  },

  T1_15: {
    id: 'T1_15', tier: 1, name: '虛空碎片射擊', spCost: 20,
    effect: {
      type: 'attack',
      ampPercent: 40,
      ignoreDR: 0.5,   // 無視 50% 物理 DR（魔法屬性）
      magic: true,
    },
    description: '從虛空邊界截取破碎的空間碎片作為投射物；碎片無物質形態，因此無視 50% 物理減傷，傷害倍率 ×1.4',
  },

  T1_16: {
    id: 'T1_16', tier: 1, name: '裂隙衝入', spCost: 20,
    effect: {
      type: 'attack',
      ampPercent: 80,
      selfPenalty: { type: 'hit_down', duration: 1, value: 20 },
    },
    description: '藉助裂隙的局部空間折疊瞬間縮短距離，以全力衝擊落下，傷害倍率 ×1.8，但自身下回合命中 −20%',
  },

  T1_17: {
    id: 'T1_17', tier: 1, name: '固化壁', spCost: 25, cd: 3,
    noAttack: true,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'absorb_shield', duration: 2, value: 0 },  // 持續兩回合
    },
    description: '預先在感知邊界建立一層固化的法則層，完全抵消下一次到達的衝擊，持續兩回合',
  },

  T1_18: {
    id: 'T1_18', tier: 1, name: '地層踏碎', spCost: 18,
    effect: {
      type: 'attack',
      ampPercent: 20,
      durabilityDamage: { amount: 5, target: 'lower' },
    },
    description: '以全力踩踏地面，釋放地層壓縮的衝擊波；主要傳導至目標的下半身裝備，傷害倍率 ×1.2，目標下裝耐久 −5',
  },

  // ══════════════════════════════════════════
  // TIER II — 中階技能（第 4–7 章掉落）
  // ══════════════════════════════════════════

  T2_01: {
    id: 'T2_01', tier: 2, name: '存在貫穿', spCost: 28,
    effect: { type: 'attack', ampPercent: 0, ignoreDR: 0.5 },
    description: '攻擊針對的不是目標的物質，而是其在此空間「存在的合法性」——計算傷害時，目標的 50% 防護框架被直接略過',
  },

  T2_02: {
    id: 'T2_02', tier: 2, name: '連鎖相位觸發', spCost: 35,
    effect: { type: 'multi_attack', hits: 3, ampPercent: -40 },
    description: '在三個相位節點依序觸發攻擊，各節點命中獨立判定；目標的感知系統需要在每次節點切換時重新定位，各 60% 傷害',
  },

  T2_03: {
    id: 'T2_03', tier: 2, name: '高階法則屏障', spCost: 20, cd: 2,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'shield', duration: 1, value: 20 },
      skillDR: 10,
    },
    description: '比基礎法則屏障更完整的防護層，同時對技能攻擊的深層穿透效果產生抑制，本回合受到傷害-20 且 技能減傷+10%',
  },

  T2_04: {
    id: 'T2_04', tier: 2, name: '深腐侵蝕', spCost: 20, cd: 3,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'poison', duration: 4, value: 0.1 },
    },
    description: '在目標的存在結構中植入腐化信號：每回合消耗其當前 HP 的 10%（4 回合），像是某種不可見的分解在持續進行',
  },

  T2_05: {
    id: 'T2_05', tier: 2, name: '意識降格術', spCost: 24, cd: 4,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'weaken', duration: 3, atkReduction: 25 },
    },
    description: '強制令目標的判斷中樞接收到「你目前的層級無法進行有效攻擊」的信號，目標傷害 −25%（3 回合）',
  },

  T2_06: {
    id: 'T2_06', tier: 2, name: '法則反射', spCost: 24, cd: 3,
    noAttack: true,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'counter', duration: 99, value: 1.5 },
    },
    description: '在感知邊界建立一層鏡像法則層，下次攻擊到達時將其能量放大反還，反彈下次受到攻擊的 150% 傷害（一次性）',
  },

  T2_07: {
    id: 'T2_07', tier: 2, name: '存在汲取攻擊', spCost: 26,
    effect: { type: 'attack_heal', ampPercent: 20, healRatio: 0.3 },
    description: '攻擊的同時從目標的存在儲量中汲取部分能量轉為自身生命力，傷害倍率 ×1.2，回復等同傷害 30% 的 HP',
  },

  T2_08: {
    id: 'T2_08', tier: 2, name: '空間迴旋斬', spCost: 30,
    effect: {
      type: 'attack',
      ampPercent: 120,
      durabilityDamage: { amount: 4, target: 'both' },
    },
    description: '以空間扭曲作為力量放大器，揮出迴旋斬擊；衝擊傳導範圍廣，傷害倍率 ×2.2，目標上下裝耐久各 −4',
  },

  T2_09: {
    id: 'T2_09', tier: 2, name: '存在大修復', spCost: 25, cd: 5,
    noAttack: true,
    effect: { type: 'heal_hp', percent: 0.4 },
    description: '深度引導存在自修復機制，恢復較大比例的生命值，回復 40% 最大生命值',
  },

  T2_10: {
    id: 'T2_10', tier: 2, name: '時序滯礙術', spCost: 25, cd: 4,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'delay', duration: 2, value: 0 },
    },
    description: '在目標的時間感知中插入滯礙信號，令其下次行動推延兩個時序節點，目標下次行動推延 2 個回合',
  },

  T2_11: {
    id: 'T2_11', tier: 2, name: '存在強化術', spCost: 20, cd: 5,
    noAttack: true,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'atk_up', duration: 3, value: 5 },
    },
    description: '短暫強化自身在此空間「存在的密度」，轉化為攻擊力的直接提升，ATK +5（3 回合，可疊加）',
  },

  T2_12: {
    id: 'T2_12', tier: 2, name: '淵源漫溢', spCost: 0, cd: 4, maxUses: 2,
    noAttack: true,
    effect: {
      type: 'heal_sp',
      amount: 50,
      nextTurnDmgBonus: 15,
    },
    description: '使靈質儲量超載並溢出，下回合技能在漫溢能量的加持下效果增強，回復 50 SP，下回合技能傷害 +15%',
  },

  T2_13: {
    id: 'T2_13', tier: 2, name: '裂隙凝視', spCost: 22, cd: 3,
    effect: {
      type: 'attack',
      ampPercent: 10,
      hitBonus: 40,
    },
    description: '透過裂隙的空間折疊直接注視目標的存在核心，本回合命中率 +40%，傷害 +10%',
  },

  T2_14: {
    id: 'T2_14', tier: 2, name: '材料崩解衝擊', spCost: 32,
    effect: {
      type: 'attack',
      ampPercent: 140,
      durabilityDamage: { amount: 8, target: 'both' },
    },
    description: '攻擊時定向切斷目標裝備材料的分子鍵結，造成高倍傷害的同時使裝甲的整合性崩解，傷害倍率 ×2.4，目標上下裝耐久各 −8',
  },

  T2_15: {
    id: 'T2_15', tier: 2, name: '古咒消耗纏繞', spCost: 28, cd: 3,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'curse', duration: 3, value: 8 },
    },
    description: '以前文明的消耗型古咒纏縛目標，每次使用技能都必須支付額外的存在資源消耗，目標每使用 1 個技能額外消耗 8 SP（3 回合）',
  },

  T2_16: {
    id: 'T2_16', tier: 2, name: '存在宣言', spCost: 0, cd: 2,
    requireHPBelow: 0.3,
    effect: {
      type: 'attack',
      ampPercent: 50,
    },
    description: '僅在瀕臨崩潰時可用——對深淵宣告「我仍然存在」，意志宣言直接轉化為暴發攻擊力，僅 HP < 30% 可用，本回合傷害 +50%',
  },

  T2_17: {
    id: 'T2_17', tier: 2, name: '相位幻形步', spCost: 25, cd: 2,
    effect: {
      type: 'attack',
      ampPercent: 0,
      applyStatus: { type: 'evasion', duration: 1, value: 50 },
      canAttack: true,
    },
    description: '在可見相位與幻象相位之間同時存在，既保有攻擊能力，又令幾乎所有攻擊的命中判定失準，本回合迴避率 +50%，且可同時進行攻擊',
  },

  // ══════════════════════════════════════════
  // TIER III — 高階技能（第 8–10 章 / 惡魔贈與）
  // ══════════════════════════════════════════

  T3_01: {
    id: 'T3_01', tier: 3, name: '存在抹消打擊', spCost: 50,
    effect: { type: 'attack', ampPercent: 200, ignoreDR: 1.0 },
    description: '攻擊的對象不是目標的物質，而是其「在此空間存在」的根基，完全無視所有防護框架，傷害倍率 ×3.0',
    source: 'drop',
  },

  T3_02: {
    id: 'T3_02', tier: 3, name: '深淵回歸意志', spCost: 40, maxUses: 1,
    noAttack: true,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'undying', duration: 99, hpRestorePercent: 0.25 },
    },
    description: '在存在被抹消的瞬間，與深淵的契約拉回一條線——本戰一次：致命傷時 HP 回復至 25%',
    source: 'drop',
  },

  T3_03: {
    id: 'T3_03', tier: 3, name: '時序凍結術', spCost: 75, cd: 8,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'seal', duration: 4, value: 0 },
    },
    description: '在目標周圍製造局部的時序凍結場，令其在接下來 4 個時序節點中無法行動',
    source: 'drop',
  },

  T3_04: {
    id: 'T3_04', tier: 3, name: '完全法則壁', spCost: 45, cd: 5,
    noAttack: true,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'perfect_shield', duration: 99, value: 0 },
    },
    description: '建立完整的法則壁，完全免疫下一次任何形式的傷害——包括針對存在本身的攻擊',
    source: 'drop',
  },

  T3_05: {
    id: 'T3_05', tier: 3, name: '淵源共鳴', spCost: 40, cd: 4,
    noAttack: true,
    effect: {
      type: 'buff_self',
      applyStatus: { type: 'resonance', duration: 3, atkBonus: 0.25, agiBonus: 0.25, wilBonus: 0.25 },
    },
    description: '與深淵源點達成短暫的完全共鳴，所有核心能力在共鳴期間大幅強化，ATK / AGI / WIL 全部 +25%（3 回合）',
    source: 'drop',
  },

  T3_06: {
    id: 'T3_06', tier: 3, name: '存在瓦解詛咒', spCost: 48, cd: 2,
    effect: {
      type: 'percent_damage',
      percent: 0.35,
      ignoreDR: 1.0,
    },
    description: '直接攻擊目標當前存在資源的 35%，無視所有防護，因為攻擊的是存在的連貫性本身',
    source: 'drop',
  },

  T3_07: {
    id: 'T3_07', tier: 3, name: '瑠夜・封存印記', spCost: 40, cd: 5,
    locked: true, lockSource: 'demon_a', trustRequired: 70,
    effect: {
      type: 'debuff_hit',
      applyStatus: { type: 'seal', duration: 3, value: 0 },
      drReduction: 20,
    },
    description: '瑠夜以契約之力刻下封存印記，封鎖目標的行動能力，同時瓦解其防護基礎，封印目標 3 回合 + 目標 減傷 −20%',
    source: 'demon_a',
  },

  T3_08: {
    id: 'T3_08', tier: 3, name: '颯牙・戰意爆裂', spCost: 60, cd: 3,
    locked: true, lockSource: 'demon_b', trustRequired: 70,
    effect: {
      type: 'attack',
      ampPercent: 300,
      durabilityDamage: { amount: 15, target: 'both' },
      applyStatus: { type: 'delay', duration: 1, value: 0 },
    },
    description: '颯牙積蓄的全部戰意在一瞬間完全釋放，爆炸性打擊穿透一切，並附加時序延遲衝擊，傷害倍率 ×4，上下裝耐久各 −15',
    source: 'demon_b',
  },

  T3_09: {
    id: 'T3_09', tier: 3, name: '玄冥・萬古腐印', spCost: 60,
    locked: true, lockSource: 'demon_c', trustRequired: 70,
    effect: {
      type: 'debuff_hit',
      applyStatus: [
        { type: 'corrode', duration: 999, drReduction: 30 },
        { type: 'reflect', duration: 999, value: 15 },
      ],
    },
    description: '玄冥以萬年積累的腐化力量刻下印記，永久削弱目標的防護基礎，並反傷持續存在，目標 減傷% −30%（全戰鬥）+ 反傷 15%（全戰鬥）',
    source: 'demon_c',
  },

  T3_10: {
    id: 'T3_10', tier: 3, name: '深淵契約覺醒', spCost: 90, cd: 8, maxUses: 2,
    locked: true, lockSource: 'all', trustRequired: 50,
    effect: {
      type: 'ultimate',
      atkMultiplier: 2,
      agiMultiplier: 2,
      duration: 2,
      demonAssist: ['demon_a', 'demon_b', 'demon_c'],
    },
    description: '三位深淵存在的力量同時與契約共鳴，能力暴發的同時，三者各自從深處降下一擊，ATK ×2 + AGI ×2（2 回合），同時三惡魔各攻擊一次',
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
