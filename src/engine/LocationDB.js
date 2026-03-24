/**
 * LocationDB.js
 * 地點類型資料庫（五層地牢）
 *
 * 格式：
 * {
 *   typeId: String,          // 地點類型 ID
 *   name: String,            // 地點名稱
 *   layer: Number,           // 所屬層數（1–5）
 *   description: String,     // 固定場景描寫文本
 *   aiPromptHint: String,    // AI 生成場景描寫的提示詞指引
 *   investigationHint: String, // 調查事件的地點描述（investigation 依地點差異化）
 *   eventPool: [             // 可能發生的事件列表
 *     {
 *       eventTypeId: String,           // EventDB 中的事件類型或子類型 ID
 *       triggerChance: Number | null,  // 機率 0–1；null = 條件觸發
 *       triggerCondition: Object | null,
 *       weight: Number,                // 同地點多事件候選時的權重
 *     }
 *   ]
 * }
 *
 * triggerChance 對應（供 ExplorationSystem 參考）：
 *   '極高' = 0.8   '高' = 0.6   '中' = 0.35   '低' = 0.15
 */

// ────────────────────────────────────────
// 第一層：小鎮（Town）固定地點
// ────────────────────────────────────────

export const TOWN_LOCATIONS = [
  {
    typeId: 'town_market',
    name: '棄世集市遺構',
    layer: 1,
    description: '昔日集市如今是靜止的時間剖面，每個倒塌的攤位都是某個決定「不再等待」的人所遺留的。油燈旁的未燒帳簿詳細記錄著最後幾天的交易，數字在某一天突然中斷，之後是空白頁。',
    aiPromptHint: '廢棄的城市集市場景，靜止的時間切面，灰塵中封存著過去最後一天的印記，油燈半傾未滅，帳簿數字戛然而止，光線昏黃如腐蝕中的記憶。',
    investigationHint: '搜尋集市中遺留的商品、帳簿殘頁，或許能找到有用的物資與情報。',
    eventPool: [
      { eventTypeId: 'rest_recovery',  triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'item_discovery', triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'npc_encounter',  triggerChance: 0.35, triggerCondition: null, weight: 2 },
    ],
  },
  {
    typeId: 'town_shelter',
    name: '末日倖存穴居',
    layer: 1,
    description: '牆上的塗鴉從求救信號，到日期記錄，到哲學塗鴉，最後到單純的重複符號——可以追蹤一個人的心理在密閉空間中的崩潰過程。現在是空的，但空氣仍保有人類聚集時的溫度殘影。',
    aiPromptHint: '昏暗的地下避難所，牆上塗鴉記錄著意識崩潰的軌跡，地板散落個人物品，空氣凝固著生存意志的最後殘留，氛圍壓抑而充滿人類掙扎的印記。',
    investigationHint: '調查倖存者留下的物品或訊息，或許能了解裂隙事件的始末。',
    eventPool: [
      { eventTypeId: 'rest_recovery',          triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'npc_encounter',           triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'demon_private_moment',    triggerChance: null,  triggerCondition: { minAffection: 15, minWarmedUp: 1 }, weight: 2 },
    ],
  },
  {
    typeId: 'town_outskirts',
    name: '認知邊界區',
    layer: 1,
    description: '這裡是「日常世界」和「其他的某種東西」的接縫。路牌的指示方向在裂隙的影響下已失去意義，但仍有人在夜間修復它——不知道是求生本能，還是在深淵中保持習慣的執念。',
    aiPromptHint: '城鎮邊緣的認知接縫地帶，天空顏色開始向異常頻率偏移，路牌指向的方向已失去意義，地面有不明液體的污跡，空氣中瀰漫著對正常世界的無聲告別。',
    investigationHint: '調查裂隙滲透的跡象，地面的異常痕跡或許能透露裂隙的擴張速度。',
    eventPool: [
      { eventTypeId: 'investigation',           triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'rift_anomaly',            triggerChance: 0.15, triggerCondition: null, weight: 1 },
      { eventTypeId: 'npc_encounter',           triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'rescue.town_outskirts',   triggerChance: 0.15, triggerCondition: null, weight: 1 },
    ],
  },
]

