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
  const heroineStats = `心動${heroine.heart}/洞察${heroine.insight}/慾望${heroine.DES}/獨立${heroine.independence}`
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
          responseRef: c.response ?? '',
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
- 選項行：{"i": 數字, "prompt": "場景提示語", "choices": [{"ci": 數字, "text": "選項文字", "response": "惡魔角色對該選項的簡短回應台詞（10–40字，依角色聲音）"}, ...]}
注意：每個選項都必須生成 response，這是玩家選完後惡魔說的話。`
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
        if (!aiC) return c
        return {
          ...c,
          ...(aiC.text     ? { text: aiC.text }         : {}),
          ...(aiC.response ? { response: aiC.response } : {}),
        }
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

// ─── Scene-1 Fallback 台詞 ────────────────────────────────────

/**
 * 每個含選擇場景的 static fallback choices response
 * key = sceneId，value = choices_fallback[]（按 ci 順序排列）
 * AI 失效時注入，避免顯示原始 JSON（但保留 choice text 與其他 dialogues 不變）
 */
const SCENE_1_FALLBACK = {
  '1-4': {
    choices_fallback: [
      { response: '利用也好。至少妳還開口了。' },
      { response: '這句話，比我預期的更甜。' },
      { response: '一個值得期待的理由。' },
    ],
  },
  '1-4-r2': {
    choices_fallback: [
      { response: '有意思。那我就先記著，伺機再近一步。' },
      { response: '退讓二字，我很珍惜。' },
      { response: '因為那樣的妳，才最真實。' },
    ],
  },
  '1-7': {
    choices_fallback: [
      { response: '那就讓我看見。' },
      { response: '能活著的人，不需要讓人喜歡。' },
      { response: '兩個都有。自己挑。' },
    ],
  },
  '1-7-r2': {
    choices_fallback: [
      { response: '行。別讓我等太久。' },
      { response: '哄人費力。這樣省事多了。' },
      { response: '……少廢話。' },
    ],
  },
  '1-10': {
    choices_fallback: [
      { response: '有看見就夠了。' },
      { response: '下次我會早些。' },
      { response: '不是幫人。只是順手。' },
    ],
  },
  '1-10-r2': {
    choices_fallback: [
      { response: '……那就好。' },
      { response: '我沒有懂。只是看見。' },
      { response: '習慣，不代表喜歡。' },
    ],
  },
}

/**
 * 將 SCENE_1_FALLBACK 注入場景骨架（只覆蓋 choices[].response）
 * 其餘 text / 選項文字保持 JSON 原文
 */
function applyFallback(sceneData) {
  const fb = SCENE_1_FALLBACK[sceneData.sceneId]
  if (!fb) return sceneData

  const dialogues = sceneData.dialogues.map(d => {
    if (d.type !== 'choice') return d
    const choices = d.choices.map((c, ci) => {
      const fbChoice = fb.choices_fallback?.[ci]
      if (!fbChoice) return c
      return { ...c, response: fbChoice.response }
    })
    return { ...d, choices }
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
 * @returns {Promise<object>}  填充後的場景物件（失敗時使用 fallback 台詞）
 */
export async function fillSceneText(sceneData, gameState, apiKey, modelId) {
  try {
    const prompt = buildPrompt(sceneData, gameState)
    const raw = await callOpenRouter(apiKey, modelId, prompt)
    return mergeAIText(sceneData, raw)
  } catch (err) {
    console.warn('[AIWriter] fillSceneText 失敗，使用 fallback 台詞:', err?.message ?? err)
    return applyFallback(sceneData)
  }
}

// ─── DES 語氣映射 ──────────────────────────────────────────

function getDESTone(des) {
  if (des <= 40)  return '清醒：旁白冷靜客觀，惡魔保持距離'
  if (des <= 80)  return '動搖：旁白帶疲憊與緊繃，惡魔開始過度關注'
  if (des <= 120) return '心防崩解：旁白暗示情緒，惡魔越界行為增加'
  if (des <= 160) return '依賴萌生：情感溢出明顯，惡魔難以回到契約距離'
  return '完全沉淪：描寫深度情感依賴'
}

const AWAKENING_BONUS_DESC = {
  slayer:     'ATK+8、AGI+2，初始技能：本能突刺',
  guardian:   'maxHP+30、WIL+2，初始技能：護盾展開',
  windwalker: 'AGI+6、洞察+10，初始技能：快速連打',
  seeker:     '洞察+25、ATK+2，初始技能：弱點標記',
  apothecary: 'maxSP+40、WIL+4，初始技能：靈力回充',
  balanced:   'ATK/AGI/WIL各+2，初始技能：契約脈衝',
}

// ─── 戰鬥敘事生成 ──────────────────────────────────────────

/**
 * 生成戰鬥結束後的旁白敘事（60–150字）
 * @returns {Promise<string|null>}  純文字段落，失敗時回傳 null
 */
export async function generateCombatNarrative(combatResult, gameState, apiKey, modelId) {
  const { heroine, combat } = gameState
  const enemy = combat.enemyName ?? '魔物'
  const hpPct = Math.round((heroine.HP / heroine.maxHP) * 100)
  const resultLabel = combatResult === 'victory' ? '勝利' : combatResult === 'defeat' ? '落敗' : '撤退'

  const prompt = `你是乙女視覺小說《心鎖》的日系劇本作家。

