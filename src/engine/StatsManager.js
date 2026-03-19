/**
 * StatsManager — V3.0
 * 負責所有數值的讀寫、邊界約束、覺醒套用、契約狀態判定
 */

// ─── 初始數值 ─────────────────────────────────────────────────

export const INITIAL_HEROINE = {
  // 情感數值
  heart: 10,
  insight: 30,
  independence: 30,

  // 戰鬥數值
  HP: 100,
  maxHP: 100,
  SP: 80,
  maxSP: 80,
  ATK: 18,
  AGI: 8,
  WIL: 6,
  DES: 0,

  // 覺醒類型
  awakening: null,

  // 裝備
  equipment: {
    upper: { id: 'covenant_coat', durability: 75 },
    lower: { id: 'covenant_skirt', durability: 75 },
  },

  // 遮掩劑狀態（道具機制）
  shroud_active: false,
  shroud_turns: 0,
}

export const INITIAL_DEMON = {
  affection: 0,
  trust: 0,
  lust: 0,
  heroine_axis: 0,
  demon_axis: 0,
  contract_status: 'active',
  summon_count: 0,
}

export const INITIAL_DEMONS = {
  demon_a: { ...INITIAL_DEMON },
  demon_b: { ...INITIAL_DEMON },
  demon_c: { ...INITIAL_DEMON },
}

// ─── 覺醒加成規格（V3.0 六種覺醒）────────────────────────────

const AWAKENING_BONUS = {
  slayer: { ATK: +8, AGI: +2, skill: 'T1_03' }, // 本能突刺
  guardian: { maxHP: +30, WIL: +2, skill: 'T1_06' }, // 護盾展開
  windwalker: { AGI: +6, insight: +10, skill: 'T1_05' }, // 快速連打
  seeker: { insight: +25, ATK: +2, skill: 'T1_01' }, // 弱點標記
  apothecary: { maxSP: +40, WIL: +4, skill: 'T1_09' }, // 靈力回充
  balanced: { ATK: +2, AGI: +2, WIL: +2, skill: 'T1_04' }, // 契約脈衝
}

// ─── 邊界函式 ─────────────────────────────────────────────────

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

// ─── 判定覺醒類型（V3.0 依入場路線 + 戰後 HP）────────────────

/**
 * 根據序章入場旗標與戰後 HP 比例判定覺醒類型
 * @param {{ entry_path: string, entry_fight?: boolean, entry_flee?: boolean }} flags
 * @param {number} hpPercent  戰後 HP / maxHP（0–1）
 * @returns {'slayer'|'guardian'|'windwalker'|'seeker'|'apothecary'|'balanced'}
 */
export function judgeAwakeningType(flags = {}, hpPercent = 1.0) {
  const { entry_path, entry_fight, entry_flee } = flags

  if (entry_path === 'tactical') {
    // 守護者：沉穩應戰，HP 保持充足
    // 逐風者：靈活周旋，HP 有所消耗
    return hpPercent >= 0.7 ? 'guardian' : 'windwalker'
  }

  if (entry_path === 'instinct') {
    // 屠戮者：本能衝上去，激烈搏鬥（HP 大量消耗）
    // 均衡者：本能衝上去，但保留了足夠 HP
    return hpPercent <= 0.4 ? 'slayer' : 'balanced'
  }

  if (entry_path === 'insight') {
    // 尋求者：觀察後主動出擊
    // 調律者：試圖逃跑後被迫應戰，以苦撐換來覺悟
    return entry_flee ? 'apothecary' : 'seeker'
  }

  return 'balanced'
}

// ─── 套用覺醒 ─────────────────────────────────────────────────

/**
 * 套用覺醒數值加成到 GameState
 * @param {object} state     當前 GameState
 * @param {string} awakeningType  'tactical'|'spiritual'|'instinct'|'balanced'
 * @returns {object} 更新後的 state（immutable）
 */
export function applyAwakening(state, awakeningType) {
  const bonus = AWAKENING_BONUS[awakeningType]
  if (!bonus) return state

  const newHeroine = { ...state.heroine, awakening: awakeningType }

  // 套用數值加成
  for (const [key, delta] of Object.entries(bonus)) {
    if (key === 'skill') continue
    if (key in newHeroine) {
      newHeroine[key] = newHeroine[key] + delta
      // maxHP/maxSP 同步更新現值
      if (key === 'maxHP') newHeroine.HP = Math.min(newHeroine.HP, newHeroine.maxHP)
      if (key === 'maxSP') newHeroine.SP = Math.min(newHeroine.SP + delta, newHeroine.maxSP)
    }
  }

  // 套用初始技能
  const initialSkill = bonus.skill
  const newSkills = { ...state.skills }
  if (initialSkill && !newSkills.active.includes(initialSkill)) {
    newSkills.active = [...newSkills.active, initialSkill]
  }

  return { ...state, heroine: newHeroine, skills: newSkills }
}

// ─── 套用數值效果（VN 場景用） ────────────────────────────────

/**
 * 套用 effects 物件的數值變化
 * effects 格式：
 * {
 *   heroine: { heart: -5, insight: +10, ... },
 *   demon_a: { heroine_axis: +10, affection: +5, ... },
 *   ...
 * }
 */
