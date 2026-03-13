/**
 * MonsterDB — 魔物資料庫
 * 依 Tier 分類：Tier A（第 1–2 章教學）、Tier B（中期）、Tier C（後期）
 */

const MONSTER_DB = {
  // ── Tier P 序章魔物（scene_0_3 教學戰鬥）─────────────────────

  rift_hound: {
    id:        'rift_hound',
    name:      '飢渴的裂隙犬',
    tier:      'P',
    HP:        45,
    ATK:       9,
    AGI:       6,
    DR:        0,
    evadeRate: 5,
    skills:    ['fierce_bite'],
    skillDefs: {
      fierce_bite: {
        name:       '猛咬',
        chance:     0.4,         // 每回合 40% 機率觸發
        ampPercent: 60,          // ATK × 1.6
        hitRate:    80,
        log:        '裂隙犬猛地躍起，以利齒猛咬！',
      },
    },
    loot:      { tierPool: 0, guaranteed: false },
    description: '從裂隙湧出的低階獸型魔物，靠本能殺戮。序章教學魔物。',
  },

  // ── Tier A 教學魔物（第 1–2 章）────────────────────────────

  vine_monster: {
    id:     'vine_monster',
    name:   '藤蔓魔物',
    tier:   'A',
    HP:     60,
    ATK:    10,
    AGI:    4,
    DR:     5,
    evadeRate: 5,
    skills:  [],
    loot:   { tierPool: 1, guaranteed: false },
    description: '從裂隙滲出的低階魔物，以藤蔓束縛獵物。',
  },

  shadow_hound: {
    id:     'shadow_hound',
    name:   '暗影獵犬',
    tier:   'A',
    HP:     50,
    ATK:    12,
    AGI:    8,
    DR:     0,
    evadeRate: 15,
    skills:  [],
    loot:   { tierPool: 1, guaranteed: false },
    description: '速度型低階魔物，攻擊迅猛但防禦薄弱。',
  },

  stone_golem_minor: {
    id:     'stone_golem_minor',
    name:   '碎石魔偶',
    tier:   'A',
    HP:     80,
    ATK:    8,
    AGI:    2,
    DR:     15,
    evadeRate: 0,
    skills:  [],
    loot:   { tierPool: 1, guaranteed: true },
    description: '以碎石構成的低階魔物，行動緩慢但防禦厚實。',
  },

  // ── Tier A 第一章教學專屬怪物 ────────────────────────────────

  fire_wraith: {
    id:     'fire_wraith',
    name:   '焰靈幽鬼',
    tier:   'A',
    HP:     90,
    ATK:    10,
    AGI:    5,
    DR:     10,
    evadeRate: 20,
    skills:  [],
    loot:   { tierPool: 1, guaranteed: false },
    description: '由裂隙火焰凝聚的幽靈型魔物，身形飄忽，普通攻擊難以命中。搭配瑠夜封印術，展示封印的戰術價值。',
  },

  heavy_beast: {
    id:     'heavy_beast',
    name:   '重甲巨獸',
    tier:   'A',
    HP:     100,
    ATK:    12,
    AGI:    3,
    DR:     35,
    evadeRate: 0,
    skills:  [],
    loot:   { tierPool: 1, guaranteed: false },
    description: '全身覆蓋厚重甲殼的巨型魔物，普通攻擊幾乎無效。颯牙的無視防禦攻擊可造成全額傷害。',
  },

  shadow_lurker: {
    id:     'shadow_lurker',
    name:   '暗影潛伏者',
    tier:   'A',
    HP:     85,
    ATK:    14,
    AGI:    7,
    DR:     20,
    evadeRate: 10,
    skills:  [],
    loot:   { tierPool: 1, guaranteed: false },
    description: '棲息於暗影的中階魔物，防禦與速度兼備。玄冥的腐蝕詛咒可大幅削弱其防禦，展示詛咒型惡魔的戰略價值。',
  },

  // ── Tier B 中期魔物（第 3–6 章）────────────────────────────

  rift_knight: {
    id:     'rift_knight',
    name:   '裂隙騎士',
    tier:   'B',
    HP:     140,
    ATK:    18,
    AGI:    6,
    DR:     20,
    evadeRate: 5,
    skills:  ['seal'],
    loot:   { tierPool: 2, guaranteed: false },
    description: '裂隙中武裝化的中階魔物，手持封印之槍。',
  },

  plague_wraith: {
    id:     'plague_wraith',
    name:   '疫癘幽靈',
    tier:   'B',
    HP:     100,
    ATK:    14,
    AGI:    10,
    DR:     8,
    evadeRate: 20,
    skills:  ['poison'],
    loot:   { tierPool: 2, guaranteed: false },
    description: '施放毒素的靈體魔物，觸碰即中毒。',
  },

  // ── Tier C 後期魔物（第 7–10 章）───────────────────────────

  abyss_overlord: {
    id:     'abyss_overlord',
    name:   '深淵霸主',
    tier:   'C',
    HP:     280,
    ATK:    28,
    AGI:    8,
    DR:     25,
    evadeRate: 10,
    skills:  ['seal', 'poison'],
    loot:   { tierPool: 3, guaranteed: true },
    description: '從深淵核心誕生的高階魔物，威壓令人窒息。',
  },
}

/**
 * 取得魔物資料
 * @param {string} monsterId
 * @returns {object|null}
 */
export function getMonsterData(monsterId) {
  return MONSTER_DB[monsterId] ?? null
}

/**
 * 依 Tier 取得隨機魔物
 */
export function getRandomMonsterByTier(tier) {
  const pool = Object.values(MONSTER_DB).filter(m => m.tier === tier)
  if (!pool.length) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

export default MONSTER_DB
