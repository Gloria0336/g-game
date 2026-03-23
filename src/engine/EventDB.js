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
  name: '遭遇戰',
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
  name: '調查事件',
  flow: 'dice',                     // 觸發 DICE phase（D20）
  useLocationHint: true,            // 描述文本從 LocationDB.investigationHint 讀取
  diceBonus: {
    insight: { per: 10, bonus: 5 }, // insight 每 10 點 → 骰點 +5
  },
  options: [
    { id: 'investigate_a', label: '仔細搜查' },
    { id: 'investigate_b', label: '快速掃視' },
    { id: 'investigate_c', label: '放棄' },
  ],
  successRewards: {
    flagUnlock: true,               // 解鎖隱藏信息旗標
    skillChance: 0.20,              // 20% 機率觸發技能獎勵
    itemDiscoveryChance: 0.30,      // 30% 機率附帶觸發 item_discovery
    privateMomentUnlock: true,      // 特定地點成功 → 解鎖惡魔私下互動條件
  },
  failurePenalties: {
    note: '無數值懲罰，僅旁白描述失敗結果',
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
      demon_c: { heroine_axis:  0, note: '玄冥：無反應' },
    },
  },

  'rescue.town_outskirts': {
    typeId: 'rescue.town_outskirts',
    name: '小鎮外圍危機',
    scenario: '被魔物追逐的逃難者',
    interventionFlow: 'force_combat',
    successRewards:  { heart: 3, flags: ['npc_favor_town'] },
    failurePenalties: { npc_fail: true, DES: 10 },
  },

  'rescue.outskirts_ruins': {
    typeId: 'rescue.outskirts_ruins',
    name: '廢棄建築群危機',
    scenario: '被廢墟結構困住的探索者',
    interventionFlow: 'dice',
    diceStats: ['WIL', 'AGI'],     // 合力判定（取平均）
    successRewards:  { heart: 2, chainEvent: 'item_discovery' },
    failurePenalties: { HP: -0.10, durability: -2 },
  },

  'rescue.outskirts_field': {
    typeId: 'rescue.outskirts_field',
    name: '荒廢曠野危機',
    scenario: '野外魔物包圍的傷者',
    interventionFlow: 'force_combat',
    successRewards:  { heart: 3, flags: ['npc_favor_outskirts'] },
    failurePenalties: { npc_fail: true, DES: 10 },
  },

  'rescue.outskirts_watchtower': {
    typeId: 'rescue.outskirts_watchtower',
    name: '崩塌瞭望台危機',
    scenario: '困在搖搖欲墜台頂的哨兵',
    interventionFlow: 'dice',
    diceStats: ['AGI'],
    successRewards:  { heart: 2, independence: 1 },
    failurePenalties: { chainEvent: 'encounter_combat', note: '落下引發魔物注意' },
  },

  'rescue.outskirts_road': {
    typeId: 'rescue.outskirts_road',
    name: '破碎公路危機',
    scenario: '路上遭魔物攻擊的旅人',
    interventionFlow: 'force_combat',
    successRewards:  { heart: 3, possibleTrade: true },
    failurePenalties: { npc_fail: true },
  },

  'rescue.rift_nest': {
    typeId: 'rescue.rift_nest',
    name: '魔物聚集地危機',
    scenario: '被魔物巢穴困住的倖存者',
    interventionFlow: 'force_combat',
    combatModifier: { enemyCountBonus: 1 }, // 敵方數量 +1
    successRewards:  { heart: 3, chainEvent: 'item_discovery' },
    failurePenalties: { npc_fail: true, DES: 15 },
  },

  'rescue.rift_ruins': {
    typeId: 'rescue.rift_ruins',
    name: '古代遺跡危機',
    scenario: '觸發古代機關被困的人',
    interventionFlow: 'dice',
    diceStats: ['insight'],
    successRewards:  { heart: 2, chainEvent: 'investigation' },
    failurePenalties: { chainTrap: 'trap.seal', targetsAll: true },
  },

  'rescue.deep_vortex': {
    typeId: 'rescue.deep_vortex',
    name: '能量漩渦危機',
    scenario: '被能量漩渦半吞噬的契約者',
    interventionFlow: 'dice_or_summon',
    diceStats: ['WIL'],
    summonOption: {
      available: true,
      successGuaranteed: true,     // 惡魔協助必定成功
      cost: { DES: 10 },
    },
    successRewards:  { heart: 3, insight: 2 },
    failurePenalties: { DES: 20 },
  },

  'rescue.core_threshold': {
    typeId: 'rescue.core_threshold',
    name: '裂隙源點入口危機',
    scenario: '已半失去意志的契約者（抉擇）',
    interventionFlow: 'three_choice',
    options: [
      {
        id: 'force_pull',
        label: '強制拉回（高難度）',
        flow: 'dice',
        diceStats: ['WIL'],
        diceDC: 80,               // 高門檻
        successRewards:  { heart: 5, independence: 3 },
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
    name: '空間扭曲',
    description: '地面與空間產生異常折疊，方向感完全喪失。',
    options: [
      {
        id: 'summon_guide',
        label: '召喚惡魔協助定向',
        requiresSummon: true,
        rewards:  { DES: +5 },
        demonBonus: { demon_axis: +3 },
      },
      {
        id: 'solo_instinct',
        label: '獨自靠直覺前進',
        flow: 'dice',
        diceStats: ['WIL'],
        successRewards:  { independence: +3 },
        failurePenalties: { DES: +12, HP: -0.05 },
      },
      { id: 'retreat', label: '撤退' },
    ],
  },

  'anomaly.surge': {
    typeId: 'anomaly.surge',
    name: '能量衝擊',
    description: '裂隙能量突然大量湧出，精神承受衝擊。',
    options: [
      {
        id: 'resist',
        label: '抵抗衝擊',
        flow: 'dice',
        diceStats: ['WIL'],
        successRewards:  { DES: +5 },
        failurePenalties: { DES: +20 },
      },
      {
        id: 'flow_with',
        label: '順流而下',
        rewards:  { DES: +10, insight: +3 },
      },
      { id: 'retreat', label: '撤退' },
    ],
  },

  'anomaly.swarm': {
    typeId: 'anomaly.swarm',
    name: '魔物湧現',
    description: '裂隙異變引發魔物群湧，數量超出預期。',
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
    name: '幻覺侵蝕',
    description: '裂隙投射幻覺，女主角看見自己最恐懼或最渴望的事物。',
    options: [
      {
        id: 'resist_vision',
        label: '對抗幻覺',
        flow: 'dice',
        diceStats: ['insight'],
        successRewards:  { insight: +3 },
        failurePenalties: { heroine_axis: -5, target: 'highest_affection' },
      },
      {
        id: 'indulge',
        label: '沉溺幻覺',
        rewards:  { DES: +15, lust: +5, target: 'highest_demon_axis' },
      },
      { id: 'retreat', label: '撤退' },
    ],
  },

  'anomaly.seal': {
    typeId: 'anomaly.seal',
    name: '封印崩潰',
    description: '舊時代封印瓦解，被封存的能量殘留湧出。',
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
        successRewards:  { flags: ['seal_reinforced'] },
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
    name: '物理陷阱',
    description: '機械式陷阱（尖刺、落石、夾具）',
    avoidDice: { stats: ['AGI'] },
    fullTrigger: { HP: -0.20, durability: -10 },
    halfTrigger: { HP: -0.10, durability: -2 },
    demonDetect: { warmedUpMin: 1, diceBonus: 10, demonNote: '召喚惡魔可能提前察覺' },
  },

  'trap.magical': {
    typeId: 'trap.magical',
    name: '魔法陷阱',
    description: '符文或魔法陣觸發的能量封鎖',
    avoidDice: { stats: ['WIL'] },
    fullTrigger: { SP: -0.30, nextCombatDiceDebuff: -10 },
    halfTrigger: { SP: -0.15 },
    demonDetect: { warmedUpMin: 1, diceBonus: 10 },
  },

  'trap.mental': {
    typeId: 'trap.mental',
    name: '精神陷阱',
    description: '幻象或詛咒侵蝕意志，令人對惡魔產生渴望依賴',
    avoidDice: { stats: ['insight'] },
    fullTrigger: { DES: +20, heroine_axis: +5, target: 'highest_affection_demon' },
    halfTrigger: { DES: +10 },
    demonDetect: { warmedUpMin: 2, diceBonus: 10 },
  },

  'trap.ambush': {
    typeId: 'trap.ambush',
    name: '伏擊陷阱',
    description: '魔物預先設置的伏擊位置，觸發後魔物搶佔先手',
    avoidDice: { stats: ['AGI'], note: '先制判定' },
    fullTrigger: { chainEvent: 'encounter_combat', enemyFirstStrike: true },
    halfTrigger: { chainEvent: 'encounter_combat', enemyFirstStrike: false },
    demonDetect: { warmedUpMin: 1, diceBonus: 10 },
  },

  'trap.seal': {
    typeId: 'trap.seal',
    name: '封印陷阱',
    description: '古代封印誤觸，暫時封鎖某項戰鬥能力',
    avoidDice: { stats: ['WIL'] },
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
  name: '休息/補給',
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
  name: '物品發現',
  flow: 'auto',                     // 自動觸發，無選擇
  itemPool: {
    recovery:    ['hp_potion', 'sp_potion', 'des_suppressant'],
    repair:      ['durability_kit_small', 'durability_kit_large'],
    skill:       ['skill_fragment'],  // 特殊技能前置碎片
  },
  rarityByLayer: {
    1: 'common',
    2: 'common',
    3: 'uncommon',
    4: 'uncommon',
    5: 'rare',
  },
  special: {
    demonComment: {
      condition: { warmedUpMin: 1 },
      note: '特定物品觸發召喚惡魔評論短對話',
    },
  },
}

// ────────────────────────────────────────
// 惡魔私下互動
// ────────────────────────────────────────

export const DEMON_PRIVATE_MOMENT = {
  typeId: 'demon_private_moment',
  name: '惡魔私下互動',
  flow: 'dialogue',                 // 觸發 DIALOGUE phase
  triggerConditions: {
    note: '各惡魔×地點組合在 LocationDB.eventPool 中個別設定（affection門檻 + warmedUpCount門檻）',
  },
  baseRewards: {
    heroine_axis: { range: [-15, 15] },  // 依選項決定方向與大小
    demon_axis:   { range: [-10, 10] },
    lust:         { range: [0, 10] },
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
  name: 'NPC 遭遇',
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
  encounter_combat:      ENCOUNTER_COMBAT,
  investigation:         INVESTIGATION,
  rest_recovery:         REST_RECOVERY,
  item_discovery:        ITEM_DISCOVERY,
  demon_private_moment:  DEMON_PRIVATE_MOMENT,
  npc_encounter:         NPC_ENCOUNTER,
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

export {
  CRISIS_RESCUE_SUBTYPES,
  RIFT_ANOMALY_SUBTYPES,
  TRAP_SUBTYPES,
}
