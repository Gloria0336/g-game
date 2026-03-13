/**
 * App.jsx — 主入口，V3.0
 * 串接遊戲引擎（Phase A）所有 UI 元件與戰鬥邏輯
 */
import { useReducer, useEffect, useCallback, useRef, useState } from 'react'
import { gameReducer, INITIAL_STATE, ACTION } from './engine/GameEngine.js'
import { fillSceneText } from './engine/AIWriter.js'
import { judgeAwakeningType } from './engine/StatsManager.js'
import {
  executeBasicAttack,
  executeSkill,
  executeEnemyAttack,
  executeDefend,
  canTriggerSummon,
  buildTurnQueue,
} from './engine/CombatEngine.js'
import {
  DEMON_DATA,
  createDemonUnit,
  executeActiveSummonEffect,
  executeDemonTurn,
  executeDemonSkill,
  executeEnemyAttackOnDemon,
  applyPostSummonAffection,
} from './engine/DemonSystem.js'
import { getSkillData } from './engine/SkillDB.js'
import { rollSkillReward } from './engine/SkillRewardSystem.js'
import { getMonsterData } from './engine/MonsterDB.js'
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
  apothecary: '靈力回充',
  balanced: '契約脈衝',
}

function AwakeningResultPanel({ awakeningType, onConfirm }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-w-sm w-full mx-6 game-panel rounded-lg p-8 text-center">
        <p className="text-game-accent text-xs tracking-widest mb-4">AWAKENING</p>
        <h2 className="text-white text-xl font-bold mb-3">
          {AWAKENING_LABELS[awakeningType]}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          初始技能解鎖：<span className="text-game-accent">{AWAKENING_SKILLS[awakeningType]}</span>
        </p>
        <button
          onClick={onConfirm}
          className="px-8 py-3 border border-game-accent text-game-accent
            hover:bg-game-accent/15 rounded transition-all text-sm"
        >
          繼續
        </button>
      </div>
    </div>
  )
}

// ── 戰鬥結束面板 ─────────────────────────────────────────────

