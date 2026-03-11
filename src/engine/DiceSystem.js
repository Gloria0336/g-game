/**
 * DiceSystem — 1D20 擲骰機制
 */

/**
 * 擲一顆 D20
 * @returns {number} 1–20
 */
export function rollD20() {
  return Math.floor(Math.random() * 20) + 1
}

/**
 * 執行骰點判定
 * @param {number} dc            難度等級
 * @param {number} statsBonus    數值加成
 * @returns {{ roll, bonus, total, isCritSuccess, isCritFailure, success }}
 */
export function performDiceCheck(dc, statsBonus = 0) {
  const roll = rollD20()
  const isCritSuccess = roll === 20
  const isCritFailure = roll === 1

  let success
  if (isCritSuccess) {
    success = true
  } else if (isCritFailure) {
    success = false
  } else {
    success = (roll + statsBonus) >= dc
  }

  return {
    roll,
    bonus: statsBonus,
    total: roll + statsBonus,
    dc,
    isCritSuccess,
    isCritFailure,
    success,
  }
}