export function applyEffects(state, effects) {
  if (!effects) return state

  let newState = { ...state }

  // 女主角情感 / 戰鬥數值
  if (effects.heroine) {
    const newHeroine = { ...newState.heroine }
    for (const [key, delta] of Object.entries(effects.heroine)) {
      if (!(key in newHeroine)) continue
      const raw = newHeroine[key] + delta
      // 各欄位邊界
      if (key === 'heart') {
        newHeroine[key] = clamp(raw, -50, 100)
      } else if (key === 'DES') {
        newHeroine[key] = clamp(raw, 0, 200)
      } else if (key === 'HP') {
        newHeroine[key] = clamp(raw, 0, newHeroine.maxHP)
      } else if (key === 'SP') {
        newHeroine[key] = clamp(raw, 0, newHeroine.maxSP)
      } else {
        newHeroine[key] = clamp(raw)
      }
    }
    newState = { ...newState, heroine: newHeroine }
  }

  // 各惡魔關係數值
  const demonIds = ['demon_a', 'demon_b', 'demon_c']
  for (const demonId of demonIds) {
    if (!effects[demonId]) continue
    const newDemons = { ...newState.demons }
    const newDemon = { ...newDemons[demonId] }
    for (const [key, delta] of Object.entries(effects[demonId])) {
      if (key === 'heart') {
        const newHeroine = { ...newState.heroine }
        newHeroine.heart = clamp(newHeroine.heart + delta, -50, 100)
        newState = { ...newState, heroine: newHeroine }
        continue
      }
      if (!(key in newDemon)) continue
      // heroine_axis 範圍 -100–100
      if (key === 'heroine_axis') {
        newDemon[key] = clamp(newDemon[key] + delta, -100, 100)
      } else if (key === 'affection') {
        newDemon[key] = clamp(newDemon[key] + delta, -50, 100)
      } else {
        newDemon[key] = clamp(newDemon[key] + delta)
      }
    }
    newDemons[demonId] = newDemon
    newState = { ...newState, demons: newDemons }
  }

  // flags
  if (effects.flags) {
    newState = {
      ...newState,
      flags: { ...newState.flags, ...effects.flags },
    }
  }

  // 序章臨時加成（prologue_bonus）— 僅在 scene_0_3 戰鬥中生效，AWAKENING_FINISH 後清除
  if (effects.prologue_bonus) {
    const cur = newState.prologueBonus ?? { ATK: 0, AGI: 0, WIL: 0 }
    newState = {
      ...newState,
      prologueBonus: {
        ATK: (cur.ATK || 0) + (effects.prologue_bonus.ATK || 0),
        AGI: (cur.AGI || 0) + (effects.prologue_bonus.AGI || 0),
        WIL: (cur.WIL || 0) + (effects.prologue_bonus.WIL || 0),
      },
    }
  }

  return newState
}

// ─── 條件判定 ─────────────────────────────────────────────────

/**
 * 判定選項條件是否滿足
 */
export function checkCondition(state, condition) {
  if (!condition) return true

  // 女主角條件
  if (condition.heroine) {
    for (const [stat, range] of Object.entries(condition.heroine)) {
      const val = state.heroine?.[stat] ?? 0
      if (range.min !== undefined && val < range.min) return false
      if (range.max !== undefined && val > range.max) return false
    }
  }

  // 惡魔關係條件
  const demonIds = ['demon_a', 'demon_b', 'demon_c']
  for (const demonId of demonIds) {
    if (!condition[demonId]) continue
    const dStats = state.demons?.[demonId] ?? {}
    for (const [stat, range] of Object.entries(condition[demonId])) {
      const val = dStats[stat] ?? 0
      if (range.min !== undefined && val < range.min) return false
      if (range.max !== undefined && val > range.max) return false
    }
  }

  // flag 條件
  if (condition.flags) {
    for (const [flag, expected] of Object.entries(condition.flags)) {
      if (state.flags?.[flag] !== expected) return false
    }
  }

  // contract_status 條件
  if (condition.contract_status) {
    for (const [demonId, expectedStatus] of Object.entries(condition.contract_status)) {
      if (state.demons?.[demonId]?.contract_status !== expectedStatus) return false
    }
  }

  return true
}

// ─── 骰點加成計算 ─────────────────────────────────────────────

export function calcStatsBonus(state, bonusStats, demonId = null) {
  const HEROINE_STAT_KEYS = ['heart', 'insight', 'independence', 'WIL', 'ATK', 'AGI']
  const DEMON_STAT_KEYS = ['affection', 'trust', 'lust', 'heroine_axis', 'demon_axis']

  let total = 0
  for (const statKey of bonusStats) {
    let val = 0
    if (HEROINE_STAT_KEYS.includes(statKey)) {
      val = state.heroine?.[statKey] ?? 0
    } else if (demonId && DEMON_STAT_KEYS.includes(statKey)) {
      val = state.demons?.[demonId]?.[statKey] ?? 0
    }
    total += Math.floor(val / 10)
  }
  return total
}

// ─── SP 命中加成 ──────────────────────────────────────────────

/**
 * 依 SP 比例計算命中加成（%）
 */
export function spHitBonus(heroine) {
  const ratio = heroine.SP / heroine.maxSP
  if (ratio > 0.6) return +5
  if (ratio >= 0.3) return 0
  if (heroine.SP === 0) return -25
  return -10
}

// ─── 契約狀態判定 ─────────────────────────────────────────────

/**
 * 每章章末執行，更新各惡魔的 contract_status
 */
export function evaluateContractStatus(state) {
  const newDemons = { ...state.demons }

  for (const demonId of ['demon_a', 'demon_b', 'demon_c']) {
    const d = newDemons[demonId]
    if (!d || d.contract_status === 'resolved') continue

    const { heroine_axis, demon_axis } = d

    if (heroine_axis <= -30) {
      newDemons[demonId] = { ...d, contract_status: 'hostile' }
    } else if (demon_axis >= 90 && Math.abs(heroine_axis) <= 10) {
      newDemons[demonId] = { ...d, contract_status: 'betrayal_warning' }
    } else if (d.contract_status !== 'hostile' && d.contract_status !== 'betrayed') {
      newDemons[demonId] = { ...d, contract_status: 'active' }
    }
  }

  return { ...state, demons: newDemons }
}