// ────────────────────────────────────────
// 第二層：裂隙外圍（Rift Outskirts）隨機地點池
// ────────────────────────────────────────

export const OUTSKIRTS_LOCATION_POOL = [
  {
    typeId: 'outskirts_ruins',
    name: '侵蝕建築遺群',
    layer: 2,
    description: '建築物的崩塌方式違反重力邏輯——有些牆是向上倒塌的，有些則以非歐幾何的角度停在半空中。裂隙能量已重寫了局部的物理法則，深掘者在此必須持續重新確認自己對「穩定」的定義。',
    aiPromptHint: '廢棄的建築群，崩塌方向違反物理，牆壁以非歐幾何角度靜止半空，植被呈現扭曲適應，天空顏色異常（紫灰色調），裂隙影響已重寫局部物理的環境。',
    investigationHint: '解讀廢棄建築的崩塌原因，牆上殘留的標記可能是逃難者或先驅者留下的情報。',
    eventPool: [
      { eventTypeId: 'investigation',           triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'item_discovery',          triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'trap.physical',           triggerChance: 0.15, triggerCondition: null, weight: 1 },
      { eventTypeId: 'rescue.outskirts_ruins',  triggerChance: 0.15, triggerCondition: null, weight: 1 },
    ],
  },
  {
    typeId: 'outskirts_field',
    name: '染毒曠野遺原',
    layer: 2,
    description: '植被的死亡方式有選擇性——某些種類完全消失，某些種類以異常的形態過度繁殖。遠處傳來的低吼聲從未固定方向。',
    aiPromptHint: '廣闊的染毒平原，植被死亡有選擇性，部分呈現過度繁殖的異常形態，天空橙紅色調，低吼聲從不固定方向傳來，是深淵侵蝕外圍的典型景觀。',
    investigationHint: null,
    eventPool: [
      { eventTypeId: 'encounter_combat',        triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'rift_anomaly',            triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'rescue.outskirts_field',  triggerChance: 0.20, triggerCondition: null, weight: 1 },
    ],
  },
  {
    typeId: 'outskirts_camp',
    name: '棄守先驅紮營地',
    layer: 2,
    description: '這個營地曾被人精心維護，最後卻在某一個瞬間被完全放棄，沒有打包，沒有收拾。補給箱的鎖被從內部打開，不是從外——最後一個人是帶著選擇離開的。他們去了哪裡無從知曉。',
    aiPromptHint: '廢棄的野外營地，帳篷架子仍完整但布料腐爛，補給箱從內部打開，物品原封未動——不是逃離，是選擇。空火盆與散落的個人物品傳達一個有意識的決定的殘跡。',
    investigationHint: null,
    eventPool: [
      { eventTypeId: 'rest_recovery',  triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'item_discovery', triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'npc_encounter',  triggerChance: 0.35, triggerCondition: null, weight: 2 },
    ],
  },
  {
    typeId: 'outskirts_watchtower',
    name: '半毀觀測遺台',
    layer: 2,
    description: '瞭望台的上半部倒塌方向是向內而非向外，殘存的樓層形成一個半封閉的觀測空間。從那裡看向裂隙方向，觀察者也更容易被觀察到。',
    aiPromptHint: '半坍塌的瞭望台，倒塌方向向內形成半封閉觀測空間，金屬結構扭曲生鏽，從現存的高處可以看見遠方裂隙的光暈，視野開闊但暴露感強烈。',
    investigationHint: '分析瞭望台殘留的記錄資料，觀測裂隙活動的方向與強度變化。',
    eventPool: [
      { eventTypeId: 'investigation',                triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'demon_private_moment',         triggerChance: null,  triggerCondition: { minAffection: 20, minWarmedUp: 2 }, weight: 2 },
      { eventTypeId: 'rescue.outskirts_watchtower',  triggerChance: 0.15, triggerCondition: null, weight: 1 },
    ],
  },
  {
    typeId: 'outskirts_road',
    name: '解構幹道遺路',
    layer: 2,
    description: '路面被抬起的力量來自某個位於地下深處的「地質記憶」，一個遠比道路更古老的事件在地層中的餘震，在裂隙的催化下終於抵達地面。路旁有翻覆的車輛與散落的個人物品。',
    aiPromptHint: '廢棄的主要公路，路面被地質記憶的餘震抬起呈波浪狀，翻覆車輛，個人物品散落兩側，天空顏色異常，地層深處的某個古老事件終於在地面留下印記。',
    investigationHint: null,
    eventPool: [
      { eventTypeId: 'encounter_combat',       triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'npc_encounter',          triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'rescue.outskirts_road',  triggerChance: 0.35, triggerCondition: null, weight: 2 },
    ],
  },
]

