/**
 * AIWriter — 方案 C 場景預生成
 *
 * 流程：
 *   loadScene(sceneId) → 取得 JSON 骨架
 *   fillSceneText(骨架, gameState, apiKey, modelId)
 *     → 送交 OpenRouter → AI 生成 text 欄位
 *     → mergeAIText 將 AI 回傳結果合併回骨架
 *     → 回傳完整場景物件（effects / conditions / next 完全不動）
 */

// ─── 可選模型 ─────────────────────────────────────────────────

export const MODELS = [
  {
    id: 'google/gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: '快速・低成本・繁體中文品質佳',
  },
  {
    id: 'x-ai/grok-4:fast',
    label: 'Grok 4.1 Fast',
    description: '個性強烈・適合挑釁與成人語境',
  },
]

import { DEMON_DATA } from './DemonSystem.js'

// ─── 角色設定（送入 prompt 的角色聲音描述）────────────────────

const CHAR_PROFILES = {
  demon_a: '瑠夜｜第七階束縛惡魔・控制封印型・低沉溫柔的語調下藏著不動聲色的支配慾，習慣用問句代替命令',
  demon_b: '颯牙｜第五階戰鬼惡魔・物理爆發型・語氣直接強硬，喜歡用挑釁逼對方露出真性情，輸了才會沉默',
  demon_c: '玄冥｜第九階詛咒惡魔・詛咒削弱型・極少說話，開口必藏深意，習慣以沉默讓對方自己填補恐懼',
}

const SPEAKER_LABEL = {
  narrator: '旁白',
  heroine:  '女主角',
  demon_a:  '瑠夜',
  demon_b:  '颯牙',
  demon_c:  '玄冥',
}

// ─── Prompt 建構 ──────────────────────────────────────────────

/**
 * 根據場景骨架與遊戲狀態建構 AI prompt
 */
function buildPrompt(sceneData, gameState) {
  const { heroine, demons, mainRoute, currentChapter, flags } = gameState
  const demonStats = mainRoute ? demons[mainRoute] : null

  // 數值快照（緊湊格式）
  const heroineStats = `心防${heroine.heart_guard}/心動${heroine.heart_flutter}/洞察${heroine.insight}/獨立${heroine.independence}/慾望${heroine.desire}`
  const charStatsStr = demonStats
    ? `${SPEAKER_LABEL[mainRoute] ?? mainRoute}（${DEMON_DATA[mainRoute]?.rank ?? ''}）: 好感${demonStats.affection}/惡魔軸${demonStats.demon_axis}/信賴${demonStats.trust}/情慾${demonStats.lust}`
    : ''

  // 場景中出現的角色設定
  const involvedSpeakers = [...new Set(
    sceneData.dialogues
      .filter(d => d.speaker && d.speaker !== 'narrator' && d.speaker !== 'heroine')
      .map(d => d.speaker)
  )]
  const profiles = involvedSpeakers.map(s => CHAR_PROFILES[s]).filter(Boolean).join('\n')

  // 骨架 JSON（每條帶 textRef 作為方向參考，AI 生成新的 text）
  const skeleton = sceneData.dialogues.map((d, i) => {
    if (d.type === 'choice') {
      return {
        i,
        type: 'choice',
        promptRef: d.prompt ?? '',
        choices: d.choices.map((c, ci) => ({
          ci,
          choiceType: c.type,
          textRef: c.text ?? '',
        })),
      }
    }
    return {
      i,
      speaker: d.speaker,
      sprite: d.sprite ?? null,
      textRef: d.text ?? '',
    }
  })

  return `你是乙女視覺小說《心鎖》的日系劇本作家，風格細膩，擅長心理張力與情感拉扯。

## 當前場景資訊
章節：第 ${currentChapter} 章　場景 ID：${sceneData.sceneId}　背景：${sceneData.background ?? '未知'}
路線：${mainRoute ? SPEAKER_LABEL[mainRoute] : '共通'}

## 數值狀態（影響語氣）
女主角：${heroineStats}
${charStatsStr}

## 角色設定
${profiles || '（共通路線，未進入個別路線）'}

## 寫作規則
1. 角色台詞用「」包住；旁白不加引號；動作/心理用（）包住
2. 每條文字 10–60 字
3. 數值影響語氣：心防高→女主角冷漠疏離；心動高→旁白帶暗示性；情慾≥60→描寫加入肢體意識；慾望≥60→女主角主動意識增強
4. 維持角色一致的聲音（依上方設定）
5. 禁止輸出任何說明、註解或 markdown，只輸出 JSON

## 骨架（textRef 為原稿方向，請生成新的 text）
${JSON.stringify(skeleton)}

## 輸出格式
輸出一個 JSON 陣列，每個元素對應一條對話：
- 普通對話：{"i": 數字, "text": "生成文字"}
- 選項行：{"i": 數字, "prompt": "場景提示語", "choices": [{"ci": 數字, "text": "選項文字"}, ...]}`
}

