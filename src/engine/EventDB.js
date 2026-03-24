/**
 * EventDB.js
 * 探索事件類型資料庫
 *
 * 定義所有事件類型及子類型的：
 *   - 進行流程（flow）
 *   - 選項列表（options）
 *   - 獎懲效果（rewards / penalties）
 *   - 特殊規則（special）
 *
 * 實際執行邏輯由 ExplorationSystem.js 呼叫本庫查詢後執行。
 */

// ────────────────────────────────────────
// 遭遇戰
// ────────────────────────────────────────

export const ENCOUNTER_COMBAT = {
  typeId: 'encounter_combat',
  name: '異形接觸戰',
  flow: 'combat',                   // 直接觸發 COMBAT phase
  preNarrativeAI: true,             // 使用 AI 生成地點差異化的遭遇旁白
  rewards: {
    skillDrop: true,                // SkillRewardSystem 處理（戰鬥結束後）
    equipmentDrop: {
      chance: 0.30,                 // 30% 機率掉落裝備
      tierByLayer: true,            // 裝備品質依所在層決定
    },
    statBoost: {
      // 固定隨機數值加成（每場勝利）
      pool: ['ATK', 'MaxHP', 'MaxSP', 'AGI', 'WIL'],
      count: 2,                     // 隨機抽 2 個數值
      range: { min: 1, max: 3 },    // 各數值加成範圍（依層數 ×1.5~×3 縮放）
    },
  },
  penalties: {
    note: '依戰鬥結果結算，無固定懲罰（HP/SP/裝備耐久變化由 CombatEngine 決定）',
  },
  special: {
    noSummonBonus: { independence: 2 }, // 全程未召喚且勝利 → independence +2
  },
}

// ────────────────────────────────────────
// 調查事件
// ────────────────────────────────────────

