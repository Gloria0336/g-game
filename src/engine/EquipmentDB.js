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
