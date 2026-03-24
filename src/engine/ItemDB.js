/**
 * ItemDB — 消耗品道具資料庫
 */

const ITEM_DB = {
  shroud_balm: {
    id:          'shroud_balm',
    name:        '存在遮蔽膏',
    description: '以特殊礦物成分製成的塗抹劑，施加後能在3次場景轉換內，對深淵存在的「注意力感知器官」形成遮蔽，使被動提升的注意度無效化。成分中有一項至今無法確認來源。',
    type:        'consumable',
    effect:      'shroud',
  },
  bait_bell: {
    id:          'bait_bell',
    name:        '吸引共鳴鈴',
    description: '振動頻率模仿受傷生物的痛覺神經信號。搖鈴後，主選的深淵存在接收到信號，注意度大幅上升——等同向所有深淵生物廣播「這裡有獵物」的信息。',
    type:        'consumable',
    effect:      'bait',
  },

  // ── 修補材料 ──────────────────────────────────────────────
  repair_kit_basic: {
    id:          'repair_kit_basic',
    name:        '初階遺構修補套',
    description: '基礎的裝備修繕材料，主要成分是從廢棄裂隙前線回收的可再用纖維和金屬粉末。修復目標裝備30點耐久。',
    type:        'repair',
    repairAmount: 30,
    target:      'single',
  },
  repair_kit_mid: {
    id:          'repair_kit_mid',
    name:        '中階遺構修補套',
    description: '品質較佳的修繕材料，包含具有自癒特性的特殊纖維。修復目標裝備60點耐久，修復後材料在接下來數次受擊中短暫提升彈性。',
    type:        'repair',
    repairAmount: 60,
    target:      'single',
  },
  repair_kit_advanced: {
    id:          'repair_kit_advanced',
    name:        '高階遺構修補套',
    description: '頂級修繕材料，以深淵自我再生型生物的再生組織為主要成分。完全修復所有已裝備服裝的耐久至100，修復的不只是破損，而是材料的記憶。',
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
