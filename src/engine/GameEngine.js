/**
 * GameEngine — 遊戲狀態機（V3.0）
 *
 * Phases: title / awakening / dialogue / choice / dice /
 *         combat / demon_summon / combat_end / demon_dialogue /
 *         skill_reward / ending / save_load
 */

import { INITIAL_HEROINE, INITIAL_DEMONS, applyEffects, applyAwakening } from './StatsManager.js'
import { resolveChoices, executeChoice } from './ChoiceResolver.js'
import { resolveEnding } from './EndingResolver.js'
import { getPrimaryDemonId, createDemonUnit } from './DemonSystem.js'

// ─── Phase 常數 ────────────────────────────────────────────────

export const PHASES = {
  TITLE:          'title',
  AWAKENING:      'awakening',
  DIALOGUE:       'dialogue',
  CHOICE:         'choice',
  DICE:           'dice',
  COMBAT:         'combat',
  DEMON_SUMMON:   'demon_summon',
  COMBAT_END:     'combat_end',
  DEMON_DIALOGUE: 'demon_dialogue',
  SKILL_REWARD:   'skill_reward',
  ENDING:         'ending',
  SAVE_LOAD:      'save_load',
  MAP:            'map',         // 五層地牢地點選擇介面
  FINAL_EVAL:     'final_eval',  // Ch.E1 評估畫面
}

// ─── 初始戰鬥狀態 ──────────────────────────────────────────────

const INITIAL_COMBAT = {
  enemyId: null,
  enemyHP: 0,
  enemyMaxHP: 0,
  enemyATK: 0,
  enemyAGI: 0,
  enemyStatuses: [],
  heroineStatuses: [],
  turnQueue: [],      // 當前回合剩餘行動者佇列
  log: [],
  summonedThisBattle: [],
  playerActionCount: 0,     // 玩家本場行動次數（用於教學延遲召喚）
  activeDemons: {},         // { [demonId]: DemonUnit } — 場上存活惡魔
  pendingNarrative: null,       // AI 戰鬥敘事（戰後顯示）
  pendingDemonDialogue: null,   // AI 惡魔對話 { lines:[], choices:[] }
  activeDemonDialogueId: null,  // 當前對話惡魔 ID
}

// ─── 初始 GameState ────────────────────────────────────────────

export const INITIAL_STATE = {
  phase: 'title',
  currentChapter: 0,
  currentScene: '0-1',
  currentDialogue: 0,
  mainRoute: null,
  sceneData: null,
  flags: {},
  choiceHistory: [],
  pendingChoices: null,
  diceResult: null,
  ending: null,
  _pendingNextScene: null,
  _prevPhase: null,
  pendingAwakeningScene: null,  // AI 覺醒演出台詞 [{ speaker, text }]

  // 序章臨時戰鬥加成（入場路線決定，AWAKENING_FINISH 後清除）
  prologueBonus: { ATK: 0, AGI: 0, WIL: 0 },

  // 女主角
  heroine: { ...INITIAL_HEROINE },

  // 技能欄位
  skills: {
    active: [],            // 最多 4 個 ID
    inventory: [],         // 最多 12 個 ID
  },

  // 各惡魔關係
  demons: { ...INITIAL_DEMONS },

  // 當前戰鬥
  combat: { ...INITIAL_COMBAT },

  // 五層地牢探索狀態
  exploration: {
    currentLayer: 1,
    currentSubLayer: 1,
    visitedSubLayers: [],
    currentSubLayerLocations: [],
    completedLocations: [],
    completedEvents: [],
    restUsedInSubLayer: false,
    layerBattleCount: 0,
    tierCKillCount: 0,
    subLayerUnlocked: false,
    town_outskirts_visited: false,
    // Ch.E1 評估結果（evaluateFinalTrack 寫入）
    finalTrack: null,
  },
}

// ─── Action Types ──────────────────────────────────────────────

