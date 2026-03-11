/**
 * App.jsx — 主入口，串接遊戲引擎與所有 UI 元件
 */
import { useReducer, useEffect, useCallback, useRef, useState } from 'react'
import { gameReducer, INITIAL_STATE, ACTION } from './engine/GameEngine.js'
import { fillSceneText } from './engine/AIWriter.js'
import { useSceneLoader } from './hooks/useSceneLoader.js'
import { useAISettings } from './hooks/useAISettings.js'

// 畫面元件
import TitleScreen from './components/TitleScreen.jsx'
import BackgroundLayer from './components/BackgroundLayer.jsx'
import CharacterSprite from './components/CharacterSprite.jsx'
import DialogueBox from './components/DialogueBox.jsx'
import ChoicePanel from './components/ChoicePanel.jsx'
import DiceModal from './components/DiceModal.jsx'
import StatsDisplay from './components/StatsDisplay.jsx'
import SaveLoadMenu from './components/SaveLoadMenu.jsx'
import EndingScreen from './components/EndingScreen.jsx'
import AISettingsPanel from './components/AISettingsPanel.jsx'

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE)
  const { loadScene, loading: sceneLoading } = useSceneLoader()
  const { settings: aiSettings, update: updateAISettings } = useAISettings()

  // AI 生成狀態
  const [aiStatus, setAIStatus] = useState('idle')
  const [aiErrorMsg, setAIErrorMsg] = useState('')
  const aiErrorTimerRef = useRef(null)

  // 用 ref 追蹤最新 state（避免 goToScene callback 的 stale closure）
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // 面板開關狀態
  const [showAISettings, setShowAISettings] = useState(false)
  const [showSaveLoad, setShowSaveLoad] = useState(false)

  // ── AI 錯誤訊息自動消失 ──────────────────────────────────────
  useEffect(() => {
    if (aiStatus === 'error') {
      clearTimeout(aiErrorTimerRef.current)
      aiErrorTimerRef.current = setTimeout(() => setAIStatus('idle'), 4000)
    }
    return () => clearTimeout(aiErrorTimerRef.current)
  }, [aiStatus])

  // ── 場景載入（含 AI 填充）────────────────────────────────────
  const goToScene = useCallback(async (sceneId) => {
    // 1. 載入 JSON 骨架
    const skeleton = await loadScene(sceneId)
    if (!skeleton) return

    let sceneData = skeleton

    // 2. 若 AI 模式開啟且 Key 有效，填充文本
    if (aiSettings.enabled && aiSettings.apiKey) {
      setAIStatus('generating')
      try {
        sceneData = await fillSceneText(
          skeleton,
          stateRef.current,
          aiSettings.apiKey,
          aiSettings.modelId,
        )
        setAIStatus('idle')
      } catch (err) {
        console.error('[App] AI 生成失敗，回退至靜態文本', err)
        setAIErrorMsg(err?.message ?? '未知錯誤')
        setAIStatus('error')
        // sceneData 保持原始骨架（fallback）
      }
    }

    dispatch({ type: ACTION.LOAD_SCENE, sceneData })
  }, [loadScene, aiSettings])

  // ── 遊戲開始 → 載入第一個場景 ────────────────────────────────
  const handleStart = useCallback(async () => {
    dispatch({ type: ACTION.START_GAME })
    await goToScene('1-1')
  }, [goToScene])

  // ── 對話推進 ─────────────────────────────────────────────────
  const handleAdvance = useCallback(async () => {
    const { sceneData, currentDialogue } = stateRef.current

    if (sceneData && currentDialogue + 1 >= sceneData.dialogues.length) {
      const nextScene = sceneData.nextScene
      if (nextScene) {
        await goToScene(nextScene)
      } else if (sceneData.isChapterEnd) {
        dispatch({ type: ACTION.TRIGGER_ENDING })
      }
      return
    }

    dispatch({ type: ACTION.ADVANCE })
  }, [goToScene])

  // 選項選擇後的場景跳轉（由 _pendingNextScene 觸發）
  useEffect(() => {
    if (state._pendingNextScene) {
      goToScene(state._pendingNextScene)
    }
  }, [state._pendingNextScene, goToScene])

  // ── 選項選擇 ─────────────────────────────────────────────────
  const handleSelect = useCallback((choice) => {
    dispatch({ type: ACTION.SELECT_CHOICE, choice })
  }, [])

  // ── 骰點確認 ─────────────────────────────────────────────────
  const handleDiceContinue = useCallback(async () => {
    dispatch({ type: ACTION.ACKNOWLEDGE_DICE })
    const pending = stateRef.current._pendingNextScene
    if (pending) await goToScene(pending)
  }, [goToScene])

  // ── 存讀檔 ───────────────────────────────────────────────────
  const handleLoadSave = (savedState) => {
    dispatch({ type: ACTION.LOAD_SAVE, savedState })
    setShowSaveLoad(false)
  }

  // ── 結局後回主選單 ────────────────────────────────────────────
  const handleRestart = () => dispatch({ type: ACTION.RETURN_TO_TITLE })

  // ── 當前對話物件 ─────────────────────────────────────────────
  const currentDialogueObj = state.sceneData?.dialogues[state.currentDialogue]
  const isChoiceNext = (() => {
    if (!state.sceneData) return false
    const next = state.sceneData.dialogues[state.currentDialogue + 1]
    return next?.type === 'choice' || next?.type === 'dice_choice'
  })()

  // ── 角色立繪解析（sprite = 'char_a_smile' → charId + expression）
  const sprites = (() => {
    const sprite = currentDialogueObj?.sprite
    if (!sprite) return []
    // 格式：char_a_smile, char_b_serious 等
    const match = sprite.match(/^(char_[abc])_?(.*)$/)
    if (!match) return []
    return [{ charId: match[1], expression: match[2] || 'default' }]
  })()

  // ── 存讀檔 / AI 設定面板在 game 畫面上疊加顯示 ────────────────
  const showInGameOverlay = state.phase === 'dialogue' || state.phase === 'choice' || state.phase === 'dice'

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-game-dark">

      {/* ── 主選單 ── */}
      {state.phase === 'title' && (
        <TitleScreen
          onStart={handleStart}
          onLoadSave={() => setShowSaveLoad(true)}
          onAISettings={() => setShowAISettings(true)}
          aiEnabled={aiSettings.enabled}
        />
      )}

      {/* ── 遊戲主畫面 ── */}
      {showInGameOverlay && (
        <>
          <BackgroundLayer background={state.sceneData?.background} />

          {sprites.map((s, i) => (
            <CharacterSprite key={i} charId={s.charId} expression={s.expression} position="center" active />
          ))}

          <StatsDisplay heroine={state.heroine} characters={state.characters} mainRoute={state.mainRoute} />

          {/* HUD 按鈕列 */}
          <div className="absolute top-4 left-4 z-20 flex gap-2">
            <button
              className="px-3 py-1 game-panel text-gray-400 hover:text-game-accent text-xs rounded transition-colors"
              onClick={() => setShowSaveLoad(true)}
            >
              ☰ 選單
            </button>
            <button
              className={`px-3 py-1 game-panel text-xs rounded transition-colors ${
                aiSettings.enabled ? 'text-purple-400 hover:text-purple-300' : 'text-gray-600 hover:text-gray-400'
              }`}
              onClick={() => setShowAISettings(true)}
              title={aiSettings.enabled ? 'AI 模式開啟' : 'AI 模式關閉'}
            >
              ✦ AI{aiSettings.enabled ? ' ●' : ''}
            </button>
          </div>

          {/* 對話框 */}
          {state.phase === 'dialogue' && currentDialogueObj && currentDialogueObj.type !== 'choice' && (
            <DialogueBox
              dialogue={currentDialogueObj}
              onAdvance={handleAdvance}
              isChoiceNext={isChoiceNext}
            />
          )}

          {/* 選項面板 */}
          {state.phase === 'choice' && state.pendingChoices && (
            <ChoicePanel
              choices={state.pendingChoices}
              prompt={currentDialogueObj?.prompt}
              onSelect={handleSelect}
            />
          )}

          {/* 骰點 Modal */}
          {state.phase === 'dice' && state.diceResult && (
            <DiceModal diceResult={state.diceResult} onContinue={handleDiceContinue} />
          )}

          {/* AI 生成中遮罩 */}
          {aiStatus === 'generating' && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="text-game-accent text-sm animate-pulse mb-2">✦ AI 正在創作中…</div>
              <div className="text-gray-500 text-xs">依模型不同約需 1–5 秒</div>
            </div>
          )}

          {/* 場景 JSON 載入中（快速） */}
          {sceneLoading && aiStatus !== 'generating' && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40">
              <span className="text-game-accent animate-pulse text-sm">載入中…</span>
            </div>
          )}

          {/* AI 錯誤提示（自動消失） */}
          {aiStatus === 'error' && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-red-950/80 border border-red-800 rounded text-red-300 text-xs max-w-sm text-center">
              ⚠ AI 生成失敗，已回退至原始文本
              {aiErrorMsg && <div className="mt-1 text-red-400 opacity-80">{aiErrorMsg}</div>}
            </div>
          )}
        </>
      )}

      {/* ── 結局畫面 ── */}
      {state.phase === 'ending' && (
        <EndingScreen ending={state.ending} onRestart={handleRestart} />
      )}

      {/* ── 覆蓋層：存讀檔 ── */}
      {showSaveLoad && (
        <SaveLoadMenu
          state={state}
          onLoad={handleLoadSave}
          onClose={() => setShowSaveLoad(false)}
        />
      )}

      {/* ── 覆蓋層：AI 設定 ── */}
      {showAISettings && (
        <AISettingsPanel
          settings={aiSettings}
          onUpdate={updateAISettings}
          onClose={() => setShowAISettings(false)}
        />
      )}
    </div>
  )
}
