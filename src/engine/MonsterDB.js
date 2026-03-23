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

  // ── Tier A 擴充魔物（四類型）──────────────────────────────────

  mud_beast: {
    id: 'mud_beast', name: '泥岩魔獸', tier: 'A', monsterType: '物理',
    HP: 90, ATK: 14, AGI: 2, DR: 15, evadeRate: 0,
    skills: [],
    skillDefs: {
      mudslam: {
        name: '泥漿衝撞', chance: 0.35, ampPercent: 75, hitRate: 72,
        log: '泥岩魔獸以龐大身軀猛力衝撞！濺起的泥漿模糊視線，難以看清攻擊軌跡！',
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '沉積在裂隙泥沼中的魔物，厚實泥甲能抵擋普通斬擊，衝撞力道驚人。',
  },

  stone_serpent: {
    id: 'stone_serpent', name: '岩石蛇怪', tier: 'A', monsterType: '物理',
    HP: 95, ATK: 13, AGI: 3, DR: 18, evadeRate: 0,
    skills: [],
    skillDefs: {
      stone_coil: {
        name: '岩甲纏繞', chance: 0.35, ampPercent: 60, hitRate: 70,
        log: '岩石蛇怪以粗礪鱗甲猛力纏繞，磨損裝備的同時施加窒息重壓！',
        durabilityDamage: { amount: 3 },
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '外皮如岩石般堅硬的大型蛇型魔物，纏繞攻擊會磨損對手裝備。',
  },

  hollow_knight: {
    id: 'hollow_knight', name: '空洞武士', tier: 'A', monsterType: '物理',
    HP: 100, ATK: 14, AGI: 3, DR: 20, evadeRate: 0,
    skills: [],
    skillDefs: {
      void_hammer: {
        name: '虛空重鎚', chance: 0.4, ampPercent: 85, hitRate: 73,
        log: '空洞武士揮動注滿裂隙能量的鐵鎚，重力扭曲周圍空間，砸落一瞬如山崩！',
      },
    },
    loot: { tierPool: 1, guaranteed: true },
    description: '裂隙能量填充的空甲武士，無意識地持鎚揮砍，是 Tier A 中防禦最高的威脅。',
  },

  toxic_slug: {
    id: 'toxic_slug', name: '劇毒蛞蝓', tier: 'A', monsterType: '精神',
    HP: 55, ATK: 8, AGI: 2, DR: 5, evadeRate: 0,
    skills: [],
    skillDefs: {
      corrosive_slime: {
        name: '腐蝕黏液', chance: 0.35, ampPercent: 0, hitRate: 68,
        log: '劇毒蛞蝓噴濺腐蝕黏液，裝甲被緩緩溶解，殘餘氣息令心神不寧...',
        durabilityDamage: { amount: 4 },
        desDrain: 2,
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '行動遲緩但散發強烈毒素的黏液魔物，其黏液同時腐蝕裝備與心神。',
  },

  ice_wisp: {
    id: 'ice_wisp', name: '冰晶鬼火', tier: 'A', monsterType: '精神',
    HP: 55, ATK: 9, AGI: 6, DR: 3, evadeRate: 12,
    skills: [],
    skillDefs: {
      despair_chill: {
        name: '絕望寒流', chance: 0.3, ampPercent: 20, hitRate: 65,
        log: '冰晶鬼火穿透軀體，絕對零度的虛空寒氣直侵心靈，契約意志開始動搖...',
        desDrain: 4,
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '在寒冷裂隙區域遊蕩的冰系靈體，其寒氣直接侵蝕心靈契約的意志根基。',
  },

  swamp_leech: {
    id: 'swamp_leech', name: '沼澤巨蛭', tier: 'A', monsterType: '控制',
    HP: 75, ATK: 10, AGI: 3, DR: 10, evadeRate: 0,
    skills: [],
    skillDefs: {
      bloodsuck: {
        name: '噬血吸附', chance: 0.4, ampPercent: 50, hitRate: 72,
        log: '沼澤巨蛭猛地吸附於傷口，以倒刺深入吸取血液，分泌的黏液同時侵蝕裝甲縫隙！',
        durabilityDamage: { amount: 2 },
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '在裂隙沼澤中潛伏的吸血巨蛭，吸附後以黏液侵蝕裝備，難以擺脫。',
  },

  bone_crawler: {
    id: 'bone_crawler', name: '骨爬蟲', tier: 'A', monsterType: '控制',
    HP: 70, ATK: 9, AGI: 4, DR: 8, evadeRate: 5,
    skills: [],
    skillDefs: {
      toxic_claw: {
        name: '毒爪撕裂', chance: 0.35, ampPercent: 40, hitRate: 70,
        log: '骨爬蟲以沾滿神經毒素的利爪撕裂，傷口傳來麻痺感，意志力隨毒素流失...',
        desDrain: 2,
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '由死骸碎骨自行組合的低階魔物，爪間分泌的神經毒素緩慢侵蝕意志力。',
  },

  wind_specter: {
    id: 'wind_specter', name: '風靈幽體', tier: 'A', monsterType: '敏捷',
    HP: 52, ATK: 12, AGI: 10, DR: 0, evadeRate: 25,
    skills: [],
    skillDefs: {
      wind_blade: {
        name: '裂空刃', chance: 0.45, ampPercent: 55, hitRate: 88,
        log: '風靈幽體凝聚氣流化為無形刃，以令人難以置信的速度切割，幾乎無法格擋！',
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '乘著裂隙氣流飄移的幽靈，極難命中，但本身防禦脆弱，一擊可破。',
  },

  ash_bat: {
    id: 'ash_bat', name: '灰燼蝙蝠', tier: 'A', monsterType: '敏捷',
    HP: 50, ATK: 11, AGI: 10, DR: 0, evadeRate: 22,
    skills: [],
    skillDefs: {
      ash_flurry: {
        name: '灰燼亂舞', chance: 0.4, ampPercent: 30, hitRate: 85,
        log: '灰燼蝙蝠揚起漫天灰燼遮蔽視線，同時以利翼連續切割——看不清攻擊方向！',
        desDrain: 2,
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '在裂隙灰燼中棲息的小型飛行魔物，以灰燼遮蔽視線後連續突擊。',
  },

  crystal_spider: {
    id: 'crystal_spider', name: '水晶毒蛛', tier: 'A', monsterType: '敏捷',
    HP: 58, ATK: 12, AGI: 8, DR: 3, evadeRate: 15,
    skills: [],
    skillDefs: {
      venom_web: {
        name: '毒蛛絲網', chance: 0.35, ampPercent: 0, hitRate: 75,
        log: '水晶毒蛛噴射含有強烈毒素的蛛絲，腐蝕裝甲的同時麻痺神經，令心神渙散...',
        durabilityDamage: { amount: 3 },
        desDrain: 3,
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '以水晶外殼偽裝的蜘蛛型魔物，噴射的毒蛛絲能同時腐蝕裝備與心神。',
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

  // ── Tier B 擴充魔物（四類型）──────────────────────────────────

  iron_colossus: {
    id: 'iron_colossus', name: '鐵鑄巨像', tier: 'B', monsterType: '物理',
    HP: 160, ATK: 22, AGI: 2, DR: 30, evadeRate: 0,
    skills: [],
    skillDefs: {
      earth_shatter: {
        name: '裂地鐵拳', chance: 0.4, ampPercent: 100, hitRate: 68,
        log: '鐵鑄巨像舉起巨拳砸向地面，衝擊波從地底湧出，撕裂一切阻擋物！',
      },
    },
    loot: { tierPool: 2, guaranteed: true },
    description: '裂隙熔融金屬凝固而成的巨像，攻擊如山崩地裂，防禦厚實近乎無解。',
  },

  blood_wolf: {
    id: 'blood_wolf', name: '血狼獸王', tier: 'B', monsterType: '物理',
    HP: 145, ATK: 20, AGI: 7, DR: 15, evadeRate: 10,
    skills: [],
    skillDefs: {
      predator_bite: {
        name: '獵殺撕咬', chance: 0.4, ampPercent: 70, hitRate: 82,
        log: '血狼獸王發出低沉嚎叫，以獵食者的本能精準鎖定要害，猛力咬下！',
      },
    },
    loot: { tierPool: 2, guaranteed: false },
    description: '統率成群弱小魔物的狼型獸王，嗜血本能讓牠愈戰愈勇，精準鎖定弱點。',
  },

  venom_witch: {
    id: 'venom_witch', name: '毒蠱巫女', tier: 'B', monsterType: '精神',
    HP: 105, ATK: 14, AGI: 8, DR: 8, evadeRate: 18,
    skills: [],
    skillDefs: {
      curse_brew: {
        name: '蠱毒詛咒', chance: 0.4, ampPercent: 10, hitRate: 75,
        log: '毒蠱巫女吟唱邪咒，裝甲表面湧現腐蝕斑點，心靈同步傳來難以抗拒的崩潰感...',
        durabilityDamage: { amount: 8 },
        desDrain: 6,
      },
    },
    loot: { tierPool: 2, guaranteed: false },
    description: '以裂隙毒素施術的女巫型魔物，其詛咒同時腐蝕裝備與瓦解心靈防線。',
  },

  chaos_hydra: {
    id: 'chaos_hydra', name: '混沌九頭蛇', tier: 'B', monsterType: '控制',
    HP: 140, ATK: 17, AGI: 5, DR: 18, evadeRate: 8,
    skills: [],
    skillDefs: {
      nine_fang: {
        name: '九頭並噬', chance: 0.45, ampPercent: 50, hitRate: 76,
        log: '混沌九頭蛇九口齊噬，在防具各處留下毒牙啃咬的痕跡，毒素從縫隙滲入...',
        durabilityDamage: { amount: 5 },
      },
    },
    loot: { tierPool: 2, guaranteed: true },
    description: '九個蛇頭各自思考的裂隙魔物，多頭同時攻擊難以全部防禦，毒牙啃碎裝甲。',
  },

  curse_mage: {
    id: 'curse_mage', name: '詛咒術師', tier: 'B', monsterType: '控制',
    HP: 110, ATK: 14, AGI: 6, DR: 15, evadeRate: 10,
    skills: [],
    skillDefs: {
      soul_shackle: {
        name: '靈魂枷鎖', chance: 0.38, ampPercent: 25, hitRate: 72,
        log: '詛咒術師以契約裂隙力量鑄造靈魂枷鎖，強制撕裂心靈防禦，慾望的枷鎖收緊！',
        desDrain: 8,
      },
    },
    loot: { tierPool: 2, guaranteed: false },
    description: '精通裂隙詛咒魔法的術師型魔物，靈魂枷鎖直接侵蝕契約意志，令人恐懼。',
  },

  shadow_reaper: {
    id: 'shadow_reaper', name: '暗影死神', tier: 'B', monsterType: '敏捷',
    HP: 115, ATK: 22, AGI: 14, DR: 8, evadeRate: 28,
    skills: [],
    skillDefs: {
      soul_harvest: {
        name: '魂魄收割', chance: 0.45, ampPercent: 75, hitRate: 92,
        log: '暗影死神的鐮刀劃過虛空，以幾乎無法察覺的軌跡準確斬向要害——無從迴避！',
      },
    },
    loot: { tierPool: 2, guaranteed: false },
    description: '以大鐮刀斬裂空間的死神型魔物，極高速度讓普通戰士難以追蹤，幾近必中。',
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
  // ── Tier C 擴充魔物（四類型）──────────────────────────────────

  rift_emperor: {
    id: 'rift_emperor', name: '裂隙帝王', tier: 'C', monsterType: '物理',
    HP: 310, ATK: 34, AGI: 6, DR: 38, evadeRate: 5,
    skills: [],
    skillDefs: {
      rift_domain: {
        name: '裂隙帝域', chance: 0.4, ampPercent: 110, hitRate: 80,
        log: '裂隙帝王展開帝域，在場所有存在都受到空間壓力碾壓，裝甲在絕對威壓下變形！',
        durabilityDamage: { amount: 12 },
      },
    },
    loot: { tierPool: 3, guaranteed: true },
    description: '統治裂隙領域的帝王型魔物，全身鎧甲由凝固裂隙能量構成，帝域之內無一倖免。',
  },

  soul_devourer: {
    id: 'soul_devourer', name: '噬魂惡魔', tier: 'C', monsterType: '精神',
    HP: 220, ATK: 28, AGI: 12, DR: 20, evadeRate: 18,
    skills: [],
    skillDefs: {
      soul_drain: {
        name: '噬魂吞食', chance: 0.4, ampPercent: 0, hitRate: 82,
        log: '噬魂惡魔伸出無形觸手，將靈魂與契約意志一同吞噬，裝備在虛空侵蝕中化為虛無...',
        durabilityDamage: { amount: 15 },
        desDrain: 12,
      },
    },
    loot: { tierPool: 3, guaranteed: true },
    description: '吞噬靈魂維持存在的高階惡魔，其觸碰直接瓦解心靈契約，裝備亦難以倖免。',
  },

  eternal_lich: {
    id: 'eternal_lich', name: '永恆死靈王', tier: 'C', monsterType: '控制',
    HP: 270, ATK: 30, AGI: 8, DR: 25, evadeRate: 10,
    skills: [],
    skillDefs: {
      eternal_curse: {
        name: '萬古詛滅', chance: 0.38, ampPercent: 30, hitRate: 78,
        log: '永恆死靈王揮動法杖，千年詛咒凝聚成形，裝備表面龜裂的同時靈魂深處傳來腐朽之感！',
        durabilityDamage: { amount: 10 },
        desDrain: 8,
      },
    },
    loot: { tierPool: 3, guaranteed: true },
    description: '以死亡魔法延續萬年的死靈王，萬古詛滅同時腐化裝備與靈魂，無從抵抗。',
  },

  void_dragon: {
    id: 'void_dragon', name: '虛空龍王', tier: 'C', monsterType: '敏捷',
    HP: 280, ATK: 38, AGI: 15, DR: 22, evadeRate: 22,
    skills: [],
    skillDefs: {
      void_breath: {
        name: '虛空龍息', chance: 0.4, ampPercent: 90, hitRate: 90,
        log: '虛空龍王噴出扭曲時空的龍息，物理衝擊與心靈崩潰同時爆發，令人無法思考！',
        desDrain: 7,
      },
    },
    loot: { tierPool: 3, guaranteed: true },
    description: '從虛空深處誕生的龍王，每次振翅裂開空間，龍息同時摧毀肉體與心靈意志。',
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