## 任務
以女主角視角寫一段60–150字的戰鬥後旁白。

## 戰鬥結果
結果：${resultLabel}　敵人：${enemy}　剩餘HP：${hpPct}%
語氣模式：${getDESTone(heroine.DES)}

## 寫作規則
1. 純旁白，不加角色台詞引號
2. 60–150字，一段文字
3. 勝利→帶些許餘震；落敗→帶疲憊與挫折；撤退→帶緊張與解脫
4. 禁止描寫角色死亡
5. 只輸出純文字，不加任何說明或 markdown`

  try {
    const raw = await callOpenRouter(apiKey, modelId, prompt)
    return raw.replace(/```[\s\S]*?```/g, '').trim() || null
  } catch (err) {
    console.warn('[AIWriter] generateCombatNarrative 失敗:', err)
    return null
  }
}

// ─── 惡魔戰後對話生成 ─────────────────────────────────────

/**
 * 生成惡魔戰後對話 + 3個玩家回應選項
 * @returns {Promise<{ lines: string[], choices: { text: string, effects: object }[] }|null>}
 */
export async function generateDemonDialogue(demonId, combatResult, gameState, apiKey, modelId) {
  const { heroine, demons } = gameState
  const demonStats = demons[demonId]
  if (!demonStats) return null

  const resultLabel = combatResult === 'victory' ? '勝利' : combatResult === 'defeat' ? '落敗' : '撤退'

  const prompt = `你是乙女視覺小說《心鎖》的日系劇本作家。

## 角色設定
${CHAR_PROFILES[demonId] ?? demonId}

## 任務
惡魔在協助戰鬥後（${resultLabel}），與女主角有一段簡短對話。
生成惡魔的1–3句台詞，以及女主角可選的3個回應方向。

## 當前數值
好感：${demonStats.affection}　信賴：${demonStats.trust}　情慾：${demonStats.lust}
女主角視角：${demonStats.heroine_axis}　惡魔視角：${demonStats.demon_axis}
語氣模式：${getDESTone(heroine.DES)}

## 寫作規則
1. 台詞用「」；動作/心理用（）；每句10–50字
2. 3個選項要有明顯不同情緒方向（如感謝/淡漠/刺探）
3. 好感高→偏溫柔；信賴低→保持距離；情慾高→帶隱約肢體意識
4. 只輸出 JSON，不加任何說明

## 輸出格式
{"lines":["台詞1","台詞2"],"choices":[{"text":"回應A","effects":{"heroine_axis":5}},{"text":"回應B","effects":{"heroine_axis":-3,"trust":2}},{"text":"回應C","effects":{"lust":3}}]}`

  try {
    const raw = await callOpenRouter(apiKey, modelId, prompt)
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed.lines) || !Array.isArray(parsed.choices)) throw new Error('格式錯誤')
    return parsed
  } catch (err) {
    console.warn('[AIWriter] generateDemonDialogue 失敗:', err)
    return null
  }
}

// ─── 覺醒演出台詞生成 ─────────────────────────────────────

/**
 * 生成覺醒演出台詞序列（3–6條）
 * @returns {Promise<{ speaker: string, text: string }[]|null>}
 */
export async function generateAwakeningScene(awakeningType, gameState, apiKey, modelId) {
  const prompt = `你是乙女視覺小說《心鎖》的日系劇本作家。

## 任務
女主角剛完成覺醒試煉，以戲劇性方式發現自己的力量。
生成3–6條覺醒演出台詞（旁白或女主角內心）。

## 覺醒類型
${awakeningType}（${AWAKENING_BONUS_DESC[awakeningType] ?? awakeningType}）

## 寫作規則
1. 旁白不加引號；女主角內心用（ ）
2. 每條10–40字
3. 情緒層次：困惑/痛楚 → 震驚 → 覺悟/決意
4. 只輸出 JSON，不加說明

