/**
 * AccessoriesDB — 飾品資料庫
 * 飾品提供各種屬性加成，不受耐久度影響
 */

const ACCESSORIES_DB = {
  // ── Tier A 飾品（第 1–3 章）───────────────────────────────
  glass_beads: {
    id:          'glass_beads',
    name:        '玻璃珠串',
    tier:        'A',
    slot:        'accessory',
    maxHP:       20,
    description: '晶瑩剔透的珠串，佩戴後全身輕盈，生命力略有提升。',
  },
  glow_badge: {
    id:          'glow_badge',
    name:        '輝光徽章',
    tier:        'A',
    slot:        'accessory',
    hit:         12,
    description: '能發出微光的徽章，佩戴者專注力顯著提升。',
  },
  feather_clip: {
    id:          'feather_clip',
    name:        '羽毛髮夾',
    tier:        'A',
    slot:        'accessory',
    AGI:         8,
    description: '以輕巧魔獸羽毛製成的髮夾，佩戴後步伐更為靈巧。',
  },
  iron_amulet: {
    id:          'iron_amulet',
    name:        '鐵製護符',
    tier:        'A',
    slot:        'accessory',
    maxHP:       15,
    description: '粗糙的護符，勉強能增加一點生命力。',
  },
  focus_ring: {
    id:          'focus_ring',
    name:        '專注戒指',
    tier:        'A',
    slot:        'accessory',
    hit:         10,
    description: '佩戴後思緒清晰，命中率顯著提升。',
  },
  spirit_bead: {
    id:          'spirit_bead',
    name:        '靈力珠',
    tier:        'A',
    slot:        'accessory',
    maxSP:       20,
    description: '蘊含微弱靈力的珠子，緩慢補充靈力儲量。',
  },

  // ── Tier B 飾品（第 4–7 章）───────────────────────────────
  rift_bracer: {
    id:          'rift_bracer',
    name:        '裂隙護腕',
    tier:        'B',
    slot:        'accessory',
    ATK:         7,
    dodge:       8,
    description: '裂隙能量注入的護腕，攻擊更具爆發力，身形也更加靈活。',
  },
  abyss_monocle: {
    id:          'abyss_monocle',
    name:        '深淵單片眼鏡',
    tier:        'B',
    slot:        'accessory',
    insight:     18,
    hit:         8,
    description: '深淵礦物打磨的鏡片，配戴者能清晰看穿敵人的動作意圖。',
  },
  moonlight_necklace: {
    id:          'moonlight_necklace',
    name:        '月光項鍊',
    tier:        'B',
    slot:        'accessory',
    maxSP:       22,
    WIL:         6,
    description: '月光下閃爍的神秘項鍊，能積蓄靈能並強化意志。',
  },
  lucky_rabbit_foot: {
    id:          'lucky_rabbit_foot',
    name:        '幸運兔足',
    tier:        'B',
    slot:        'accessory',
    dodge:       12,
    AGI:         8,
    description: '據說是黑市上最暢銷的幸運物，佩戴後迴避能力大幅提升。',
  },
  rift_crystal: {
    id:          'rift_crystal',
    name:        '裂隙結晶',
    tier:        'B',
    slot:        'accessory',
    ATK:         6,
    AGI:         3,
    description: '從裂隙邊緣採集的結晶，蘊含不穩定的戰鬥能量。',
  },
  guardian_pendant: {
    id:          'guardian_pendant',
    name:        '守護吊墜',
    tier:        'B',
    slot:        'accessory',
    maxHP:       40,
    WIL:         5,
    description: '傳說某位古老契約者佩戴過的吊墜，殘留著強烈的守護意志。',
  },
  insight_lens: {
    id:          'insight_lens',
    name:        '洞察鏡片',
    tier:        'B',
    slot:        'accessory',
    insight:     15,
    hit:         15,
    description: '鑲嵌在小小鏡片中的魔法陣，配戴者能看穿敵人的破綻。',
  },
  swift_anklet: {
    id:          'swift_anklet',
    name:        '輕身足環',
    tier:        'B',
    slot:        'accessory',
    AGI:         10,
    dodge:       10,
    description: '輕盈的足環，大幅提升移動速度與迴避能力。',
  },

  // ── Tier C 飾品（第 8–10 章）─────────────────────────────
  demon_armband: {
    id:          'demon_armband',
    name:        '惡魔契約臂章',
    tier:        'C',
    slot:        'accessory',
    ATK:         10,
    WIL:         10,
    maxHP:       40,
    description: '與惡魔締結的臂章，全面強化持有者的戰鬥能力，彷彿惡魔常伴左右。',
  },
  fallen_star_ornament: {
    id:          'fallen_star_ornament',
    name:        '星落冠飾',
    tier:        'C',
    slot:        'accessory',
    insight:     15,
    maxSP:       20,
    hit:         10,
    description: '流星殞落後凝結而成，蘊含宇宙的意志，看穿一切虛偽。',
  },
  rift_crown_fragment: {
    id:          'rift_crown_fragment',
    name:        '裂隙王冠碎片',
    tier:        'C',
    slot:        'accessory',
    ATK:         14,
    maxSP:       15,
    drPen:       18,
    description: '上古裂隙王冠的殘片，蘊含無法估量的穿透之力。',
  },
  contract_seal: {
    id:          'contract_seal',
    name:        '契約封印徽',
    tier:        'C',
    slot:        'accessory',
    ATK:         10,
    WIL:         10,
    maxSP:       25,
    description: '契約者頂點才能持有的徽章，象徵與惡魔的完全羈絆。',
  },
  demon_heart_gem: {
    id:          'demon_heart_gem',
    name:        '惡魔心臟寶石',
    tier:        'C',
    slot:        'accessory',
    maxHP:       60,
    ATK:         12,
    description: '惡魔核心結晶而成的寶石，持有者生命力與攻擊力大幅強化。',
  },
  ruya_binding_ring: {
    id:          'ruya_binding_ring',
    name:        '瑠夜・束縛之環',
    tier:        'C',
    slot:        'accessory',
    WIL:         15,
    insight:     20,
    locked:      true,
    unlockCond:  'demon_a_trust_50',
    description: '瑠夜送出的戒指，戴上後能感受到他遙遠的存在，意志力異常堅定。',
  },
  soga_iron_bangle: {
    id:          'soga_iron_bangle',
    name:        '颯牙・鋼鐵臂環',
    tier:        'C',
    slot:        'accessory',
    ATK:         18,
    maxHP:       30,
    locked:      true,
    unlockCond:  'demon_b_trust_50',
    description: '颯牙隨手丟給她的臂環，粗糙卻沉甸甸的重量令人安心。',
  },
  xuanming_shadow_chain: {
    id:          'xuanming_shadow_chain',
    name:        '玄冥・暗影鎖鏈',
    tier:        'C',
    slot:        'accessory',
    AGI:         12,
    dodge:       20,
    insight:     10,
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