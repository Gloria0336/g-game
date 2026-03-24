/**
 * App.jsx — 主入口，V3.0
 * 串接遊戲引擎（Phase A）所有 UI 元件與戰鬥邏輯
 */
import { useReducer, useEffect, useCallback, useRef, useState } from 'react'
import { getEquipmentData } from './engine/EquipmentDB.js'
import { getWeaponData } from './engine/WeaponDB.js'
import { getAccessoryData } from './engine/AccessoriesDB.js'
import { getItemData } from './engine/ItemDB.js'
import { gameReducer, INITIAL_STATE, ACTION } from './engine/GameEngine.js'
import { generateSubLayerLocations } from './engine/MapEngine.js'
import { useAIR18Settings } from './hooks/useAIR18Settings.js'
import { useActiveAIWriter } from './hooks/useActiveAIWriter.js'
import { judgeAwakeningType } from './engine/StatsManager.js'
import {
  executeBasicAttack,
  executeSkill,
  executeEnemyAttack,
  executeDefend,
  canTriggerSummon,
  buildTurnQueue,
  processStatusEffects,
  tickCooldowns,
} from './engine/CombatEngine.js'
import {
  DEMON_DATA,
  createDemonUnit,
  executeActiveSummonEffect,
  executeDemonTurn,
  executeDemonSkill,
  executeEnemyAttackOnDemon,
} from './engine/DemonSystem.js'
import { getSkillData } from './engine/SkillDB.js'
import { rollSkillReward } from './engine/SkillRewardSystem.js'
import { getMonsterData } from './engine/MonsterDB.js'
import { resolveDesOverflowEnding, evaluateFinalTrack } from './engine/EndingResolver.js'
import { useSceneLoader } from './hooks/useSceneLoader.js'
import { useAISettings } from './hooks/useAISettings.js'

// ── UI 元件 ──────────────────────────────────────────────────
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
import CombatScreen from './components/CombatScreen.jsx'
import DemonSummonModal from './components/DemonSummonModal.jsx'
import SkillRewardScreen from './components/SkillRewardScreen.jsx'
import SkillManageScreen from './components/SkillManageScreen.jsx'
import DemonDialogueScreen from './components/DemonDialogueScreen.jsx'
import WorldMapScreen from './components/WorldMapScreen.jsx'
import DebugMenu from './components/DebugMenu.jsx' // [NEW]

// ── 背包 Modal ────────────────────────────────────────────────