// ────────────────────────────────────────
// 第三層：裂隙入口（Rift Entrance）隨機地點池
// ────────────────────────────────────────

export const RIFT_ENTRANCE_LOCATION_POOL = [
  {
    typeId: 'rift_boundary',
    name: '存在法則邊界',
    layer: 3,
    description: '法則的邊界不是可見的牆，而是一個需要感知才能察覺的過渡帶。穿越它時，人體短暫接收到來自兩套不同物理法則的信號，大腦在協調時產生的短暫混亂，就是「空間折疊感」的本質。',
    aiPromptHint: '裂隙邊界地帶，法則的過渡在視覺上無法察覺，空間感扭曲，光源方向混亂，地面材質異常（黑色焦化），穿越時兩套物理法則的交疊在感知中產生短暫的現實錯位。',
    investigationHint: '測量裂隙擴張速度，記錄能量讀數的異常波動規律。',
    eventPool: [
      { eventTypeId: 'rift_anomaly',    triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'encounter_combat', triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'investigation',   triggerChance: 0.35, triggerCondition: null, weight: 2 },
    ],
  },
  {
    typeId: 'rift_forest',
    name: '法則侵蝕異林',
    layer: 3,
    description: '樹木的扭曲是它們「記住了」裂隙能量的力量方向後的生長結果，不是被動的破壞，而是主動的適應。問題在於它們適應的方向和人類的導向感完全不同。地面上有不明液體慢慢滲透，空氣甜膩令人作嘔。',
    aiPromptHint: '完全被法則侵蝕的森林，樹木扭曲是主動適應而非被動破壞，深紫色樹皮，地面有黏稠的暗色液體，陰暗的光線透過扭曲的枝條形成怪異的陰影，方向感完全失效。',
    investigationHint: null,
    eventPool: [
      { eventTypeId: 'encounter_combat',      triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'trap.ambush',           triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'demon_private_moment',  triggerChance: null,  triggerCondition: { minAffection: 25, minWarmedUp: 3 }, weight: 2 },
      { eventTypeId: 'item_discovery',        triggerChance: 0.15, triggerCondition: null, weight: 1 },
    ],
  },
  {
    typeId: 'rift_nest',
    name: '深淵型態聚集地',
    layer: 3,
    description: '大量深淵生物在此聚集，因為這片區域的能量頻率對特定生物類型有吸引力。骨骸散落方式顯示部分是互相獵殺的結果，另一部分可能是將此地視為目的地而非起點的生物的遺骸。',
    aiPromptHint: '深淵型態生物的聚集核心區域，地面有大量爪痕和腐蝕斑，骨骸散落模式暗示複雜的獵食關係，巢穴材料堆積成奇異的結構，能量頻率對特定生物具有吸引力。',
    investigationHint: null,
    eventPool: [
      { eventTypeId: 'encounter_combat',   triggerChance: 0.80, triggerCondition: null, weight: 4 },
      { eventTypeId: 'item_discovery',     triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'rescue.rift_nest',   triggerChance: 0.20, triggerCondition: null, weight: 1 },
    ],
  },
  {
    typeId: 'rift_ruins',
    name: '前文明封印遺跡',
    layer: 3,
    description: '建造者使用了此後從未被成功複製的結構技術。封印紋路仍在發光，意味著能量來源尚未耗盡——要麼建造者預留的能量極度充足，要麼來源不在此處。空間在此相對穩定。',
    aiPromptHint: '古老石造遺跡，使用已失傳的結構技術建造，刻有仍在發光的封印紋路，能量來源不明，空氣中有某種超越時間的殘留力量，相對穩定但藏著前文明的未解之謎。',
    investigationHint: '解讀古代碑文，分析封印構造的設計意圖與作用原理。',
    eventPool: [
      { eventTypeId: 'investigation',   triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'item_discovery',  triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'trap.seal',       triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'rescue.rift_ruins', triggerChance: 0.15, triggerCondition: null, weight: 1 },
    ],
  },
  {
    typeId: 'rift_gate',
    name: '崩潰封印圓場',
    layer: 3,
    description: '封印的爆炸以完美的圓形向外擴散，在物理上幾乎不可能——完美圓形意味著爆炸能量在每個方向都受到同等的導引，需要極度精確的設計，或是某種超越設計的對稱性存在。中央仍有能量在緩慢洩漏。',
    aiPromptHint: '崩潰的封印中心遺址，地面有完美圓形的燒焦痕跡——物理上幾乎不可能，中央有緩慢洩漏的能量光芒，邊緣有異常鮮豔的植被，對稱性令人不安地完美。',
    investigationHint: '研究封印殘留的能量紋路，分析封印崩潰的原因與規律。',
    eventPool: [
      { eventTypeId: 'rift_anomaly',          triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'investigation',         triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'demon_private_moment',  triggerChance: null,  triggerCondition: { minAffection: 30, minWarmedUp: 3 }, weight: 2 },
    ],
  },
]