export const INVESTIGATION = {
  typeId: 'investigation',
  name: '遺構解讀事件',
  flow: 'local',                    // 由 WorldMapScreen 本地管理多層子流程

  // ── 仔細搜查 ──────────────────────────────────────────────
  thorough: {
    dc: 35,                         // D100 + insight 加成 ≤ dc 視為成功（較易）
    trapChance: 0.1,               // 深入調查各子物件時觸發陷阱機率
    itemDiscoveryChance: 0.50,      // 調查成功後觸發物品發現機率
    deepDiveCount: 3,               // 生成 3 個可調查子物件
  },

  // ── 快速掃視 ──────────────────────────────────────────────
  quick: {
    dc: 60,                         // 較難（成功率低於仔細搜查）
    itemDiscoveryChance: 0.20,      // 成功後物品發現機率
  },

  // ── 共通骰點加成 ──────────────────────────────────────────
  diceBonus: {
    insight: { per: 10, bonus: 5 }, // 每 10 insight → 骰點 +5
  },

  // ── Per-location AI 失效 fallback 文本 ─────────────────────
  // 鍵名 = LocationDB typeId（僅含有 investigationHint 的地點）
  fallbackTexts: {
    town_market: {
      thorough_intro: '妳在廢棄集市的攤位間穿行，翻找著可能殘留的有用物資與帳簿。',
      thorough_objects: ['被翻倒的香料罐堆', '碎裂的玻璃展示箱', '攤位後的帆布包'],
      deep_success: '仔細翻找後，妳在遺棄物中發現了一些有用的東西。',
      deep_failure: '這裡早已被人翻過，所剩無幾。',
      quick_success: '快速掃視後，眼角瞥見幾個值得注意的遺留物。',
      quick_failure: '集市裡空空如也，什麼都沒有。',
    },
    town_shelter: {
      thorough_intro: '避難所角落堆著殘破的行囊，牆上塗鴉或許藏著比物資更有價值的線索。',
      thorough_objects: ['牆角半埋的行李箱', '潦草的逃難路線塗鴉', '地板磚縫中的折疊紙條'],
      deep_success: '塗鴉的內容指向了一條重要的情報——有人刻意留下了這條路線。',
      deep_failure: '字跡過於潦草，無法從中解讀任何有用的訊息。',
      quick_success: '快速繞行一圈，看見幾份倖存者遺留的物品。',
      quick_failure: '翻了一圈，只有廢棄的個人物品，什麼情報都沒有。',
    },
    town_outskirts: {
      thorough_intro: '妳蹲下身，仔細觀察地面上交錯的腳印和翻倒的路牌。裂隙的熱氣讓空氣微微扭曲。',
      thorough_objects: ['路邊傾倒的路牌底座', '地面燒灼後的結晶痕跡', '草叢邊的廢棄背包'],
      deep_success: '仔細檢視後，妳從痕跡的方向確認了裂隙最近一次的擴張路徑。',
      deep_failure: '這裡的線索已被破壞，看不出什麼端倪。',
      quick_success: '快速掃視下，隱約看到幾個值得注意的異常點。',
      quick_failure: '這一帶似乎什麼都沒有。',
    },
    outskirts_ruins: {
      thorough_intro: '廢棄建築群的金屬味讓人不適，但牆上殘留的標記讓妳停下腳步。',
      thorough_objects: ['牆上的潦草標記', '倒塌樑柱底下的空隙', '鏽蝕窗框旁的碎片堆'],
      deep_success: '標記是逃難者留下的——裡面藏有有用的情報與路線提示。',
      deep_failure: '字跡早已模糊，已無從辨識任何有意義的內容。',
      quick_success: '快速繞行一圈，確認了幾個需要注意的區域。',
      quick_failure: '什麼都沒找到，廢墟裡只有風聲。',
    },
    outskirts_watchtower: {
      thorough_intro: '瞭望台的記錄儀器雖然損毀，但資料碎片或許還保存著。妳開始拼湊殘存的讀數。',
      thorough_objects: ['破損的觀測儀器', '台頂散落的記錄簿殘頁', '旗桿旁的訊號發射器殘骸'],
      deep_success: '觀測資料顯示裂隙正在以可預測的規律擴張——這意味著下一個節點可以預測。',
      deep_failure: '資料已被能量波動完全清除，無法提取任何有效讀數。',
      quick_success: '瀏覽了一遍，確認裂隙方向近期沒有明顯異動。',
      quick_failure: '角度不對，加上儀器損毀，什麼都看不清楚。',
    },
    rift_boundary: {
      thorough_intro: '邊界處空間微妙地折疊著，妳感覺腳下的地面在回應妳的注視。能量讀數在這裡跳動得很不規律。',
      thorough_objects: ['能量波動最密集的地面節點', '凝固的黑色地面裂縫邊緣', '空間折疊最明顯的視覺扭曲點'],
      deep_success: '能量讀數出現規律性波動——裂隙有一個可以利用的節律，妳記下了它。',
      deep_failure: '靠近後感到頭暈，強烈的感知干擾讓妳不得不後退。',
      quick_success: '掃視後快速記下幾個能量節點的相對位置。',
      quick_failure: '周遭干擾太強，無法得到任何有效的能量讀數。',
    },
    rift_ruins: {
      thorough_intro: '石塊上的封印紋路仍在微微發光，像是等待著被人讀懂。妳靠近，試圖解讀它的語法。',
      thorough_objects: ['中央祭台上的核心碑文', '側牆刻有輔助符文的石板', '地面陣列圖形的起始節點'],
      deep_success: '碑文記載著封印的核心設計意圖——這改變了妳對裂隙運作方式的既有認知。',
      deep_failure: '古老的語言已超出妳目前的理解範圍。',
      quick_success: '大致掃過，辨認出幾個熟悉的封印符號。',
      quick_failure: '走過一圈，符文對妳而言仍是難以解讀的謎。',
    },
    rift_gate: {
      thorough_intro: '封印崩潰處的能量洩漏散發著奇異的吸引力，妳靠近，開始研究洩漏的規律。',
      thorough_objects: ['能量洩漏的核心破口', '燒焦環形痕跡的邊緣結構', '異常鮮豔的再生植被根部'],
      deep_success: '能量洩漏的模式顯示：封印是從內部被有意破壞的——並非自然崩潰。',
      deep_failure: '能量波動令妳無法持續集中精神進行分析。',
      quick_success: '快速確認洩漏規模，判斷此刻暫無立即性危險。',
      quick_failure: '太接近了，妳感到一陣暈眩，不得不退後。',
    },
    deep_interior: {
      thorough_intro: '流動的深藍紋路像是裂隙的血脈，妳試圖找出其中的流向規律——它們並非隨機移動。',
      thorough_objects: ['能量流動最密集的交匯節點', '重力方向反轉的懸浮區域邊緣', '深藍紋路的發源起點'],
      deep_success: '流向存在結構——妳看見了裂隙內部空間的組織方式，並找到了一個相對穩定的移動路徑。',
      deep_failure: '感知在這裡開始失效，所見皆為干擾，妳只能放棄。',
      quick_success: '快速辨識出幾個相對穩定的結構節點。',
      quick_failure: '一切都在流動，什麼都無法捕捉到任何規律。',
    },
    deep_shrine: {
      thorough_intro: '祭壇表面的侵蝕紋路訴說著某種失傳的儀式，妳開始逐段解讀它們殘存的意義。',
      thorough_objects: ['祭壇中心的主符文陣', '側面的獻祭容器痕跡', '地面殘存的陣列圖形'],
      deep_success: '儀式的目的是「強化封印」——而不是召喚或獻祭。這徹底推翻了妳的既有假設。',
      deep_failure: '腐化的能量干擾了妳的感知，無法完整解讀紋路的意圖。',
      quick_success: '快速瀏覽後，認出這是某種古代封印儀式的核心場所。',
      quick_failure: '時間太短，腐化的紋路無法在短時間內提取任何資訊。',
    },
    demon_territory: {
      thorough_intro: '異界領域的法則讓妳的感知以不同的方式運作。妳嘗試放下人類直覺，用另一種邏輯感受這個空間。',
      thorough_objects: ['幾何結構超自然扭曲的建築核心', '光影方向完全倒置的異常區域', '共鳴最強的虛空振動節點'],
      deep_success: '妳找到了這片領域的一個「弱點」——人類的直覺在此反而比邏輯更可靠。',
      deep_failure: '異界法則完全混淆了妳的判斷，妳找不到任何可依循的規律。',
      quick_success: '快速確認了幾個可以利用的結構規律。',
      quick_failure: '異界邏輯讓妳無法以正常方式進行分析。',
    },
    core_threshold: {
      thorough_intro: '源點的能量匯聚在此，靜得讓人不安。妳感覺得到它在「看著」妳，就如同妳在看著它一樣。',
      thorough_objects: ['能量匯聚的核心焦點', '通往更深處的光柱邊緣結構', '源點邊界的封印紋路殘留'],
      deep_success: '妳感覺到：這個地方不是裂隙的起源，而是它的入口——真正的起源在更深的地方。',
      deep_failure: '源點的存在壓倒了妳的感知，妳被迫退後，無法再靠近。',
      quick_success: '快速掃視後，確認了此地的能量結構目前是相對穩定的。',
      quick_failure: '這裡的能量密度讓妳無法集中，只能匆匆離開。',
    },
  },
}