function InventoryModal({ heroine, onClose }) {
  const equip = heroine.equipment ?? {}
  const items = heroine.items ?? []
  const slots = [
    { key: 'weapon', label: '武器' },
    { key: 'accessory', label: '飾品' },
    { key: 'upper', label: '上衣' },
    { key: 'lower', label: '下身' },
  ]
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-start" onClick={onClose}>
      <div
        className="m-4 mb-16 w-80 game-panel rounded-lg p-4 flex flex-col gap-3"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm font-semibold">🎒 背包</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xs">✕</button>
        </div>

        {/* 裝備欄 */}
        <div>
          <div className="text-gray-500 text-xs mb-1.5">裝備中</div>
          <div className="grid grid-cols-4 gap-1.5">
            {slots.map(({ key, label }) => {
              const e = equip[key]
              let data = null
              if (e) {
                if (key === 'weapon') data = getWeaponData(e.id)
                else if (key === 'accessory') data = getAccessoryData(e.id)
                else data = getEquipmentData(e.id)
              }
              return (
                <div key={key}
                  className="bg-gray-900 border border-gray-700 rounded p-1.5 flex flex-col
                             items-center justify-center min-h-[52px] text-center">
                  <div className="text-gray-600 text-xs mb-0.5">{label}</div>
                  {data ? (
                    <>
                      <div className="text-gray-200 text-xs font-semibold leading-tight">{data.name}</div>
                      {e.durability != null && (
                        <div className={`text-xs mt-0.5 ${e.durability >= 60 ? 'text-blue-400' :
                            e.durability >= 30 ? 'text-yellow-400' : 'text-red-500'
                          }`}>{e.durability}</div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-700 text-xs">空</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 背包物品 */}
        <div>
          <div className="text-gray-500 text-xs mb-1.5">背包物品</div>
          {items.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {items.map((item, i) => {
                const data = getItemData(item.id)
                return (
                  <div key={i}
                    className="bg-gray-900 border border-gray-700 rounded px-2 py-1"
                    title={data?.description ?? ''}>
                    <span className="text-gray-300 text-xs">{data?.name ?? item.id}</span>
                    {(item.quantity ?? 1) > 1 && (
                      <span className="text-gray-500 text-xs ml-1">×{item.quantity}</span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-gray-700 text-xs">（背包空空如也）</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 覺醒結果面板 ─────────────────────────────────────────────

const AWAKENING_LABELS = {
  slayer: '本能覺醒・屠戮者',
  guardian: '防禦覺醒・守護者',
  windwalker: '戰術覺醒・逐風者',
  seeker: '洞察覺醒・尋求者',
  apothecary: '靈性覺醒・調律者',
  balanced: '均衡覺醒・無名之力',
}
const AWAKENING_SKILLS = {
  slayer: '本能突刺',
  guardian: '護盾展開',
  windwalker: '快速連打',
  seeker: '弱點標記',
  apothecary: null,
  balanced: '契約脈衝',
}

function AwakeningResultPanel({ awakeningType, scene, sceneIdx, onAdvanceScene, onConfirm }) {
  const showingScene = scene && sceneIdx < scene.length

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-w-sm w-full mx-6 game-panel rounded-lg p-8 text-center">

        {/* AI 覺醒演出台詞 */}
        {scene && scene.length > 0 && (
          <div className="mb-6 text-left space-y-2 min-h-[72px]">
            {scene.slice(0, sceneIdx + 1).map((line, i) => (
              <p key={i} className={`text-sm leading-relaxed ${line.speaker === 'heroine' ? 'text-gray-300 italic' : 'text-gray-400'
                }`}>
                {line.speaker === 'heroine' ? `（${line.text}）` : line.text}
              </p>
            ))}
          </div>
        )}
        {!scene && <div className="mb-6 h-[72px]" />}

        <p className="text-game-accent text-xs tracking-widest mb-4">AWAKENING</p>
        {AWAKENING_SKILLS[awakeningType] && (
          <p className="text-gray-400 text-sm mb-6">
            初始技能解鎖：<span className="text-game-accent">{AWAKENING_SKILLS[awakeningType]}</span>
          </p>
        )}

        {showingScene ? (
          <button
            onClick={onAdvanceScene}
            className="px-8 py-3 border border-gray-600 text-gray-300
              hover:border-game-accent hover:text-game-accent rounded transition-all text-sm"
          >
            ▶
          </button>
        ) : (
          <button
            onClick={onConfirm}
            className="px-8 py-3 border border-game-accent text-game-accent
              hover:bg-game-accent/15 rounded transition-all text-sm"
          >
            確認覺醒
          </button>
        )}
      </div>
    </div>
  )
}

// ── 戰鬥結束面板 ─────────────────────────────────────────────

function CombatEndPanel({ result, narrative, isGenerating, onContinue }) {
  const [showContinue, setShowContinue] = useState(!isGenerating)

  // 敘事生成完成 → 顯示繼續按鈕
  useEffect(() => {
    if (narrative) setShowContinue(true)
  }, [narrative])

  // 20 秒 fallback：AI 超時或失敗時強制顯示繼續按鈕
  useEffect(() => {
    if (!isGenerating) return
    const timer = setTimeout(() => setShowContinue(true), 20000)
    return () => clearTimeout(timer)
  }, [isGenerating])

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80">
      <div className="max-w-md w-full mx-6 game-panel rounded-lg p-6 text-center">
        <h2 className={`text-xl font-bold mb-4 ${result === 'victory' ? 'text-game-accent' :
          result === 'defeat' ? 'text-red-400' : 'text-gray-400'
          }`}>
          {result === 'victory' ? '戰鬥勝利' :
            result === 'defeat' ? '戰鬥失敗' : '成功撤退'}
        </h2>
        {narrative ? (
          <p className="text-gray-300 text-sm leading-relaxed mb-6">{narrative}</p>
        ) : isGenerating ? (
          <p className="text-gray-500 text-xs mb-6 animate-pulse">敘事生成中…</p>
        ) : null}
        {showContinue && (
          <button
            onClick={onContinue}
            className="px-8 py-2.5 border border-game-border text-gray-300
              hover:border-game-accent hover:text-game-accent rounded transition-all text-sm"
          >
            繼續
          </button>
        )}
      </div>
    </div>
  )
}

function DeathRewindScreen({ heroine, onContinue }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/90">
      <div className="max-w-md w-full mx-6 game-panel rounded-lg p-6 text-center">
        <h2 className="text-red-400 text-xl font-bold mb-2 tracking-widest">死亡回朔</h2>
        <p className="text-gray-500 text-xs mb-6 tracking-wide">
          意識碎裂，時間倒流——代價已刻入靈魂。
        </p>
        <div className="grid grid-cols-2 gap-y-2 text-left text-xs mb-6">
          <span className="text-gray-400">HP 回復至</span>
          <span className="text-red-300">{heroine.HP} / {heroine.maxHP}（25%）</span>
          <span className="text-gray-400">靈力上限</span>
          <span className="text-red-300">{heroine.maxSP}（永久 −15%）</span>
          <span className="text-gray-400">ATK / AGI / WIL</span>
          <span className="text-red-300">{heroine.ATK} / {heroine.AGI} / {heroine.WIL}（各隨機削減）</span>
          <span className="text-gray-400">裝備 &amp; 背包</span>
          <span className="text-red-300">重置為契約初始狀態</span>
          <span className="text-gray-400">技能欄</span>
          <span className="text-red-300">隨機消失 3–5 個</span>
        </div>
        <button
          onClick={onContinue}
          className="px-8 py-2.5 border border-red-800 text-red-400 hover:border-red-600 hover:text-red-200 rounded transition-all text-sm"
        >
          繼續前行
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// App 主體
// ════════════════════════════════════════════════════════════

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE)
  const { loadScene, loading: sceneLoading } = useSceneLoader()
  const { settings: aiSettings, update: updateAISettings } = useAISettings()
  const { settings: r18Settings, update: updateR18Settings } = useAIR18Settings()
  const { apiKey, modelId: activeModelId, writer, enabled: aiEnabled, r18Active } = useActiveAIWriter(aiSettings, r18Settings)

  const [aiStatus, setAIStatus] = useState('idle')
  const [aiErrorMsg, setAIErrorMsg] = useState('')
  const aiErrorTimerRef = useRef(null)

  // 覺醒結果顯示
  const [showAwakeningResult, setShowAwakeningResult] = useState(false)
  const [pendingAwakeningType, setPendingAwakeningType] = useState(null)
  const [pendingAwakeningScene, setPendingAwakeningScene] = useState(null)
  const [awakeningSceneIdx, setAwakeningSceneIdx] = useState(0)

  // 戰鬥處理中標誌
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)

  // 面板開關
  const [showAISettings, setShowAISettings] = useState(false)
  const [showSaveLoad, setShowSaveLoad] = useState(false)
  const [showSkillManage, setShowSkillManage] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [showDebugMenu, setShowDebugMenu] = useState(false)
  const [revealedDemons, setRevealedDemons] = useState(new Set())

  // stateRef（避免 stale closure）
  const stateRef = useRef(state)
  const aiSettingsRef = useRef({ apiKey, modelId: activeModelId, writer, enabled: aiEnabled })

  // 回合推進 ref（避免 goToScene TDZ 問題）
  const handleEnemyTurnRef = useRef(null)
  const advanceToNextActorRef = useRef(null)
  const handleDemonTurnRef = useRef(null)

  // 戰中文本觸發 refs（各戰鬥只觸發一次）
  const enemyHpThreshold50Triggered = useRef(false)
  const enemyHpThreshold30Triggered = useRef(false)
  const playerHpThreshold50Triggered = useRef(false)
  const playerHpThreshold30Triggered = useRef(false)
  const desThreshold80Triggered = useRef(false)

  // AI 錯誤自動消失
  useEffect(() => {
    if (aiStatus === 'error') {
      clearTimeout(aiErrorTimerRef.current)
      aiErrorTimerRef.current = setTimeout(() => setAIStatus('idle'), 4000)
    }
    return () => clearTimeout(aiErrorTimerRef.current)
  }, [aiStatus])

  // [Debug] 快捷鍵偵聽 (~)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '`' || e.key === '~') {
        setShowDebugMenu(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ── DES 溢出監測：DES ≥ 200 → 提前壞結局 ─────────────────────
  useEffect(() => {
    if (state.heroine.DES < 200) return
    if (state.flags.des_overflow_triggered) return
    if (['title', 'ending', 'map', 'final_eval'].includes(state.phase)) return
    dispatch({ type: ACTION.SET_FLAG, flag: 'des_overflow_triggered', value: true })
    const ending = resolveDesOverflowEnding(state)
    dispatch({ type: ACTION.TRIGGER_ENDING, ending })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.heroine.DES, state.flags.des_overflow_triggered])

  // ── demon_axis 鎖定監測：任一惡魔 demon_axis = 100 → 鎖定 ────
  useEffect(() => {
    if (state.flags.demon_locked) return
    if (['title', 'ending', 'map', 'final_eval'].includes(state.phase)) return
    const demonIds = ['demon_a', 'demon_b', 'demon_c']
    for (const demonId of demonIds) {
      if ((state.demons[demonId]?.demon_axis ?? 0) >= 100) {
        dispatch({ type: ACTION.SET_FLAG, flag: 'demon_locked', value: demonId })
        break
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.demons.demon_a?.demon_axis,
    state.demons.demon_b?.demon_axis,
    state.demons.demon_c?.demon_axis,
    state.flags.demon_locked,
  ])

  // combat_end → AI 戰鬥敘事生成
  useEffect(() => {
    if (state.phase !== 'combat_end') return
    if (!aiEnabled) return
    if (state.combat.pendingNarrative != null) return  // 已生成過
    writer.generateCombatNarrative(state.combat.result, stateRef.current, apiKey, activeModelId)
      .then(narrative => {
        if (narrative) dispatch({ type: ACTION.SET_COMBAT_NARRATIVE, narrative })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.combat.result])

  // combat → 戰中動態文本（HP / DES 閾值監控）
  useEffect(() => {
    if (state.phase !== 'combat') return
    if (!aiEnabled) return

    const { heroine, combat } = state
    const enemyData = getMonsterData(combat.enemyId)
    if (!enemyData) return

    const playerHpPct = heroine.HP / heroine.maxHP
    const enemyHpPct  = combat.enemyMaxHP > 0 ? combat.enemyHP / combat.enemyMaxHP : 1

    if (enemyHpPct <= 0.5 && !enemyHpThreshold50Triggered.current) {
      enemyHpThreshold50Triggered.current = true
      writer.generateMidCombatText('enemy_hp50', enemyData, stateRef.current, {}, apiKey, activeModelId)
        .then(text => {
          if (text) dispatch({ type: ACTION.COMBAT_APPLY_LOG, combatUpdate: { log: [`【${text}】`] } })
        })
    }
    if (enemyHpPct <= 0.3 && !enemyHpThreshold30Triggered.current) {
      enemyHpThreshold30Triggered.current = true
      writer.generateMidCombatText('enemy_hp30', enemyData, stateRef.current, {}, apiKey, activeModelId)
        .then(text => {
          if (text) dispatch({ type: ACTION.COMBAT_APPLY_LOG, combatUpdate: { log: [`【${text}】`] } })
        })
    }
    if (playerHpPct <= 0.5 && !playerHpThreshold50Triggered.current) {
      playerHpThreshold50Triggered.current = true
      writer.generateMidCombatText('player_hp50', enemyData, stateRef.current, {}, apiKey, activeModelId)
        .then(text => {
          if (text) dispatch({ type: ACTION.COMBAT_APPLY_LOG, combatUpdate: { log: [`【${text}】`] } })
        })
    }
    if (playerHpPct <= 0.3 && !playerHpThreshold30Triggered.current) {
      playerHpThreshold30Triggered.current = true
      writer.generateMidCombatText('player_hp30', enemyData, stateRef.current, {}, apiKey, activeModelId)
        .then(text => {
          if (text) dispatch({ type: ACTION.COMBAT_APPLY_LOG, combatUpdate: { log: [`【${text}】`] } })
        })
    }
    if (heroine.DES >= 80 && !desThreshold80Triggered.current) {
      desThreshold80Triggered.current = true
      writer.generateMidCombatText('des80', enemyData, stateRef.current, {}, apiKey, activeModelId)
        .then(text => {
          if (text) dispatch({ type: ACTION.COMBAT_APPLY_LOG, combatUpdate: { log: [`【${text}】`] } })
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.heroine.HP, state.heroine.DES, state.combat.enemyHP, state.phase])

  // demon_dialogue → AI 惡魔對話生成
  useEffect(() => {
    if (state.phase !== 'demon_dialogue') return
    if (!aiEnabled) return
    if (state.combat.pendingDemonDialogue != null) return  // 已生成過
    const demonId = state.combat.activeDemonDialogueId
    if (!demonId) return
    writer.generateDemonDialogue(demonId, state.combat.result, stateRef.current, apiKey, activeModelId)
      .then(dialogue => {
        if (dialogue) dispatch({ type: ACTION.SET_DEMON_DIALOGUE, dialogue, demonId })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.combat.activeDemonDialogueId])

  // ── 場景載入 ─────────────────────────────────────────────

  const goToScene = useCallback(async (sceneId) => {
    const skeleton = await loadScene(sceneId)
    if (!skeleton) return

    let sceneData = skeleton

    if (aiEnabled && skeleton.type === 'narrative') {
      setAIStatus('generating')
      try {
        sceneData = await writer.fillSceneText(skeleton, stateRef.current, apiKey, activeModelId)
        setAIStatus('idle')
      } catch (err) {
        console.error('[App] AI 生成失敗，回退至靜態文本', err)
        setAIErrorMsg(err?.message ?? '未知錯誤')
        setAIStatus('error')
      }
    }

    // 若為戰鬥場景，先取得魔物資料並進入戰鬥
    if (sceneData.type === 'combat') {
      const enemyData = getMonsterData(sceneData.enemyId)
      if (enemyData) {
        // 重置 threshold refs
        enemyHpThreshold50Triggered.current = false
        enemyHpThreshold30Triggered.current = false
        playerHpThreshold50Triggered.current = false
        playerHpThreshold30Triggered.current = false
        desThreshold80Triggered.current = false

        dispatch({ type: ACTION.START_COMBAT, enemyData })
        setIsProcessing(true)

        // 戰前遭遇描述（非阻塞，在 1200ms 視窗內生成）
        if (aiEnabled) {
          writer.generateEncounterNarrative(enemyData, stateRef.current, apiKey, activeModelId)
            .then(narrative => {
              if (narrative) {
                dispatch({
                  type: ACTION.COMBAT_APPLY_LOG,
                  combatUpdate: { log: [`【${enemyData.name}】`, narrative] },
                })
              }
            })
        } else if (enemyData.description) {
          dispatch({
            type: ACTION.COMBAT_APPLY_LOG,
            combatUpdate: { log: [`【${enemyData.name}】`, enemyData.description] },
          })
        }

        setTimeout(() => advanceToNextActorRef.current?.(), 1200)
      }
      dispatch({ type: ACTION.LOAD_SCENE, sceneData })
      return
    }

    dispatch({ type: ACTION.LOAD_SCENE, sceneData })
  }, [loadScene, apiKey, activeModelId, writer, aiEnabled])

  useEffect(() => {
    stateRef.current = state
    aiSettingsRef.current = { apiKey, modelId: activeModelId, writer, enabled: aiEnabled }
    // [Debug] 曝露給 Console
    if (process.env.NODE_ENV === 'development') {
      window.game = {
        state,
        dispatch,
        goToScene,
        // 快捷功能
        setStat: (heroineStats) => dispatch({ type: ACTION.DEBUG_MODIFY_STATE, payload: { heroine: heroineStats } }),
        addSkill: (id) => {
          const s = getSkillData(id)
          if (!s) return console.error('Skill not found:', id)
          const { active, inventory } = state.skills
          if (active.includes(id) || inventory.some(i => (i.id || i) === id)) return console.warn('Skill already owned')
          if (active.length < 4) dispatch({ type: ACTION.DEBUG_MODIFY_STATE, payload: { skills: { active: [...active, id], inventory } } })
          else if (inventory.length < 12) dispatch({ type: ACTION.DEBUG_MODIFY_STATE, payload: { skills: { active, inventory: [...inventory, id] } } })
        },
        addEquip: (id, slot = 'weapon') => {
          const data = slot === 'weapon' ? getWeaponData(id) : getAccessoryData(id)
          if (!data) return console.error('Equip not found:', id)
          // 直接強制更換裝備並套用數值 (由於 StatsManager.applyEffects 太複雜且依賴 VN 格式，這裡直接覆寫)
          const newHeroine = { ...state.heroine }
          newHeroine.equipment = { ...newHeroine.equipment, [slot]: { id, durability: 100 } }
          // 同時增加基礎數值 (簡化版：僅 ATK/AGI/WIL/HP/SP)
          if (data.ATK) newHeroine.ATK += data.ATK
          if (data.AGI) newHeroine.AGI += data.AGI
          if (data.WIL) newHeroine.WIL += data.WIL
          if (data.maxHP) { newHeroine.maxHP += data.maxHP; newHeroine.HP += data.maxHP }
          if (data.maxSP) { newHeroine.maxSP += data.maxSP; newHeroine.SP += data.maxSP }
          dispatch({ type: ACTION.DEBUG_MODIFY_STATE, payload: { heroine: newHeroine } })
        }
      }
    }
  }, [state, goToScene])

  // ── 遊戲開始（序章） ─────────────────────────────────────

  const handleStart = useCallback(async () => {
    dispatch({ type: ACTION.START_GAME })
    await goToScene('0-1')
  }, [goToScene])

  // ── 對話推進 ─────────────────────────────────────────────

  const handleAdvance = useCallback(async () => {
    const cur = stateRef.current
    const { sceneData, currentDialogue } = cur

    if (!sceneData) return

    // 到達場景末尾
    if (currentDialogue + 1 >= sceneData.dialogues.length) {
      // 覺醒場景：場景結束後顯示結果
      if (sceneData.isAwakeningScene) {
        const hpPercent = cur.heroine.HP / cur.heroine.maxHP
        const awakeningType = judgeAwakeningType(cur.flags, hpPercent)
        setPendingAwakeningType(awakeningType)
        setShowAwakeningResult(true)
        return
      }

      const nextScene = sceneData.nextScene
      if (nextScene) {
        await goToScene(nextScene)
      } else if (sceneData.nextPhase === 'map') {
        // 第一章結束，轉入地圖前初始化地點
        const firstLocations = generateSubLayerLocations(1, 1) // 1-1
        dispatch({ type: ACTION.SET_SUBLAYER_LOCATIONS, locations: firstLocations })
        dispatch({ type: ACTION.ENTER_MAP })
      } else if (sceneData.isChapterEnd) {
        dispatch({ type: ACTION.TRIGGER_ENDING })
      }
      return
    }

    dispatch({ type: ACTION.ADVANCE })
  }, [goToScene])

  // 選項後場景跳轉
  useEffect(() => {
    if (state._pendingNextScene) {
      goToScene(state._pendingNextScene)
    }
  }, [state._pendingNextScene, goToScene])

  // ── 覺醒結果確認（序章戰鬥後觸發）────────────────────────

  const handleAwakeningConfirm = useCallback(() => {
    setShowAwakeningResult(false)
    dispatch({
      type: ACTION.AWAKENING_FINISH,
      awakeningType: pendingAwakeningType,
      nextScene: '0-3-post',
    })
    // _pendingNextScene useEffect 會自動呼叫 goToScene('0-3-post')
  }, [pendingAwakeningType])

  // ── 選項選擇 ─────────────────────────────────────────────

  const handleSelect = useCallback((choice) => {
    dispatch({ type: ACTION.SELECT_CHOICE, choice })
  }, [])

  // ── 骰點確認 ─────────────────────────────────────────────

  const handleDiceContinue = useCallback(async () => {
    dispatch({ type: ACTION.ACKNOWLEDGE_DICE })
    const pending = stateRef.current._pendingNextScene
    if (pending) await goToScene(pending)
  }, [goToScene])

  // ── 回合推進（佇列式，耗盡後自動重建新回合）───────────────────

  const advanceToNextActor = useCallback(() => {
    const { heroine, combat } = stateRef.current
    let queue = [...(combat.turnQueue ?? [])]
    let isNewRound = false

    if (queue.length === 0) {
      queue = buildTurnQueue(heroine, combat.activeDemons ?? {}, combat)
      isNewRound = true
    }

    const next = queue[0]
    const remaining = queue.slice(1)

    if (isNewRound) {
      // 遞減技能冷卻
      const nextSkillCDs = tickCooldowns(combat.skillCooldowns ?? {})
      const nextEnemySkillCDs = tickCooldowns(combat.enemySkillCooldowns ?? {})

      // DOT 效果（bleed/poison）與狀態持續時間遞減
      const { 
        newHeroine: dotHeroine, 
        newHeroineStatuses: dotHeroineStatuses, 
        newEnemyHP: dotEnemyHP, 
        newEnemyStatuses: dotEnemyStatuses, 
        logs: dotLogs 
      } = processStatusEffects(
        heroine, 
        combat.heroineStatuses ?? [], 
        combat.enemyHP, 
        combat.enemyStatuses ?? []
      )

      const roundLogs = ['── 新回合 ──', ...dotLogs]

      dispatch({
        type: ACTION.COMBAT_APPLY_LOG,
        combatUpdate: {
          log: roundLogs,
          turnQueue: remaining,
          enemyHP: dotEnemyHP,
          enemyStatuses: dotEnemyStatuses,
          heroineStatuses: dotHeroineStatuses,
          skillCooldowns: nextSkillCDs,
          enemySkillCooldowns: nextEnemySkillCDs,
        },
        heroineUpdate: { HP: dotHeroine.HP },
      })

      if (dotEnemyHP <= 0) {
        setTimeout(() => { dispatch({ type: ACTION.END_COMBAT, result: 'victory' }); setIsProcessing(false) }, 600)
        return
      }
      if (dotHeroine.HP <= 0) {
        setTimeout(() => { dispatch({ type: ACTION.END_COMBAT, result: 'defeat' }); setIsProcessing(false) }, 600)
        return
      }
    } else {
      dispatch({ type: ACTION.SET_TURN_QUEUE, queue: remaining })
    }

    if (next === 'heroine') {
      setIsPlayerTurn(true)
      setIsProcessing(false)
    } else if (next === 'enemy') {
      handleEnemyTurnRef.current?.()
    } else {
      handleDemonTurnRef.current?.(next)
    }
  }, [])

  // ── 惡魔回合 ─────────────────────────────────────────────

  const handleDemonTurn = useCallback((demonId) => {
    const { combat, heroine } = stateRef.current
    const demonUnit = combat.activeDemons?.[demonId]
    if (!demonUnit) { advanceToNextActorRef.current?.(); return }

    const result = executeDemonTurn(demonId, demonUnit, combat, heroine)

    dispatch({ type: ACTION.UPDATE_ACTIVE_DEMON, demonId, demonUnit: result.newDemonUnit })
    dispatch({
      type: ACTION.COMBAT_APPLY_LOG,
      combatUpdate: result.combatUpdate,
      ...(result.heroineUpdate ? { heroineUpdate: result.heroineUpdate } : {}),
    })

    const newEnemyHP = result.combatUpdate.enemyHP ?? combat.enemyHP
    if (newEnemyHP <= 0) {
      setTimeout(() => { dispatch({ type: ACTION.END_COMBAT, result: 'victory' }); setIsProcessing(false) }, 600)
      return
    }
    setTimeout(() => advanceToNextActorRef.current?.(), 800)
  }, [])

  // ── 戰鬥：敵人回合 ───────────────────────────────────────

  const handleEnemyTurn = useCallback(() => {
    const cur = stateRef.current
    const { heroine, combat } = cur

    // 封印 / 遲滯狀態：跳過敵人行動 → 直接回到下一行動者
    const skipStatus = combat.enemyStatuses?.find(s => s.type === 'seal' || s.type === 'delay')
    if (skipStatus) {
      dispatch({
        type: ACTION.COMBAT_APPLY_LOG,
        combatUpdate: {
          log: [skipStatus.type === 'delay' ? '敵人陷入遲滯，跳過行動！' : '敵人被封印，跳過行動！'],
          enemyStatuses: combat.enemyStatuses
            .map(s => (s.type === 'seal' || s.type === 'delay') ? { ...s, duration: s.duration - 1 } : s)
            .filter(s => s.duration > 0),
        },
      })
      setTimeout(() => advanceToNextActorRef.current?.(), 400)
      return
    }

    // 若惡魔在場，50% 機率改為攻擊惡魔
    const activeDemonIds = Object.keys(combat.activeDemons ?? {})
    if (activeDemonIds.length > 0 && Math.random() < 0.5) {
      const demonId = activeDemonIds[0]
      const demonUnit = combat.activeDemons[demonId]
      const dResult = executeEnemyAttackOnDemon(demonUnit, combat)

      dispatch({ type: ACTION.COMBAT_APPLY_LOG, combatUpdate: { log: dResult.logs } })

      // reflect 反傷：敵人攻擊惡魔時也觸發
      const reflectOnDemon = (combat.enemyStatuses ?? []).find(s => s.type === 'reflect')
      if (reflectOnDemon && dResult.damage > 0) {
        const reflectDmg = Math.max(1, Math.floor(dResult.damage * (reflectOnDemon.value ?? 10) / 100))
        const reflectedHP = Math.max(0, combat.enemyHP - reflectDmg)
        dispatch({
          type: ACTION.COMBAT_APPLY_LOG,
          combatUpdate: {
            log: [`反傷：${reflectDmg} 傷害反射回敵人！`],
            enemyHP: reflectedHP,
          },
        })
        if (reflectedHP <= 0) {
          setTimeout(() => { dispatch({ type: ACTION.END_COMBAT, result: 'victory' }); setIsProcessing(false) }, 600)
          return
        }
      }

      if (dResult.newDemonHP <= 0) {
        dispatch({ type: ACTION.REMOVE_ACTIVE_DEMON, demonId })
      } else {
        dispatch({ type: ACTION.UPDATE_ACTIVE_DEMON, demonId, demonUnit: { ...demonUnit, currentHP: dResult.newDemonHP } })
      }
      setTimeout(() => advanceToNextActorRef.current?.(), 800)
      return
    }

    // 攻擊玩家（原邏輯）
    const result = executeEnemyAttack(heroine, combat)
    dispatch({
      type: ACTION.COMBAT_APPLY_LOG,
      combatUpdate: result.combatUpdate,
      heroineUpdate: {
        HP: result.newHeroine.HP,
        DES: result.newHeroine.DES,
        equipment: result.newHeroine.equipment,
      },
    })

    // 特殊技能觸發：AI 生成描述（fire-and-forget，不影響 isProcessing）
    if (result.specialSkillUsed) {
      const ai = aiSettingsRef.current
      if (ai.enabled && ai.apiKey) {
        const enemyData = getMonsterData(combat.enemyId)
        if (enemyData) {
          ai.writer.generateMidCombatText(
            'special_skill', enemyData, stateRef.current,
            { skillName: result.specialSkillUsed },
            ai.apiKey, ai.modelId
          ).then(text => {
            if (text) dispatch({ type: ACTION.COMBAT_APPLY_LOG, combatUpdate: { log: [`【${text}】`] } })
          })
        }
      }
    }

    // reflect 致死判定：敵人被反傷擊殺 → 勝利
    const reflectEnemyHP = result.combatUpdate.enemyHP
    if (reflectEnemyHP !== undefined && reflectEnemyHP <= 0) {
      setTimeout(() => { dispatch({ type: ACTION.END_COMBAT, result: 'victory' }); setIsProcessing(false) }, 600)
      return
    }

    if (result.newHeroine.HP <= 0) {
      setTimeout(() => { dispatch({ type: ACTION.END_COMBAT, result: 'defeat' }); setIsProcessing(false) }, 600)
      return
    }
    setTimeout(() => advanceToNextActorRef.current?.(), 800)
  }, [])

  // 同步 refs
  useEffect(() => { handleEnemyTurnRef.current = handleEnemyTurn }, [handleEnemyTurn])
  useEffect(() => { advanceToNextActorRef.current = advanceToNextActor }, [advanceToNextActor])
  useEffect(() => { handleDemonTurnRef.current = handleDemonTurn }, [handleDemonTurn])

  // ── 第一章教學戰：自動召喚 tutorialDemon ──────────────────

  useEffect(() => {
    const { phase, sceneData, combat } = state
    const delay = sceneData?.tutorialDemonDelay ?? 0
    if (
      phase === 'combat' &&
      sceneData?.isTutorialSummon &&
      sceneData?.tutorialDemon &&
      !combat.summonedThisBattle.includes(sceneData.tutorialDemon) &&
      combat.playerActionCount >= delay
    ) {
      const demonId = sceneData.tutorialDemon
      dispatch({ type: ACTION.SUMMON_DEMON, demonId })
      dispatch({
        type: ACTION.COMBAT_APPLY_LOG,
        combatUpdate: { log: [`【${DEMON_DATA[demonId]?.name ?? demonId}】應召而至！`] },
      })
      setRevealedDemons(prev => new Set([...prev, demonId]))
    }
  }, [state.sceneData?.sceneId, state.phase, state.combat.playerActionCount])

  // ── 戰鬥：召喚惡魔 ───────────────────────────────────────

  const handleOpenSummon = useCallback(() => {
    if (!isPlayerTurn || isProcessing) return
    const { heroine } = stateRef.current
    if (canTriggerSummon(heroine)) {
      dispatch({ type: ACTION.OPEN_DEMON_SUMMON })
    } else {
      dispatch({ type: ACTION.OPEN_ACTIVE_SUMMON })
    }
  }, [isPlayerTurn, isProcessing])

  const _applyEntrySkill = (demonId, combat, heroine) => {
    const freshUnit = createDemonUnit(demonId)
    if (!freshUnit) return null
    const skillResult = executeDemonSkill(demonId, freshUnit, combat, heroine)
    // 入場技能後將 CD 重置為最大值
    const skills = {}
    for (const [id, s] of Object.entries(freshUnit.skills)) {
      skills[id] = { ...s, cooldown: s.maxCooldown }
    }
    return { skillResult, updatedUnit: { ...freshUnit, skills } }
  }

  const handleActiveSummon = useCallback((demonId) => {
    const cur = stateRef.current
    const { heroine, combat, demons, sceneData } = cur

    const result = executeActiveSummonEffect(demonId, heroine, combat, demons)
    dispatch({
      type: ACTION.COMBAT_APPLY_LOG,
      combatUpdate: result.combatUpdate,
      heroineUpdate: { SP: result.newHeroine.SP },
    })

    if (result.success) {
      dispatch({ type: ACTION.SUMMON_DEMON, demonId })
      dispatch({ type: ACTION.UPDATE_DEMON_AXIS, demonId, heroineAxisDelta: 10 })
      // DES +5（主動召喚固定）；若為鎖定惡魔額外 +40
      const activeDESGain = cur.flags.demon_locked === demonId ? 45 : 5
      dispatch({ type: ACTION.COMBAT_APPLY_LOG, heroineUpdate: { DES: Math.min(200, (cur.heroine.DES ?? 0) + activeDESGain) } })
      if (cur.flags.demon_locked === demonId) {
        dispatch({ type: ACTION.COMBAT_APPLY_LOG, combatUpdate: { log: ['【契約鎖定】慾念湧上——DES +40'] } })
      }

      dispatch({ type: ACTION.UPDATE_DEMON_RELATION, demonId, trustDelta: 2, affectionDelta: 2, axisDelta: 8 })
      setRevealedDemons(prev => new Set([...prev, demonId]))

      // 入場技能（非第一章）
      if (sceneData?.chapter !== 1) {
        const entry = _applyEntrySkill(demonId, combat, result.newHeroine)
        if (entry) {
          dispatch({ type: ACTION.UPDATE_ACTIVE_DEMON, demonId, demonUnit: entry.updatedUnit })
          dispatch({
            type: ACTION.COMBAT_APPLY_LOG,
            combatUpdate: entry.skillResult.combatUpdate,
            ...(entry.skillResult.heroineUpdate ? { heroineUpdate: entry.skillResult.heroineUpdate } : {}),
          })
          const newEnemyHP = entry.skillResult.combatUpdate.enemyHP ?? combat.enemyHP
          if (newEnemyHP <= 0) {
            setTimeout(() => { dispatch({ type: ACTION.END_COMBAT, result: 'victory' }); setIsProcessing(false) }, 600)
            return
          }
        }
      }

      setIsPlayerTurn(false)
      setTimeout(() => advanceToNextActorRef.current?.(), 800)
    } else {
      dispatch({ type: ACTION.SKIP_SUMMON })
      setIsPlayerTurn(false)
      setTimeout(() => advanceToNextActorRef.current?.(), 800)
    }
  }, [])

  const handleSummon = useCallback((demonId) => {
    const cur = stateRef.current
    const { demons, combat, heroine, sceneData } = cur

    dispatch({ type: ACTION.SUMMON_DEMON, demonId })
    dispatch({
      type: ACTION.COMBAT_APPLY_LOG,
      combatUpdate: { log: [`【${DEMON_DATA[demonId]?.name ?? demonId}】應召而至！`] },
    })
    // 鎖定惡魔被動召喚：DES +25
    if (cur.flags.demon_locked === demonId) {
      dispatch({
        type: ACTION.COMBAT_APPLY_LOG,
        heroineUpdate: { DES: Math.min(200, (cur.heroine.DES ?? 0) + 25) },
        combatUpdate: { log: ['【契約鎖定】慾念湧上——DES +25'] },
      })
    }

    dispatch({ type: ACTION.UPDATE_DEMON_RELATION, demonId, trustDelta: 2, affectionDelta: 2, axisDelta: 5 })
    setRevealedDemons(prev => new Set([...prev, demonId]))

    // 入場技能（非第一章）
    if (sceneData?.chapter !== 1) {
      const entry = _applyEntrySkill(demonId, combat, heroine)
      if (entry) {
        dispatch({ type: ACTION.UPDATE_ACTIVE_DEMON, demonId, demonUnit: entry.updatedUnit })
        dispatch({
          type: ACTION.COMBAT_APPLY_LOG,
          combatUpdate: entry.skillResult.combatUpdate,
          ...(entry.skillResult.heroineUpdate ? { heroineUpdate: entry.skillResult.heroineUpdate } : {}),
        })
        const newEnemyHP = entry.skillResult.combatUpdate.enemyHP ?? combat.enemyHP
        if (newEnemyHP <= 0) {
          setTimeout(() => { dispatch({ type: ACTION.END_COMBAT, result: 'victory' }); setIsProcessing(false) }, 600)
          return
        }
      }
    }

    setIsPlayerTurn(false)
    setTimeout(() => advanceToNextActorRef.current?.(), 800)
  }, [])

  const handleSkipSummon = useCallback(() => {
    dispatch({ type: ACTION.SKIP_SUMMON })
    setIsPlayerTurn(false)
    setTimeout(() => advanceToNextActorRef.current?.(), 800)
  }, [])

  // ── 戰鬥：普通攻擊 ───────────────────────────────────────

  const handleBasicAttack = useCallback(() => {
    if (!isPlayerTurn || isProcessing) return
    setIsProcessing(true)

    const cur = stateRef.current
    const { heroine, combat } = cur
    const pb = cur.prologueBonus ?? {}
    const effectiveHeroine = pb.ATK || pb.AGI || pb.WIL
      ? { ...heroine, ATK: heroine.ATK + (pb.ATK || 0), AGI: heroine.AGI + (pb.AGI || 0), WIL: heroine.WIL + (pb.WIL || 0) }
      : heroine
    const result = executeBasicAttack(effectiveHeroine, combat)

    dispatch({
      type: ACTION.COMBAT_APPLY_LOG,
      combatUpdate: {
        ...result.combatUpdate,
        enemyHP: result.combatUpdate.enemyHP ?? combat.enemyHP,
      },
    })
    dispatch({ type: ACTION.INCREMENT_PLAYER_ACTION })

    if ((result.combatUpdate.enemyHP ?? combat.enemyHP) <= 0) {
      setTimeout(() => { dispatch({ type: ACTION.END_COMBAT, result: 'victory' }); setIsProcessing(false) }, 600)
      return
    }

    setIsPlayerTurn(false)
    setTimeout(() => advanceToNextActorRef.current?.(), 800)
  }, [isPlayerTurn, isProcessing])

  // ── 戰鬥：使用技能 ───────────────────────────────────────

  const handleUseSkill = useCallback((skillId) => {
    if (!isPlayerTurn || isProcessing) return
    setIsProcessing(true)

    const cur = stateRef.current
    const { heroine, combat } = cur
    const skillData = getSkillData(skillId)
    if (!skillData) { setIsProcessing(false); return }

    const pb = cur.prologueBonus ?? {}
    const effectiveHeroine = pb.ATK || pb.AGI || pb.WIL
      ? { ...heroine, ATK: heroine.ATK + (pb.ATK || 0), AGI: heroine.AGI + (pb.AGI || 0), WIL: heroine.WIL + (pb.WIL || 0) }
      : heroine
    const result = executeSkill(effectiveHeroine, skillData, combat)

    dispatch({
      type: ACTION.COMBAT_APPLY_LOG,
      combatUpdate: {
        ...result.combatUpdate,
        enemyStatuses: result.newEnemyStatuses ?? combat.enemyStatuses,
      },
      heroineUpdate: {
        SP: result.newHeroine.SP,
        HP: result.newHeroine.HP,
        DES: result.newHeroine.DES,
        equipment: result.newHeroine.equipment,
      },
    })
    dispatch({ type: ACTION.INCREMENT_PLAYER_ACTION })

    const newEnemyHP = result.combatUpdate.enemyHP ?? combat.enemyHP
    if (newEnemyHP <= 0) {
      setTimeout(() => { dispatch({ type: ACTION.END_COMBAT, result: 'victory' }); setIsProcessing(false) }, 600)
      return
    }

    setIsPlayerTurn(false)
    setTimeout(() => advanceToNextActorRef.current?.(), 800)
  }, [isPlayerTurn, isProcessing])

  // ── 戰鬥：防禦 ──────────────────────────────────────────

  const handleDefend = useCallback(() => {
    if (!isPlayerTurn || isProcessing) return
    setIsProcessing(true)

    const { heroine, combat } = stateRef.current
    const result = executeDefend(heroine, combat)

    dispatch({
      type: ACTION.COMBAT_APPLY_LOG,
      combatUpdate: result.combatUpdate,
    })
    dispatch({ type: ACTION.INCREMENT_PLAYER_ACTION })

    setIsPlayerTurn(false)
    setTimeout(() => advanceToNextActorRef.current?.(), 800)
  }, [isPlayerTurn, isProcessing])

  // ── 戰鬥：逃跑 ──────────────────────────────────────────

  const handleFlee = useCallback(() => {
    if (!isPlayerTurn || isProcessing) return
    dispatch({ type: ACTION.END_COMBAT, result: 'escape' })
  }, [isPlayerTurn, isProcessing])

  // ── 戰鬥結束：繼續 ──────────────────────────────────────

  const handleCombatEndContinue = useCallback(async () => {
    const cur = stateRef.current
    const { combat, sceneData, exploration } = cur

    // 處理探索階段的戰鬥紀錄
    if (exploration?.currentLayer > 0 && combat.result === 'victory') {
      const isTierC = combat.enemyData?.tier === 'C'
      dispatch({ type: ACTION.RECORD_BATTLE, tierC: isTierC })
    }

    // 序章戰鬥（scene_0_3）勝利後觸發覺醒結果
    if (sceneData?.isPrologueCombat && combat.result === 'victory') {
      const hpPercent = cur.heroine.HP / cur.heroine.maxHP
      const awakeningType = judgeAwakeningType(cur.flags, hpPercent)
      setPendingAwakeningType(awakeningType)
      setPendingAwakeningScene(null)
      setAwakeningSceneIdx(0)
      // 非同步生成覺醒台詞（不阻塞面板顯示）
      if (aiEnabled) {
        writer.generateAwakeningScene(awakeningType, cur, apiKey, activeModelId)
          .then(scene => { if (scene) setPendingAwakeningScene(scene) })
      }
      setShowAwakeningResult(true)
      return
    }

    // 戰敗（非序章）→ 死亡回朔
    if (combat.result === 'defeat' && !sceneData?.isPrologueCombat) {
      dispatch({ type: ACTION.APPLY_DEATH_REWIND })
      return
    }

    // 勝利且有召喚惡魔 → 惡魔戰後對話
    if (combat.result === 'victory' && combat.summonedThisBattle.length > 0) {
      const demonId = combat.summonedThisBattle[combat.summonedThisBattle.length - 1]
      dispatch({ type: ACTION.START_DEMON_DIALOGUE, demonId })
      return
    }

    if (combat.result === 'victory') {
      // 技能掉落
      const candidates = rollSkillReward(cur)
      if (candidates.length > 0) {
        dispatch({ type: ACTION.SHOW_SKILL_REWARD, candidates })
        return
      }
    }

    // 跳往下一場景
    const nextScene = sceneData?.nextScene
    if (nextScene) {
      await goToScene(nextScene)
    } else if (exploration?.currentLayer > 0) {
      // 若是在地圖探索中的戰鬥：有 activeScene 時確認場景事件，否則回到地圖
      if (exploration.activeScene !== null) {
        dispatch({ type: ACTION.CONFIRM_SCENE_EVENT })
      } else {
        dispatch({ type: ACTION.ENTER_MAP })
      }
    }
  }, [goToScene, apiKey, activeModelId, writer, aiEnabled])

  // ── 死亡回朔：繼續 ──────────────────────────────────────

  const handleDeathRewindContinue = useCallback(async () => {
    const cur = stateRef.current
    if (cur.exploration?.currentLayer > 0) {
      const layer = cur.exploration.currentLayer
      const locations = generateSubLayerLocations(layer, 1)
      dispatch({ type: ACTION.SET_SUBLAYER_LOCATIONS, locations })
      dispatch({ type: ACTION.ENTER_MAP })
    } else {
      await goToScene(cur.currentScene)
    }
  }, [goToScene])

  // ── 惡魔回應選擇（demon_dialogue → 技能掉落 / 下一場景）────

  const handleDemonResponsePick = useCallback(async (choiceIndex) => {
    dispatch({ type: ACTION.PICK_DEMON_RESPONSE, choiceIndex })
    const cur = stateRef.current
    const candidates = rollSkillReward(cur)
    if (candidates.length > 0) {
      dispatch({ type: ACTION.SHOW_SKILL_REWARD, candidates })
      return
    }
    const nextScene = cur.sceneData?.nextScene
    if (nextScene) {
      await goToScene(nextScene)
    } else if (cur.exploration?.currentLayer > 0 && cur.exploration?.activeScene !== null) {
      dispatch({ type: ACTION.CONFIRM_SCENE_EVENT })
    }
  }, [goToScene])

  // ── 技能選擇 ─────────────────────────────────────────────

  const handlePickSkill = useCallback(async (skillId) => {
    dispatch({ type: ACTION.PICK_SKILL, skillId })
    const cur = stateRef.current
    const nextScene = cur.sceneData?.nextScene
    if (nextScene) {
      await goToScene(nextScene)
    } else if (cur.exploration?.currentLayer > 0 && cur.exploration?.activeScene !== null) {
      dispatch({ type: ACTION.CONFIRM_SCENE_EVENT })
    }
  }, [goToScene])

  const handleSkipSkill = useCallback(async () => {
    dispatch({ type: ACTION.SKIP_SKILL_REWARD })
    const cur = stateRef.current
    const nextScene = cur.sceneData?.nextScene
    if (nextScene) {
      await goToScene(nextScene)
    } else if (cur.exploration?.currentLayer > 0 && cur.exploration?.activeScene !== null) {
      dispatch({ type: ACTION.CONFIRM_SCENE_EVENT })
    }
  }, [goToScene])

  // ── 存讀檔 ───────────────────────────────────────────────

  const handleLoadSave = (savedState) => {
    dispatch({ type: ACTION.LOAD_SAVE, savedState })
    setShowSaveLoad(false)
  }

  const handleRestart = () => dispatch({ type: ACTION.RETURN_TO_TITLE })

  // ── 當前對話物件 ─────────────────────────────────────────

  const currentDialogueObj = state.sceneData?.dialogues?.[state.currentDialogue]
  const isChoiceNext = (() => {
    if (!state.sceneData) return false
    const next = state.sceneData?.dialogues?.[state.currentDialogue + 1]
    return next?.type === 'choice' || next?.type === 'dice_choice'
  })()

  // 角色立繪解析（demon_a_smile → charId + expression）
  const sprites = (() => {
    const sprite = currentDialogueObj?.sprite
    if (!sprite) return []
    const match = sprite.match(/^(demon_[abc]|char_[abc])_?(.*)$/)
    if (!match) return []
    return [{ charId: match[1], expression: match[2] || 'default' }]
  })()

  // VN 畫面顯示判定
  const showVNOverlay = ['dialogue', 'choice', 'dice', 'awakening', 'demon_dialogue'].includes(state.phase)

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-game-dark">

      {/* ── 主選單 ── */}
      {state.phase === 'title' && (
        <TitleScreen
          onStart={handleStart}
          onLoadSave={() => setShowSaveLoad(true)}
          onAISettings={() => setShowAISettings(true)}
          aiEnabled={aiEnabled}
        />
      )}

      {/* ── VN 遊戲主畫面（含覺醒試煉） ── */}
      {showVNOverlay && (
        <>
          <BackgroundLayer background={state.sceneData?.background} />

          {sprites.map((s, i) => (
            <CharacterSprite key={i} charId={s.charId} expression={s.expression} position="center" active />
          ))}

          {!state.currentScene?.startsWith('0-') && (
            <StatsDisplay
              heroine={state.heroine}
              demons={state.demons}
              mainRoute={state.mainRoute}
              revealedDemons={revealedDemons}
            />
          )}

          {/* HUD 按鈕列 */}
          <div className="absolute top-4 left-4 z-20 flex gap-2">
            <button
              className="px-3 py-1 game-panel text-gray-400 hover:text-game-accent text-xs rounded transition-colors"
              onClick={() => setShowSaveLoad(true)}
            >
              ☰ 選單
            </button>
            <button
              className={`px-3 py-1 game-panel text-xs rounded transition-colors ${aiEnabled ? 'text-purple-400 hover:text-purple-300' : 'text-gray-600 hover:text-gray-400'
                }`}
              onClick={() => setShowAISettings(true)}
            >
              ✦ AI{aiEnabled ? ' ●' : ''}
            </button>
            <button
              className="px-3 py-1 game-panel text-gray-400 hover:text-game-accent text-xs rounded transition-colors"
              onClick={() => setShowSkillManage(true)}
            >
              ⚔ 技能
            </button>
            <button
              className={`px-3 py-1 game-panel text-xs rounded transition-colors ${showInventory ? 'text-amber-300' : 'text-gray-400 hover:text-game-accent'
                }`}
              onClick={() => setShowInventory(v => !v)}
            >
              🎒 背包
            </button>
          </div>

          {/* 一般對話框 */}
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



          {/* AI 生成遮罩 - 幾何動畫版 */}
          {aiStatus === 'generating' && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
              <div className="relative w-20 h-20 flex items-center justify-center">
                {/* 外層旋轉菱形 */}
                <div className="absolute inset-0 border-2 border-game-accent/30 rotate-45 animate-spin-slow rounded-sm"></div>
                {/* 內層反向旋轉菱形 */}
                <div className="absolute inset-4 border border-game-accent/60 rotate-45 animate-spin-reverse rounded-sm"></div>
                {/* 中心發光球體 */}
                <div className="w-3 h-3 bg-game-accent rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-heartbeat"></div>
              </div>
              <div className="mt-8 text-white text-[0.6rem] tracking-[0.4em] font-light opacity-40 uppercase">
                loading...
              </div>
            </div>
          )}

          {sceneLoading && aiStatus !== 'generating' && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40">
              <span className="text-game-accent animate-pulse text-sm">載入中…</span>
            </div>
          )}

          {aiStatus === 'error' && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-red-950/80 border border-red-800 rounded text-red-300 text-xs max-w-sm text-center">
              ⚠ AI 生成失敗，已回退至原始文本
              {aiErrorMsg && <div className="mt-1 text-red-400 opacity-80">{aiErrorMsg}</div>}
            </div>
          )}
        </>
      )}

      {/* ── 戰鬥畫面 ── */}
      {(state.phase === 'combat' || state.phase === 'demon_summon') && (
        <>
          <BackgroundLayer background={state.sceneData?.background ?? 'forest_ruin'} />

          <CombatScreen
            heroine={state.heroine}
            combat={state.combat}
            skills={state.skills}
            onBasicAttack={handleBasicAttack}
            onUseSkill={handleUseSkill}
            onDefend={handleDefend}
            onOpenSummon={handleOpenSummon}
            onFlee={handleFlee}
            isPlayerTurn={isPlayerTurn && state.phase === 'combat'}
            isProcessing={isProcessing}
            allowSummon={!state.currentScene?.startsWith('0-') && !state.sceneData?.isTutorialSummon}
          />

          {state.phase === 'demon_summon' && (
            <DemonSummonModal
              heroine={state.heroine}
              demons={state.demons}
              summonedThisBattle={state.combat.summonedThisBattle}
              isActiveSummon={state.combat.isActiveSummon ?? false}
              onSummon={handleSummon}
              onActiveSummon={handleActiveSummon}
              onSkip={handleSkipSummon}
              lockedDemon={state.flags.demon_locked || null}
            />
          )}
        </>
      )}

      {/* ── 戰鬥結束 ── */}
      {state.phase === 'combat_end' && (
        <>
          <BackgroundLayer background={state.sceneData?.background ?? 'forest_ruin'} />
          <CombatEndPanel
            result={state.combat.result}
            narrative={state.combat.pendingNarrative}
            isGenerating={aiEnabled && state.combat.pendingNarrative === null}
            onContinue={handleCombatEndContinue}
          />
        </>
      )}

      {/* ── 死亡回朔 ── */}
      {state.phase === 'death_rewind' && (
        <>
          <BackgroundLayer background={state.sceneData?.background ?? 'forest_ruin'} />
          <DeathRewindScreen heroine={state.heroine} onContinue={handleDeathRewindContinue} />
        </>
      )}

      {state.phase === 'demon_dialogue' && (
        <DemonDialogueScreen
          demonId={state.combat.activeDemonDialogueId}
          dialogue={state.combat.pendingDemonDialogue}
          onSelect={handleDemonResponsePick}
        />
      )}

      {/* ── 覺醒結果彈窗（phase 無關，任何時機都可顯示）── */}
      {showAwakeningResult && pendingAwakeningType && (
        <AwakeningResultPanel
          awakeningType={pendingAwakeningType}
          scene={pendingAwakeningScene}
          sceneIdx={awakeningSceneIdx}
          onAdvanceScene={() => setAwakeningSceneIdx(i => i + 1)}
          onConfirm={handleAwakeningConfirm}
        />
      )}

      {/* ── 技能獎勵（Phase B SkillRewardScreen） ── */}
      {state.phase === 'skill_reward' && (
        <>
          <BackgroundLayer background={state.sceneData?.background} />
          <SkillRewardScreen
            candidates={state._skillCandidates ?? []}
            onPick={handlePickSkill}
            onSkip={handleSkipSkill}
          />
        </>
      )}

      {/* ── 背包（VN 場景中可打開） ── */}
      {showInventory && (
        <InventoryModal heroine={state.heroine} onClose={() => setShowInventory(false)} />
      )}

      {/* ── 技能管理（VN 場景中可打開） ── */}
      {showSkillManage && (
        <SkillManageScreen
          skills={state.skills}
          onConfirm={(newSkills) => {
            dispatch({ type: ACTION.SET_SKILL_SLOTS, skills: newSkills })
            setShowSkillManage(false)
          }}
          onClose={() => setShowSkillManage(false)}
        />
      )}

      {/* ── 地圖探索 ── */}
      {state.phase === 'map' && (
        <>
          {/* HUD 按鈕列（與 VN 畫面相同） */}
          <div className="absolute top-4 left-4 z-30 flex gap-2">
            <button
              className="px-3 py-1 game-panel text-gray-400 hover:text-game-accent text-xs rounded transition-colors"
              onClick={() => setShowSaveLoad(true)}
            >
              ☰ 選單
            </button>
            <button
              className={`px-3 py-1 game-panel text-xs rounded transition-colors ${
                aiEnabled ? 'text-purple-400 hover:text-purple-300' : 'text-gray-600 hover:text-gray-400'
              }`}
              onClick={() => setShowAISettings(true)}
            >
              ✦ AI{aiEnabled ? ' ●' : ''}
            </button>
            <button
              className="px-3 py-1 game-panel text-gray-400 hover:text-game-accent text-xs rounded transition-colors"
              onClick={() => setShowSkillManage(true)}
            >
              ⚔ 技能
            </button>
            <button
              className={`px-3 py-1 game-panel text-xs rounded transition-colors ${
                showInventory ? 'text-amber-300' : 'text-gray-400 hover:text-game-accent'
              }`}
              onClick={() => setShowInventory(v => !v)}
            >
              🎒 背包
            </button>
          </div>
          <WorldMapScreen state={state} dispatch={dispatch} revealedDemons={revealedDemons} apiKey={apiKey} modelId={activeModelId} writer={writer} aiEnabled={aiEnabled} />
        </>
      )}

      {/* ── Ch.E1 最終評估 ── */}
      {state.phase === 'final_eval' && (
        <div className="relative w-screen h-screen overflow-hidden bg-game-dark flex flex-col items-center justify-center gap-6">
          <BackgroundLayer background="rift_core" />
          <div className="z-10 text-center max-w-sm">
            <div className="text-game-accent text-xl font-bold mb-4">Ch.E1 — 命運的交叉口</div>
            {(() => {
              const result = evaluateFinalTrack(state)
              return (
                <>
                  <div className="text-gray-300 text-sm mb-2">
                    軌道：<span className="text-purple-300 font-semibold">{result.track}</span>
                  </div>
                  {result.dominantDemonId && (
                    <div className="text-gray-400 text-xs mb-4">主導惡魔：{result.dominantDemonId}</div>
                  )}
                  <button
                    className="px-6 py-2 bg-game-accent/20 border border-game-accent text-game-accent rounded hover:bg-game-accent/40 text-sm transition-colors"
                    onClick={() => dispatch({ type: ACTION.APPLY_FINAL_EVAL_RESULT, result })}
                  >
                    進入結局
                  </button>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* ── 結局 ── */}
      {state.phase === 'ending' && (
        <EndingScreen ending={state.ending} onRestart={handleRestart} />
      )}

      {/* ── 存讀檔 ── */}
      {showSaveLoad && (
        <SaveLoadMenu
          state={state}
          onLoad={handleLoadSave}
          onClose={() => setShowSaveLoad(false)}
        />
      )}

      {/* ── AI 設定 ── */}
      {showAISettings && (
        <AISettingsPanel
          settings={aiSettings}
          onUpdate={updateAISettings}
          r18Settings={r18Settings}
          onUpdateR18={updateR18Settings}
          onClose={() => setShowAISettings(false)}
        />
      )}

      {/* [Debug] 調試選單 */}
      {showDebugMenu && (
        <DebugMenu
          state={state}
          dispatch={dispatch}
          goToScene={goToScene}
          onClose={() => setShowDebugMenu(false)}
        />
      )}
    </div>
  )
}