// ────────────────────────────────────────
// 第四層：深入裂隙（Deep Rift）隨機地點池
// ────────────────────────────────────────

export const DEEP_RIFT_LOCATION_POOL = [
  {
    typeId: 'deep_interior',
    name: '法則解體內域',
    layer: 4,
    description: '在這裡，「內」和「外」的概念開始分離。重力每隔幾步的微妙改變，是因為此空間受多個來源的力場疊加，深藍黑色紋路是多個力場邊界的可見化——如同等高線，只是等力場線。',
    aiPromptHint: '裂隙內部空間，「內」與「外」的概念分離，重力受多個力場疊加而不穩定，流動的深藍黑色紋路是力場邊界的可見化，無自然光源，充滿宇宙尺度的壓迫性空曠。',
    investigationHint: '分析裂隙核心結構的能量流向，尋找結構規律。',
    eventPool: [
      { eventTypeId: 'rift_anomaly',    triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'encounter_combat', triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'investigation',   triggerChance: 0.35, triggerCondition: null, weight: 2 },
    ],
  },
  {
    typeId: 'deep_lair',
    name: '高階型態巢域',
    layer: 4,
    description: '有機體狀的結構材料是多個生物共同分泌和構建的，不是某個單一生物的巢穴。參與構建的生物之間存在人類尚未理解的溝通機制。巢穴結構複雜，有些部分似乎還是活的。',
    aiPromptHint: '高階型態生物的共同構建巢域，有機體狀的結構材料由多個生物協作分泌，部分仍在蠕動，強烈的異味，是比獵手更高層級的意志在此組織居住。',
    investigationHint: null,
    eventPool: [
      { eventTypeId: 'encounter_combat', triggerChance: 0.80, triggerCondition: null, weight: 4 },
      { eventTypeId: 'item_discovery',  triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'trap.ambush',     triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'trap.physical',   triggerChance: 0.35, triggerCondition: null, weight: 2 },
    ],
  },
  {
    typeId: 'deep_shrine',
    name: '侵蝕儀軌祭壇',
    layer: 4,
    description: '祭壇的原始功能是「向某個存在送出信號」，而非典型的祈禱或獻祭設施。被裂隙能量腐化後，它仍在發送信號，只是內容已無法確認是否與原始設計一致。殘留的能量仍在共鳴，發出低頻振動。',
    aiPromptHint: '腐化的古代信號祭壇，能量低頻共鳴，表面有複雜的侵蝕紋路，空間中漂浮著細微的能量粒子，仍在發送的信號正在聯繫某個存在——目標不明。',
    investigationHint: '解讀腐化祭壇上殘存的儀式痕跡，理解其原始功能。',
    eventPool: [
      { eventTypeId: 'investigation',         triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'rift_anomaly',          triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'demon_private_moment',  triggerChance: null,  triggerCondition: { minAffection: 35, minWarmedUp: 4 }, weight: 2 },
      { eventTypeId: 'trap.seal',             triggerChance: 0.35, triggerCondition: null, weight: 2 },
    ],
  },
  {
    typeId: 'deep_vortex',
    name: '裂隙能量旋核',
    layer: 4,
    description: '漩渦的旋轉方向與此區域的主導力場方向呈精確的90度偏移，在物理上無法用常規力學解釋。靠近時感受到的意志力侵蝕，是因為漩渦產生的橫向波與神經系統的電場產生了共鳴干擾。',
    aiPromptHint: '可見的能量漩渦，旋轉方向呈精確90度偏移（物理上不可能），中心白光，周圍空間透視變形，橫向波干擾神經系統電場，讓人同時感到恐懼與難以解釋的吸引。',
    investigationHint: null,
    eventPool: [
      { eventTypeId: 'rift_anomaly',       triggerChance: 0.80, triggerCondition: null, weight: 4 },
      { eventTypeId: 'encounter_combat',    triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'rescue.deep_vortex', triggerChance: 0.35, triggerCondition: null, weight: 2 },
    ],
  },
  {
    typeId: 'deep_corridor',
    name: '時序崩塌通道',
    layer: 4,
    description: '通道的崩塌不是一次事件的結果，而是多個時間點的崩塌層疊在一起——有些石塊崩塌是很久以前的，有些是很近的，有些尚未崩塌但已處於臨界點。在此行走，是在多個時間層的縫隙中尋找路徑。',
    aiPromptHint: '時序層疊崩塌的地下通道，不同時間點的崩塌交疊在同一空間，不穩定的岩石結構，狹窄的可行路徑，深不見底的裂縫，每步都是在時間縫隙中的試探。',
    investigationHint: null,
    eventPool: [
      { eventTypeId: 'encounter_combat', triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'trap.physical',    triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'trap.magical',     triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'item_discovery',   triggerChance: 0.15, triggerCondition: null, weight: 1 },
    ],
  },
]