// ─── API 呼叫 ─────────────────────────────────────────────────

/**
 * 呼叫 OpenRouter Chat Completions API
 * @returns {Promise<string>} AI 回傳的原始文字
 */
async function callOpenRouter(apiKey, modelId, prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'HeartLock',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 2048,
    }),
  })

  const data = await response.json().catch(() => null)
  console.log('[AIWriter] HTTP status:', response.status, '| model:', modelId)
  console.log('[AIWriter] response body:', data)

  if (!response.ok) {
    const msg = data?.error?.message ?? data?.message ?? `HTTP ${response.status}`
    throw new Error(msg)
  }

  const content = data?.choices?.[0]?.message?.content ?? ''
  if (!content) {
    console.warn('[AIWriter] 模型回傳空內容，raw data:', data)
    throw new Error('模型回傳空內容（可能被 content filter 擋下）')
  }

  console.log('[AIWriter] raw content (前200字):', content.slice(0, 200))
  return content
}

// ─── 文本合併 ─────────────────────────────────────────────────

/**
 * 將 AI 回傳的 JSON 合併回場景骨架
 * 若解析失敗，安靜回退使用原始骨架
 */
function mergeAIText(sceneData, aiRaw) {
  let parsed
  try {
    // 清除可能的 markdown fences
    const cleaned = aiRaw
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```$/m, '')
      .trim()
    parsed = JSON.parse(cleaned)
  } catch {
    console.warn('[AIWriter] JSON 解析失敗，保留原始文本')
    return sceneData
  }

  if (!Array.isArray(parsed)) {
    console.warn('[AIWriter] 回傳格式非陣列，保留原始文本')
    return sceneData
  }

  const aiMap = new Map(parsed.map(item => [item.i, item]))

  const dialogues = sceneData.dialogues.map((d, i) => {
    const ai = aiMap.get(i)
    if (!ai) return d

    if (d.type === 'choice') {
      const choices = d.choices.map((c, ci) => {
        const aiC = ai.choices?.find(x => x.ci === ci)
        return aiC?.text ? { ...c, text: aiC.text } : c
      })
      return {
        ...d,
        prompt: ai.prompt ?? d.prompt,
        choices,
      }
    }

    return { ...d, text: ai.text ?? d.text }
  })

  return { ...sceneData, dialogues }
}

// ─── 主要對外函式 ─────────────────────────────────────────────

/**
 * 填充場景文本
 *
 * @param {object} sceneData   原始場景 JSON 骨架
 * @param {object} gameState   當前 GameState
 * @param {string} apiKey      OpenRouter API Key
 * @param {string} modelId     模型 ID
 * @returns {Promise<object>}  填充後的場景物件（失敗時回傳原始骨架）
 */
export async function fillSceneText(sceneData, gameState, apiKey, modelId) {
  const prompt = buildPrompt(sceneData, gameState)
  const raw = await callOpenRouter(apiKey, modelId, prompt)
  return mergeAIText(sceneData, raw)
}

/**
 * 驗證 OpenRouter API Key（輕量呼叫）
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export async function verifyAPIKey(apiKey) {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const data = await res.json()
    if (data?.data?.label) {
      return { ok: true, message: `已驗證：${data.data.label}` }
    }
    return { ok: false, message: 'API Key 無效' }
  } catch {
    return { ok: false, message: '連線失敗，請確認網路狀態' }
  }
}
