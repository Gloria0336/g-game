/**
 * useActiveAIWriter — AI 路由 hook
 *
 * 根據 r18Settings.enabled 決定路由至 AIWriterR18 或 AIWriter（SFW）。
 * API 金鑰永遠使用 aiSettings.apiKey（共用）。
 * 模型 ID 依當前模式選擇。
 */
import * as SFW from '../engine/AIWriter.js'
import * as R18 from '../engine/AIWriterR18.js'

/**
 * @param {object} aiSettings   - 來自 useAISettings()
 * @param {object} r18Settings  - 來自 useAIR18Settings()
 * @returns {{
 *   apiKey: string,
 *   modelId: string,
 *   writer: typeof SFW | typeof R18,
 *   enabled: boolean,
 *   r18Active: boolean
 * }}
 */
export function useActiveAIWriter(aiSettings, r18Settings) {
  const r18Active = r18Settings.enabled

  const apiKey = aiSettings.apiKey
  const modelId = r18Active ? r18Settings.modelId : aiSettings.modelId
  const writer = r18Active ? R18 : SFW
  const enabled = (r18Active ? r18Settings.enabled : aiSettings.enabled) && !!apiKey

  return { apiKey, modelId, writer, enabled, r18Active }
}
