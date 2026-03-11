/**
 * GameEngine — 遊戲狀態機（useReducer 的 reducer 與 action creators）
 *
 * GameState 結構：
 * {
 *   phase: 'title' | 'dialogue' | 'choice' | 'dice' | 'ending' | 'save_load',
 *   currentChapter: number,
 *   currentScene: string,
 *   currentDialogue: number,
 *   mainRoute: string | null,     // 分歧後的攻略角色 ID
 *   sceneData: object | null,     // 當前載入的場景 JSON
 *   heroine: { guard, flutter, insight, charm, desire },
 *   characters: {
 *     char_a: { affection, progress, trust, lust },
 *     char_b: { affection, progress, trust, lust },
 *     char_c: { affection, progress, trust, lust },
 *   },
 *   flags: {},
 *   choiceHistory: [],
 *   pendingChoices: [] | null,    // 當前可選選項（已過濾條件）
 *   diceResult: object | null,    // 最近一次骰點結果
 *   ending: object | null,        // 最終結局物件
 * }
 */

import { INITIAL_HEROINE, INITIAL_CHARACTER, applyEffects } from './StatsManager.js'
import { resolveChoices, executeChoice } from './ChoiceResolver.js'
import { resolveEnding } from './EndingResolver.js'

// ─── 初始狀態 ──────────────────────────────────────────────────

export const INITIAL_STATE = {
  phase: 'title',
  currentChapter: 1,
  currentScene: '1-1',
  currentDialogue: 0,
  mainRoute: null,
  sceneData: null,
  heroine: { ...INITIAL_HEROINE },
  characters: {
    char_a: { ...INITIAL_CHARACTER },
    char_b: { ...INITIAL_CHARACTER },
    char_c: { ...INITIAL_CHARACTER },
  },
  flags: {},
  choiceHistory: [],
  pendingChoices: null,
  diceResult: null,
  ending: null,
}

// ─── Action Types ──────────────────────────────────────────────

export const ACTION = {
  START_GAME: 'START_GAME',
  LOAD_SCENE: 'LOAD_SCENE',
  ADVANCE: 'ADVANCE',         // 推進對話
  SHOW_CHOICES: 'SHOW_CHOICES',
  SELECT_CHOICE: 'SELECT_CHOICE',
  ACKNOWLEDGE_DICE: 'ACKNOWLEDGE_DICE',  // 看完骰點動畫後繼續
  SET_FLAG: 'SET_FLAG',
  SET_ROUTE: 'SET_ROUTE',
  TRIGGER_ENDING: 'TRIGGER_ENDING',
  OPEN_SAVE_LOAD: 'OPEN_SAVE_LOAD',
  CLOSE_SAVE_LOAD: 'CLOSE_SAVE_LOAD',
  LOAD_SAVE: 'LOAD_SAVE',
  RETURN_TO_TITLE: 'RETURN_TO_TITLE',
}

// ─── Reducer ──────────────────────────────────────────────────

export function gameReducer(state, action) {
  switch (action.type) {

    case ACTION.START_GAME:
      return { ...INITIAL_STATE, phase: 'dialogue' }

    case ACTION.LOAD_SCENE: {
      return {
        ...state,
        sceneData: action.sceneData,
        currentScene: action.sceneData.sceneId,
        currentDialogue: 0,
        phase: 'dialogue',
        pendingChoices: null,
        diceResult: null,
      }
    }

    case ACTION.ADVANCE: {
      const { sceneData, currentDialogue } = state
      if (!sceneData) return state

      const nextIdx = currentDialogue + 1

      // 到達場景末尾 → 觸發結局判定或等待下一場景
      if (nextIdx >= sceneData.dialogues.length) {
        // 若有設定 nextScene，由外部 useEffect 載入
        return { ...state, currentDialogue: nextIdx }
      }

      const nextDialogue = sceneData.dialogues[nextIdx]

      // 下一行是選項
      if (nextDialogue.type === 'choice') {
        const choices = resolveChoices(nextDialogue.choices, state)
        return {
          ...state,
          currentDialogue: nextIdx,
          phase: 'choice',
          pendingChoices: choices,
        }
      }

      // 下一行是骰點選項
      if (nextDialogue.type === 'dice_choice') {
        return {
          ...state,
          currentDialogue: nextIdx,
          phase: 'choice',
          pendingChoices: [nextDialogue], // 單一骰點選項
        }
      }

      return { ...state, currentDialogue: nextIdx, phase: 'dialogue' }
    }

    case ACTION.SELECT_CHOICE: {
      const { choice } = action
      const result = executeChoice(choice, state, state.mainRoute)

      const newState = {
        ...result.newState,
        choiceHistory: [...state.choiceHistory, { choiceId: choice.id ?? choice.text, scene: state.currentScene }],
        pendingChoices: null,
        phase: result.diceResult ? 'dice' : 'dialogue',
        diceResult: result.diceResult ?? null,
      }

      // 如果骰點直接導向下一場景，記錄 nextScene
      if (result.nextScene) {
        newState._pendingNextScene = result.nextScene
      }

      return newState
    }

    case ACTION.ACKNOWLEDGE_DICE: {
      // 骰點動畫確認後，清除 diceResult，繼續推進
      return { ...state, phase: 'dialogue', diceResult: null }
    }

    case ACTION.SET_FLAG: {
      return {
        ...state,
        flags: { ...state.flags, [action.flag]: action.value },
      }
    }

    case ACTION.SET_ROUTE: {
      return { ...state, mainRoute: action.charId }
    }

    case ACTION.TRIGGER_ENDING: {
      const ending = action.ending ?? resolveEnding(state, state.mainRoute)
      return { ...state, phase: 'ending', ending }
    }

    case ACTION.OPEN_SAVE_LOAD: {
      return { ...state, _prevPhase: state.phase, phase: 'save_load' }
    }

    case ACTION.CLOSE_SAVE_LOAD: {
      return { ...state, phase: state._prevPhase ?? 'dialogue', _prevPhase: undefined }
    }

    case ACTION.LOAD_SAVE: {
      return { ...action.savedState, phase: 'dialogue' }
    }

    case ACTION.RETURN_TO_TITLE: {
      return { ...INITIAL_STATE }
    }

    default:
      return state
  }
}
