/**
 * EndingResolver — 根據最終數值與 flag 判定結局
 */
import { checkCondition } from './StatsManager.js'
import { getDominantDemon } from './ExplorationSystem.js'

// ─── DES 溢出提前結局（priority: 99，由 App.jsx 直接 dispatch）────────────

const EARLY_ENDINGS = {
  early_demon_a_willing: {
    id: 'early_demon_a_willing',
    name: '束縛之蜜——自願淪陷',
    icon: '🔮',
    description: '慾念燃盡理智的最後一絲防線。妳主動走向瑠夜張開的束縛，絲線纏繞四肢的觸感不再令妳恐懼——那是妳一直渴望的歸宿。「終於……妳願意了。」他低語，而妳只是微笑。',
    priority: 99,
  },
  early_demon_a_captive: {
    id: 'early_demon_a_captive',
    name: '束縛之牢——被迫囚禁',
    icon: '🔗',
    description: '瑠夜的絲線像潮水一樣淹沒了妳，不給妳任何喘息的機會。妳掙扎、哭泣，但身體早已不聽使喚。「不要緊，我有很多時間讓妳習慣。」',
    priority: 99,
  },
  early_demon_b_willing: {
    id: 'early_demon_b_willing',
    name: '獸欲之烙——自願淪陷',
    icon: '🔥',
    description: '理性在烈焰中燃盡。妳不再逃跑，反而迎向颯牙灼熱的目光。他笑得猙獰而溫柔，「這才對——妳本來就屬於這裡。」契約印記在妳掌心發光，從此是鎖，也是歸處。',
    priority: 99,
  },
  early_demon_b_captive: {
    id: 'early_demon_b_captive',
    name: '獸欲之爪——被迫囚禁',
    icon: '⛓️',
    description: '颯牙沒有給妳選擇的時間。他的手扣住妳的肩膀，力道不容拒絕。「跑累了吧。我早說了，逃不掉的。」妳的吶喊在空曠的廢墟裡消散，無人聽見。',
    priority: 99,
  },
  early_demon_c_willing: {
    id: 'early_demon_c_willing',
    name: '冥契之歸——自願淪陷',
    icon: '🌑',
    description: '死與生的邊界在妳眼中已失去意義。玄冥伸出手，妳毫不猶豫地握住了它——冰涼、安靜，像是久違的安息。「妳終於看透了。」他說，而妳只是點頭。',
    priority: 99,
  },
  early_demon_c_captive: {
    id: 'early_demon_c_captive',
    name: '冥契之縛——被迫囚禁',
    icon: '💀',
    description: '玄冥的詛咒滲入骨髓，生死之氣將妳完全封鎖。妳試圖呼喚，卻發現聲音已被他吞噬。「別掙扎了。在我這裡，妳哪裡也去不了。」',
    priority: 99,
  },
  early_rift_fall: {
    id: 'early_rift_fall',
    name: '裂隙淪陷——諸魔皆歎',
    icon: '🕳️',
    description: '慾念的重量超越了所有契約的拉力。惡魔們沉默地注視著妳，眼中帶著罕見的惋惜——而非貪婪。裂隙從妳腳下綻開，吞噬了一切。沒有人伸出手，因為已沒有任何力量能阻止這場墜落。',
    priority: 99,
  },
}

/**
 * 依 DES 溢出條件判定提前壞結局
 * 在 App.jsx useEffect 中呼叫，結果直接傳入 TRIGGER_ENDING action
 * @param {object} state  GameState
 * @returns {object}      結局物件
 */
export function resolveDesOverflowEnding(state) {
  const demonIds = ['demon_a', 'demon_b', 'demon_c']
  let topDemonId = null
  let topAxis = 0

  for (const id of demonIds) {
    const axis = state.demons[id]?.demon_axis ?? 0
    if (axis > topAxis) {
      topAxis = axis
      topDemonId = id
    }
  }

  if (topAxis >= 75 && topDemonId) {
    const heroineAxis = state.demons[topDemonId]?.heroine_axis ?? 0
    const variant = heroineAxis > 50 ? 'willing' : 'captive'
    return EARLY_ENDINGS[`early_${topDemonId}_${variant}`]
  }

  return EARLY_ENDINGS['early_rift_fall']
}

// TODO Phase D: replace with full endings data
const endingsData = {
  endings: [
    { id: 'unfinished', name: '未完待續', icon: '...', priority: 0, conditions: null }
  ]
}

/**
 * 判定當前狀態對應的結局
 * @param {object} state        GameState
 * @param {string} charId       目前攻略角色
 * @returns {object|null}       結局物件（含 id, name, icon 等欄位）
 */
export function resolveEnding(state, charId) {
  const charEndings = endingsData.endings

  // 依優先度排序（數字越大越優先）
  const sorted = [...charEndings].sort((a, b) => b.priority - a.priority)

  for (const ending of sorted) {
    // 將條件中的 character 展開為實際 charId
    const condition = expandCharacterCondition(ending.conditions, charId)
    if (checkCondition(state, condition)) {
      return ending
    }
  }

  // fallback：未完待續
  return charEndings.find((e) => e.id === 'unfinished') ?? null
}

/**
 * Ch.E1 評估：根據探索結果決定結局軌道
 * @param {object} state  GameState
 * @returns {{ track: string, dominantDemonId: string|null, interferenceFlags: string[] }}
 *   track: 'solo' | 'crisis' | 'romance_he' | 'romance_de' | 'conflict'
 */
export function evaluateFinalTrack(state) {
  const demonIds = ['demon_a', 'demon_b', 'demon_c']

  // 計算各惡魔積分（affection + trust）
  const demonScores = Object.fromEntries(
    demonIds.map(id => [id, (state.demons[id]?.affection ?? 0) + (state.demons[id]?.trust ?? 0)])
  )

  // 主導惡魔 = affection + trust 合計最高
  const dominantDemonId = getDominantDemon(state)

  // 跨線干擾旗標
  const interferenceFlags = state.flags?.interference_triggered ?? []

  // 路線一：solo（independence ≥ 60 且所有惡魔積分皆 < 30）
  const allLowScore = demonIds.every(id => demonScores[id] < 30)
  if (state.heroine.independence >= 60 && allLowScore) {
    return { track: 'solo', dominantDemonId: null, interferenceFlags }
  }

  if (!dominantDemonId) {
    return { track: 'conflict', dominantDemonId: null, interferenceFlags }
  }

  const dominant = state.demons[dominantDemonId]

  // 路線二：crisis（BE）demon_axis ≥ 80
  if ((dominant.demon_axis ?? 0) >= 80) {
    return { track: 'crisis', dominantDemonId, interferenceFlags }
  }

  // 路線三：romance_he（HE）heroine_axis ≥ 70
  if ((dominant.heroine_axis ?? 0) >= 70) {
    return { track: 'romance_he', dominantDemonId, interferenceFlags }
  }

  // 路線四：romance_de（HE/BE）heroine_axis ≥ 50
  if ((dominant.heroine_axis ?? 0) >= 50) {
    return { track: 'romance_de', dominantDemonId, interferenceFlags }
  }

  // 路線五：conflict（NE）其他
  return { track: 'conflict', dominantDemonId, interferenceFlags }
}

/**
 * 將 conditions.character 轉換為 conditions[charId]
 */
function expandCharacterCondition(conditions, charId) {
  if (!conditions) return {}
  const expanded = { ...conditions }
  if (expanded.character) {
    expanded[charId] = expanded.character
    delete expanded.character
  }
  return expanded
}