// ────────────────────────────────────────
// 危機救援（依地點分類為子類型）
// ────────────────────────────────────────

export const CRISIS_RESCUE_SUBTYPES = {
  // 共通：不介入
  noIntervention: {
    rewards: { independence: 1 },
    demonReaction: {
      // 召喚惡魔在場時，各惡魔依個性調整 heroine_axis
      demon_a: { heroine_axis: +2, note: '瑠夜：隱性認可，認為這是明智之舉' },
      demon_b: { heroine_axis: -3, note: '颯牙：明顯不滿，認為這是懦弱的行為' },
      demon_c: { heroine_axis: 0, note: '玄冥：無反應' },
    },
  },

  'rescue.town_outskirts': {
    typeId: 'rescue.town_outskirts',
    name: '認知邊界區危機',
    scenario: '被魔物追逐的逃難者',
    interventionFlow: 'force_combat',
    successRewards: { heart: 3, flags: ['npc_favor_town'] },
    failurePenalties: { npc_fail: true, DES: 10 },
  },

  'rescue.outskirts_ruins': {
    typeId: 'rescue.outskirts_ruins',
    name: '侵蝕建築群危機',
    scenario: '被廢墟結構困住的探索者',
    interventionFlow: 'dice',
    diceStats: ['WIL', 'AGI'],     // 合力判定（取平均）
    successRewards: { heart: 2, chainEvent: 'item_discovery' },
    failurePenalties: { HP: -0.10, durability: -2 },
  },

  'rescue.outskirts_field': {
    typeId: 'rescue.outskirts_field',
    name: '染毒曠野危機',
    scenario: '野外魔物包圍的傷者',
    interventionFlow: 'force_combat',
    successRewards: { heart: 3, flags: ['npc_favor_outskirts'] },
    failurePenalties: { npc_fail: true, DES: 10 },
  },

  'rescue.outskirts_watchtower': {
    typeId: 'rescue.outskirts_watchtower',
    name: '半毀觀測台危機',
    scenario: '困在搖搖欲墜台頂的哨兵',
    interventionFlow: 'dice',
    diceStats: ['AGI'],
    successRewards: { heart: 2, independence: 1 },
    failurePenalties: { chainEvent: 'encounter_combat', note: '落下引發魔物注意' },
  },

  'rescue.outskirts_road': {
    typeId: 'rescue.outskirts_road',
    name: '解構幹道危機',
    scenario: '路上遭魔物攻擊的旅人',
    interventionFlow: 'force_combat',
    successRewards: { heart: 3, possibleTrade: true },
    failurePenalties: { npc_fail: true },
  },

  'rescue.rift_nest': {
    typeId: 'rescue.rift_nest',
    name: '型態聚集地危機',
    scenario: '被魔物巢穴困住的倖存者',
    interventionFlow: 'force_combat',
    combatModifier: { enemyCountBonus: 1 }, // 敵方數量 +1
    successRewards: { heart: 3, chainEvent: 'item_discovery' },
    failurePenalties: { npc_fail: true, DES: 15 },
  },

  'rescue.rift_ruins': {
    typeId: 'rescue.rift_ruins',
    name: '封印遺跡危機',
    scenario: '觸發古代機關被困的人',
    interventionFlow: 'dice',
    diceStats: ['insight'],
    successRewards: { heart: 2, chainEvent: 'investigation' },
    failurePenalties: { chainTrap: 'trap.seal', targetsAll: true },
  },

  'rescue.deep_vortex': {
    typeId: 'rescue.deep_vortex',
    name: '旋核吞噬危機',
    scenario: '被能量漩渦半吞噬的契約者',
    interventionFlow: 'dice_or_summon',
    diceStats: ['WIL'],
    summonOption: {
      available: true,
      successGuaranteed: true,     // 惡魔協助必定成功
      cost: { DES: 10 },
    },
    successRewards: { heart: 3, insight: 2 },
    failurePenalties: { DES: 20 },
  },

  'rescue.core_threshold': {
    typeId: 'rescue.core_threshold',
    name: '源點閾口失志危機',
    scenario: '已半失去意志的契約者（抉擇）',
    interventionFlow: 'three_choice',
    options: [
      {
        id: 'force_pull',
        label: '強制拉回（高難度）',
        flow: 'dice',
        diceStats: ['WIL'],
        diceDC: 80,               // 高門檻
        successRewards: { heart: 5, independence: 3 },
        failurePenalties: { DES: 25, HP: -0.15 },
      },
      {
        id: 'let_choose',
        label: '讓對方自己選擇',
        flow: 'choice',
        note: '觸發被救者的選擇型對話，結果由對方決定',
      },
      {
        id: 'abandon',
        label: '放棄介入',
        note: '視同不介入，觸發 noIntervention 效果',
      },
    ],
  },
}