export const ACTION = {
  // 一般流程
  START_GAME:         'START_GAME',
  LOAD_SCENE:         'LOAD_SCENE',
  ADVANCE:            'ADVANCE',
  SHOW_CHOICES:       'SHOW_CHOICES',
  SELECT_CHOICE:      'SELECT_CHOICE',
  ACKNOWLEDGE_DICE:   'ACKNOWLEDGE_DICE',
  SET_FLAG:           'SET_FLAG',
  SET_ROUTE:          'SET_ROUTE',
  TRIGGER_ENDING:     'TRIGGER_ENDING',
  RETURN_TO_TITLE:    'RETURN_TO_TITLE',

  // 覺醒系統
  AWAKENING_FINISH:   'AWAKENING_FINISH',   // 戰鬥後套用覺醒數值（由 App 判定類型後觸發）

  // 戰鬥系統
  START_COMBAT:       'START_COMBAT',        // 進入戰鬥（帶 enemyId）
  COMBAT_ACTION:      'COMBAT_ACTION',       // 玩家行動（普通攻擊 / 使用技能）
  COMBAT_ENEMY_TURN:  'COMBAT_ENEMY_TURN',   // 敵人回合結算
  COMBAT_APPLY_LOG:   'COMBAT_APPLY_LOG',    // 補充戰鬥訊息
  OPEN_DEMON_SUMMON:   'OPEN_DEMON_SUMMON',   // 打開危機召喚面板
  OPEN_ACTIVE_SUMMON:  'OPEN_ACTIVE_SUMMON',  // 打開主動召喚面板（消耗全部 SP）
  SUMMON_DEMON:        'SUMMON_DEMON',        // 召喚指定惡魔
  SKIP_SUMMON:         'SKIP_SUMMON',         // 選擇不召喚
  UPDATE_DEMON_AXIS:     'UPDATE_DEMON_AXIS',       // 更新惡魔 heroine_axis
  UPDATE_DEMON_RELATION: 'UPDATE_DEMON_RELATION',   // 召喚後更新 trust / affection / demon_axis
  INCREMENT_PLAYER_ACTION: 'INCREMENT_PLAYER_ACTION', // 玩家行動次數+1（教學用）
  UPDATE_ACTIVE_DEMON: 'UPDATE_ACTIVE_DEMON', // 更新場上惡魔單位（HP / 技能冷卻）
  REMOVE_ACTIVE_DEMON: 'REMOVE_ACTIVE_DEMON', // 惡魔 HP 歸零後移除
  SET_TURN_QUEUE:     'SET_TURN_QUEUE',       // 更新回合佇列（pop 或重建）
  END_COMBAT:         'END_COMBAT',          // 戰鬥結束（victory / defeat / escape）
  SET_COMBAT_NARRATIVE: 'SET_COMBAT_NARRATIVE', // 儲存 AI 戰鬥敘事
  SET_DEMON_DIALOGUE:   'SET_DEMON_DIALOGUE',   // 儲存 AI 惡魔對話
  SET_AWAKENING_SCENE:  'SET_AWAKENING_SCENE',  // 儲存 AI 覺醒台詞
  PICK_DEMON_RESPONSE:  'PICK_DEMON_RESPONSE',  // 玩家選擇惡魔回應

  // 惡魔對話
  START_DEMON_DIALOGUE: 'START_DEMON_DIALOGUE',
  END_DEMON_DIALOGUE:   'END_DEMON_DIALOGUE',

  // 技能獎勵
  SHOW_SKILL_REWARD:  'SHOW_SKILL_REWARD',   // 顯示技能選擇畫面
  PICK_SKILL:         'PICK_SKILL',          // 選擇技能
  SKIP_SKILL_REWARD:  'SKIP_SKILL_REWARD',   // 略過技能選擇
  SET_SKILL_SLOTS:    'SET_SKILL_SLOTS',     // 整體替換技能槽（管理畫面用）

  // 存讀檔
  OPEN_SAVE_LOAD:     'OPEN_SAVE_LOAD',
  CLOSE_SAVE_LOAD:    'CLOSE_SAVE_LOAD',
  LOAD_SAVE:          'LOAD_SAVE',

  // demon_axis 複雜化機制（REC 1/2/4/5）
  PURIFICATION:   'PURIFICATION',   // 聖域淨化：所有惡魔 demon_axis −10
  RELIC_INTERACT: 'RELIC_INTERACT', // 遺物調查：指定惡魔 demon_axis +8
  REST:           'REST',           // 休息：DES −20、HP +10、主選惡魔 demon_axis −5
  USE_ITEM:       'USE_ITEM',       // 使用道具（shroud_balm / bait_bell）

  // 探索系統
  ENTER_MAP:               'ENTER_MAP',               // 進入地圖介面
  SET_SUBLAYER_LOCATIONS:  'SET_SUBLAYER_LOCATIONS',  // 設定子層地點清單
  COMPLETE_LOCATION:       'COMPLETE_LOCATION',       // 標記地點已探索（index）
  COMPLETE_EVENT:          'COMPLETE_EVENT',          // 標記事件已完成（eventId）
  ADVANCE_SUBLAYER:        'ADVANCE_SUBLAYER',        // 推進至下一子層（或下一層）
  RECORD_BATTLE:           'RECORD_BATTLE',           // 記錄戰鬥完成（含是否擊殺TierC）
  MARK_TOWN_OUTSKIRTS:     'MARK_TOWN_OUTSKIRTS',     // 標記小鎮外圍已訪問
  USE_REST_IN_SUBLAYER:    'USE_REST_IN_SUBLAYER',    // 標記本子層休息已使用
  MARK_PRIVATE_MOMENT:     'MARK_PRIVATE_MOMENT',     // 標記惡魔私下互動已觸發
  TRIGGER_FINAL_EVAL:      'TRIGGER_FINAL_EVAL',      // 進入 Ch.E1 評估
  APPLY_FINAL_EVAL_RESULT: 'APPLY_FINAL_EVAL_RESULT', // 寫入 finalTrack 並進入 Ch.E2
}

