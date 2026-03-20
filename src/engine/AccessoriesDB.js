/**
 * AccessoriesDB — 飾品資料庫
 * 飾品提供各種屬性加成，不受耐久度影響
 */

const ACCESSORIES_DB = {
  // ── Tier A 飾品（第 1–3 章）───────────────────────────────
  iron_amulet: {
    id:          'iron_amulet',
    name:        '鐵製護符',
    tier:        'A',
    slot:        'accessory',
    hpBonus:     15,
    description: '粗糙的護符，勉強能增加一點生命力。',
  },
  focus_ring: {
    id:          'focus_ring',
    name:        '專注戒指',
    tier:        'A',
    slot:        'accessory',
    hitBonus:    10,
    description: '佩戴後思緒清晰，命中率顯著提升。',
  },
  spirit_bead: {
    id:          'spirit_bead',
    name:        '靈力珠',
    tier:        'A',
    slot:        'accessory',
    spBonus:     20,
    description: '蘊含微弱靈力的珠子，緩慢補充靈力儲量。',
  },

  // ── Tier B 飾品（第 4–7 章）───────────────────────────────
  rift_crystal: {
    id:          'rift_crystal',
    name:        '裂隙結晶',
    tier:        'B',
    slot:        'accessory',
    atkBonus:    6,
    agiBonus:    3,
    description: '從裂隙邊緣採集的結晶，蘊含不穩定的戰鬥能量。',
  },
  guardian_pendant: {
    id:          'guardian_pendant',
    name:        '守護吊墜',
    tier:        'B',
    slot:        'accessory',
    hpBonus:     40,
    wilBonus:    5,
    description: '傳說某位古老契約者佩戴過的吊墜，殘留著強烈的守護意志。',
  },
  insight_lens: {
    id:          'insight_lens',
    name:        '洞察鏡片',
    tier:        'B',
    slot:        'accessory',
    insightBonus: 15,
    hitBonus:    15,
    description: '鑲嵌在小小鏡片中的魔法陣，配戴者能看穿敵人的破綻。',
  },
  swift_anklet: {
    id:          'swift_anklet',
    name:        '輕身足環',
    tier:        'B',
    slot:        'accessory',
    agiBonus:    10,
    dodgeBonus:  10,
    description: '輕盈的足環，大幅提升移動速度與迴避能力。',
  },

  // ── Tier C 飾品（第 8–10 章）─────────────────────────────
  contract_seal: {
    id:          'contract_seal',
    name:        '契約封印徽',
    tier:        'C',
    slot:        'accessory',
    atkBonus:    10,
    wilBonus:    10,
    spBonus:     25,
    description: '契約者頂點才能持有的徽章，象徵與惡魔的完全羈絆。',
  },
  demon_heart_gem: {
    id:          'demon_heart_gem',
    name:        '惡魔心臟寶石',
    tier:        'C',
    slot:        'accessory',
    hpBonus:     60,
    atkBonus:    12,
    description: '惡魔核心結晶而成的寶石，持有者生命力與攻擊力大幅強化。',
  },
  ruya_binding_ring: {
    id:          'ruya_binding_ring',
    name:        '瑠夜・束縛之環',
    tier:        'C',
    slot:        'accessory',
    wilBonus:    15,
    insightBonus: 20,
    locked:      true,
    unlockCond:  'demon_a_trust_50',
    description: '瑠夜送出的戒指，戴上後能感受到他遙遠的存在，意志力異常堅定。',
  },
  soga_iron_bangle: {
    id:          'soga_iron_bangle',
    name:        '颯牙・鋼鐵臂環',
    tier:        'C',
    slot:        'accessory',
    atkBonus:    18,
    hpBonus:     30,
    locked:      true,
    unlockCond:  'demon_b_trust_50',
    description: '颯牙隨手丟給她的臂環，粗糙卻沉甸甸的重量令人安心。',
  },
  xuanming_shadow_chain: {
    id:          'xuanming_shadow_chain',
    name:        '玄冥・暗影鎖鏈',
    tier:        'C',
    slot:        'accessory',
    agiBonus:    12,
    dodgeBonus:  20,
    insightBonus: 10,
    locked:      true,
    unlockCond:  'demon_c_trust_50',
    description: '玄冥親手鍛造的細鏈，幾乎看不見，卻保護著持有者不被惡意察覺。',
  },
}

/**
 * 取得飾品資料
 * @param {string} accessoryId
 * @returns {object|null}
 */
export function getAccessoryData(accessoryId) {
  return ACCESSORIES_DB[accessoryId] ?? null
}

export default ACCESSORIES_DB