// ────────────────────────────────────────
// 裂隙異變（子類型）
// ────────────────────────────────────────

export const RIFT_ANOMALY_SUBTYPES = {
  // 每個子類型的 options 均包含：①特定應對 ②另一種應對 ③撤退
  // 撤退：離開當前地點，無獎勵無懲罰

  'anomaly.spatial': {
    typeId: 'anomaly.spatial',
    name: '法則折疊異變',
    description: '局部空間的座標系在外力干涉下產生折疊，方向感完全依賴的重力參考系失效。',
    options: [
      {
        id: 'summon_guide',
        label: '召喚惡魔協助定向',
        requiresSummon: true,
        rewards: { DES: +5 },
        demonBonus: { demon_axis: +3 },
      },
      {
        id: 'solo_instinct',
        label: '獨自靠直覺前進',
        flow: 'dice',
        diceStats: ['WIL'],
        successRewards: { independence: +3 },
        failurePenalties: { DES: +12, HP: -0.05 },
      },
      { id: 'retreat', label: '撤退' },
    ],
  },

  'anomaly.surge': {
    typeId: 'anomaly.surge',
    name: '淵能浪湧衝擊',
    description: '裂隙能量因某個未知觸發以波形大量釋放，精神首當其衝。',
    options: [
      {
        id: 'resist',
        label: '抵抗衝擊',
        flow: 'dice',
        diceStats: ['WIL'],
        successRewards: { DES: +5 },
        failurePenalties: { DES: +20 },
      },
      {
        id: 'flow_with',
        label: '順流而下',
        rewards: { DES: +10, insight: +3 },
      },
      { id: 'retreat', label: '撤退' },
    ],
  },

  'anomaly.swarm': {
    typeId: 'anomaly.swarm',
    name: '型態群湧異變',
    description: '裂隙能量的特定波動觸發了大量深淵生物的集體行動，數量超出正常遭遇範疇。',
    options: [
      {
        id: 'fight',
        label: '迎戰',
        chainEvent: 'encounter_combat',
        combatModifier: { enemyCountBonus: 1 },
      },
      {
        id: 'summon_suppress',
        label: '召喚惡魔壓制',
        requiresSummon: true,
        avoidCombat: true,
        rewards: { DES: +8 },
        demonBonus: { demon_axis: +5 },
      },
      { id: 'retreat', label: '撤退' },
    ],
  },

  'anomaly.vision': {
    typeId: 'anomaly.vision',
    name: '認知侵入幻蝕',
    description: '裂隙投射具有個人化特性的幻覺，精確對應觀察者的深層渴望或恐懼——裂隙在某個程度上能夠「閱讀」接觸者。',
    options: [
      {
        id: 'resist_vision',
        label: '對抗幻覺',
        flow: 'dice',
        diceStats: ['insight'],
        successRewards: { insight: +3 },
        failurePenalties: { heroine_axis: -5, target: 'highest_affection' },
      },
      {
        id: 'indulge',
        label: '沉溺幻覺',
        rewards: { DES: +15, lust: +5, target: 'highest_demon_axis' },
      },
      { id: 'retreat', label: '撤退' },
    ],
  },

  'anomaly.seal': {
    typeId: 'anomaly.seal',
    name: '古封崩解異變',
    description: '前文明時代的封印在裂隙能量的侵蝕下到達崩解臨界，封存物質開始溢出。',
    options: [
      {
        id: 'research',
        label: '研究封印',
        chainEvent: 'investigation',
      },
      {
        id: 'reinforce',
        label: '嘗試強化封印',
        flow: 'dice',
        diceStats: ['WIL'],
        successRewards: { flags: ['seal_reinforced'] },
        failurePenalties: { DES: +8, HP: -0.10 },
      },
      { id: 'retreat', label: '撤退' },
    ],
  },
}

