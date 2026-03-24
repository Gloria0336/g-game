/**
 * MonsterDB — 魔物資料庫
 * 依 Tier 分類：Tier A（第 1–2 章教學）、Tier B（中期）、Tier C（後期）
 */

const MONSTER_DB = {
  // ── Tier P 序章魔物（scene_0_3 教學戰鬥）─────────────────────

  rift_hound: {
    id: 'rift_hound',
    name: '飢餓的門縫獸',
    tier: 'P',
    HP: 45,
    ATK: 9,
    AGI: 6,
    DR: 0,
    evadeRate: 5,
    skills: ['fierce_bite'],
    skillDefs: {
      fierce_bite: {
        name: '猛咬',
        cd: 2,
        initialCd: 1,
        ampPercent: 60,
        hitRate: 80,
        log: '門縫獸猛地躍起，以利齒猛咬！',
      },
    },
    loot: { tierPool: 0, guaranteed: false },
    description: '從現實的裂縫中撕擠而出的原始獸型，永遠保持著飢餓的狀態。其存在本身違反物理法則——身軀比縫隙更大，卻能從中整體鑽出。序章的第一次接觸，讓人初次理解「裂隙」並非空間破損，而是某種生命的出入口。',
  },

  // ── Tier A 教學魔物（第 1–2 章）────────────────────────────

  vine_monster: {
    id: 'vine_monster',
    name: '纏絡根絲體',
    tier: 'A',
    HP: 60,
    ATK: 10,
    AGI: 4,
    DR: 5,
    evadeRate: 5,
    skills: [],
    loot: { tierPool: 1, guaranteed: false },
    description: '外觀如腐根，實為從地底伸出的觸手網絡末端。其本體從未被人見過，見到的永遠只是它用來獵食的一部分。藤蔓束縛時，會有輕微的低語聲貫入腦中——那是它的消化方式，先腐蝕意識，再腐蝕肉體。',
  },

  shadow_hound: {
    id: 'shadow_hound',
    name: '光蝕犬',
    tier: 'A',
    HP: 50,
    ATK: 12,
    AGI: 8,
    DR: 0,
    evadeRate: 15,
    skills: [],
    loot: { tierPool: 1, guaranteed: false },
    description: '以光的負值構成的速攻型存在，準確來說它存在於光照不到的位置，而非「陰影中」。移動速度超越正常認知，是因為它並非在移動，而是在不斷消失和重現。防禦薄弱是因為它本身幾乎沒有物質性。',
  },

  stone_golem_minor: {
    id: 'stone_golem_minor',
    name: '地層記憶聚合體',
    tier: 'A',
    HP: 80,
    ATK: 8,
    AGI: 2,
    DR: 15,
    evadeRate: 0,
    skills: [],
    loot: { tierPool: 1, guaranteed: true },
    description: '由裂隙壓力將無數層地質記憶凝聚的移動岩體。身上的紋路是數萬年地層被壓縮的印記，每一條裂痕都是一個已消失的地質年代。行動遲緩是因為它仍試圖「記住」自己是岩石，但記憶正在流失。',
  },

  // ── Tier A 第一章教學專屬怪物 ────────────────────────────────

  fire_wraith: {
    id: 'fire_wraith',
    name: '燃燒記憶幽形',
    tier: 'A',
    HP: 90,
    ATK: 10,
    AGI: 5,
    DR: 10,
    evadeRate: 20,
    skills: [],
    loot: { tierPool: 1, guaranteed: false },
    description: '某個在裂隙中死去者的最後情緒被火焰固化的產物，並非真正的火，而是「記憶燃燒的殘影」。身形飄忽是因為它不斷在死亡的那一瞬間和此刻之間震盪。普通攻擊穿過它，就像穿過過去的幻象。搭配瑠夜封印術，展示封印的戰術價值。',
  },

  heavy_beast: {
    id: 'heavy_beast',
    name: '古殼覆甲者',
    tier: 'A',
    HP: 100,
    ATK: 12,
    AGI: 3,
    DR: 35,
    evadeRate: 0,
    skills: [],
    loot: { tierPool: 1, guaranteed: false },
    description: '蟲型深淵生物在演化頂點時分泌的外骨骼層層疊加形成的巨型個體，最外層的殼已是數百代前的祖先所留。甲殼厚到幾乎吸收所有外力，颯牙的力量之所以有效，是因為它不是「穿透」，而是直接撕碎時間。',
  },

  shadow_lurker: {
    id: 'shadow_lurker',
    name: '暗域潛息者',
    tier: 'A',
    HP: 85,
    ATK: 14,
    AGI: 7,
    DR: 20,
    evadeRate: 10,
    skills: [],
    loot: { tierPool: 1, guaranteed: false },
    description: '長期棲居於暗處，已將自身的存在密度降至接近零。它潛伏時，旁邊的空氣折射率會輕微改變——這是唯一可察覺的線索。玄冥的腐蝕詛咒之所以有效，是因為它攻擊的是「存在密度」，而非物理防禦。',
  },

  // ── Tier A 擴充魔物（四類型）──────────────────────────────────

  mud_beast: {
    id: 'mud_beast', name: '地泥蠕龐', tier: 'A', monsterType: '物理',
    HP: 90, ATK: 14, AGI: 2, DR: 15, evadeRate: 0,
    skills: [],
    skillDefs: {
      mudslam: {
        name: '泥漿衝撞', cd: 2, initialCd: 2, ampPercent: 75, hitRate: 72,
        log: '地泥蠕龐以龐大身軀猛力衝撞！濺起的泥漿模糊視線，難以看清攻擊軌跡！',
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '裂隙壓縮作用使泥土和礦石融合成半流動的巨型蠕動體。撞擊後濺起的泥漿帶有輕微的視覺干擾性，讓人無法看清它的邊界在哪裡。',
  },

  stone_serpent: {
    id: 'stone_serpent', name: '硬殼蜿蜒脊', tier: 'A', monsterType: '物理',
    HP: 95, ATK: 13, AGI: 3, DR: 18, evadeRate: 0,
    skills: [],
    skillDefs: {
      stone_coil: {
        name: '岩甲纏繞', cd: 3, initialCd: 2, ampPercent: 60, hitRate: 70,
        log: '硬殼蜿蜒脊以粗礪鱗甲猛力纏繞，磨損裝備的同時施加窒息重壓！',
        durabilityDamage: { amount: 3 },
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '在高壓地層中生成的節肢型礦石生物，外殼是真正意義上的岩石。纏繞時產生的磨耗是它認識世界的方式——用自己的礦石質感去感知獵物的材料組成。',
  },

  hollow_knight: {
    id: 'hollow_knight', name: '空甲意志遺形', tier: 'A', monsterType: '物理',
    HP: 100, ATK: 14, AGI: 3, DR: 20, evadeRate: 0,
    skills: [],
    skillDefs: {
      void_hammer: {
        name: '虛空重鎚', cd: 2, initialCd: 1, ampPercent: 85, hitRate: 73,
        log: '空甲意志遺形揮動注滿裂隙能量的鐵鎚，重力扭曲周圍空間，砸落一瞬如山崩！',
      },
    },
    loot: { tierPool: 1, guaranteed: true },
    description: '某位在裂隙中死去的武士的「戰意」遺留，找到了空的甲冑並住進去。嚴格意義上沒有生命，只有慣性——戰鬥的慣性。揮動重錘的並非肌肉，而是被壓縮在鎧甲內的純粹慣性。',
  },

  toxic_slug: {
    id: 'toxic_slug', name: '腐訊滲體', tier: 'A', monsterType: '精神',
    HP: 55, ATK: 8, AGI: 2, DR: 5, evadeRate: 0,
    skills: [],
    skillDefs: {
      corrosive_slime: {
        name: '腐蝕黏液', cd: 3, initialCd: 2, ampPercent: 0, hitRate: 68,
        log: '腐訊滲體噴濺腐蝕黏液，裝甲被緩緩溶解，殘餘氣息令心神不寧...',
        durabilityDamage: { amount: 4 },
        desDrain: 5,
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '以信息形式傳播腐蝕的軟體生物，其「毒素」實際上是一種改寫材料記憶的物質——讓金屬忘記自己是金屬、讓心靈忘記自己的邊界。行動遲緩，但牠等的起。',
  },

  ice_wisp: {
    id: 'ice_wisp', name: '絕對零響體', tier: 'A', monsterType: '精神',
    HP: 55, ATK: 9, AGI: 6, DR: 3, evadeRate: 12,
    skills: [],
    skillDefs: {
      despair_chill: {
        name: '絕望寒流', cd: 2, initialCd: 2, ampPercent: 20, hitRate: 65,
        log: '絕對零響體穿透軀體，絕對零度的虛空寒氣直侵心靈，契約意志開始動搖...',
        desDrain: 8,
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '溫度的概念在它附近失去意義。穿過人體時，帶走的不是體溫，而是「想要繼續的意願」——那種在心靈最深處支撐一切的基礎動能。',
  },

  swamp_leech: {
    id: 'swamp_leech', name: '深沼附貼者', tier: 'A', monsterType: '控制',
    HP: 75, ATK: 10, AGI: 3, DR: 10, evadeRate: 0,
    skills: [],
    skillDefs: {
      bloodsuck: {
        name: '噬血吸附', cd: 2, initialCd: 1, ampPercent: 50, hitRate: 72,
        log: '深沼附貼者猛地吸附於傷口，以倒刺深入吸取血液，分泌的黏液同時侵蝕裝甲縫隙！',
        durabilityDamage: { amount: 2 },
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '以倒刺吸附後分泌物重寫了皮膚表面的分子記憶，使兩者「認為」彼此是同一個體。黏液的腐蝕功能原是用來消融獵物，對裝甲同樣有效。',
  },

  bone_crawler: {
    id: 'bone_crawler', name: '死骸拼合蟲', tier: 'A', monsterType: '控制',
    HP: 70, ATK: 9, AGI: 4, DR: 8, evadeRate: 5,
    skills: [],
    skillDefs: {
      toxic_claw: {
        name: '毒爪撕裂', cd: 2, initialCd: 2, ampPercent: 40, hitRate: 70,
        log: '死骸拼合蟲以沾滿神經毒素的利爪撕裂，傷口傳來麻痺感，意志力隨毒素流失...',
        desDrain: 8,
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '自行從骨骸殘骸中組裝的個體，沒有原始形態。爪間的神經毒素是從死骸殘留的神經組織中萃取，傳遞的是死者最後的恐懼。',
  },

  wind_specter: {
    id: 'wind_specter', name: '氣流相位體', tier: 'A', monsterType: '敏捷',
    HP: 52, ATK: 12, AGI: 10, DR: 0, evadeRate: 25,
    skills: [],
    skillDefs: {
      wind_blade: {
        name: '裂空刃', cd: 2, initialCd: 1, ampPercent: 55, hitRate: 88,
        log: '氣流相位體凝聚氣流化為無形刃，以令人難以置信的速度切割，幾乎無法格擋！',
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '存在於空氣振動頻率的邊緣。「速度快」是誤解——它只在攻擊的那一瞬間進入可見相位。維持實體形態對它而言需要極大的「意志消耗」，防禦因此薄弱。',
  },

  ash_bat: {
    id: 'ash_bat', name: '煤靈騷翼獸', tier: 'A', monsterType: '敏捷',
    HP: 50, ATK: 11, AGI: 10, DR: 0, evadeRate: 22,
    skills: [],
    skillDefs: {
      ash_flurry: {
        name: '灰燼亂舞', cd: 2, initialCd: 1, ampPercent: 30, hitRate: 85,
        log: '煤靈騷翼獸揚起漫天灰燼遮蔽視線，同時以利翼連續切割——看不清攻擊方向！',
        desDrain: 5,
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '翼膜由凝固的燃燒殘留物構成，揮動時散開的灰燼具有視覺干擾性。所謂「灰燼亂舞」並非特技，而是它的正常呼吸方式。',
  },

  crystal_spider: {
    id: 'crystal_spider', name: '假晶蛛形體', tier: 'A', monsterType: '敏捷',
    HP: 58, ATK: 12, AGI: 8, DR: 3, evadeRate: 15,
    skills: [],
    skillDefs: {
      venom_web: {
        name: '毒蛛絲網', cd: 3, initialCd: 2, ampPercent: 0, hitRate: 75,
        log: '假晶蛛形體噴射含有強烈毒素的蛛絲，腐蝕裝甲的同時麻痺神經，令心神渙散...',
        durabilityDamage: { amount: 3 },
        desDrain: 10,
      },
    },
    loot: { tierPool: 1, guaranteed: false },
    description: '以生長中的晶石結構模擬自然礦石，偽裝精確度幾乎無法區分真假。蛛絲帶有破壞晶格結構的物質——對裝甲的金屬晶格有效，對神經網絡的電信號同樣有效。',
  },

  // ── Tier B 中期魔物（第 3–6 章）────────────────────────────

  rift_knight: {
    id: 'rift_knight',
    name: '縫隙誓衛者',
    tier: 'B',
    HP: 140,
    ATK: 18,
    AGI: 6,
    DR: 20,
    evadeRate: 5,
    skills: [],
    skillDefs: {
      lance_seal: {
        name: '封印之槍',
        cd: 4,
        initialCd: 2,
        ampPercent: 30,
        hitRate: 72,
        log: '縫隙誓衛者以封印之槍貫穿目標，時間流在槍尖凝固——無法行動！',
        applyHeroineStatus: { type: 'seal', duration: 2, value: 0 },
      },
    },
    loot: { tierPool: 2, guaranteed: false },
    description: '無法確認是否曾為人類的武裝存在，持有的封印之槍設計目的不是殺傷，而是「固定存在」——令目標無法繼續移動於時間流中。命令的來源已無從追溯。',
  },

  plague_wraith: {
    id: 'plague_wraith',
    name: '黑疫漂流形',
    tier: 'B',
    HP: 100,
    ATK: 14,
    AGI: 10,
    DR: 8,
    evadeRate: 20,
    skills: [],
    skillDefs: {
      plague_touch: {
        name: '黑疫觸碰',
        cd: 4,
        initialCd: 3,
        ampPercent: 0,
        hitRate: 70,
        log: '黑疫漂流形傳遞死亡記憶的觸碰——毒素從心靈深處蔓延！',
        applyHeroineStatus: { type: 'poison', duration: 3, value: 0.08 },
      },
    },
    loot: { tierPool: 2, guaranteed: false },
    description: '不是個體，而是某次大規模死亡事件的「集體記憶」凝結。每次觸碰都是在傳遞那次死亡的感受——接觸者的夢境會開始出現那次死亡的片段。',
  },

  // ── Tier B 擴充魔物（四類型）──────────────────────────────────

  iron_colossus: {
    id: 'iron_colossus', name: '鑄鐵古代機', tier: 'B', monsterType: '物理',
    HP: 160, ATK: 22, AGI: 2, DR: 30, evadeRate: 0,
    skills: [],
    skillDefs: {
      earth_shatter: {
        name: '裂地鐵拳', cd: 3, initialCd: 2, ampPercent: 100, hitRate: 68,
        log: '鑄鐵古代機舉起巨拳砸向地面，衝擊波從地底湧出，撕裂一切阻擋物！',
      },
    },
    loot: { tierPool: 2, guaranteed: true },
    description: '前文明時代的戰爭機械被遺棄在裂隙中後，裂隙能量滲入其金屬組織，鐵開始「思考」。思考的結果是：持續戰鬥，直到找到下達停止命令的主人。',
  },

  blood_wolf: {
    id: 'blood_wolf', name: '血跡嗅獵王', tier: 'B', monsterType: '物理',
    HP: 145, ATK: 20, AGI: 7, DR: 15, evadeRate: 10,
    skills: [],
    skillDefs: {
      predator_bite: {
        name: '獵殺撕咬', cd: 2, initialCd: 1, ampPercent: 70, hitRate: 82,
        log: '血跡嗅獵王發出低沉嚎叫，以獵食者的本能精準鎖定要害，猛力咬下！',
      },
    },
    loot: { tierPool: 2, guaranteed: false },
    description: '通過感知血液中的恐懼素精準鎖定目標弱點。「愈戰愈勇」的原因是：戰鬥中接收到愈來愈多的恐懼素，而恐懼素是它最有效的興奮劑。',
  },

  venom_witch: {
    id: 'venom_witch', name: '污誦術形', tier: 'B', monsterType: '精神',
    HP: 105, ATK: 14, AGI: 8, DR: 8, evadeRate: 18,
    skills: [],
    skillDefs: {
      curse_brew: {
        name: '蠱毒詛咒', cd: 3, initialCd: 2, ampPercent: 10, hitRate: 75,
        log: '污誦術形吟唱邪咒，裝甲表面湧現腐蝕斑點，心靈同步傳來難以抗拒的崩潰感...',
        durabilityDamage: { amount: 8 },
        desDrain: 15,
      },
    },
    loot: { tierPool: 2, guaranteed: false },
    description: '吟誦的「邪咒」是裂隙能量的頻率調製，能定點溶解物質的分子鍵結。裝甲的腐蝕斑點是鍵結被選擇性切斷的結果；心靈同步崩潰，是因為人類神經系統恰好在同一頻率範圍內運作。',
  },

  chaos_hydra: {
    id: 'chaos_hydra', name: '九意識裂頭蛇', tier: 'B', monsterType: '控制',
    HP: 140, ATK: 17, AGI: 5, DR: 18, evadeRate: 8,
    skills: [],
    skillDefs: {
      nine_fang: {
        name: '九頭並噬', cd: 3, initialCd: 2, ampPercent: 50, hitRate: 76,
        log: '九意識裂頭蛇九口齊噬，在防具各處留下毒牙啃咬的痕跡，毒素從縫隙滲入...',
        durabilityDamage: { amount: 5 },
      },
    },
    loot: { tierPool: 2, guaranteed: true },
    description: '九個完全獨立的意識共享一具身體，從不協調——每個頭都有自己的判斷，攻擊時方向完全不可預測，因為連它自己都不知道下一個頭打算做什麼。',
  },

  curse_mage: {
    id: 'curse_mage', name: '古語詛刻者', tier: 'B', monsterType: '控制',
    HP: 110, ATK: 14, AGI: 6, DR: 15, evadeRate: 10,
    skills: [],
    skillDefs: {
      soul_shackle: {
        name: '靈魂枷鎖', cd: 3, initialCd: 2, ampPercent: 25, hitRate: 72,
        log: '古語詛刻者以契約裂隙力量鑄造靈魂枷鎖，強制撕裂心靈防禦，慾望的枷鎖收緊！',
        desDrain: 18,
      },
    },
    loot: { tierPool: 2, guaranteed: false },
    description: '使用的詛咒語言早於任何已知文明，符文的形狀在視覺上製造輕微的認知不適——不是魔法效果，而是大腦試圖識別無法識別的符號時產生的生理反應。',
  },

  shadow_reaper: {
    id: 'shadow_reaper', name: '虛空割徑者', tier: 'B', monsterType: '敏捷',
    HP: 115, ATK: 22, AGI: 14, DR: 8, evadeRate: 28,
    skills: [],
    skillDefs: {
      soul_harvest: {
        name: '魂魄收割', cd: 2, initialCd: 1, ampPercent: 75, hitRate: 92,
        log: '虛空割徑者的鐮刀劃過虛空，以幾乎無法察覺的軌跡準確斬向要害——無從迴避！',
      },
    },
    loot: { tierPool: 2, guaranteed: false },
    description: '鐮刀劃過的不是空間，而是目標「下一個時刻存在於此處」的可能性。被切的不是當前位置，而是未來位置——因此幾乎無從迴避。',
  },

  // ── Tier C 後期魔物（第 7–10 章）───────────────────────────

  abyss_overlord: {
    id: 'abyss_overlord',
    name: '淵底主宰者',
    tier: 'C',
    HP: 280,
    ATK: 28,
    AGI: 8,
    DR: 25,
    evadeRate: 10,
    skills: [],
    skillDefs: {
      abyss_seal: {
        name: '時序禁錮',
        cd: 4,
        initialCd: 2,
        priority: 1,
        ampPercent: 0,
        hitRate: 78,
        log: '淵底主宰者以壓倒性的存在層級強制封印時間流，令一切抵抗陷入靜止！',
        applyHeroineStatus: { type: 'seal', duration: 2, value: 0 },
      },
      abyss_plague: {
        name: '淵底瘟疫',
        cd: 3,
        initialCd: 4,
        priority: 2,
        ampPercent: 0,
        hitRate: 75,
        log: '淵底主宰者釋放存在腐蝕，從存在的根源開始溶解……',
        applyHeroineStatus: { type: 'poison', duration: 4, value: 0.1 },
      },
    },
    loot: { tierPool: 3, guaranteed: true },
    description: '不是誕生自裂隙，而是裂隙為了它的存在而形成的。靠近它的人，本能的第一反應永遠是跪下——那是人類大腦在感知到「比自身存在層級更高的存在」時觸發的本能性系統崩潰。',
  },
  // ── Tier C 擴充魔物（四類型）──────────────────────────────────

  rift_emperor: {
    id: 'rift_emperor', name: '空間折疊帝', tier: 'C', monsterType: '物理',
    HP: 310, ATK: 34, AGI: 6, DR: 38, evadeRate: 5,
    skills: [],
    skillDefs: {
      rift_domain: {
        name: '裂隙帝域', cd: 4, initialCd: 2, ampPercent: 110, hitRate: 80,
        log: '空間折疊帝展開帝域，在場所有存在都受到空間壓力碾壓，裝甲在絕對威壓下變形！',
        durabilityDamage: { amount: 12 },
      },
    },
    loot: { tierPool: 3, guaranteed: true },
    description: '統治的不是領土，而是一定範圍內的空間法則。在其帝域內，所有物理定律受它的意志調整，包括材料的強度上限。裝甲在帝域內變形，是因為帝域重新定義了該材料「能夠承受的壓力」的上限值。',
  },

  soul_devourer: {
    id: 'soul_devourer', name: '靈質吞食者', tier: 'C', monsterType: '精神',
    HP: 220, ATK: 28, AGI: 12, DR: 20, evadeRate: 18,
    skills: [],
    skillDefs: {
      soul_drain: {
        name: '噬魂吞食', cd: 3, initialCd: 2, ampPercent: 0, hitRate: 82,
        log: '靈質吞食者伸出無形觸手，將靈魂與契約意志一同吞噬，裝備在虛空侵蝕中化為虛無...',
        durabilityDamage: { amount: 15 },
        desDrain: 20,
      },
    },
    loot: { tierPool: 3, guaranteed: true },
    description: '以消化「存在的連續性」維生——不是靈魂，而是「這個人在時間流中保持同一個人」的連貫性。接觸者不會立即死亡，而是開始忘記自己是誰。',
  },

  eternal_lich: {
    id: 'eternal_lich', name: '萬古不滅詛主', tier: 'C', monsterType: '控制',
    HP: 270, ATK: 30, AGI: 8, DR: 25, evadeRate: 10,
    skills: [],
    skillDefs: {
      eternal_curse: {
        name: '萬古詛滅', cd: 4, initialCd: 3, ampPercent: 30, hitRate: 78,
        log: '萬古不滅詛主揮動法杖，千年詛咒凝聚成形，裝備表面龜裂的同時靈魂深處傳來腐朽之感！',
        durabilityDamage: { amount: 10 },
        desDrain: 18,
      },
    },
    loot: { tierPool: 3, guaranteed: true },
    description: '存在的時間長到已超越「死亡」的定義範疇，嚴格來說並非「死靈」，而是「超越了死生分界的存在」。揮杖時洩漏的是它無意間承受的歲月壓力——一瞬間承受萬年的時間重量。',
  },

  void_dragon: {
    id: 'void_dragon', name: '深宇龍型存在', tier: 'C', monsterType: '敏捷',
    HP: 280, ATK: 38, AGI: 15, DR: 22, evadeRate: 22,
    skills: [],
    skillDefs: {
      void_breath: {
        name: '虛空龍息', cd: 3, initialCd: 2, ampPercent: 90, hitRate: 90,
        log: '深宇龍型存在噴出扭曲時空的龍息，物理衝擊與心靈崩潰同時爆發，令人無法思考！',
        desDrain: 18,
      },
    },
    loot: { tierPool: 3, guaranteed: true },
    description: '在宇宙尺度的虛空中活動的龍類，出現在此處純屬降級——它偶爾對局部空間產生興趣。振翅時裂開空間，是因為翅膀結構是為了在真空中產生推進力，在有大氣的環境中使用會對周遭空間造成副作用。',
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
