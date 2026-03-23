/**
 * ItemDB — 消耗品道具資料庫
 */

const ITEM_DB = {
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

  // ── 修補材料 ──────────────────────────────────────────────
  repair_kit_basic: {
    id:          'repair_kit_basic',
    name:        '初階修補材料',
    description: '基礎修繕材料，修復目標裝備 30 點耐久。',
    type:        'repair',
    repairAmount: 30,
    target:      'single',
  },
  repair_kit_mid: {
    id:          'repair_kit_mid',
    name:        '中階修補材料',
    description: '品質較佳的修繕材料，修復目標裝備 60 點耐久。',
    type:        'repair',
    repairAmount: 60,
    target:      'single',
  },
  repair_kit_advanced: {
    id:          'repair_kit_advanced',
    name:        '高階修補材料',
    description: '頂級修繕材料，完全修復所有已裝備服裝的耐久至 100。',
    type:        'repair',
    repairAmount: 100,
    target:      'all',
  },
}

/**
 * 取得道具資料
 * @param {string} itemId
 * @returns {object|null}
 */
export function getItemData(itemId) {
  return ITEM_DB[itemId] ?? null
}

export default ITEM_DB
