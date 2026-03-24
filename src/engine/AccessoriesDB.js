/**
 * AccessoriesDB — 飾品資料庫
 * 飾品提供各種屬性加成，不受耐久度影響
 */

const ACCESSORIES_DB = {
  // ── Tier A 飾品（第 1–3 章）───────────────────────────────
  glass_beads: {
    id:          'glass_beads',
    name:        '透明礦石珠串',
    tier:        'A',
    slot:        'accessory',
    maxHP:       20,
    description: '以裂隙外圍採集的透明礦石打磨而成，每顆的內部有極細微的空氣泡包覆——那是礦石形成時的深淵氣息。佩戴後全身輕盈，因為礦石中的空泡對穿戴者的生命力場有輕微的增益共鳴效果。',
  },
  glow_badge: {
    id:          'glow_badge',
    name:        '殘響指向徽章',
    tier:        'A',
    slot:        'accessory',
    hit:         12,
    description: '某個組織或個人留下的徽章，發光性質確認是儲存了某種「注意力的殘響」。佩戴者接收到這股殘響後，自身的專注力和命中判斷會顯著提升，像是站在前人的肩膀上觀察。',
  },
  feather_clip: {
    id:          'feather_clip',
    name:        '輕翼記憶髮夾',
    tier:        'A',
    slot:        'accessory',
    AGI:         8,
    description: '以深淵飛行型生物的羽毛製成，保留了飛行的肌肉記憶。佩戴後步伐的重心管理自然改善——飛行記憶要求精確的重心控制，這一要求通過接觸傳遞給穿戴者。',
  },
  iron_amulet: {
    id:          'iron_amulet',
    name:        '粗鑄保護護符',
    tier:        'A',
    slot:        'accessory',
    maxHP:       15,
    description: '設計粗糙，但帶有強烈的「想要保護人」的意願。護符的保護效果有一部分來自材料，另一部分可能確實來自那個意願的殘留。',
  },
  focus_ring: {
    id:          'focus_ring',
    name:        '認知收束指環',
    tier:        'A',
    slot:        'accessory',
    hit:         10,
    description: '戒指的開口在佩戴時對手指施加幾乎察覺不到的壓力，持續傳遞給大腦的感知中樞，讓思緒自然收束，命中率的提升是注意力集中效果的實際應用。',
  },
  spirit_bead: {
    id:          'spirit_bead',
    name:        '靈質儲存珠',
    tier:        'A',
    slot:        'accessory',
    maxSP:       20,
    description: '以某種方式固定了微量靈質的珠子，功能類似靈力的小型電池。緩慢補充靈力儲量是因為珠子自然向外釋放儲存的靈質，穿戴者需要讓自身與珠子的釋放頻率同步。',
  },

  // ── Tier B 飾品（第 4–7 章）───────────────────────────────
  rift_bracer: {
    id:          'rift_bracer',
    name:        '縫隙能量護腕',
    tier:        'B',
    slot:        'accessory',
    ATK:         7,
    dodge:       8,
    description: '以裂隙能量固化後鑄成，保留了裂隙特有的爆發特性。每次出力時自動釋放儲存能量協助加速，身形的靈活度也因能量流通而改善。',
  },
  abyss_monocle: {
    id:          'abyss_monocle',
    name:        '淵底礦石單眼鏡',
    tier:        'B',
    slot:        'accessory',
    insight:     18,
    hit:         8,
    description: '以深淵礦物打磨的鏡片，過濾了部分欺騙性的視覺頻率。配戴者能清晰看穿敵人的動作意圖，是因為大腦接收到更純粹的動態信息，判斷準確度自然提升。',
  },
  moonlight_necklace: {
    id:          'moonlight_necklace',
    name:        '月相引力項鍊',
    tier:        'B',
    slot:        'accessory',
    maxSP:       22,
    WIL:         6,
    description: '材料對月相週期的引力變化高度敏感。月光下閃爍的效果是材料的自然物理反應，神秘感來自其對引力的敏感性讓人直觀感到它在「回應天體」。',
  },
  lucky_rabbit_foot: {
    id:          'lucky_rabbit_foot',
    name:        '速覺獸型遺物',
    tier:        'B',
    slot:        'accessory',
    dodge:       12,
    AGI:         8,
    description: '以高速獸型生物的肢體末端製成，保留了高度發展的逃脫反射記憶。佩戴後迴避能力大幅提升，因為那個逃脫反射在危機瞬間自動提前啟動，讓身體反應先於意識判斷完成。',
  },
  rift_crystal: {
    id:          'rift_crystal',
    name:        '縫隙能量結晶',
    tier:        'B',
    slot:        'accessory',
    ATK:         6,
    AGI:         3,
    description: '從裂隙邊緣自然形成的能量結晶體，內部仍保有不穩定的能量殘留，持續向外輻射微量的激發信號，讓使用者的肌肉反應和感知系統維持在輕微的亢奮狀態。',
  },
  guardian_pendant: {
    id:          'guardian_pendant',
    name:        '先驅者意志吊墜',
    tier:        'B',
    slot:        'accessory',
    maxHP:       40,
    WIL:         5,
    description: '某位古代先驅者曾長期佩戴，積累的守護意願已深入材料的記憶結構中。HP和WIL的提升難以用材料本身的物理特性解釋。',
  },
  insight_lens: {
    id:          'insight_lens',
    name:        '相位洞察鏡片',
    tier:        'B',
    slot:        'accessory',
    insight:     15,
    hit:         15,
    description: '鏡片內嵌的魔法陣調整了穿戴者接收的光頻，使部分正常不可見的相位信息變得可讀。配戴者能看穿敵人破綻，源自接收到更多維度的動態信息。',
  },
  swift_anklet: {
    id:          'swift_anklet',
    name:        '步態記憶足環',
    tier:        'B',
    slot:        'accessory',
    AGI:         10,
    dodge:       10,
    description: '材料中編入了某種輕量化生物的步態記憶，使穿戴者的重心轉移更自然流暢。dodge的提升是因為流暢的重心轉移讓迴避動作的執行損耗更低。',
  },

  // ── Tier C 飾品（第 8–10 章）─────────────────────────────
  demon_armband: {
    id:          'demon_armband',
    name:        '深淵存在契約臂章',
    tier:        'C',
    slot:        'accessory',
    ATK:         10,
    WIL:         10,
    maxHP:       40,
    description: '以特殊儀式締結深淵存在力量的臂章，那股能量在強化的同時也在「認識」持有者，等同接受了來自深處的持續觀察。但力量是真實的。',
  },
  fallen_star_ornament: {
    id:          'fallen_star_ornament',
    name:        '星體隕落冠飾',
    tier:        'C',
    slot:        'accessory',
    insight:     15,
    maxSP:       20,
    hit:         10,
    description: '以真正的星體物質製成，蘊含宇宙尺度的信息密度，看穿虛偽的能力源自接觸了「比謊言更古老的真實」之後的自然結果。',
  },
  rift_crown_fragment: {
    id:          'rift_crown_fragment',
    name:        '縫隙霸主冠碎片',
    tier:        'C',
    slot:        'accessory',
    ATK:         14,
    maxSP:       15,
    drPen:       18,
    description: '某個曾統治裂隙的存在所遺留的王冠碎片，蘊含的穿透力是統治者「意志力以物質形式存在」的殘留——統治者的意志不承認任何阻擋，材料繼承了這個不承認。',
  },
  contract_seal: {
    id:          'contract_seal',
    name:        '頂點契約封印徽',
    tier:        'C',
    slot:        'accessory',
    ATK:         10,
    WIL:         10,
    maxSP:       25,
    description: '契約力量積累到頂點後自然形成的封印象徵。持有它意味著契約已深入到某種無法輕易解除的程度——這不是配件，而是一個狀態的物質化證明。',
  },
  demon_heart_gem: {
    id:          'demon_heart_gem',
    name:        '淵核心臟結晶',
    tier:        'C',
    slot:        'accessory',
    maxHP:       60,
    ATK:         12,
    description: '深淵核心生物的能量中樞結晶化的產物，仍在持續釋放核心生物的生命力量。那股力量原本用來維持一個體積遠大於人類的生命，釋放到人類尺度效果極為顯著。',
  },
  ruya_binding_ring: {
    id:          'ruya_binding_ring',
    name:        '瑠夜・意念束縛戒',
    tier:        'C',
    slot:        'accessory',
    WIL:         15,
    insight:     20,
    locked:      true,
    unlockCond:  'demon_a_trust_50',
    description: '瑠夜親手製造的戒指，以封印術將自身的意念固定在材料中，讓戴戒者能持續感受到他意識的邊緣。WIL和insight的提升，是接觸到更高純度的封印意志後的自然共鳴——戴上它之後，很難說清楚哪些想法是自己的，哪些是瑠夜的。',
  },
  soga_iron_bangle: {
    id:          'soga_iron_bangle',
    name:        '颯牙・戰意鑄臂環',
    tier:        'C',
    slot:        'accessory',
    ATK:         18,
    maxHP:       30,
    locked:      true,
    unlockCond:  'demon_b_trust_50',
    description: '颯牙隨手取用材料打造，加工痕跡粗糙但材料品質超群。ATK和maxHP的部分提升難以用材料解釋，可能真的來自颯牙不多說卻確實在意的那個感覺。',
  },
  xuanming_shadow_chain: {
    id:          'xuanming_shadow_chain',
    name:        '玄冥・存在隱匿鏈',
    tier:        'C',
    slot:        'accessory',
    AGI:         12,
    dodge:       20,
    insight:     10,
    locked:      true,
    unlockCond:  'demon_c_trust_50',
    description: '玄冥親手鍛造，設計目的是讓穿戴者的存在信號在深淵生物的感知範圍內降至最低。幾乎看不見，是玄冥的習慣——不讓人注意到，然後默默把事情解決掉。',
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