## 輸出格式
[{"speaker":"narrator","text":"台詞"},{"speaker":"heroine","text":"台詞"}]`

  try {
    const raw = await callOpenRouter(apiKey, modelId, prompt)
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) throw new Error('格式錯誤')
    return parsed
  } catch (err) {
    console.warn('[AIWriter] generateAwakeningScene 失敗:', err)
    return null
  }
}

// ─── 調查事件文本生成 ───────────────────────────────────────

/**
 * 生成調查事件各階段文本
 *
 * @param {'thorough'|'quick_success'|'quick_failure'|'deep_success'|'deep_failure'} mode
 * @param {Object} locationData   - LocationDB 地點物件（含 name, description, aiPromptHint）
 * @param {Object} gameState      - 完整 GameState
 * @param {string} apiKey         - OpenRouter API Key
 * @param {string} modelId        - 模型 ID
 * @param {Object} [extra]        - 額外參數
 * @param {string} [extra.objectName] - deep_success/deep_failure 時的子物件名稱
 * @returns {Promise<
 *   { intro: string, objects: string[] } |
 *   { narrative: string } |
 *   null
 * >}
 */
export async function generateInvestigationText(mode, locationData, gameState, apiKey, modelId, extra = {}) {
  const { heroine } = gameState
  const locName = locationData?.name ?? '未知地點'
  const locHint = locationData?.aiPromptHint ?? locationData?.description ?? ''
  const desStr = getDESTone(heroine?.DES ?? 0)

  let prompt

  if (mode === 'thorough') {
    prompt = `你是乙女視覺小說《心鎖》的日系劇本作家。

## 任務
女主角正在對「${locName}」進行仔細搜查。
生成：
1. 一段30–60字的場景導入旁白（intro）
2. 該地點內3個可以進一步調查的具體子物件名稱（objects，每個5–12字的名詞短語）

## 地點氛圍
${locHint}

## 寫作規則
1. 旁白不加引號；物件名稱為具體名詞短語（如「牆角的鏽蝕箱子」、「地面的奇異紋路」）
2. 語氣模式：${desStr}
3. 只輸出 JSON，不加任何說明或 markdown

## 輸出格式
{"intro":"旁白文字","objects":["物件A","物件B","物件C"]}`
  } else if (mode === 'quick_success') {
    prompt = `你是乙女視覺小說《心鎖》的日系劇本作家。

## 任務
女主角對「${locName}」進行快速掃視，結果成功發現線索。
生成一段30–50字的結果旁白。

## 地點氛圍
${locHint}

## 寫作規則
1. 純旁白，不加引號
2. 語氣：輕巧迅速，帶一點收穫感
3. 語氣模式：${desStr}
4. 只輸出 JSON，不加說明

## 輸出格式
{"narrative":"旁白文字"}`
  } else if (mode === 'quick_failure') {
    prompt = `你是乙女視覺小說《心鎖》的日系劇本作家。

## 任務
女主角對「${locName}」進行快速掃視，結果什麼都沒發現。
生成一段25–45字的結果旁白。

## 地點氛圍
${locHint}

## 寫作規則
1. 純旁白，不加引號
2. 語氣：略帶落空感，但無懲罰
3. 語氣模式：${desStr}
4. 只輸出 JSON，不加說明

## 輸出格式
{"narrative":"旁白文字"}`
  } else if (mode === 'deep_success') {
    const objName = extra.objectName ?? '目標物件'
    prompt = `你是乙女視覺小說《心鎖》的日系劇本作家。

## 任務
女主角仔細調查了「${locName}」中的「${objName}」，調查成功，有所發現。
生成一段35–60字的調查結果旁白。

## 地點氛圍
${locHint}

## 寫作規則
1. 純旁白，不加引號
2. 語氣：帶發現感與成就感
3. 語氣模式：${desStr}
4. 只輸出 JSON，不加說明

## 輸出格式
{"narrative":"旁白文字"}`
  } else if (mode === 'deep_failure') {
    const objName = extra.objectName ?? '目標物件'
    prompt = `你是乙女視覺小說《心鎖》的日系劇本作家。

## 任務
女主角仔細調查了「${locName}」中的「${objName}」，但調查失敗，什麼都沒找到。
生成一段30–50字的調查結果旁白。

## 地點氛圍
${locHint}

## 寫作規則
1. 純旁白，不加引號
2. 語氣：無懲罰，帶輕微挫折感或謎團感
3. 語氣模式：${desStr}
4. 只輸出 JSON，不加說明

## 輸出格式
{"narrative":"旁白文字"}`
  } else {
    return null
  }

  try {
    const raw = await callOpenRouter(apiKey, modelId, prompt)
    const cleaned = raw
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```$/m, '')
      .trim()
    const parsed = JSON.parse(cleaned)

    if (mode === 'thorough') {
      if (typeof parsed.intro !== 'string' || !Array.isArray(parsed.objects) || parsed.objects.length < 3) {
        throw new Error('thorough 回傳格式錯誤')
      }
      return { intro: parsed.intro, objects: parsed.objects.slice(0, 3) }
    } else {
      if (typeof parsed.narrative !== 'string') throw new Error('narrative 格式錯誤')
      return { narrative: parsed.narrative }
    }
  } catch (err) {
    console.warn('[AIWriter] generateInvestigationText 失敗:', err?.message ?? err)
    return null
  }
}

// ─── API Key 驗證 ──────────────────────────────────────────

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