// ────────────────────────────────────────
// 陷阱（子類型）
// ────────────────────────────────────────

export const TRAP_SUBTYPES = {
  'trap.physical': {
    typeId: 'trap.physical',
    name: '機械遺留陷阱',
    description: '前文明或深掘者前人設置的機械式防護，目的是阻止未授權者進入。召喚的深淵存在能在接近前察覺機械陷阱發出的特定振動頻率。',
    avoidDice: { stats: ['AGI'] },
    avoidOptions: [
      { id: 'dodge_agi', label: '閃避（身體本能）', stat: 'AGI', statLabel: '敏捷', dcAvoid: 70, dcHalf: 40 },
    ],
    fullTrigger: { HP: -0.20, durability: -10 },
    halfTrigger: { HP: -0.10, durability: -2 },
    demonDetect: { warmedUpMin: 1, diceBonus: 10, demonNote: '召喚惡魔可能提前察覺' },
  },

  'trap.magical': {
    typeId: 'trap.magical',
    name: '靈紋封鎖陷阱',
    description: '以符文或魔法陣構成的能量封鎖，觸發後選擇性阻斷靈力流通路徑。意志堅定者更清楚自己的靈力邊界，封鎖較難找到可入侵的缺口。',
    avoidDice: { stats: ['WIL'] },
    avoidOptions: [
      { id: 'resist_wil',    label: '意志抵抗（抵禦魔力）', stat: 'WIL',    statLabel: '意志',  dcAvoid: 70, dcHalf: 40 },
      { id: 'sense_insight', label: '感知識別（看穿符文）', stat: 'insight', statLabel: '洞察力', dcAvoid: 72, dcHalf: 42 },
    ],
    fullTrigger: { SP: -0.30, nextCombatDiceDebuff: -10 },
    halfTrigger: { SP: -0.15 },
    demonDetect: { warmedUpMin: 1, diceBonus: 10 },
  },

  'trap.mental': {
    typeId: 'trap.mental',
    name: '渴望植入精神阱',
    description: '針對人類神經系統中的「依賴機制」設計的幻象裝置，令接觸者對選定對象產生非理性的渴望和依賴感。Insight用於抵抗，辨別「這是植入的」而非「這是自己的」。',
    avoidDice: { stats: ['insight'] },
    avoidOptions: [
      { id: 'see_through',      label: '洞察破除（識破幻象）', stat: 'insight', statLabel: '洞察力', dcAvoid: 65, dcHalf: 35 },
      { id: 'willpower_resist', label: '意志對抗（壓制詛咒）', stat: 'WIL',    statLabel: '意志',  dcAvoid: 70, dcHalf: 40 },
    ],
    fullTrigger: { DES: +20, heroine_axis: +5, target: 'highest_affection_demon' },
    halfTrigger: { DES: +10 },
    demonDetect: { warmedUpMin: 2, diceBonus: 10 },
  },

  'trap.ambush': {
    typeId: 'trap.ambush',
    name: '型態預伏陷阱',
    description: '深淵型態生物預先選定的伏擊位置。察覺到伏擊的方式，往往不是看到，而是先感覺到不對。',
    avoidDice: { stats: ['AGI'], note: '先制判定' },
    fullTrigger: { chainEvent: 'encounter_combat', enemyFirstStrike: true },
    halfTrigger: { chainEvent: 'encounter_combat', enemyFirstStrike: false },
    demonDetect: { warmedUpMin: 1, diceBonus: 10 },
  },

  'trap.seal': {
    typeId: 'trap.seal',
    name: '古代誤觸封印',
    description: '前文明封印設施的警報系統，它封鎖的往往是接觸者當下最依賴的那一項，如同古代設計師仍在觀察並作出判斷。',
    avoidDice: { stats: ['WIL'] },
    avoidOptions: [
      { id: 'resist_wil',    label: '抵禦封印（意志對抗）',   stat: 'WIL', statLabel: '意志',  dcAvoid: 65, dcHalf: 35 },
      { id: 'avoid_trigger', label: '繞過觸發點（靈活迴避）', stat: 'AGI', statLabel: '敏捷',  dcAvoid: 72, dcHalf: 45 },
    ],
    fullTrigger: {
      sealEffect: {
        randomStat: ['ATK', 'AGI', 'WIL', 'DES'],
        valueRange: { min: 3, max: 8 },  // 隨機減少值
        duration: 'current_sublayer',
        note: '封印能力類型及數值隨機，持續本子層',
      },
    },
    halfTrigger: {
      sealEffect: {
        randomStat: ['ATK', 'AGI', 'WIL', 'DES'],
        valueRange: { min: 1, max: 4 },  // 效果減半
        duration: 'current_sublayer',
      },
    },
    demonDetect: { warmedUpMin: 1, diceBonus: 10 },
  },
}

