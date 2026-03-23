/**
 * EquipmentDB — 裝備資料庫
 * 記錄各裝備的基礎 DR 值與耐久區間懲罰
 */

const EQUIPMENT_DB = {
  // ── 起始裝備 ──────────────────────────────────────────────
  covenant_coat: {
    id:   'covenant_coat',
    name: '契約者外衣',
    slot: 'upper',
    drU:  10,
    drL:  0,
    tierSteps: {
      '100_80': 0,
      '79_60':  -2,
      '59_30':  -5,
      '30_0':   -9,
    },
  },
  covenant_skirt: {
    id:   'covenant_skirt',
    name: '契約者長裙',
    slot: 'lower',
    drU:  0,
    drL:  8,
    tierSteps: {
      '100_80': 0,
      '79_60':  -2,
      '59_30':  -5,
      '30_0':   -9,
    },
  },

  // ── Tier A 上衣（第 1–3 章）──────────────────────────────────
  leather_vest: {
    id: 'leather_vest', name: '輕甲皮背心', tier: 'A', slot: 'upper',
    drU: 8, drL: 0,
    tierSteps: { '100_80': 0, '79_60': -2, '59_30': -5, '30_0': -9 },
  },
  cloth_robe: {
    id: 'cloth_robe', name: '布衣道袍', tier: 'A', slot: 'upper',
    drU: 6, drL: 0,
    tierSteps: { '100_80': 0, '79_60': -2, '59_30': -5, '30_0': -9 },
  },
  reinforced_leather_coat: {
    id: 'reinforced_leather_coat', name: '強化皮甲', tier: 'A', slot: 'upper',
    drU: 12, drL: 0,
    tierSteps: { '100_80': 0, '79_60': -2, '59_30': -5, '30_0': -9 },
  },

  // ── Tier B 上衣（第 4–7 章）──────────────────────────────────
  rift_battle_coat: {
    id: 'rift_battle_coat', name: '裂隙戰衣', tier: 'B', slot: 'upper',
    drU: 16, drL: 0,
    tierSteps: { '100_80': 0, '79_60': -3, '59_30': -7, '30_0': -12 },
  },
  magic_robe: {
    id: 'magic_robe', name: '魔法長袍', tier: 'B', slot: 'upper',
    drU: 14, drL: 0,
    tierSteps: { '100_80': 0, '79_60': -3, '59_30': -7, '30_0': -12 },
  },
  contract_armor: {
    id: 'contract_armor', name: '契約護甲', tier: 'B', slot: 'upper',
    drU: 18, drL: 0,
    tierSteps: { '100_80': 0, '79_60': -3, '59_30': -7, '30_0': -12 },
  },
  black_iron_breastplate: {
    id: 'black_iron_breastplate', name: '黑鐵胸甲', tier: 'B', slot: 'upper',
    drU: 20, drL: 0,
    tierSteps: { '100_80': 0, '79_60': -3, '59_30': -7, '30_0': -12 },
  },

  // ── Tier C 上衣（第 8–10 章）─────────────────────────────────
  dragon_scale_coat: {
    id: 'dragon_scale_coat', name: '龍鱗戰衣', tier: 'C', slot: 'upper',
    drU: 26, drL: 0,
    tierSteps: { '100_80': 0, '79_60': -4, '59_30': -9, '30_0': -15 },
  },
  heaven_armor: {
    id: 'heaven_armor', name: '天界戰甲', tier: 'C', slot: 'upper',
    drU: 32, drL: 0,
    tierSteps: { '100_80': 0, '79_60': -4, '59_30': -9, '30_0': -15 },
  },
  demon_leather_coat: {
    id: 'demon_leather_coat', name: '惡魔皮製精裝', tier: 'C', slot: 'upper',
    drU: 28, drL: 0,
    tierSteps: { '100_80': 0, '79_60': -4, '59_30': -9, '30_0': -15 },
  },

  // ── Tier A 下半身（第 1–3 章）────────────────────────────────
  light_leg_guard: {
    id: 'light_leg_guard', name: '輕甲護腿', tier: 'A', slot: 'lower',
    drU: 0, drL: 6,
    tierSteps: { '100_80': 0, '79_60': -2, '59_30': -5, '30_0': -9 },
  },
  cloth_skirt: {
    id: 'cloth_skirt', name: '布衣長裙', tier: 'A', slot: 'lower',
    drU: 0, drL: 5,
    tierSteps: { '100_80': 0, '79_60': -2, '59_30': -5, '30_0': -9 },
  },
  leather_legging: {
    id: 'leather_legging', name: '皮革護腿', tier: 'A', slot: 'lower',
    drU: 0, drL: 10,
    tierSteps: { '100_80': 0, '79_60': -2, '59_30': -5, '30_0': -9 },
  },

  // ── Tier B 下半身（第 4–7 章）────────────────────────────────
  rift_half_plate: {
    id: 'rift_half_plate', name: '裂隙半甲裙', tier: 'B', slot: 'lower',
    drU: 0, drL: 14,
    tierSteps: { '100_80': 0, '79_60': -3, '59_30': -7, '30_0': -12 },
  },
  magic_long_skirt: {
    id: 'magic_long_skirt', name: '魔法長裙', tier: 'B', slot: 'lower',
    drU: 0, drL: 12,
    tierSteps: { '100_80': 0, '79_60': -3, '59_30': -7, '30_0': -12 },
  },
  contract_leg_guard: {
    id: 'contract_leg_guard', name: '契約護腿', tier: 'B', slot: 'lower',
    drU: 0, drL: 16,
    tierSteps: { '100_80': 0, '79_60': -3, '59_30': -7, '30_0': -12 },
  },
  chain_skirt: {
    id: 'chain_skirt', name: '鎖鏈護裙', tier: 'B', slot: 'lower',
    drU: 0, drL: 18,
    tierSteps: { '100_80': 0, '79_60': -3, '59_30': -7, '30_0': -12 },
  },

  // ── Tier C 下半身（第 8–10 章）───────────────────────────────
  dragon_scale_skirt: {
    id: 'dragon_scale_skirt', name: '龍鱗裙甲', tier: 'C', slot: 'lower',
    drU: 0, drL: 24,
    tierSteps: { '100_80': 0, '79_60': -4, '59_30': -9, '30_0': -15 },
  },
  heaven_leg_armor: {
    id: 'heaven_leg_armor', name: '天界護腿甲', tier: 'C', slot: 'lower',
    drU: 0, drL: 28,
    tierSteps: { '100_80': 0, '79_60': -4, '59_30': -9, '30_0': -15 },
  },
  demon_leather_pants: {
    id: 'demon_leather_pants', name: '惡魔皮革長褲', tier: 'C', slot: 'lower',
    drU: 0, drL: 22,
    tierSteps: { '100_80': 0, '79_60': -4, '59_30': -9, '30_0': -15 },
  },
}

/**
 * 取得裝備資料
 * @param {string} equipId
 * @returns {object|null}
 */
export function getEquipmentData(equipId) {
  return EQUIPMENT_DB[equipId] ?? null
}

export default EQUIPMENT_DB