// ────────────────────────────────────────
// 第五層：裂隙最深處（Deepest Rift）隨機地點池
// ────────────────────────────────────────

export const DEEPEST_RIFT_LOCATION_POOL = [
  {
    typeId: 'core_chamber',
    name: '感知失效核腔',
    layer: 5,
    description: '人類感知系統在進化過程中從未需要處理這種密度的信息，在此處所有感知都帶有主動的「過濾錯誤」——大腦試圖將感知到的東西轉化為已知形態，但材料不足，輸出的是拼湊的幻象。',
    aiPromptHint: '裂隙核心腔室，感知系統的過濾機制在信息密度過載下主動輸出拼湊的幻象，顏色飽和度極端，感知全面扭曲，是深淵存在的自然棲息地，人類在此顯得不相容。',
    investigationHint: null,
    eventPool: [
      { eventTypeId: 'rift_anomaly',          triggerChance: 0.80, triggerCondition: null, weight: 4 },
      { eventTypeId: 'encounter_combat',       triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'demon_private_moment',   triggerChance: null,  triggerCondition: { minAffection: 40, minWarmedUp: 5 }, weight: 2 },
    ],
  },
  {
    typeId: 'demon_territory',
    name: '他律法則異域',
    layer: 5,
    description: '這個空間遵循的法則是由其中居住的存在的意志主動決定的。越了解那些存在，越能預測法則的邏輯。完全不了解的人，在這裡的每一步都是在對抗由他者意志制訂的現實。',
    aiPromptHint: '遵循他律法則的異域，幾何形狀超自然，光影方向由居住者意志決定，在此深淵存在的邏輯比人類更「自然」，了解他們的人在此有優勢，不了解的人在此是外來者。',
    investigationHint: '觀察異界領域的運行法則，尋找結構中可利用的弱點。',
    eventPool: [
      { eventTypeId: 'encounter_combat',      triggerChance: 0.80, triggerCondition: null, weight: 4 },
      { eventTypeId: 'demon_private_moment',  triggerChance: null,  triggerCondition: { minAffection: 40, minWarmedUp: 5 }, weight: 3 },
      { eventTypeId: 'investigation',         triggerChance: 0.35, triggerCondition: null, weight: 2 },
    ],
  },
  {
    typeId: 'core_threshold',
    name: '淵源起點閾口',
    layer: 5,
    description: '所有裂隙能量的起點在此匯聚。能量匯聚而非擴散，是因為所有擴散出去的能量都在試圖返回這裡。站在此處感受到的寂靜，是一切最終回歸後的靜止，是完成而非虛空。通往Ch.E1的門就在此處。',
    aiPromptHint: '裂隙的淵源起點，能量匯聚而非擴散，奇異的完成感而非虛空感，視野延伸至無盡深處，是所有裂隙能量想要回歸的地方——站在此處，能感受到自己也在被輕輕拉扯。',
    investigationHint: '解析裂隙源點的能量構成，試圖理解裂隙存在的根本原因。',
    eventPool: [
      { eventTypeId: 'investigation',             triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'rift_anomaly',              triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'rescue.core_threshold',     triggerChance: 0.60, triggerCondition: null, weight: 3 },
    ],
  },
]