// ────────────────────────────────────────
// 休息/補給
// ────────────────────────────────────────

export const REST_RECOVERY = {
  typeId: 'rest_recovery',
  name: '負荷舒緩補給',
  flow: 'choice',
  limit: { perSubLayer: 1 },       // 每個子層最多休息 1 次
  options: [
    {
      id: 'solo_rest',
      label: '獨自休息',
      rewards: { HP: +0.20, SP: +0.20, DES: -10, independence: +1 },
    },
    {
      id: 'demon_a_rest',
      label: '請瑠夜陪伴休息',
      demonId: 'demon_a',
      rewards: { HP: +0.30, SP: +0.30, DES: -15, affection: +2, trust: +1 },
      hasShortDialogue: true,
    },
    {
      id: 'demon_b_rest',
      label: '請颯牙陪伴休息',
      demonId: 'demon_b',
      rewards: { HP: +0.30, SP: +0.30, DES: -15, affection: +2, trust: +1 },
      hasShortDialogue: true,
    },
    {
      id: 'demon_c_rest',
      label: '請玄冥陪伴休息',
      demonId: 'demon_c',
      rewards: { HP: +0.30, SP: +0.30, DES: -15, affection: +2, trust: +1 },
      hasShortDialogue: true,
    },
  ],
}

// ────────────────────────────────────────
// 物品發現
// ────────────────────────────────────────

