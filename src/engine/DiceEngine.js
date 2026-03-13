/**
 * DiceEngine — V3.0
 * D100 戰鬥命中/迴避 + D20 VN 場景骰點
 * 移植自 Dungen TRPG diceEngine，去除 TypeScript
 */

// ─── 基礎骰點 ─────────────────────────────────────────────────

/** 擲 N 面骰，回傳結果（1–N） */
export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1
}

/** 擲 D100 */
export function rollD100() {
  return rollDie(100)
}

/** 擲 D20 */
export function rollD20() {
  return rollDie(20)
}

// ─── D20 VN 場景骰點（原 DiceSystem）────────────────────────

/**
 * 執行 VN 場景的骰點檢定
 * @param {number} dc          難易度（1–20）
 * @param {number} statsBonus  來自數值的加成（每 10 點 +1）
 * @returns {{ roll, bonus, total, dc, success }}
 */
export function performDiceCheck(dc, statsBonus = 0) {
  const roll = rollD20()
  const total = roll + statsBonus
  return {
    roll,
    bonus: statsBonus,
    total,
    dc,
    success: total >= dc,
  }
}

// ─── D100 戰鬥命中系統 ────────────────────────────────────────

/**
 * D100 命中判定（攻擊方）
 * @param {number} baseHit     基礎命中率（0–99）
 * @param {number} spBonus     SP 命中加成（+5 / 0 / -10 / -25）
 * @param {number} statusBonus 狀態加成（正/負）
 * @returns {{ roll, threshold, hit }}
 */
export function d100HitCheck(baseHit, spBonus = 0, statusBonus = 0) {
  const threshold = Math.min(99, Math.max(5, baseHit + spBonus + statusBonus))
  const roll = rollD100()
  return { roll, threshold, hit: roll <= threshold }
}

/**
 * D100 迴避判定（防禦方）
 * @param {number} evadeRate    迴避率（0–100）
 * @param {boolean} controlled  被「封印」狀態：強制失敗
 * @returns {{ roll, evaded }}
 */
export function d100EvadeCheck(evadeRate, controlled = false) {
  if (controlled) return { roll: 0, evaded: false }
  const roll = rollD100()
  return { roll, evaded: roll <= Math.max(0, evadeRate) }
}

// ─── 回合順序判定 ─────────────────────────────────────────────

/**
 * 依 AGI 決定先後順序，AGI 相同時隨機決定
 * @param {number} heroineAGI
 * @param {number} enemyAGI
 * @returns {('heroine'|'enemy')[]}
 */
export function determineTurnOrder(heroineAGI, enemyAGI) {
  if (heroineAGI > enemyAGI) return ['heroine', 'enemy']
  if (enemyAGI > heroineAGI) return ['enemy', 'heroine']
  return Math.random() < 0.5 ? ['heroine', 'enemy'] : ['enemy', 'heroine']
}
