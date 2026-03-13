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