export const ITEM_DISCOVERY = {
  typeId: 'item_discovery',
  name: '遺物發現',
  flow: 'auto',                     // 自動觸發，無選擇

  /**
   * 各層戰利品池（加權隨機）
   * source: 'itemDB' | 'accessoriesDB' | 'equipmentDB' | 'weaponDB'
   * locked 物品（demon 專屬）不列入
   */
  lootPoolByLayer: {
    // ── 第一層：主要消耗品 + Tier A 飾品 ──────────────────────
    1: [
      { source: 'itemDB', id: 'repair_kit_basic', weight: 30 },
      { source: 'itemDB', id: 'shroud_balm', weight: 15 },
      { source: 'itemDB', id: 'bait_bell', weight: 15 },
      { source: 'accessoriesDB', id: 'glass_beads', weight: 20 },
      { source: 'accessoriesDB', id: 'iron_amulet', weight: 20 },
      { source: 'accessoriesDB', id: 'feather_clip', weight: 15 },
      { source: 'accessoriesDB', id: 'focus_ring', weight: 15 },
      { source: 'accessoriesDB', id: 'spirit_bead', weight: 15 },
      { source: 'accessoriesDB', id: 'glow_badge', weight: 15 },
    ],
    // ── 第二層：消耗品 + Tier A-B 飾品 + Tier A 武器/防具 ──────
    2: [
      { source: 'itemDB', id: 'repair_kit_basic', weight: 20 },
      { source: 'itemDB', id: 'repair_kit_mid', weight: 15 },
      { source: 'itemDB', id: 'shroud_balm', weight: 10 },
      { source: 'accessoriesDB', id: 'glass_beads', weight: 10 },
      { source: 'accessoriesDB', id: 'glow_badge', weight: 10 },
      { source: 'accessoriesDB', id: 'spirit_bead', weight: 10 },
      { source: 'accessoriesDB', id: 'rift_bracer', weight: 12 },
      { source: 'accessoriesDB', id: 'abyss_monocle', weight: 8 },
      { source: 'weaponDB', id: 'moon_kunai', weight: 8 },
      { source: 'weaponDB', id: 'swift_dagger', weight: 8 },
      { source: 'weaponDB', id: 'thorn_whip', weight: 7 },
      { source: 'equipmentDB', id: 'leather_vest', weight: 8 },
      { source: 'equipmentDB', id: 'light_leg_guard', weight: 8 },
      { source: 'equipmentDB', id: 'cloth_robe', weight: 6 },
    ],
    // ── 第三層：修補材料 + Tier B 飾品/武器/防具 ───────────────
    3: [
      { source: 'itemDB', id: 'repair_kit_mid', weight: 20 },
      { source: 'itemDB', id: 'repair_kit_advanced', weight: 8 },
      { source: 'accessoriesDB', id: 'rift_bracer', weight: 15 },
      { source: 'accessoriesDB', id: 'moonlight_necklace', weight: 12 },
      { source: 'accessoriesDB', id: 'lucky_rabbit_foot', weight: 12 },
      { source: 'accessoriesDB', id: 'guardian_pendant', weight: 12 },
      { source: 'accessoriesDB', id: 'swift_anklet', weight: 12 },
      { source: 'weaponDB', id: 'rune_hammer', weight: 10 },
      { source: 'weaponDB', id: 'steel_blade', weight: 10 },
      { source: 'weaponDB', id: 'covenant_rod', weight: 10 },
      { source: 'equipmentDB', id: 'reinforced_leather_coat', weight: 8 },
      { source: 'equipmentDB', id: 'leather_legging', weight: 8 },
      { source: 'equipmentDB', id: 'cloth_skirt', weight: 7 },
    ],
    // ── 第四層：高階修補 + Tier B-C 飾品/武器/防具 ─────────────
    4: [
      { source: 'itemDB', id: 'repair_kit_advanced', weight: 15 },
      { source: 'accessoriesDB', id: 'rift_crystal', weight: 14 },
      { source: 'accessoriesDB', id: 'insight_lens', weight: 14 },
      { source: 'accessoriesDB', id: 'abyss_monocle', weight: 12 },
      { source: 'accessoriesDB', id: 'demon_armband', weight: 8 },
      { source: 'accessoriesDB', id: 'fallen_star_ornament', weight: 8 },
      { source: 'weaponDB', id: 'twin_blades', weight: 10 },
      { source: 'weaponDB', id: 'shadow_bow', weight: 10 },
      { source: 'weaponDB', id: 'rift_lance', weight: 10 },
      { source: 'weaponDB', id: 'spirit_blade', weight: 10 },
      { source: 'weaponDB', id: 'soul_staff', weight: 8 },
      { source: 'equipmentDB', id: 'rift_battle_coat', weight: 8 },
      { source: 'equipmentDB', id: 'contract_armor', weight: 8 },
      { source: 'equipmentDB', id: 'rift_half_plate', weight: 8 },
      { source: 'equipmentDB', id: 'chain_skirt', weight: 7 },
    ],
    // ── 第五層：Tier C 全品類 + 稀有飾品 ───────────────────────
    5: [
      { source: 'accessoriesDB', id: 'demon_armband', weight: 15 },
      { source: 'accessoriesDB', id: 'fallen_star_ornament', weight: 15 },
      { source: 'accessoriesDB', id: 'rift_crown_fragment', weight: 12 },
      { source: 'accessoriesDB', id: 'contract_seal', weight: 12 },
      { source: 'accessoriesDB', id: 'demon_heart_gem', weight: 12 },
      { source: 'weaponDB', id: 'heaven_sword', weight: 14 },
      { source: 'weaponDB', id: 'hellfire_twin', weight: 12 },
      { source: 'weaponDB', id: 'void_scythe', weight: 12 },
      { source: 'weaponDB', id: 'abyss_sword', weight: 10 },
      { source: 'weaponDB', id: 'cursed_flail', weight: 8 },
      { source: 'equipmentDB', id: 'dragon_scale_coat', weight: 10 },
      { source: 'equipmentDB', id: 'heaven_armor', weight: 10 },
      { source: 'equipmentDB', id: 'demon_leather_coat', weight: 8 },
      { source: 'equipmentDB', id: 'dragon_scale_skirt', weight: 10 },
      { source: 'equipmentDB', id: 'heaven_leg_armor', weight: 10 },
      { source: 'itemDB', id: 'repair_kit_advanced', weight: 8 },
    ],
  },

  special: {
    demonComment: {
      condition: { warmedUpMin: 1 },
      note: '特定物品觸發召喚惡魔評論短對話',
    },
  },
}