// ─── Reducer ──────────────────────────────────────────────────

export function gameReducer(state, action) {
  switch (action.type) {

    // ── 遊戲開始（從主選單） ────────────────────────────────────
    case ACTION.START_GAME:
      return { ...INITIAL_STATE, phase: 'dialogue', currentChapter: 0 }

    // ── 載入場景資料 ────────────────────────────────────────────
    case ACTION.LOAD_SCENE: {
      const { sceneData } = action
      let baseState = {
        ...state,
        sceneData,
        currentScene: sceneData.sceneId,
        currentDialogue: 0,
        pendingChoices: null,
        diceResult: null,
        _pendingNextScene: null,
      }

      // 遮掩劑計數遞減（每次場景轉換）
      if (baseState.heroine.shroud_turns > 0) {
        const newTurns = baseState.heroine.shroud_turns - 1
        baseState = {
          ...baseState,
          heroine: {
            ...baseState.heroine,
            shroud_turns:  newTurns,
            shroud_active: newTurns > 0,
          },
        }
      }

      // DES > 100 被動聯動：非戰鬥轉場且無遮掩效果時，主選惡魔 demon_axis +2
      if (sceneData.type !== 'combat' && baseState.heroine.DES > 100 && !baseState.heroine.shroud_active) {
        const primaryId = getPrimaryDemonId(baseState.demons)
        if (primaryId) {
          const cur = baseState.demons[primaryId].demon_axis ?? 0
          baseState = {
            ...baseState,
            demons: {
              ...baseState.demons,
              [primaryId]: { ...baseState.demons[primaryId], demon_axis: Math.min(100, cur + 2) },
            },
          }
        }
      }

      // 若為戰鬥場景，直接進入 combat phase（由 App 決策）
      if (sceneData.type === 'combat') {
        return { ...baseState, phase: 'combat' }
      }
      return { ...baseState, phase: 'dialogue' }
    }

    // ── 對話推進 ─────────────────────────────────────────────────
    case ACTION.ADVANCE: {
      const { sceneData, currentDialogue } = state
      if (!sceneData) return state

      const nextIdx = currentDialogue + 1

      if (nextIdx >= sceneData.dialogues.length) {
        return { ...state, currentDialogue: nextIdx }
      }

      const nextDialogue = sceneData.dialogues[nextIdx]

      if (nextDialogue.type === 'choice') {
        const choices = resolveChoices(nextDialogue.choices, state)
        return {
          ...state,
          currentDialogue: nextIdx,
          phase: 'choice',
          pendingChoices: choices,
        }
      }

      if (nextDialogue.type === 'dice_choice') {
        return {
          ...state,
          currentDialogue: nextIdx,
          phase: 'choice',
          pendingChoices: [nextDialogue],
        }
      }

      // 覺醒試煉選項
      if (nextDialogue.type === 'awakening_choice') {
        return {
          ...state,
          currentDialogue: nextIdx,
          phase: 'awakening',
        }
      }

      return { ...state, currentDialogue: nextIdx, phase: 'dialogue' }
    }

    // ── 選項選擇 ─────────────────────────────────────────────────
    case ACTION.SELECT_CHOICE: {
      const { choice } = action
      const result = executeChoice(choice, state, state.mainRoute)

      return {
        ...result.newState,
        choiceHistory: [...state.choiceHistory, { choiceId: choice.id ?? choice.text, scene: state.currentScene }],
        pendingChoices: null,
        phase: result.diceResult ? 'dice' : 'dialogue',
        diceResult: result.diceResult ?? null,
        _pendingNextScene: result.nextScene ?? null,
      }
    }

    // ── 骰點確認 ─────────────────────────────────────────────────
    case ACTION.ACKNOWLEDGE_DICE:
      return { ...state, phase: 'dialogue', diceResult: null }

    // ── 旗標設定 ─────────────────────────────────────────────────
    case ACTION.SET_FLAG:
      return { ...state, flags: { ...state.flags, [action.flag]: action.value } }

    // ── 路線設定 ─────────────────────────────────────────────────
    case ACTION.SET_ROUTE:
      return { ...state, mainRoute: action.demonId }

    // ── 覺醒完成（戰鬥後由 App 判定類型，套用數值加成）────────────
    case ACTION.AWAKENING_FINISH: {
      const { awakeningType } = action
      const newState = applyAwakening(state, awakeningType)
      return {
        ...newState,
        phase: 'dialogue',
        prologueBonus: { ATK: 0, AGI: 0, WIL: 0 },   // 清除序章臨時加成
        _pendingNextScene: action.nextScene ?? null,
      }
    }

    // ── 進入戰鬥 ─────────────────────────────────────────────────
    case ACTION.START_COMBAT: {
      const { enemyData } = action
      return {
        ...state,
        phase: 'combat',
        combat: {
          ...INITIAL_COMBAT,
          enemyId: enemyData.id,
          enemyName: enemyData.name,
          enemyHP: enemyData.HP,
          enemyMaxHP: enemyData.HP,
          enemyATK: enemyData.ATK,
          enemyAGI: enemyData.AGI,
          enemyDR: enemyData.DR ?? 0,
          enemySkillDefs: enemyData.skillDefs ?? {},
          log: [`遭遇 ${enemyData.name}！`],
          turnQueue: [],   // 首次 advanceToNextActor 時惰性建立
        },
      }
    }

    // ── 戰鬥行動日誌更新 ─────────────────────────────────────────
    case ACTION.COMBAT_APPLY_LOG: {
      return {
        ...state,
        // heroineUpdate 用於同步戰鬥中的 HP/SP/DES/裝備變動
        heroine: action.heroineUpdate
          ? { ...state.heroine, ...action.heroineUpdate }
          : state.heroine,
        combat: {
          ...state.combat,
          ...action.combatUpdate,
          log: [...state.combat.log, ...(action.combatUpdate.log ?? [])],
        },
      }
    }

    // ── 打開召喚面板 ─────────────────────────────────────────────
    case ACTION.OPEN_DEMON_SUMMON:
      return {
        ...state,
        phase: 'demon_summon',
        combat: { ...state.combat, isActiveSummon: false },
      }

    case ACTION.OPEN_ACTIVE_SUMMON:
      return {
        ...state,
        phase: 'demon_summon',
        combat: { ...state.combat, isActiveSummon: true },
      }

    // ── 召喚惡魔 ─────────────────────────────────────────────────
    case ACTION.SUMMON_DEMON: {
      const { demonId } = action
      const demon = state.demons[demonId]
      const demonUnit = createDemonUnit(demonId)
      return {
        ...state,
        phase: 'combat',
        combat: {
          ...state.combat,
          summonedThisBattle: [...state.combat.summonedThisBattle, demonId],
          activeDemons: demonUnit
            ? { ...state.combat.activeDemons, [demonId]: demonUnit }
            : state.combat.activeDemons,
        },
        demons: {
          ...state.demons,
          [demonId]: {
            ...demon,
            summon_count: (demon.summon_count ?? 0) + 1,
            demon_axis: Math.min(100, (demon.demon_axis ?? 0) + 3),
          },
        },
      }
    }

    // ── 更新場上惡魔單位（HP / 技能冷卻）────────────────────────
    case ACTION.UPDATE_ACTIVE_DEMON: {
      const { demonId, demonUnit } = action
      return {
        ...state,
        combat: {
          ...state.combat,
          activeDemons: {
            ...state.combat.activeDemons,
            [demonId]: demonUnit,
          },
        },
      }
    }

    // ── 移除場上惡魔（HP 歸零）──────────────────────────────────
    case ACTION.REMOVE_ACTIVE_DEMON: {
      const { demonId } = action
      const { [demonId]: _removed, ...rest } = state.combat.activeDemons
      return {
        ...state,
        combat: {
          ...state.combat,
          activeDemons: rest,
          turnQueue: (state.combat.turnQueue ?? []).filter(id => id !== demonId),
        },
      }
    }

    // ── 更新回合佇列 ──────────────────────────────────────────────
    case ACTION.SET_TURN_QUEUE:
      return { ...state, combat: { ...state.combat, turnQueue: action.queue } }

    // ── 主動召喚：更新 heroine_axis ──────────────────────────────
    case ACTION.UPDATE_DEMON_AXIS: {
      const { demonId, heroineAxisDelta } = action
      const d = state.demons[demonId]
      if (!d) return state
      return {
        ...state,
        demons: {
          ...state.demons,
          [demonId]: {
            ...d,
            heroine_axis: Math.min(100, Math.max(-100, (d.heroine_axis ?? 0) + heroineAxisDelta)),
          },
        },
      }
    }

    // ── 惡魔關係更新（召喚後 trust / affection / demon_axis）────────
    case ACTION.UPDATE_DEMON_RELATION: {
      const { demonId, trustDelta = 0, affectionDelta = 0, axisDelta = 0 } = action
      const d = state.demons[demonId]
      if (!d) return state
      return {
        ...state,
        demons: {
          ...state.demons,
          [demonId]: {
            ...d,
            trust:      Math.min(100, Math.max(0,   (d.trust ?? 0)      + trustDelta)),
            affection:  Math.min(100, Math.max(-50,  (d.affection ?? 0)  + affectionDelta)),
            demon_axis: Math.min(100, Math.max(0,    (d.demon_axis ?? 0) + axisDelta)),
          },
        },
      }
    }

    // ── 不召喚 ───────────────────────────────────────────────────
    case ACTION.SKIP_SUMMON:
      return {
        ...state,
        phase: 'combat',
        heroine: {
          ...state.heroine,
          independence: Math.min(100, (state.heroine.independence ?? 30) + 3),
        },
      }

    // ── 玩家行動次數累計（教學延遲召喚用）────────────────────────
    case ACTION.INCREMENT_PLAYER_ACTION:
      return {
        ...state,
        combat: {
          ...state.combat,
          playerActionCount: (state.combat.playerActionCount ?? 0) + 1,
        },
      }

    // ── 戰鬥結束 ─────────────────────────────────────────────────
    case ACTION.END_COMBAT: {
      const { result } = action   // 'victory' | 'defeat' | 'escape'
      let newHeroine = { ...state.heroine }

      if (result === 'defeat') {
        newHeroine.DES = Math.min(200, newHeroine.DES + 30)
      }

      return {
        ...state,
        phase: 'combat_end',
        heroine: newHeroine,
        combat: {
          ...state.combat,
          result,
        },
      }
    }

    // ── 儲存 AI 戰鬥敘事 ────────────────────────────────────────
    case ACTION.SET_COMBAT_NARRATIVE:
      return {
        ...state,
        combat: { ...state.combat, pendingNarrative: action.narrative },
      }

    // ── 儲存 AI 惡魔對話 ─────────────────────────────────────────
    case ACTION.SET_DEMON_DIALOGUE:
      return {
        ...state,
        combat: {
          ...state.combat,
          pendingDemonDialogue: action.dialogue,
          activeDemonDialogueId: action.demonId,
        },
      }

    // ── 儲存 AI 覺醒台詞 ─────────────────────────────────────────
    case ACTION.SET_AWAKENING_SCENE:
      return { ...state, pendingAwakeningScene: action.scene }

    // ── 玩家選擇惡魔回應（套用 effects，回到 dialogue）─────────────
    case ACTION.PICK_DEMON_RESPONSE: {
      const { choiceIndex } = action
      const { activeDemonDialogueId, pendingDemonDialogue } = state.combat
      const choice = pendingDemonDialogue?.choices?.[choiceIndex]

      let newDemons = state.demons
      if (choice?.effects && activeDemonDialogueId) {
        const effects = choice.effects
        const d = state.demons[activeDemonDialogueId]
        if (d) {
          newDemons = {
            ...state.demons,
            [activeDemonDialogueId]: {
              ...d,
              heroine_axis: Math.min(100, Math.max(-100, (d.heroine_axis ?? 0) + (effects.heroine_axis ?? 0))),
              trust:        Math.min(100, Math.max(0,    (d.trust ?? 0)        + (effects.trust ?? 0))),
              affection:    Math.min(100, Math.max(-50,  (d.affection ?? 0)    + (effects.affection ?? 0))),
              lust:         Math.min(100, Math.max(0,    (d.lust ?? 0)         + (effects.lust ?? 0))),
            },
          }
        }
      }

      return {
        ...state,
        phase: 'dialogue',
        demons: newDemons,
        combat: { ...state.combat, pendingDemonDialogue: null, activeDemonDialogueId: null },
      }
    }

    // ── 惡魔戰後對話 ─────────────────────────────────────────────
    case ACTION.START_DEMON_DIALOGUE:
      return {
        ...state,
        phase: 'demon_dialogue',
        combat: {
          ...state.combat,
          activeDemonDialogueId: action.demonId ?? null,
          pendingDemonDialogue: null,
        },
      }

    case ACTION.END_DEMON_DIALOGUE:
      return { ...state, phase: 'dialogue', _pendingNextScene: action.nextScene ?? null }

    // ── 技能獎勵 ─────────────────────────────────────────────────
    case ACTION.SHOW_SKILL_REWARD:
      return { ...state, phase: 'skill_reward', _skillCandidates: action.candidates }

    case ACTION.PICK_SKILL: {
      const { skillId } = action
      const active = state.skills.active
      const inventory = state.skills.inventory

      let newActive = [...active]
      let newInventory = [...inventory]

      // 優先放入 active 槽（未滿 4 個）
      if (newActive.length < 4) {
        newActive.push(skillId)
      } else if (newInventory.length < 12) {
        newInventory.push(skillId)
      }
      // 若都滿了，不取得（由上層 UI 強制要求丟棄後再呼叫）

      return {
        ...state,
        phase: state._pendingNextScene ? 'dialogue' : 'dialogue',
        skills: { active: newActive, inventory: newInventory },
        _skillCandidates: null,
      }
    }

    case ACTION.SKIP_SKILL_REWARD:
      return { ...state, phase: 'dialogue', _skillCandidates: null }

    // ── 技能槽管理（替換整個 skills 物件）────────────────────────
    case ACTION.SET_SKILL_SLOTS:
      return { ...state, skills: action.skills }

    // ── 結局 ─────────────────────────────────────────────────────
    case ACTION.TRIGGER_ENDING: {
      const ending = action.ending ?? resolveEnding(state, state.mainRoute)
      return { ...state, phase: 'ending', ending }
    }

    // ── 存讀檔 ───────────────────────────────────────────────────
    case ACTION.OPEN_SAVE_LOAD:
      return { ...state, _prevPhase: state.phase, phase: 'save_load' }

    case ACTION.CLOSE_SAVE_LOAD:
      return { ...state, phase: state._prevPhase ?? 'dialogue', _prevPhase: null }

    case ACTION.LOAD_SAVE:
      return { ...action.savedState, phase: 'dialogue' }

    // ── 聖域淨化：所有惡魔 demon_axis −10 ──────────────────────────
    case ACTION.PURIFICATION: {
      // demon_locked 時封鎖淨化（降軸途徑禁止）
      if (state.flags.demon_locked) return state
      const demons = {}
      for (const id of Object.keys(state.demons)) {
        demons[id] = {
          ...state.demons[id],
          demon_axis: Math.max(0, (state.demons[id].demon_axis ?? 0) - 10),
        }
      }
      return { ...state, demons }
    }

    // ── 遺物調查：指定惡魔 demon_axis +8 ──────────────────────────
    case ACTION.RELIC_INTERACT: {
      const { demonId } = action
      const demon = state.demons[demonId]
      if (!demon) return state
      return {
        ...state,
        demons: {
          ...state.demons,
          [demonId]: { ...demon, demon_axis: Math.min(100, (demon.demon_axis ?? 0) + 8) },
        },
      }
    }

    // ── 休息：DES −20、HP +10、主選惡魔 demon_axis −5 ────────────
    case ACTION.REST: {
      const heroine = {
        ...state.heroine,
        DES: Math.max(0, state.heroine.DES - 20),
        HP:  Math.min(state.heroine.maxHP, state.heroine.HP + 10),
      }
      // demon_locked 時跳過 demon_axis 減少，但 DES 回復與 HP 回復照常執行
      if (state.flags.demon_locked) return { ...state, heroine }
      const primaryId = getPrimaryDemonId(state.demons)
      const demons = { ...state.demons }
      if (primaryId) {
        const cur = demons[primaryId].demon_axis ?? 0
        demons[primaryId] = { ...demons[primaryId], demon_axis: Math.max(0, cur - 5) }
      }
      return { ...state, heroine, demons }
    }

    // ── 使用道具（shroud_balm / bait_bell）─────────────────────────
    case ACTION.USE_ITEM: {
      const { itemId } = action
      const inv = state.skills.inventory.filter(i => i !== itemId && i?.id !== itemId)
      let heroine = { ...state.heroine }
      let demons  = { ...state.demons }

      if (itemId === 'shroud_balm') {
        heroine.shroud_active = true
        heroine.shroud_turns  = 3
      } else if (itemId === 'bait_bell') {
        const primaryId = getPrimaryDemonId(demons)
        if (primaryId) {
          const cur = demons[primaryId].demon_axis ?? 0
          demons[primaryId] = { ...demons[primaryId], demon_axis: Math.min(100, cur + 15) }
        }
      }

      return { ...state, heroine, demons, skills: { ...state.skills, inventory: inv } }
    }

    // ── 回主選單 ─────────────────────────────────────────────────
    case ACTION.RETURN_TO_TITLE:
      return { ...INITIAL_STATE }

    // ══════════════════════════════════════════════════════════
    // 探索系統
    // ══════════════════════════════════════════════════════════

    // 進入地圖介面
    case ACTION.ENTER_MAP:
      return { ...state, phase: 'map' }

    // 設定子層地點清單（子層開始時由 App 呼叫）
    case ACTION.SET_SUBLAYER_LOCATIONS:
      return {
        ...state,
        exploration: {
          ...state.exploration,
          currentSubLayerLocations: action.locations,
          completedLocations: [],
          restUsedInSubLayer: false,
          subLayerUnlocked: false,
        },
      }

    // 標記地點已探索
    case ACTION.COMPLETE_LOCATION: {
      const { index } = action
      const expl = state.exploration
      if (expl.completedLocations.includes(index)) return state

      const newCompleted = [...expl.completedLocations, index]
      const townVisited = expl.town_outskirts_visited ||
        (expl.currentSubLayerLocations[index] === 'town_outskirts')

      return {
        ...state,
        exploration: {
          ...expl,
          completedLocations: newCompleted,
          town_outskirts_visited: townVisited,
        },
      }
    }

    // 標記事件已完成（全域防重複）
    case ACTION.COMPLETE_EVENT: {
      const { eventId } = action
      if (state.exploration.completedEvents.includes(eventId)) return state
      return {
        ...state,
        exploration: {
          ...state.exploration,
          completedEvents: [...state.exploration.completedEvents, eventId],
        },
      }
    }

    // 推進至下一子層或下一層
    case ACTION.ADVANCE_SUBLAYER: {
      // 由 App 呼叫 MapEngine.advanceToNextSubLayer() 計算後傳入 newExploration
      const { newExploration } = action
      return { ...state, exploration: newExploration, phase: 'map' }
    }

    // 記錄戰鬥完成
    case ACTION.RECORD_BATTLE: {
      const { tierC = false } = action
      const expl = state.exploration
      return {
        ...state,
        exploration: {
          ...expl,
          layerBattleCount: expl.layerBattleCount + 1,
          tierCKillCount: tierC ? expl.tierCKillCount + 1 : expl.tierCKillCount,
        },
      }
    }

    // 標記小鎮外圍已訪問
    case ACTION.MARK_TOWN_OUTSKIRTS:
      return {
        ...state,
        exploration: { ...state.exploration, town_outskirts_visited: true },
      }

    // 標記本子層休息已使用
    case ACTION.USE_REST_IN_SUBLAYER:
      return {
        ...state,
        exploration: { ...state.exploration, restUsedInSubLayer: true },
      }

    // 標記惡魔私下互動已觸發（key = `${demonId}_${locationTypeId}`）
    case ACTION.MARK_PRIVATE_MOMENT: {
      const { demonId, key } = action
      const demon = state.demons[demonId]
      if (!demon || demon.private_moments_triggered.includes(key)) return state
      return {
        ...state,
        demons: {
          ...state.demons,
          [demonId]: {
            ...demon,
            private_moments_triggered: [...demon.private_moments_triggered, key],
          },
        },
      }
    }

    // 進入 Ch.E1 評估畫面
    case ACTION.TRIGGER_FINAL_EVAL:
      return { ...state, phase: 'final_eval' }

    // 寫入最終路線判定結果，進入 Ch.E2（dialogue phase）
    case ACTION.APPLY_FINAL_EVAL_RESULT: {
      const { route, endingTrack, interferenceTriggered } = action
      return {
        ...state,
        mainRoute: route,
        phase: 'dialogue',
        flags: {
          ...state.flags,
          ending_track: endingTrack,
          interference_triggered: interferenceTriggered ?? [],
        },
        exploration: {
          ...state.exploration,
          finalTrack: { route, endingTrack, interferenceTriggered },
        },
      }
    }

    default:
      return state
  }
}
