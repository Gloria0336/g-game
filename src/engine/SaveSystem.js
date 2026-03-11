/**
 * SaveSystem — 存讀檔管理（使用 localStorage）
 */

const SAVE_KEY_PREFIX = 'heartlock_save_'
const MAX_SLOTS = 5

/**
 * 儲存遊戲至指定槽位
 * @param {number} slot    0–4
 * @param {object} state   GameState（不含 UI 暫存欄位）
 */
export function saveGame(slot, state) {
  const saveData = {
    ...state,
    // 排除 UI 暫存欄位
    sceneData: null,
    pendingChoices: null,
    diceResult: null,
    _prevPhase: undefined,
    _pendingNextScene: undefined,
    savedAt: new Date().toISOString(),
  }
  localStorage.setItem(`${SAVE_KEY_PREFIX}${slot}`, JSON.stringify(saveData))
}

/**
 * 從指定槽位讀取存檔
 * @param {number} slot
 * @returns {object|null}
 */
export function loadGame(slot) {
  const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * 取得所有存檔槽位的摘要資訊
 * @returns {Array<{ slot, savedAt, chapter, scene }|null>}
 */
export function listSaves() {
  return Array.from({ length: MAX_SLOTS }, (_, i) => {
    const data = loadGame(i)
    if (!data) return null
    return {
      slot: i,
      savedAt: data.savedAt,
      chapter: data.currentChapter,
      scene: data.currentScene,
      route: data.mainRoute,
    }
  })
}

/**
 * 刪除指定槽位的存檔
 * @param {number} slot
 */
export function deleteSave(slot) {
  localStorage.removeItem(`${SAVE_KEY_PREFIX}${slot}`)
}