/**
 * 依層數從戰利品池加權隨機抽取一件物品
 * @param {number} layer - 1–5
 * @returns {{ source: string, id: string }|null}
 */
export function drawItemFromPool(layer) {
  const pool = ITEM_DISCOVERY.lootPoolByLayer[layer] ?? ITEM_DISCOVERY.lootPoolByLayer[1]
  if (!pool || pool.length === 0) return null
  const total = pool.reduce((s, e) => s + e.weight, 0)
  let rand = Math.random() * total
  for (const entry of pool) {
    rand -= entry.weight
    if (rand <= 0) return { source: entry.source, id: entry.id }
  }
  const last = pool[pool.length - 1]
  return { source: last.source, id: last.id }
}

// ────────────────────────────────────────
// 惡魔私下互動
// ────────────────────────────────────────

export const DEMON_PRIVATE_MOMENT = {
  typeId: 'demon_private_moment',
  name: '深淵存在私語',
  flow: 'dialogue',                 // 觸發 DIALOGUE phase
  triggerConditions: {
    note: '各惡魔×地點組合在 LocationDB.eventPool 中個別設定（affection門檻 + warmedUpCount門檻）',
  },
  baseRewards: {
    heroine_axis: { range: [-15, 15] },  // 依選項決定方向與大小
    demon_axis: { range: [-10, 10] },
    lust: { range: [0, 10] },
  },
  penalties: {
    wrongChoice: { affection: -5, heroine_axis: -10 },
  },
  special: {
    onePerCombo: true,              // 每個惡魔×地點組合只觸發一次
    trackField: 'private_moments_triggered', // 記錄在 demons[id].private_moments_triggered[]
  },
}

// ────────────────────────────────────────
// NPC 遭遇
// ────────────────────────────────────────

export const NPC_ENCOUNTER = {
  typeId: 'npc_encounter',
  name: '他者生存者接觸',
  flow: 'dialogue',
  possibleOutcomes: [
    'intel_flags',        // 獲得情報（設定 flags）
    'item_trade',         // 物品交換
    'trigger_rescue',     // 引發 crisis_rescue
    'story_chain',        // 後續事件鏈旗標
  ],
  penalties: {
    wrongAction: { heart: -5, note: '錯誤處理觸發負面旗標' },
  },
  special: {
    corruptedNPC: {
      chance: 0.20,                 // 20% 機率為魔物化人類
      revealed: 'encounter_combat', // 揭露後強制戰鬥
    },
  },
}

// ────────────────────────────────────────
// 統一查詢介面
// ────────────────────────────────────────

const EVENT_MAP = {
  encounter_combat: ENCOUNTER_COMBAT,
  investigation: INVESTIGATION,
  rest_recovery: REST_RECOVERY,
  item_discovery: ITEM_DISCOVERY,
  demon_private_moment: DEMON_PRIVATE_MOMENT,
  npc_encounter: NPC_ENCOUNTER,
  ...Object.fromEntries(Object.entries(CRISIS_RESCUE_SUBTYPES).map(([k, v]) => [k, v])),
  ...Object.fromEntries(Object.entries(RIFT_ANOMALY_SUBTYPES).map(([k, v]) => [k, v])),
  ...Object.fromEntries(Object.entries(TRAP_SUBTYPES).map(([k, v]) => [k, v])),
  // noIntervention 為共通規則，不單獨查詢
}

/**
 * 依事件類型 ID 取得事件定義
 * @param {string} eventTypeId
 * @returns {Object|null}
 */
export function getEventDef(eventTypeId) {
  return EVENT_MAP[eventTypeId] ?? null
}

/**
 * 取得 crisis_rescue 不介入效果
 * @returns {Object}
 */
export function getCrisisNoInterventionDef() {
  return CRISIS_RESCUE_SUBTYPES.noIntervention
}


