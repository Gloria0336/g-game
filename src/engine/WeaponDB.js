/**
 * WeaponDB — 武器資料庫
 * 武器影響 ATK 加成、命中率，並有耐久度系統
 */

const WEAPON_DB = {
  // ── 序章 / 起始武器 ───────────────────────────────────────
  iron_sword: {
    id:          'iron_sword',
    name:        '破舊鐵劍',
    tier:        'P',
    atkBonus:    0,
    hitBonus:    0,
    tierSteps: {
      '100_80': 0,
      '79_60':  -1,
      '59_30':  -3,
      '30_0':   -6,
    },
    description: '序章教學武器，毫不起眼的鐵劍，卻是她走向戰場的第一步。',
  },

  // ── Tier A 武器（第 1–3 章）───────────────────────────────
  steel_blade: {
    id:          'steel_blade',
    name:        '鋼刃',
    tier:        'A',
    atkBonus:    4,
    hitBonus:    5,
    tierSteps: { '100_80': 0, '79_60': -1, '59_30': -3, '30_0': -6 },
    description: '鍛造精良的標準戰鬥刃，重量均衡，易於掌控。',
  },
  swift_dagger: {
    id:          'swift_dagger',
    name:        '疾風匕首',
    tier:        'A',
    atkBonus:    2,
    hitBonus:    12,
    agiBonus:    3,
    tierSteps: { '100_80': 0, '79_60': -1, '59_30': -3, '30_0': -6 },
    description: '輕巧短刃，犧牲攻擊力換取絕佳的速度加成。',
  },
  covenant_rod: {
    id:          'covenant_rod',
    name:        '契約法杖',
    tier:        'A',
    atkBonus:    3,
    hitBonus:    8,
    spBonus:     15,
    tierSteps: { '100_80': 0, '79_60': -1, '59_30': -3, '30_0': -6 },
    description: '注入靈力的法杖，提升 SP 上限，適合技能型戰鬥風格。',
  },

  // ── Tier B 武器（第 4–7 章）───────────────────────────────
  demon_fang: {
    id:          'demon_fang',
    name:        '惡魔之牙',
    tier:        'B',
    atkBonus:    10,
    hitBonus:    8,
    tierSteps: { '100_80': 0, '79_60': -2, '59_30': -5, '30_0': -9 },
    description: '以裂隙魔物之牙鑄成，散發著隱約的腐敗氣息，攻擊力驚人。',
  },
  rift_lance: {
    id:          'rift_lance',
    name:        '裂隙穿刺槍',
    tier:        'B',
    atkBonus:    8,
    hitBonus:    15,
    drPenBonus:  15,
    tierSteps: { '100_80': 0, '79_60': -2, '59_30': -5, '30_0': -9 },
    description: '細長槍身可穿透護甲縫隙，對高 DR 目標效果額外提升 15%。',
  },
  spirit_blade: {
    id:          'spirit_blade',
    name:        '靈魂刃',
    tier:        'B',
    atkBonus:    9,
    hitBonus:    10,
    wilBonus:    4,
    tierSteps: { '100_80': 0, '79_60': -2, '59_30': -5, '30_0': -9 },
    description: '刀身帶有微弱的靈力脈動，強化意志，抵抗控制效果。',
  },

  // ── Tier C 武器（第 8–10 章）─────────────────────────────
  abyss_sword: {
    id:          'abyss_sword',
    name:        '深淵巨劍',
    tier:        'C',
    atkBonus:    20,
    hitBonus:    5,
    tierSteps: { '100_80': 0, '79_60': -3, '59_30': -7, '30_0': -12 },
    description: '從深淵裂隙中挖掘的神秘巨劍，攻擊力超凡，但耐久損耗極快。',
  },
  ruya_shadow_blade: {
    id:          'ruya_shadow_blade',
    name:        '瑠夜・縛影刃',
    tier:        'C',
    atkBonus:    15,
    hitBonus:    20,
    wilBonus:    8,
    locked:      true,
    unlockCond:  'demon_a_trust_70',
    tierSteps: { '100_80': 0, '79_60': -3, '59_30': -7, '30_0': -12 },
    description: '瑠夜以契約之力鑄造，如暗影般寂靜，封印力量灌注其中。',
  },
  soga_war_axe: {
    id:          'soga_war_axe',
    name:        '颯牙・戰鬼戰斧',
    tier:        'C',
    atkBonus:    25,
    hitBonus:    0,
    locked:      true,
    unlockCond:  'demon_b_trust_70',
    tierSteps: { '100_80': 0, '79_60': -3, '59_30': -7, '30_0': -12 },
    description: '颯牙的戰意凝聚而成，粗獷霸道，爆發力無與倫比。',
  },
  xuanming_cursed_staff: {
    id:          'xuanming_cursed_staff',
    name:        '玄冥・詛咒杖',
    tier:        'C',
    atkBonus:    12,
    hitBonus:    10,
    spBonus:     30,
    drPenBonus:  25,
    locked:      true,
    unlockCond:  'demon_c_trust_70',
    tierSteps: { '100_80': 0, '79_60': -3, '59_30': -7, '30_0': -12 },
    description: '玄冥詛咒的結晶，持有者的攻擊附帶穿透防禦的腐蝕之力。',
  },
}

/**
 * 取得武器資料
 * @param {string} weaponId
 * @returns {object|null}
 */
export function getWeaponData(weaponId) {
  return WEAPON_DB[weaponId] ?? null
}

export default WEAPON_DB
