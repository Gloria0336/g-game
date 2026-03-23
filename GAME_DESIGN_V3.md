# 《心鎖：契約亂世》全局規劃書 V3.0

> **單一真相來源（Single Source of Truth）**
> 本文件整合 v2.0 + v2.1 所有設計決策，為開發過程中的最終參考規範。
> 每次設計變更請同步更新本文件。

---

## 目錄

1. [專案概述](#1-專案概述)
2. [世界觀與核心概念](#2-世界觀與核心概念)
3. [女主角系統](#3-女主角系統)
4. [序章覺醒系統](#4-序章覺醒系統)
5. [惡魔契約系統](#5-惡魔契約系統)
6. [戰鬥系統（完整規格）](#6-戰鬥系統完整規格)
7. [技能庫系統](#7-技能庫系統)
8. [情感數值與分歧系統](#8-情感數值與分歧系統)
9. [章節結構與路線](#9-章節結構與路線)
10. [自由探索地圖系統](#10-自由探索地圖系統)
11. [探索事件系統](#11-探索事件系統)
12. [結局矩陣](#12-結局矩陣)
13. [技術架構](#13-技術架構)
14. [AI 整合策略](#14-ai-整合策略)
15. [資料結構規格](#15-資料結構規格)
16. [實作路線圖](#16-實作路線圖)
17. [命名規範與檔案結構](#17-命名規範與檔案結構)

---

## 1. 專案概述

| 項目 | 內容 |
|------|------|
| **遊戲名稱** | 心鎖：契約亂世（HeartLock: Chaos Realm） |
| **類型** | 女性向 敘事 RPG（乙女 VN × 回合制戰鬥） |
| **目標受眾** | 18 歲以上女性玩家 |
| **技術棧** | React 18 + Vite 6 + Tailwind CSS 3 + OpenRouter API |
| **語言** | JavaScript（不使用 TypeScript） |
| **狀態管理** | useReducer（gameReducer） |
| **存檔系統** | localStorage（key: `heartlock_save_0~4`） |
| **AI 文本** | OpenRouter → Gemini 2.5 Flash / Grok 4 Fast |
| **設計核心** | 「在危機中建立的羈絆，比任何誓言都更真實。」 |

---

## 2. 世界觀與核心概念

### 2.1 世界設定

大陸上「裂隙」突然開裂，魔物透過裂隙湧入人間，各地陷入混亂。部分人類學會了「封印術」——以自身為媒介，與裂隙另一端的惡魔締結「契約」，換取力量。這些人被稱為**契約者（Covenant）**，是抵禦魔物侵擾的最後防線，也是最危險的存在。

### 2.2 女主角定位

- 剛獲得契約資格的新手契約者
- 持有三份空白契約書，尚未激活任何惡魔
- 職業：**契約者**（無其他職業分類）
- 戰鬥方式：單一化攻擊 + 技能組合（技能為個性化核心）
- 背景可由序章選擇反映，但固定為「孤身探索者」框架

### 2.3 設計哲學

- **戰鬥是情感催化劑**，不是遊戲目的本身
- **召喚有代價**：每次召喚惡魔都推進雙向情感變化，可能帶來危險後果
- **技能即個性**：玩家透過技能選擇建構自己的戰鬥風格，沒有職業限制
- **四向動態**：惡魔與玩家的關係不是線性攻略，而是雙軸互動的結果

---

## 3. 女主角系統

### 3.1 固定基礎數值（序章開始時）

```
情感數值：
  heart           (心動值)      10    範圍 -50~100；低 = 防衛高，高 = 心動深  [介面可見]
  DES             (慾望值)       0    受魔物技能/衣裝耐久/場景選擇影響  [介面可見 0–200]
                                       → 影響 AI 敘事語氣（見 6.6 節）
  insight         (洞察)       30    高 → 骰點加成、看穿謊言  [隱藏]
  independence    (獨立心)      30    高 → 不依賴召喚、解鎖獨行結局  [隱藏]

戰鬥數值：
  HP / maxHP      100 / 100
  SP / maxSP       80 / 80    靈力（技能消耗）
  ATK              18         基礎攻擊
  AGI               8         速度（決定回合順序）
  WIL               6         意志（抗控制 / SP 加成）
  DES               0         絕望值 0–200（影響 AI 敘事語氣）

起始裝備：
  weapon: { id: 'iron_sword', durability: 50 }  基礎鐵劍（序章教學用）
  upper:  { id: 'covenant_coat',  durability: 75 }
  lower:  { id: 'covenant_skirt', durability: 75 }
```

### 3.2 基礎攻擊規格

```
普通攻擊：
  Raw ATK   = ATK × [0.9–1.1]（浮動 ±10%）
  最終傷害  = Raw ATK × 1.15 × (1 − DR%) − FlatDR
  命中基礎  = 70%
```

---

## 4. 序章：烽火中的覺醒

### 4.1 設計理念

序章以**真實感**為核心。玩家從記憶喪失的狀態在烽火中醒來，沒有抽象試煉，沒有問答——覺醒從真實的選擇與戰鬥中誕生。

**分支入場系統**：玩家進入小鎮的方式分成三條路線，每條路線決定她以何種狀態（臨時加成或 HP 懲罰）踏入第一場真實戰鬥，並最終影響覺醒方向。

### 4.2 序章場景結構

```
scene_0_1          → 燃燒的夢境（烽火中醒來，失憶，發現鐵劍）
scene_0_2          → 小鎮邊緣（入場方式選擇，三選一）
    ├─ scene_0_2_a       → [tactical] 伏低潛入，目睹魔物殺人，先手
    ├─ scene_0_2_b       → [instinct] 直衝入場，遭偷襲 HP −20%
    └─ scene_0_2_c       → [insight]  登鐘樓俯瞰，看見屠殺全貌，子選擇
           ├─ scene_0_2_c_fight  → 縱身躍下攔截
           └─ scene_0_2_c_flee   → 試圖逃跑，被追上 HP −40%
scene_0_3          → 首戰・飢渴的裂隙犬（真實戰鬥）← 所有路線匯合
scene_0_3_post     → 宿命的轉折（契約書出現 → 進入 Ch1）
```

### 4.3 分支效果規格

| 路線 | 觸發 | 臨時加成（僅本戰） | HP 懲罰 |
|------|------|-------------------|---------|
| `0-2-a` (tactical) | 伏低潛入 | AGI +4 | — |
| `0-2-b` (instinct) | 直衝入場 | ATK +3, WIL +3 | −20% maxHP |
| `0-2-c-fight` (insight fight) | 俯瞰後躍下 | WIL +6 | — |
| `0-2-c-flee` (insight flee) | 試圖逃跑被追上 | AGI −5 | −40% maxHP |

> **臨時加成（prologueBonus）**：儲存於 `state.prologueBonus`，在 CombatEngine 計算時疊加於基礎數值，`AWAKENING_FINISH` 後歸零，**不永久寫入** heroine 屬性。

> **HP 懲罰下限**：無論懲罰多大，序章不引入召喚觸發條件（玩家尚未持有契約書），HP 不設下限保護。

### 4.4 覺醒判定規格

覺醒類型根據**入場路線旗標** + **戰後 HP 比例**判定：

| 覺醒類型 | 旗標條件 | HP 條件 | 數值加成 | 初始技能 |
|---------|---------|---------|---------|---------|
| **屠戮者 (Slayer)** | `entry_path: 'instinct'` | 戰後 HP ≤ 40% | ATK +8, AGI +2 | 本能突刺 |
| **均衡者 (Balanced)** | `entry_path: 'instinct'` | 戰後 HP > 40% | ATK+2, AGI+2, WIL+2 | 契約脈衝 |
| **守護者 (Guardian)** | `entry_path: 'tactical'` | 戰後 HP ≥ 70% | maxHP +30, WIL +2 | 護盾展開 |
| **逐風者 (Windwalker)** | `entry_path: 'tactical'` | 戰後 HP < 70% | AGI +6, insight +10 | 快速連打 |
| **尋求者 (Seeker)** | `entry_path: 'insight'`, `entry_fight: true` | — | insight +25, ATK +2 | 弱點標記 |
| **調律者 (Apothecary)** | `entry_path: 'insight'`, `entry_flee: true` | — | maxSP +40, WIL +4 | 靈力回充 |

> **隱性覺醒**：覺醒類型名稱不對玩家展現，介面只顯示數值加成與初始技能，統稱「契約者資質」。

### 4.5 序章戰鬥規格

| 項目 | 規格 |
|------|------|
| 敵人 | 飢渴的裂隙犬（`rift_hound`，Tier P） |
| 敵人 HP / ATK / AGI | 45 / 9 / 6 |
| 召喚條件 | **不適用**（玩家尚未持有契約書） |
| 技能掉落 | **不適用**（覺醒給予初始技能） |
| 戰鬥結束後 | 顯示覺醒結果 → 確認 → `scene_0_3_post`（契約書出現） |

### 4.6 宿命的轉折：惡魔契約書

- **旁白**：魔物的血液滲入了焦黑的地面，化作了三張充滿不祥氣息的契約書。
- **女主角**：「這些紙片……在呼喚我？」
- **劇情效果**：拾取契約書，玩家正式晉升為**契約者 (Covenant)**。隨後場景強制切換至第一章 1-1。

---

## 5. 惡魔契約系統

### 5.1 三名惡魔設定

| 契約惡魔 | 惡魔名 | 階位 | 能力類型 | 性格核心 |
|---------|--------|------|---------|---------|
| **demon_a** | **瑠夜**（Ruya） | 第七階・束縛惡魔 | 控制 / 封印型 | 溫柔表象下藏著深不見底的執著，說話輕柔，句句是陷阱 |
| **demon_b** | **颯牙**（Sōga） | 第五階・戰鬼惡魔 | 物理爆發型 | 直接強硬，把「比你強」掛在嘴邊，情感表達笨拙 |
| **demon_c** | **玄冥**（Xuán Míng） | 第九階・詛咒惡魔 | 詛咒 / 削弱型 | 極簡沉默，話少行動快，習慣獨自承受所有事 |

### 5.2 召喚觸發條件

```
召喚可用條件（滿足任一）：
  ├── 女主角 HP ≤ 30%（臨界呼喚）
  └── 女主角 DES ≥ 80（精神崩潰邊緣）

玩家選擇：
  ├── [召喚 瑠夜]  → 控制輔助型援助
  ├── [召喚 颯牙]  → 爆發破壞型援助
  ├── [召喚 玄冥]  → 詛咒削弱型援助
  └── [不召喚]    → 獨力應對（independence +3）

規則：
  - 同一戰鬥每個惡魔只能召喚一次
  - 已進入「敵對」狀態的惡魔無法召喚
  - 「背叛」狀態的惡魔召喚後會作為敵方援軍出現
```

### 5.3 惡魔召喚戰鬥效果

| 惡魔 | 召喚效果 | 機制說明 |
|------|---------|---------|
| **瑠夜** | 封印術：敵人下回合跳過行動 + 回復女主角 20% maxSP | 控制 + 補給，適合持久戰 |
| **颯牙** | 獸神衝擊：ATK × 3 × 1.6 直接傷害（無視 DR%） | 爆發破壞，一次決勝 |
| **玄冥** | 腐蝕詛咒：目標 DR% −20%（持續 3 回合）+ 反傷 10% | 削弱輔助，後期爆發 |

惡魔行動不佔用女主角回合（插入式行動）。

### 5.4 戰後惡魔停留

```
首次召喚：強制停留，必須完成一段對話
後續召喚：停留 1–2 個場景（依 summon_count 決定）

停留期間可觸發的對話類型：
  ├── 常規評論（affection 任意值）
  ├── 關心確認（trust ≥ 30）
  ├── 挑釁嘲諷（heroine_axis < 20）
  └── 越界行動（DES ≥ 120 + lust ≥ 50，18+ 設定開啟後解鎖）
```

---

## 6. 戰鬥系統（完整規格）

> **來源：完整移植自 Dungen TRPG combatEngine.ts + diceEngine.ts**

### 6.1 核心傷害公式

```
最終傷害 = (Raw ATK × [0.9–1.1]) × (1 + Amp%) × (1 − DR%) × (1 − SkillDR%) − FlatDR

  Raw ATK   = ATK × 隨機浮動（每次攻擊重新計算）
  Amp%      = 攻擊方技能加乘百分比（整數，如 10 = +10%）
  DR%       = 防禦方裝備耐久計算值（見 6.2）
  SkillDR%  = 技能 / 狀態臨時防禦（乘法疊加）
  FlatDR    = 固定減傷值（來自裝備或技能）
  最低傷害  = 1（不可為 0 或負數）

普通攻擊附加：Amp% = +15
技能依 SP 花費：1 SP 階 = ×1.3 / 2 SP 階 = ×1.5 / 3 SP 階 = ×1.8
```

### 6.2 裝備耐久度系統

#### 耐久度區間與 DR

```
上裝耐久 / 下裝耐久：各自獨立，範圍 0–100

區間懲罰（每件裝備有各自的 tierSteps 定義）：
  100–80：tierSteps['100_80']   通常 0（無懲罰）
   79–60：tierSteps['79_60']    輕微懲罰
   59–30：tierSteps['59_30']    中度懲罰
    30–0：tierSteps['30_0']     重度懲罰
```

#### DR 計算邏輯

```
1. 基礎值：固定 drU（上裝基礎）+ drL（下裝基礎）
2. 依各裝備當前耐久度區間，加入對應 tierSteps 懲罰值
3. 若裝備欄位有實際裝備，取 max(基礎計算, 裝備計算)
4. 最終 DR% = max(0, drU + drL)
```

#### 起始裝備 DR 規格

| 裝備 | 基礎 DR | tierSteps |
|------|--------|-----------|
| 契約者外衣（upper） | drU = 10 | {0, −2, −5, −9} |
| 契約者長裙（lower） | drL = 8  | {0, −2, −5, −9} |

#### 耐久傷害

```
耐久傷害量 = 攻擊技能設定值 × 1.3（向下取整）
目標部位：'upper'（上裝）/ 'lower'（下裝）/ 'both'（雙件）/ 'none'（不破壞）
耐久度範圍：0–100，低於 0 自動鎖定為 0
```

### 6.3 命中與迴避（D100 系統）

```
命中判定：Roll(1D100) ≤ hitThreshold   → 命中
  hitThreshold = 基礎命中 + SP加成 + 狀態加成（上限 99，下限 5）

迴避判定：Roll(1D100) ≤ evadeRate − 軟減益   → 迴避成功
  被「控制」狀態的目標自動放棄迴避

SP 命中加成（見第 3.2 節）
```

### 6.4 狀態效果規格

| 狀態 | 效果 | 最長持續 |
|------|------|---------|
| 流血 | 每回合損失固定 HP（技能決定數值） | 技能定義 |
| 重毒 | 每回合損失 8% 現存 HP | 技能定義 |
| 詛咒 | 每次使用技能額外消耗 8 SP | 技能定義 |
| 封印 | 跳過該回合所有行動，無法迴避 | 技能定義 |
| 標記 | 受到傷害 +25% | 技能定義 |
| 腐蝕 | DR% 降低 N%（技能決定） | 技能定義 |

### 6.5 DES 值規則

```
DES 增加觸發：
  裝備耐久降至 59 以下：DES +5
  裝備耐久降至 30 以下：DES +10
  HP 降至 30% 以下：DES +8 / 每次發生
  戰鬥失敗（HP = 0）：DES +30

DES 減少觸發：
  章節末休息事件：DES −15
  惡魔親密對話（特定選項）：DES −10

DES 上限：200
```

### 6.6 DES → AI 敘事語氣映射

| DES 值 | 語氣模式 | AI 敘事傾向 |
|--------|---------|------------|
| 0–40 | 清醒 | 冷靜戰鬥描寫，惡魔互動克制 |
| 41–80 | 動搖 | 疲憊緊張，惡魔開始過度關注女主角狀態 |
| 81–120 | 心防崩解 | 旁白帶情感暗示，惡魔行為越界感增強 |
| 121–160 | 依賴萌生 | 情感流露明顯，惡魔不願回到契約書 |
| 161–200 | 完全沉淪 | 18+ 語境解鎖（需設定開啟） |

---

## 7. 技能庫系統

### 7.1 系統概覽

```
技能庫（Skill Pool）：共 45 個技能，分三個等級

戰鬥結束觸發（勝利）：
  從當前章節對應 Tier Pool 中（排除已擁有）隨機抽 3 個 → 玩家選 1 或略過

事件獎勵觸發：
  隨機抽 2 個 → 玩家選 1 或略過

技能欄位上限：
  ├── active（戰鬥技能槽）：4 個
  └── inventory（庫存）：12 個（超過需丟棄才能取得新技能）

切換時機：據點場景 / 章節間隙（戰鬥中不可切換）
```

### 7.2 Tier 分配時機

| Tier | 名稱 | 掉落章節 | 技能數 |
|------|------|---------|-------|
| **Tier I** | 初階技能 | 第一層地點戰鬥 / Ch1 教學戰鬥 | 18 個 |
| **Tier II** | 中階技能 | 第二層地點戰鬥掉落 | 17 個 |
| **Tier III** | 高階技能 | 第三～五層地點 / 惡魔 trust ≥ 70 私下互動贈與 / Ch.E1 場景 | 10 個 |

### 7.3 Tier I 技能（初階・第 1–3 章）

| ID | 名稱 | SP | 效果 |
|----|------|-----|------|
| T1_01 | **弱點標記** | 14 | 本回合及下回合對目標傷害 +25%，移除目標 10% 迴避率 |
| T1_02 | **靈壓壓制** | 12 | 目標命中率 −20%（2 回合），需 WIL ≥ 8 |
| T1_03 | **本能突刺** | 18 | 傷害倍率 ×1.5，忽略目標 10% DR |
| T1_04 | **契約脈衝** | 10 | 傷害倍率 ×1.2，回復自身 15 SP（均衡覺醒限定初始，後可掉落）|
| T1_05 | **快速連打** | 20 | 攻擊 2 次，各 60% 傷害，命中獨立判定 |
| T1_06 | **護盾展開** | 15 | 本回合受到傷害 FlatDR +12 |
| T1_07 | **創口加深** | 22 | 攻擊後施加「流血」：每回合 −5 HP（3 回合）|
| T1_08 | **迴避步法** | 10 | 本回合迴避率 +30%（不可與攻擊同回合使用）|
| T1_09 | **靈力回充** | 0 | 回復 30 SP（消耗行動，不攻擊）|
| T1_10 | **震盪拳** | 18 | 傷害倍率 ×1.3，目標本回合行動延遲至回合末 |
| T1_11 | **致盲術** | 14 | 目標命中率 −25%（2 回合）|
| T1_12 | **重擊** | 25 | 傷害倍率 ×1.6，目標上裝耐久 −6 |
| T1_13 | **纏縛術** | 16 | 目標迴避率 −20%（2 回合）|
| T1_14 | **輕傷自癒** | 12 | 回復 15% maxHP |
| T1_15 | **魔力碎片** | 20 | 魔法攻擊，無視 50% 物理 DR，傷害倍率 ×1.1 |
| T1_16 | **衝刺突擊** | 22 | 傷害倍率 ×1.4，但自身下回合命中 −15% |
| T1_17 | **靈盾罩** | 18 | 抵消下一次受到的傷害（持續到被觸發）|
| T1_18 | **猛踏** | 18 | 傷害倍率 ×1.2，目標下裝耐久 −5 |

### 7.4 Tier II 技能（中階・第 4–7 章）

| ID | 名稱 | SP | 效果 |
|----|------|-----|------|
| T2_01 | **貫穿之刃** | 28 | 傷害計算無視目標 40% DR |
| T2_02 | **連鎖術式** | 35 | 攻擊 3 次，各 45% 傷害，命中獨立判定 |
| T2_03 | **上位護盾** | 22 | 本回合 FlatDR +20 且 SkillDR +10% |
| T2_04 | **毒素侵蝕** | 20 | 施加「重毒」：每回合損失 8% 現存 HP（4 回合）|
| T2_05 | **意志壓制** | 24 | 目標傷害 −25%（3 回合）|
| T2_06 | **反制之術** | 20 | 反彈下次受到攻擊的 150% 傷害（一次性）|
| T2_07 | **消耗汲取** | 26 | 傷害倍率 ×1.2，回復等同傷害 30% 的 HP |
| T2_08 | **迴旋斬** | 30 | 傷害倍率 ×1.4，目標上下裝耐久各 −4 |
| T2_09 | **中位自癒** | 18 | 回復 30% maxHP |
| T2_10 | **時間延遲** | 25 | 目標下次行動推延 2 個回合 |
| T2_11 | **屬性強化** | 20 | ATK +5（3 回合，可疊加）|
| T2_12 | **精神滿溢** | 0 | 回復 50 SP，下回合技能傷害 +15% |
| T2_13 | **精準注視** | 22 | 本回合命中率 +40%，傷害 +10% |
| T2_14 | **破甲衝擊** | 32 | 傷害倍率 ×1.5，目標上下裝耐久各 −8 |
| T2_15 | **詛咒纏繞** | 28 | 目標每使用 1 個技能額外消耗 8 SP（3 回合）|
| T2_16 | **鋼鐵意志** | 0 | 僅 HP < 30% 可用，本回合傷害 +50% |
| T2_17 | **身法幻影** | 25 | 本回合迴避率 +50%，且可同時進行攻擊 |

### 7.5 Tier III 技能（高階・第 8–10 章 / 惡魔贈與）

| ID | 名稱 | SP | 效果 | 來源 |
|----|------|-----|------|------|
| T3_01 | **滅世一擊** | 50 | 傷害倍率 ×2.0，完全無視 DR% 和 FlatDR | 戰鬥掉落 |
| T3_02 | **不死之心** | 40 | 本戰一次：受致命傷害時 HP 回復至 25% | 戰鬥掉落 |
| T3_03 | **時間靜止** | 55 | 目標跳過下 2 回合行動 | 戰鬥掉落 |
| T3_04 | **完全壁障** | 45 | 完全免疫下一次受到的任何傷害 | 戰鬥掉落 |
| T3_05 | **靈魂共鳴** | 40 | ATK / AGI / WIL 全部 +25%（3 回合）| 戰鬥掉落 |
| T3_06 | **絕命詛咒** | 48 | 造成目標當前 HP 35% 的傷害（無視 DR，最低 1）| 戰鬥掉落 |
| T3_07 | **束縛之印** 🔒 | 35 | 封印目標 2 回合 + 目標 DR −20% | 瑠夜 trust ≥ 70 |
| T3_08 | **獸神爆裂** 🔒 | 40 | 傷害倍率 ×1.8，上下裝耐久各 −15，附加延遲行動 | 颯牙 trust ≥ 70 |
| T3_09 | **腐蝕詛印** 🔒 | 38 | 目標 DR% −30%（全戰鬥）+ 反傷 15%（全戰鬥）| 玄冥 trust ≥ 70 |
| T3_10 | **契約覺醒** 🔒 | 60 | ATK ×2 + AGI ×2（2 回合），同時三惡魔各攻擊一次 | 全惡魔 trust ≥ 50 |

---

## 8. 情感數值與分歧系統

### 8.1 各惡魔情感數值

```javascript
per_demon: {
  affection:       -50–100   // 好感度（可為負：敵意）  [介面可見]
  trust:             0–100   // 信賴度  [介面可見]
  heroine_axis:   -100–100   // 女主角對惡魔的態度（負 = 討厭）  [隱藏]
  demon_axis:        0–100   // 惡魔對女主角的注意度  [隱藏]
  lust:              0–100   // 情慾度（對每個惡魔分別計算）  [隱藏]
                             // 影響來源：對話 soul_aroma 選項 + DES 值
  contract_status:           // 'active' | 'hostile' | 'betrayed' | 'resolved'
  summon_count:      0+      // 召喚次數（影響惡魔態度演變速度）
}
```

### 8.2 數值互動規則

```
召喚惡魔    → demon_axis +3 / summon_count++
不召喚      → independence +3
惡魔援助成功→ trust +2 / affection +2
對話選親近選項 (soul_aroma: positive) → heroine_axis +5–15 / lust +3 / demon_axis +4
對話選敵意選項 (soul_aroma: negative) → heroine_axis −5–15 / lust -1 / demon_axis -3
惡魔在意女主角 → demon_axis +5（每次召喚後依角色個性觸發）
DES 升高    → 主線惡魔 lust 緩慢上升（DES 每 +30 → lust +5）
場景選擇/遭遇 → heart ±N（依選項設計）、DES ±N（危險遭遇）
```

### 8.3 四向分歧路徑

#### ① 「傾心」路徑（女主角愛上惡魔）
```
觸發條件：heroine_axis ≥ 70 + demon_axis ≥ 40
效果：進入「深度契約路線」，解鎖浪漫結局
     惡魔對話中出現脆弱一面，性格逐漸軟化
```

#### ② 「惡魔傾心」路徑（惡魔愛上女主角）
```
觸發條件：demon_axis ≥ 80 + heroine_axis 20–60
效果：進入「越界契約路線」，惡魔開始做出契約外的行為
     若女主角最終拒絕 → 惡魔承受「反噬」，決絕離開（BE）
     若女主角接受    → 解鎖「執念結局」
```

#### ③ 「敵對」路徑（女主角討厭惡魔）
```
觸發條件：heroine_axis ≤ −30（數次對話選敵意選項）
效果：該惡魔進入 contract_status: 'hostile'
     下次戰鬥可能作為 BOSS 援軍出現
     可透過特殊對話嘗試挽回（困難分支）
```

#### ④ 「背叛」路徑（惡魔主動背棄契約）
```
觸發條件（任一）：
  a. demon_axis ≥ 90 + |heroine_axis| ≤ 10（惡魔認為「你根本不在乎我」）
  b. 女主角同時向多個惡魔發展傾心路線（嫉妒觸發）
  c. 關鍵場景選擇「出賣惡魔」的選項

效果：contract_status: 'betrayed'
     惡魔短暫成為敵人，但保有情感
     最高難度結局「以傷換傷」需另一惡魔幫助解決
```

### 8.3.5 全數值一覽

| 數值 | 範圍 | 介面 | 主要影響來源 | 影響結局方式 |
|------|------|------|-------------|------------|
| **heart**（心動值） | -50~100 | **顯示** | 場景選擇、惡魔對話 | 傾心/防衛路線分歧 |
| **DES**（慾望值） | 0~200 | **顯示** | 魔物技能、衣裝耐久、場景選擇與遭遇 | AI 敘事語氣、lust 累積速度 |
| insight（洞察） | 0~100 | 隱藏 | 覺醒類型、場景選擇 | 骰點加成、看穿謊言分支 |
| independence（獨立心） | 0~100 | 隱藏 | 不召喚惡魔選項 | ≥40 觸發獨行路線 |
| lust（情慾，per_demon） | 0~100 | 隱藏 | 對話 soul_aroma + DES 值 | 越界行動解鎖、執念結局 |
| affection（per_demon） | -50~100 | 顯示 | 惡魔援助、對話選項 | 各路線主結局分歧 |
| trust（per_demon） | 0~100 | 顯示 | 惡魔援助成功 | 路線深度、特殊對話解鎖 |
| heroine_axis（per_demon） | -100~100 | 隱藏 | 對話親/敵選項 | 四向分歧判定（8.3 節） |
| demon_axis（per_demon） | 0~100 | 隱藏 | 召喚次數、soul_aroma 對話 | 四向分歧判定（8.3 節） |

### 8.4 契約狀態判定時機

```
每次離開地點後執行 evaluateContractStatus()（exitLocation 事件觸發）：
  heroine_axis ≤ −30          → 'hostile'
  demon_axis ≥ 90 + |heroine_axis| ≤ 10 → 'betrayal_warning'
  否則                         → 'active'
```

### 8.5 探索期間數值累積補充規則

```
同伴召喚（戰鬥中召喚惡魔，依現有 DemonSystem 機制）：
  warmed_up_count + 1（每次召喚）

完成地點戰鬥（全程未召喚任何惡魔且勝利）：
  independence + 2

完成私下互動（demon_private_moment）：
  heroine_axis ±5–15（依玩家選項）
  demon_axis ±5–10
  lust ±0–10

跨惡魔干擾（整合至探索期間，見第 11 節事件系統）：
  非主導惡魔在特定地點觸發干擾事件後，設置相同的 interference_triggered 旗標
  EndingResolver 判定邏輯不變（見第 12 節）
```

---

## 9. 章節結構與路線

### 9.1 整體流程架構

```
序章（共通）：「裂隙之夜」
    ↓
第一章（共通）：「三個名字」（三惡魔依序登場）
    ↓
【自由探索階段】五層地牢地圖
  玩家自由推進五層，無固定路線
  與三惡魔在戰鬥中互動，關係數值自然累積
  探索期間 DES 溢出仍可觸發提前壞結局
    ↓ 完成第五層 5-3 後自動觸發
Ch.E1「裂隙最深處」（評估階段）
  依累積數值動態判定主導路線與結局軌道（四向分歧）
    ↓
Ch.E2「契約空間」（結局演出）
  EndingResolver → 23 種結局
```

### 9.2 共通章節

#### 序章「裂隙之夜」
```
場景數：8（含分支）
  共通：scene_0_1, scene_0_2, scene_0_3, scene_0_3_post
  分支：scene_0_2_a / scene_0_2_b / scene_0_2_c / scene_0_2_c_fight / scene_0_2_c_flee
戰鬥：1 場（Tier P 教學魔物・飢渴的裂隙犬）
內容：世界觀導入 → 分支入場（三路線）→ 首戰 → 覺醒判定 → 獲得契約書
```

#### 第一章「三個名字」
```
場景數：11（scene_1_1–scene_1_11）+ 3 個選項接續子場景（scene_1_4-r2 / 1_7-r2 / 1_10-r2）
戰鬥：3 場（Tier A 魔物，教學戰鬥）
  - 戰鬥一「束縛之印」（scene_1_3）：首次召喚瑠夜，機制：控制 + SP 補給
  - 戰鬥二「獸神衝擊」（scene_1_6）：首次召喚颯牙，機制：高爆發 + 無視防禦
  - 戰鬥三「腐蝕詛咒」（scene_1_9）：首次召喚玄冥，機制：削弱 + 反傷
內容：三份契約書依序激活 → 瑠夜→颯牙→玄冥各自登場、教學戰鬥、戰後對話
特殊：每位惡魔各有兩輪分歧選項對話（heroine_axis 單輪 ±3~±8）
     - 偏好路線：heroine_axis 合計 +14~+16
     - 中立好奇：heroine_axis 合計 +6~+8
     - 明顯排斥：heroine_axis 合計 −12~−16
收章：scene_1_11「三個名字」— 三人同框台詞，進入自由探索階段（第一層小鎮）
技能：戰鬥掉落 Tier I
教學戰 JSON 欄位：isTutorialSummon: true / tutorialDemon: "demon_a|b|c"
```

### 9.3 Ch.E1 評估階段

完成第五層 5-3 後自動觸發，執行 `evaluateFinalTrack(state)`：

```javascript
evaluateFinalTrack(state):
  // 1. 主導惡魔 = affection + trust 合計最高的惡魔
  // 2. 若 independence ≥ 60 且所有惡魔積分 < 30 → solo 路線
  // 3. 依主導惡魔數值判定四向軌道：
  //    demon_axis ≥ 80           → crisis（BE）
  //    heroine_axis ≥ 70         → romance_he（HE）
  //    heroine_axis ≥ 50         → romance_de（HE/BE）
  //    其他                       → conflict（NE）
  // 4. 跨線干擾旗標讀取（interference_triggered）→ 子結局判定
  // 輸出格式與 resolveEnding() 輸入完全相容
```

評估結果顯示於 `FinalEvalScreen.jsx`，玩家確認後進入 Ch.E2。

### 9.4 Ch.E2 結局演出

依 Ch.E1 判定的路線 × 結局軌道，由 `EndingResolver.js` 輸出最終結局 ID，
進入 `EndingScreen.jsx` 演出（AI 生成個性化結局敘事）。

**各路線主題（仍為核心敘事驅動，散布於探索期間私下互動場景中）：**

| 路線 | 主題 | 核心衝突 |
|------|------|---------|
| **瑠夜路線**「溫柔的囚籠」 | 愛到底算不算是一種束縛 | 瑠夜的執著超出了惡魔應有的限度——他在保護還是在控制 |
| **颯牙路線**「輸給了一個人」 | 強者對弱者的鄙視如何變成不願承認的在乎 | 颯牙一直認為女主角太弱——直到他開始怕她受傷比怕死更甚 |
| **玄冥路線**「詛咒的另一面」 | 一個從不期待被記得的惡魔被某人記住了 | 玄冥的力量來自傷痛，她越了解他，他的力量越不穩定 |
| **獨行路線**「不需要你」 | 人類的力量能否真的抵禦惡魔 | 女主角獨力作戰，三個惡魔以不同方式試圖介入——但她拒絕了 |

### 9.5 跨路線干擾（整合至探索期間）

非主導惡魔在探索特定地點時可觸發干擾事件（替代原 Ch5 硬性時間點）。
同一存檔每個惡魔最多觸發一次，記錄寫入 `state.flags.interference_triggered`。

| 非主導惡魔條件 | 觸發時機 | 干擾內容 | 數值效果 |
|-------------|---------|---------|---------|
| affection ≥ 30（任一非主導） | 探索特定地點時 | 插入「第三者出現」對話（1 段） | 主導惡魔 heroine_axis ±5（依玩家回應） |
| heroine_axis ≤ −25（任一非主導） | 探索特定地點時 | 非主導惡魔作為臨時盟友介入戰鬥 | 該非主導惡魔 trust +8 |
| demon_axis ≥ 70（任一非主導）且 warmed_up_count = 0 | 探索特定地點時 | 該惡魔主動現身，強制對話 | 該惡魔 contract_status → `betrayal_warning` |

---

---

## 10. 自由探索地圖系統

### 10.1 地圖設計哲學

地圖不是「關卡」，而是「關係累積的容器」。玩家在五層地牢中自由推進，
每個地點都提供機會讓關係數值自然累積，無強制主軸路線。
地牢式規則：**無法返回上一層**，每層通關後鎖定。

### 10.2 預設子層解鎖規則

> 除特殊定義外，**所有子層預設解鎖方式為：在當前子層經歷完 3 個地點後，第 3 個地點自動解鎖下一子層入口。**

### 10.3 五層地圖規格

#### 第一層：小鎮（Town）
```
魔物等級：Tier A
地點結構：固定（Ch0/Ch1 場景延伸，非隨機）
推進至第二層：進入 town_outskirts（小鎮外圍）後自動解鎖
```

#### 第二層：裂隙外圍（Rift Outskirts）
```
魔物等級：Tier A 為主 + 少量 Tier B
子層數：5 個，每子層隨機生成 4 個地點

子層解鎖條件：
  2-1：由小鎮外圍自動解鎖進入
  2-2 ~ 2-5：預設（完成前一子層 3 個地點）

推進至第三層：至少完成 3 場戰鬥後，在 2-5 解鎖第三層入口
```

#### 第三層：裂隙入口（Rift Entrance）
```
魔物等級：Tier B
子層數：5 個，每子層隨機生成 4 個地點

子層解鎖條件：
  3-1：由第二層推進後自動進入
  3-2 ~ 3-5：預設

推進至第四層：至少完成 3 場戰鬥後，在 3-5 解鎖第四層入口
```

#### 第四層：深入裂隙（Deep Rift）
```
魔物等級：Tier B 為主 + 少量 Tier C
子層數：5 個，每子層隨機生成 4 個地點

子層解鎖條件：
  4-1：由第三層推進後自動進入
  4-2 ~ 4-5：預設

推進至第五層：至少完成 3 場戰鬥且至少擊殺 1 名 Tier C 魔物後，在 4-5 解鎖第五層入口
```

#### 第五層：裂隙最深處（Deepest Rift）
```
魔物等級：Tier B + Tier C
子層數：3 個，每子層隨機生成 4 個地點

子層解鎖條件：
  5-1：由第四層推進後自動進入
  5-2 ~ 5-3：預設

完成 5-3：自動觸發 Ch.E1
```

### 10.4 地點庫（LocationDB）規格

完整定義見 `src/engine/LocationDB.js`。每個地點類型（LocationType）包含：

```javascript
{
  typeId: String,           // 地點類型 ID
  name: String,             // 地點名稱
  layer: Number,            // 所屬層數（1–5）
  description: String,      // 固定場景描寫文本
  aiPromptHint: String,     // AI 生成場景描寫的提示詞指引
  eventPool: [              // 可能發生的事件列表
    {
      eventTypeId: String,           // EventDB 中的事件類型或子類型 ID
      triggerChance: Number | null,  // 機率 0–1；null = 條件觸發
      triggerCondition: Object | null,
      weight: Number,
    }
  ]
}
```

#### 地點類型清單

**第一層（小鎮）：**
| typeId | 名稱 | 主要事件類型 |
|--------|------|------------|
| `town_market` | 廢棄集市 | rest_recovery、item_discovery、npc_encounter |
| `town_shelter` | 臨時避難所 | rest_recovery、npc_encounter、demon_private_moment |
| `town_outskirts` | 小鎮外圍 | investigation、rift_anomaly、npc_encounter、crisis_rescue |

**第二層（裂隙外圍）：**
| typeId | 名稱 | 主要事件類型 |
|--------|------|------------|
| `outskirts_ruins` | 廢棄建築群 | investigation、item_discovery、trap、crisis_rescue |
| `outskirts_field` | 荒廢曠野 | encounter_combat、rift_anomaly、crisis_rescue |
| `outskirts_camp` | 廢棄紮營地 | rest_recovery、item_discovery、npc_encounter |
| `outskirts_watchtower` | 崩塌瞭望台 | investigation、demon_private_moment、crisis_rescue |
| `outskirts_road` | 破碎公路 | encounter_combat、npc_encounter、crisis_rescue |

**第三層（裂隙入口）：**
| typeId | 名稱 | 主要事件類型 |
|--------|------|------------|
| `rift_boundary` | 裂隙邊界 | rift_anomaly、encounter_combat、investigation |
| `rift_forest` | 腐化森林 | encounter_combat、trap、demon_private_moment、item_discovery |
| `rift_nest` | 魔物聚集地 | encounter_combat（極高）、item_discovery、crisis_rescue |
| `rift_ruins` | 古代遺跡 | investigation、item_discovery、trap、crisis_rescue |
| `rift_gate` | 封印殘跡 | rift_anomaly、investigation、demon_private_moment |

**第四層（深入裂隙）：**
| typeId | 名稱 | 主要事件類型 |
|--------|------|------------|
| `deep_interior` | 裂隙內部 | rift_anomaly、encounter_combat、investigation |
| `deep_lair` | 魔物巢穴 | encounter_combat（極高）、item_discovery、trap |
| `deep_shrine` | 腐化祭壇 | investigation、rift_anomaly、demon_private_moment、trap |
| `deep_vortex` | 能量漩渦 | rift_anomaly（極高）、encounter_combat、crisis_rescue |
| `deep_corridor` | 崩塌通道 | encounter_combat、trap、item_discovery |

**第五層（裂隙最深處）：**
| typeId | 名稱 | 主要事件類型 |
|--------|------|------------|
| `core_chamber` | 核心腔室 | rift_anomaly（極高）、encounter_combat、demon_private_moment |
| `demon_territory` | 異界領域 | encounter_combat（極高）、demon_private_moment、investigation |
| `core_threshold` | 裂隙源點入口 | investigation、rift_anomaly、crisis_rescue（高） |

---

## 11. 探索事件系統

### 11.1 惡魔召喚規則（探索期間）

**維持現有觸發條件**（HP≤30% 或 DES≥80），戰鬥中可召喚三者之一。
召喚後數值變化依現有 `DemonSystem.js` 機制（warmed_up_count 追蹤召喚次數）。

- 全程未召喚任何惡魔且勝利 → `independence + 2`
- 私下互動（demon_private_moment）：進入地點時系統依條件判定觸發，與戰鬥召喚無關

### 11.2 事件類型庫（EventDB）規格

完整定義見 `src/engine/EventDB.js`。

#### `encounter_combat` — 遭遇戰

| 欄位 | 內容 |
|------|------|
| 觸發 | 地點事件池抽取（依 triggerChance / weight） |
| 流程 | 觸發 COMBAT phase，魔物等級依所在層決定 |
| 前置 | 依地點類型生成不同遭遇旁白（AI 生成） |
| 獎勵 | 技能掉落（SkillRewardSystem）＋隨機機率掉落隨機裝備（依 Tier）＋固定隨機數值加成（ATK / MaxHP / MaxSP / AGI / WIL） |
| 懲罰 | 依戰鬥結果結算（無固定懲罰） |
| 特殊 | 全程未召喚惡魔且勝利 → independence +2 |

#### `investigation` — 調查事件

| 欄位 | 內容 |
|------|------|
| 流程 | 依地點類型呈現不同調查描述 → 2–3 選項 → DICE phase（insight 每 10 點 → 骰點+5） |
| 成功 | 隱藏信息 flags、偶發技能獎勵、觸發 item_discovery |
| 失敗 | 旁白描述，無數值懲罰 |
| 特殊 | 特定地點成功 → 解鎖對應惡魔私下互動條件 |

#### `crisis_rescue` — 危機救援（依地點分類為子類型）

共通規則：不介入 → independence +1；介入 → 依子類型展開

| 子類型 | 觸發地點 | 介入流程 | 成功獎勵 | 失敗結果 |
|--------|---------|---------|---------|---------|
| `rescue.town_outskirts` | 小鎮外圍 | 強制 encounter_combat | heart +3、npc_favor 旗標 | 救援失敗，DES +10 |
| `rescue.outskirts_ruins` | 廢棄建築群 | WIL+AGI 骰點 | heart +2、item_discovery | HP -10%、裝備耐久 -2 |
| `rescue.outskirts_field` | 荒廢曠野 | 強制 encounter_combat | heart +3、npc_favor 旗標 | 救援失敗，DES +10 |
| `rescue.outskirts_watchtower` | 崩塌瞭望台 | AGI 骰點 | heart +2、independence +1 | 觸發 encounter_combat |
| `rescue.outskirts_road` | 破碎公路 | 強制 encounter_combat | heart +3 | 救援失敗 |
| `rescue.rift_nest` | 魔物聚集地 | 強制 encounter_combat（敵方+1） | heart +3、item_discovery | 救援失敗，DES +15 |
| `rescue.rift_ruins` | 古代遺跡 | insight 骰點 | heart +2、investigation | trap.seal 觸發（雙方） |
| `rescue.deep_vortex` | 能量漩渦 | WIL 骰點 OR 惡魔協助 | heart +3、insight +2 | DES +20 |
| `rescue.core_threshold` | 裂隙源點入口 | 三選一（拉回/自選/放棄） | heart +5、independence +3 | DES +25、HP -15% |

#### `rift_anomaly` — 裂隙異變（子類型）

| 子類型 | 現象 | 應對選項 | 效果 |
|--------|------|---------|------|
| `anomaly.spatial` | 空間扭曲 | ①惡魔定向 ②獨自直覺 ③撤退 | ①DES+5、demon_axis+3 ②WIL骰點→成功independence+3/失敗DES+12、HP-5% |
| `anomaly.surge` | 能量衝擊 | ①抵抗 ②順流 ③撤退 | ①WIL骰點→成功DES+5/失敗DES+20 ②DES+10、insight+3 |
| `anomaly.swarm` | 魔物湧現 | ①迎戰 ②惡魔壓制 ③撤退 | ①強制 encounter_combat（敵方+1）②demon_axis+5、DES+8 |
| `anomaly.vision` | 幻覺侵蝕 | ①對抗 ②沉溺 ③撤退 | ①insight骰點→成功insight+3/失敗heroine_axis-5 ②DES+15、lust+5 |
| `anomaly.seal` | 封印崩潰 | ①研究 ②強化 ③撤退 | ①investigation觸發 ②WIL骰點→成功封印flags/失敗DES+8、HP-10% |

#### `trap` — 陷阱（子類型）

| 子類型 | 規避判定 | 完整觸發效果 | 半規避效果 |
|--------|---------|------------|----------|
| `trap.physical` | AGI | HP-20%、裝備耐久-10 | HP-10%、裝備耐久-2 |
| `trap.magical` | WIL | SP-30%、下場戰鬥骰點-10 | SP-15% |
| `trap.mental` | insight | DES+20、heroine_axis+5（對最高affection惡魔） | DES+10 |
| `trap.ambush` | AGI（先制） | 強制 encounter_combat，敵方先攻一回合 | 正常 encounter_combat |
| `trap.seal` | WIL | 隨機封印一項能力（ATK/AGI/WIL/DES任一），數值隨機減少，持續本子層 | 封印效果減半 |

> 召喚惡魔同行時（warmed_up_count > 0）：可能提前察覺陷阱（骰點+10）

#### `rest_recovery` — 休息/補給

| 選擇 | 效果 |
|------|------|
| 獨自休息 | HP+20%、SP+20%、DES-10、independence+1 |
| 惡魔陪伴 | HP+30%、SP+30%、DES-15、affection+2、trust+1；附帶短對話 |
| 限制 | 每個子層最多休息 1 次 |

#### `item_discovery` — 物品發現

物品類型：回復道具（HP/SP/DES）、裝備耐久修復材料、技能碎片。
稀有度依層數決定品質。特定物品觸發召喚惡魔評論短對話（warmed_up_count > 0）。

#### `demon_private_moment` — 惡魔私下互動

替代原 Ch3-Ch8 線性感情推進場景。各惡魔×地點組合設定觸發條件（affection 門檻 + warmed_up_count 門檻），每組合只觸發一次。
獎勵：heroine_axis ±5–15、demon_axis ±5–10、lust ±0–10（依選項）。

#### `npc_encounter` — NPC 遭遇

遭遇倖存者或其他契約者 → 對話選擇 → 結果包含：情報 flags、物品交換、觸發 crisis_rescue。
部分 NPC 已魔物化，揭露後觸發強制 encounter_combat。

---

## 12. 結局矩陣

### 10.1 主結局矩陣（4 × 4）

| 路線 | 傾心（HE）<br>浪漫軌 heroine_axis ≥ 70 | 惡魔傾心（HE/BE）<br>浪漫軌 heroine_axis 50–69 | 敵對解決（NE）<br>衝突軌 | 背叛（BE）<br>危機軌 |
|------|------|------|------|------|
| **瑠夜** | 永遠的囚人 | 你的枷鎖 | 碎裂的契約 | 以傷換傷 |
| **颯牙** | 輸了又怎樣 | 我贏了你 | 沒你更輕鬆 | 對手的背影 |
| **玄冥** | 被你記住了 | 詛咒不消散 | 沉默的謝辭 | 裂隙另一端 |
| **獨行** | — | — | — | 一個人走完 |

### 10.2 跨路線干擾觸發的子結局（+7）

| 子結局名稱 | 觸發路線 | 觸發條件 | 性質 |
|----------|---------|---------|------|
| 「被搶走了」 | 瑠夜路線 | 跨線干擾（非主選 affection ≥ 30）+ 浪漫軌 | HE 變體 |
| 「枷鎖的裂縫」 | 瑠夜路線 | 跨線干擾（非主選 heroine_axis ≤ −25）+ 衝突軌 | NE 變體 |
| 「另一個強者」 | 颯牙路線 | 跨線干擾（非主選 affection ≥ 30）+ 浪漫軌 | HE 變體 |
| 「我不輸給你」 | 颯牙路線 | 跨線干擾（demon_axis ≥ 70 且未召喚）+ 危機軌 | BE 變體 |
| 「被看見了」 | 玄冥路線 | 跨線干擾（非主選 affection ≥ 30）+ 浪漫軌 | HE 變體 |
| 「另一個傷痛」 | 玄冥路線 | 跨線干擾（非主選 heroine_axis ≤ −25）+ 衝突軌 | NE 變體 |
| 「不需要任何人」 | 獨行路線 | 成功抵擋所有三次干擾嘗試 | HE（純粹） |

### 10.3 結局總數

| 類別 | 數量 |
|------|------|
| 主結局 | 16 |
| 干擾子結局 | 7 |
| **合計** | **23** |

---

## 13. 技術架構

### 13.1 技術棧

```
框架：    React 18 + Vite 6
樣式：    Tailwind CSS 3（自訂 token：game-dark, game-panel, game-border, game-accent）
語言：    JavaScript（不遷移 TypeScript）
狀態：    useReducer（gameReducer）
存檔：    localStorage（key: heartlock_save_0~4）
AI：      OpenRouter API（Gemini 2.5 Flash / Grok 4 Fast）
場景資料：動態 import() 載入 JSON（Vite 自動 code-split）
```

### 13.2 引擎模組

```
src/engine/
├── GameEngine.js          useReducer reducer + ACTION types
│                          phases: title / awakening / dialogue / choice /
│                                  dice / combat / demon_summon / combat_end /
│                                  demon_dialogue / skill_reward / ending /
│                                  map / final_eval
├── StatsManager.js        數值計算、applyEffects、applyAwakening、evaluateContractStatus
├── CombatEngine.js        傷害公式、DR 計算、耐久傷害
├── DiceEngine.js          D100 + 命中/迴避判定（保留 D20 供 VN 場景）
├── DemonSystem.js         召喚觸發、停留計算、戰後互動、分歧判定
├── SkillDB.js             45 技能完整資料庫（含 Tier 分配、掉落池）
├── SkillRewardSystem.js   戰後抽取邏輯、庫存管理
├── MonsterDB.js           魔物資料庫（Tier A/B/C）
├── EquipmentDB.js         裝備資料庫（含起始裝備）
├── ChoiceResolver.js      選項過濾、VN 場景骰點
├── EndingResolver.js      結局判定（含 evaluateFinalTrack）
├── AIWriter.js            OpenRouter 整合（場景生成 + 戰鬥敘事 + 惡魔對話）
├── SaveSystem.js          localStorage 存讀
├── MapEngine.js           [新增] 子層生成、地點隨機抽取、解鎖條件判定
├── ExplorationSystem.js   [新增] 事件池解析、觸發判定、私下互動條件判定
├── LocationDB.js          [新增] 所有地點類型定義（typeId/name/layer/description/aiPromptHint/eventPool）
└── EventDB.js             [新增] 所有事件類型及子類型定義（流程/獎懲/特殊規則）
```

### 13.3 UI 元件

```
src/components/
├── TitleScreen.jsx          主選單
├── BackgroundLayer.jsx      背景圖層
├── CharacterSprite.jsx      角色立繪
├── DialogueBox.jsx          對話框（打字機效果）
├── ChoicePanel.jsx          選項面板
├── DiceModal.jsx            D20 骰點結果 Modal
├── StatsDisplay.jsx         數值面板（可收合）
├── SaveLoadMenu.jsx         存讀檔介面
├── EndingScreen.jsx         結局演出
├── AISettingsPanel.jsx      AI 設定面板
├── CombatScreen.jsx         [新增] 戰鬥主畫面（HP/SP條、技能列、敵人）
├── CombatLog.jsx            [新增] 戰鬥訊息捲動顯示
├── DemonSummonModal.jsx     [新增] 召喚選擇畫面（3 個惡魔 + 不召喚）
├── DemonDialogueOverlay.jsx [新增] 戰後惡魔對話（疊加在戰鬥背景的 VN 模式）
├── SkillRewardScreen.jsx    [新增] 戰後技能選擇畫面（3 選 1 卡片）
├── SkillManageScreen.jsx    [新增] 技能槽管理（據點 / 章節間）
├── WorldMapScreen.jsx       [新增] 五層地牢子層地點節點選擇 UI
└── FinalEvalScreen.jsx      [新增] Ch.E1 評估結果顯示（主導惡魔 + 結局軌道）
```

### 13.4 Phase 狀態機（完整）

```javascript
// GameEngine.js 中定義
const PHASES = {
  TITLE:           'title',           // 主選單
  AWAKENING:       'awakening',       // 序章覺醒流程
  DIALOGUE:        'dialogue',        // VN 對話場景
  CHOICE:          'choice',          // 玩家選項
  DICE:            'dice',            // D20 骰點（VN 場景用）
  COMBAT:          'combat',          // 戰鬥回合（D100）
  DEMON_SUMMON:    'demon_summon',    // 召喚選擇畫面
  COMBAT_END:      'combat_end',      // 戰鬥結束 + AI 敘事
  DEMON_DIALOGUE:  'demon_dialogue',  // 惡魔停留對話
  SKILL_REWARD:    'skill_reward',    // 技能選擇畫面
  ENDING:          'ending',          // 結局演出
  MAP:             'map',             // 五層地牢地點選擇介面
  FINAL_EVAL:      'final_eval',      // Ch.E1 評估畫面
}
```

---

## 14. AI 整合策略

### 12.1 AIWriter.js 功能架構

```javascript
// 現有（沿用）
fillSceneText(sceneData, gameState, apiKey, modelId)
  → 場景骨架 text 欄位 AI 填充

verifyAPIKey(apiKey)
  → OpenRouter API Key 驗證

// 新增
generateCombatNarrative(combatResult, gameState, apiKey, modelId)
  → 戰鬥結束後 60–150 字敘事（依 DES 值調整語氣）

generateDemonDialogue(demonId, combatResult, gameState, apiKey, modelId)
  → 惡魔停留對話（含 3 個玩家可選的回應方向）

generateAwakeningScene(awakeningType, gameState, apiKey, modelId)
  → 序章覺醒演出台詞
```

### 12.2 惡魔角色設定（CHAR_PROFILES）

```javascript
const CHAR_PROFILES = {
  demon_a: '瑠夜｜第七階束縛惡魔・說話輕柔帶笑意，每句話都像精心設計的陷阱・越親近越危險・對「契約」有超出常規的執念',
  demon_b: '颯牙｜第五階戰鬼惡魔・直接強硬，把「比你強」當口頭禪・情感表達笨拙・其實根本不知道怎麼對人好',
  demon_c: '玄冥｜第九階詛咒惡魔・話極少・行動比話快・沉默背後有說不出口的事・詛咒力量來自傷痛',
}
```

### 12.3 AI prompt 約束規則

```
所有 prompt 中必須注入的約束：
1. 當前 DES 值 → 對應敘事語氣模式（見 6.6 節）
2. 當前 contract_status → 惡魔行為限制
3. heroine_axis 與 demon_axis → 對話情感基調
4. 禁止描述角色死亡（除非結局場景）
5. 禁止添加 JSON 骨架中不存在的行動
6. 禁止矛盾當前戰鬥結果（勝/負/逃脫）
```

---

## 15. 資料結構規格

### 15.1 完整 GameState

```javascript
{
  phase: 'title',          // 當前 phase（見 11.4）
  currentChapter: 0,       // 當前章節
  mainRoute: null,         // null | 'demon_a' | 'demon_b' | 'demon_c' | 'solo'
  flags: {},               // 任意旗標（用於場景條件判定）
  _pendingNextScene: null, // 待跳轉場景 ID

  // 女主角
  heroine: {
    heart:          10,   // 心動值 -50~100  [介面可見]
    insight:        30,   // 洞察  [隱藏]
    independence:   30,   // 獨立心  [隱藏]
    HP: 100, maxHP: 100,
    SP:  80, maxSP:  80,
    ATK: 18,
    AGI:  8,
    WIL:  6,
    DES:  0,
    awakening: null,   // 'tactical' | 'spiritual' | 'instinct' | 'balanced'
    equipment: {
      upper: { id: 'covenant_coat',  durability: 75 },
      lower: { id: 'covenant_skirt', durability: 75 },
    },
  },

  // 技能
  skills: {
    active:    [],   // 最多 4 個（ID 字串）
    inventory: [],   // 最多 12 個
  },

  // 各惡魔關係
  demons: {
    demon_a: { affection: 0, trust: 0, heroine_axis: 0, demon_axis: 0, lust: 0, contract_status: 'active', summon_count: 0, warmed_up_count: 0, private_moments_triggered: [] },
    demon_b: { affection: 0, trust: 0, heroine_axis: 0, demon_axis: 0, lust: 0, contract_status: 'active', summon_count: 0, warmed_up_count: 0, private_moments_triggered: [] },
    demon_c: { affection: 0, trust: 0, heroine_axis: 0, demon_axis: 0, lust: 0, contract_status: 'active', summon_count: 0, warmed_up_count: 0, private_moments_triggered: [] },
  },

  // 探索狀態
  exploration: {
    currentLayer: 1,
    currentSubLayer: 1,
    visitedSubLayers: [],            // 已完成的子層 ['2-1', '2-2', ...]
    currentSubLayerLocations: [],    // 當前子層的 4 個 LocationType IDs（隨機生成）
    completedLocations: [],          // 本子層已探索完畢的地點索引
    completedEvents: [],             // 全域已完成事件 ID（防重複觸發）
    restUsedInSubLayer: false,       // 本子層是否已使用休息
    layerBattleCount: 0,             // 當前層累積戰鬥場數（用於層間解鎖判定）
    tierCKillCount: 0,               // 當前層擊殺 Tier C 數（用於 4→5 解鎖）
    subLayerUnlocked: false,         // 當前子層是否已滿足推進條件
  },

  // 當前戰鬥狀態（phase === 'combat' 時有效）
  combat: {
    enemyId: null,
    enemyHP: 0,
    enemyMaxHP: 0,
    enemyStatuses: [],   // 狀態效果陣列
    heroineStatuses: [], // 狀態效果陣列
    turn: 0,
    turnOrder: [],       // ['heroine', 'enemy']
    log: [],             // 戰鬥訊息記錄
    summonedThisBattle: [], // 本場已召喚的惡魔 ID
  },

  // VN 場景資料
  sceneData: null,
  currentDialogue: 0,
  pendingChoices: null,
  diceResult: null,
  ending: null,
}
```

### 15.2 場景 JSON 格式

#### VN 場景（type: 'narrative'）
```json
{
  "sceneId": "1-1",
  "type": "narrative",
  "background": "forest_path",
  "nextScene": "1-2",
  "dialogues": [
    { "speaker": "narrator", "text": "靜態文本（AI 覆寫）" },
    { "speaker": "demon_a", "sprite": "demon_a_smile", "text": "..." },
    {
      "type": "choice",
      "prompt": "...",
      "choices": [
        { "text": "...", "effects": { "heroine_axis_a": 10 }, "next": "1-1-a" },
        { "text": "...", "effects": { "heart": -5 }, "next": "1-1-b" }
      ]
    }
  ]
}
```

#### 戰鬥場景（type: 'combat'）
```json
{
  "sceneId": "1-2",
  "type": "combat",
  "background": "forest_ruin",
  "enemyId": "vine_monster",
  "preCombatScene": "1-2-pre",
  "postCombatScene": "1-2-post",
  "nextScene": "1-3"
}
```

### 15.3 技能資料格式

```javascript
// SkillDB.js 中每個技能的結構
{
  id: 'T1_05',
  name: '快速連打',
  tier: 1,
  spCost: 20,
  effect: {
    type: 'multi_attack',
    hits: 2,
    ampPercent: -40,       // 各次 60% 傷害（相對 +15% 基礎）
    durabilityDamage: { amount: 0, target: 'none' },
  },
  description: '攻擊 2 次，各 60% 傷害，命中獨立判定',
}
```

---

## 16. 實作路線圖

### Phase A — 基礎框架（優先）

| 任務 | 模組 | 備注 |
|------|------|------|
| 序章覺醒流程 | `GameEngine.js` + `StatsManager.js` | 新增 `awakening` phase + `applyAwakening()` |
| 戰鬥引擎移植 | `CombatEngine.js` + `DiceEngine.js` | 從 Dungen 移植，去掉 TypeScript |
| 惡魔召喚系統 | `DemonSystem.js` | 召喚觸發、行動效果、停留狀態 |
| 基礎戰鬥 UI | `CombatScreen.jsx` + `DemonSummonModal.jsx` | HP/SP 條、技能列、召喚按鈕 |
| 序章 + 第一章 JSON | `src/data/scenes/` | 世界觀導入 + 三惡魔登場 |

### Phase B — 技能系統

| 任務 | 模組 |
|------|------|
| 完整技能資料庫 | `SkillDB.js`（45 技能）|
| 戰後技能掉落 | `SkillRewardSystem.js` |
| 技能選擇畫面 | `SkillRewardScreen.jsx` |
| 技能管理畫面 | `SkillManageScreen.jsx` |

### Phase C — AI 整合

| 任務 | 模組 |
|------|------|
| 戰鬥敘事生成 | `AIWriter.js` 擴充 |
| 惡魔對話生成 | `AIWriter.js` 擴充 |
| 覺醒演出台詞生成 | `AIWriter.js` 擴充 |
| DES 語氣映射實作 | prompt 模板調整 |

### Phase D — 自由探索系統（★核心重構）

| 任務 | 模組 | 備注 |
|------|------|------|
| 地圖狀態管理 | `MapEngine.js`（新建）| 子層生成、地點隨機抽取、解鎖條件判定 |
| 事件邏輯 | `ExplorationSystem.js`（新建）| 事件池解析、觸發判定、私下互動條件 |
| 地點資料庫 | `LocationDB.js`（新建）| 所有地點類型定義 |
| 事件資料庫 | `EventDB.js`（新建）| 所有事件類型及子類型定義 |
| 地圖 UI | `WorldMapScreen.jsx`（新建）| 子層地點節點選擇 |
| Ch.E1 UI | `FinalEvalScreen.jsx`（新建）| 評估結果顯示 |
| GameEngine 更新 | `GameEngine.js` | 新增 map/final_eval phase + exploration 初始狀態 + 探索 actions |
| StatsManager 更新 | `StatsManager.js` | INITIAL_DEMON 加入 warmed_up_count、private_moments_triggered |
| EndingResolver 更新 | `EndingResolver.js` | 新增 evaluateFinalTrack() |
| App.jsx 更新 | `App.jsx` | 串接 map/final_eval phase，移除 Ch2-Ch8 跳轉邏輯 |
| GAME_DESIGN_V3.md | 本文件 | 重構第9節，新增第10-11節 ✓ |

### Phase E — 探索內容（長期）

- 各地點私下互動場景（demon_private_moment）— 替代原 Ch3-Ch8 路線敘事
- 各地點探索事件腳本
- 立繪、背景圖、UI 素材
- 音效、BGM
- CG 回廊

---

## 17. 命名規範與檔案結構

### 17.1 場景 ID 命名

```
sceneId '0-1'    → 檔案 scene_0_1.json    （序章第 1 場景）
sceneId '1-2-a'  → 檔案 scene_1_2_a.json （第一章第 2 場景，分支 a）
```

### 17.2 惡魔 ID

```
demon_a  →  瑠夜（Ruya）
demon_b  →  颯牙（Sōga）
demon_c  →  玄冥（Xuán Míng）
```

### 17.3 技能 ID

```
T1_XX  → Tier I 技能（XX 為 01–18）
T2_XX  → Tier II 技能（XX 為 01–17）
T3_XX  → Tier III 技能（XX 為 01–10）
```

### 17.4 完整目錄結構

```
g-game/
├── GAME_DESIGN_V3.md         ← 本規劃書（單一真相來源）
├── GAME_DESIGN_DOC.md        （舊版，保留參考）
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── src/
│   ├── App.jsx
│   ├── engine/
│   │   ├── GameEngine.js
│   │   ├── StatsManager.js
│   │   ├── CombatEngine.js
│   │   ├── DiceEngine.js
│   │   ├── DemonSystem.js
│   │   ├── SkillDB.js
│   │   ├── SkillRewardSystem.js
│   │   ├── MonsterDB.js
│   │   ├── EquipmentDB.js
│   │   ├── AIWriter.js
│   │   ├── ChoiceResolver.js
│   │   ├── EndingResolver.js
│   │   ├── SaveSystem.js
│   │   ├── MapEngine.js             [新增] 五層地牢地圖狀態管理
│   │   ├── ExplorationSystem.js     [新增] 探索事件邏輯
│   │   ├── LocationDB.js            [新增] 地點類型資料庫
│   │   └── EventDB.js               [新增] 事件類型資料庫
│   ├── components/
│   │   ├── TitleScreen.jsx
│   │   ├── BackgroundLayer.jsx
│   │   ├── CharacterSprite.jsx
│   │   ├── DialogueBox.jsx
│   │   ├── ChoicePanel.jsx
│   │   ├── DiceModal.jsx
│   │   ├── StatsDisplay.jsx
│   │   ├── SaveLoadMenu.jsx
│   │   ├── EndingScreen.jsx
│   │   ├── AISettingsPanel.jsx
│   │   ├── CombatScreen.jsx
│   │   ├── CombatLog.jsx
│   │   ├── DemonSummonModal.jsx
│   │   ├── DemonDialogueOverlay.jsx
│   │   ├── SkillRewardScreen.jsx
│   │   ├── SkillManageScreen.jsx
│   │   ├── WorldMapScreen.jsx       [新增] 五層地牢地點選擇 UI
│   │   └── FinalEvalScreen.jsx      [新增] Ch.E1 評估顯示
│   ├── hooks/
│   │   ├── useSceneLoader.js
│   │   └── useAISettings.js
│   └── data/
│       ├── characters.json    （舊版，後續轉為 demons.json）
│       ├── endings.json       （待擴充新結局矩陣）
│       ├── chapters/
│       └── scenes/
│           ├── scene_0_1.json [待建立]
│           ├── scene_1_1.json
│           └── ...
└── public/
    └── assets/
        ├── sprites/
        ├── backgrounds/
        └── ui/
```

---

*最後更新：V3.1 自由探索架構重構版*
*下一步：Phase D 實作 — 建議從 `MapEngine.js` + `LocationDB.js` 開始*