function CombatEndPanel({ result, narrative, onContinue }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80">
      <div className="max-w-md w-full mx-6 game-panel rounded-lg p-6 text-center">
        <h2 className={`text-xl font-bold mb-4 ${result === 'victory' ? 'text-game-accent' :
          result === 'defeat' ? 'text-red-400' : 'text-gray-400'
          }`}>
          {result === 'victory' ? '戰鬥勝利' :
            result === 'defeat' ? '戰鬥失敗' : '成功撤退'}
        </h2>
        {narrative && (
          <p className="text-gray-300 text-sm leading-relaxed mb-6">{narrative}</p>
        )}
        <button
          onClick={onContinue}
          className="px-8 py-2.5 border border-game-border text-gray-300
            hover:border-game-accent hover:text-game-accent rounded transition-all text-sm"
        >
          繼續
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

  const [aiStatus, setAIStatus] = useState('idle')
  const [aiErrorMsg, setAIErrorMsg] = useState('')
  const aiErrorTimerRef = useRef(null)

  // 覺醒結果顯示
  const [showAwakeningResult, setShowAwakeningResult] = useState(false)
  const [pendingAwakeningType, setPendingAwakeningType] = useState(null)

  // 戰鬥處理中標誌
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)

  // 面板開關
  const [showAISettings, setShowAISettings] = useState(false)
  const [showSaveLoad, setShowSaveLoad] = useState(false)
  const [showSkillManage, setShowSkillManage] = useState(false)
  const [revealedDemons, setRevealedDemons] = useState(new Set())

  // stateRef（避免 stale closure）
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // 回合推進 ref（避免 goToScene TDZ 問題）
  const handleEnemyTurnRef = useRef(null)
  const advanceToNextActorRef = useRef(null)
  const handleDemonTurnRef = useRef(null)

  // AI 錯誤自動消失
  useEffect(() => {
    if (aiStatus === 'error') {
      clearTimeout(aiErrorTimerRef.current)
      aiErrorTimerRef.current = setTimeout(() => setAIStatus('idle'), 4000)
    }
    return () => clearTimeout(aiErrorTimerRef.current)
  }, [aiStatus])

  // ── 場景載入 ─────────────────────────────────────────────

  const goToScene = useCallback(async (sceneId) => {
    const skeleton = await loadScene(sceneId)
    if (!skeleton) return

    let sceneData = skeleton

    if (aiSettings.enabled && aiSettings.apiKey && skeleton.type === 'narrative') {
      setAIStatus('generating')
      try {
        sceneData = await fillSceneText(skeleton, stateRef.current, aiSettings.apiKey, aiSettings.modelId)
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
        dispatch({ type: ACTION.START_COMBAT, enemyData })
        setIsProcessing(true)
        setTimeout(() => advanceToNextActorRef.current?.(), 1200)
      }
      dispatch({ type: ACTION.LOAD_SCENE, sceneData })
      return
    }

    dispatch({ type: ACTION.LOAD_SCENE, sceneData })
  }, [loadScene, aiSettings])

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
        const awakeningType = judgeAwakeningType(cur.awakeningScores)
        setPendingAwakeningType(awakeningType)
        setShowAwakeningResult(true)
        return
      }

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

    // 佇列耗盡 → 建立新回合
    if (queue.length === 0) {
      queue = buildTurnQueue(heroine, combat.activeDemons ?? {}, combat)
      dispatch({ type: ACTION.COMBAT_APPLY_LOG, combatUpdate: { log: ['── 新回合 ──'] } })
    }

    const next = queue[0]
    dispatch({ type: ACTION.SET_TURN_QUEUE, queue: queue.slice(1) })

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

    // 封印狀態：跳過敵人行動 → 直接回到下一行動者
    const sealStatus = combat.enemyStatuses?.find(s => s.type === 'seal')
    if (sealStatus) {
      dispatch({
        type: ACTION.COMBAT_APPLY_LOG,
        combatUpdate: {
          log: ['敵人被封印，跳過行動！'],
          enemyStatuses: combat.enemyStatuses
            .map(s => s.type === 'seal' ? { ...s, duration: s.duration - 1 } : s)
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
        desire: result.newHeroine.desire,
        equipment: result.newHeroine.equipment,
      },
    })

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
      dispatch({ type: ACTION.COMBAT_APPLY_LOG, heroineUpdate: { DES: (cur.heroine.DES ?? 0) + 5 } })

      const newDemons = applyPostSummonAffection(demons, demonId, 8)
      stateRef.current = { ...stateRef.current, demons: newDemons }
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

    const newDemons = applyPostSummonAffection(demons, demonId)
    stateRef.current = { ...stateRef.current, demons: newDemons }
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
    const { combat, sceneData } = cur

    // 序章戰鬥（scene_0_3）勝利後觸發覺醒結果
    if (sceneData?.isPrologueCombat && combat.result === 'victory') {
      const hpPercent = cur.heroine.HP / cur.heroine.maxHP
      const awakeningType = judgeAwakeningType(cur.flags, hpPercent)
      setPendingAwakeningType(awakeningType)
      setShowAwakeningResult(true)
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
    if (nextScene) await goToScene(nextScene)
  }, [goToScene])

  // ── 技能選擇 ─────────────────────────────────────────────

  const handlePickSkill = useCallback(async (skillId) => {
    dispatch({ type: ACTION.PICK_SKILL, skillId })
    const nextScene = stateRef.current.sceneData?.nextScene
    if (nextScene) await goToScene(nextScene)
  }, [goToScene])

  const handleSkipSkill = useCallback(async () => {
    dispatch({ type: ACTION.SKIP_SKILL_REWARD })
    const nextScene = stateRef.current.sceneData?.nextScene
    if (nextScene) await goToScene(nextScene)
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
  const showVNOverlay = ['dialogue', 'choice', 'dice', 'awakening'].includes(state.phase)

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
              className={`px-3 py-1 game-panel text-xs rounded transition-colors ${aiSettings.enabled ? 'text-purple-400 hover:text-purple-300' : 'text-gray-600 hover:text-gray-400'
                }`}
              onClick={() => setShowAISettings(true)}
            >
              ✦ AI{aiSettings.enabled ? ' ●' : ''}
            </button>
            <button
              className="px-3 py-1 game-panel text-gray-400 hover:text-game-accent text-xs rounded transition-colors"
              onClick={() => setShowSkillManage(true)}
            >
              ⚔ 技能
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
            allowSummon={!state.currentScene?.startsWith('0-')}
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
            onContinue={handleCombatEndContinue}
          />
        </>
      )}

      {/* ── 覺醒結果彈窗（phase 無關，任何時機都可顯示）── */}
      {showAwakeningResult && pendingAwakeningType && (
        <AwakeningResultPanel
          awakeningType={pendingAwakeningType}
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
          onClose={() => setShowAISettings(false)}
        />
      )}

    </div>
  )
}