// ────────────────────────────────────────
// 輔助函式
// ────────────────────────────────────────

/**
 * 依層數取得對應的地點池
 * @param {number} layer
 * @returns {Array}
 */
export function getLocationPoolByLayer(layer) {
  switch (layer) {
    case 1: return TOWN_LOCATIONS
    case 2: return OUTSKIRTS_LOCATION_POOL
    case 3: return RIFT_ENTRANCE_LOCATION_POOL
    case 4: return DEEP_RIFT_LOCATION_POOL
    case 5: return DEEPEST_RIFT_LOCATION_POOL
    default: return []
  }
}

/**
 * 依 typeId 查詢地點資料
 * @param {string} typeId
 * @returns {Object|null}
 */
export function getLocationByTypeId(typeId) {
  const all = [
    ...TOWN_LOCATIONS,
    ...OUTSKIRTS_LOCATION_POOL,
    ...RIFT_ENTRANCE_LOCATION_POOL,
    ...DEEP_RIFT_LOCATION_POOL,
    ...DEEPEST_RIFT_LOCATION_POOL,
  ]
  return all.find(l => l.typeId === typeId) ?? null
}

/**
 * 從指定層的地點池中隨機抽取 N 個不重複地點（用於子層生成）
 * @param {number} layer
 * @param {number} count
 * @returns {string[]} typeId 陣列
 */
export function randomPickLocations(layer, count = 4) {
  const pool = getLocationPoolByLayer(layer)
  if (pool.length === 0) return []
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length)).map(l => l.typeId)
}
