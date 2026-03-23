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
    name: '廢棄集市',
    layer: 1,
    description: '昔日喧囂的集市如今空無一人，破損的攤位東倒西歪，散落各處的商品殘骸在風中搖曳。偶爾可見翻倒的油燈與未燒完的帳簿。',
    aiPromptHint: '廢棄的城市集市場景，戰後荒涼氛圍，灰塵中殘留著昔日繁榮的痕跡，光線昏黃，空氣中有焦味與腐敗氣息混合。',
    investigationHint: '搜尋集市中遺留的商品、帳簿殘頁，或許能找到有用的物資與情報。',
    eventPool: [
      { eventTypeId: 'rest_recovery',  triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'item_discovery', triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'npc_encounter',  triggerChance: 0.35, triggerCondition: null, weight: 2 },
    ],
  },
  {
    typeId: 'town_shelter',
    name: '臨時避難所',
    layer: 1,
    description: '廢棄建築的地下室被改作避難使用，牆壁上留有倉皇逃離的塗鴉與求救標記。角落堆放著殘破的行囊，空氣沉悶，帶著人留存過的氣息。',
    aiPromptHint: '昏暗的地下避難所，牆上有潦草的記號，地板散落個人物品，氛圍壓抑而充滿人類掙扎求生的痕跡。',
    investigationHint: '調查倖存者留下的物品或訊息，或許能了解裂隙事件的始末。',
    eventPool: [
      { eventTypeId: 'rest_recovery',          triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'npc_encounter',           triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'demon_private_moment',    triggerChance: null,  triggerCondition: { minAffection: 15, minWarmedUp: 1 }, weight: 2 },
    ],
  },
  {
    typeId: 'town_outskirts',
    name: '小鎮外圍',
    layer: 1,
    description: '小鎮與荒野的交界地帶，路邊的路牌半倒在草叢中，遠處的天際線有隱約的紫色光暈——那是裂隙的方向。風帶來一股異常的溫熱。',
    aiPromptHint: '城鎮邊緣的荒廢公路，天空顏色開始偏向異常的紫灰色，植被稀疏且部分枯萎，地面有不明液體的污跡。',
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
    name: '廢棄建築群',
    layer: 2,
    description: '昔日的住宅區如今只剩殘垣斷壁，每一處牆角都藏著可能的危機。腐蝕的鐵鑄窗框在風中發出低鳴，空氣中有裂隙能量特有的金屬味。',
    aiPromptHint: '廢棄的建築群，植被開始出現扭曲，天空顏色異常（紫灰色調），空氣中輕微震動感，裂隙影響的初期環境。',
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
    name: '荒廢曠野',
    layer: 2,
    description: '廣闊的平原上雜草高及膝蓋，枯萎的植物透露著裂隙污染的跡象。遠處偶爾傳來不屬於任何已知生物的低吼聲，空氣中有輕微的電磁感。',
    aiPromptHint: '廣闊的荒廢平原，植被大面積枯萎，部分植物呈現異常的深紫或暗紅色，天空橙紅色調，是裂隙外圍的典型景觀。',
    investigationHint: null,
    eventPool: [
      { eventTypeId: 'encounter_combat',        triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'rift_anomaly',            triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'rescue.outskirts_field',  triggerChance: 0.20, triggerCondition: null, weight: 1 },
    ],
  },
  {
    typeId: 'outskirts_camp',
    name: '廢棄紮營地',
    layer: 2,
    description: '有人曾在此長時間駐紮，留下精心搭建卻被倉皇廢棄的營地。帳篷支架仍在，篝火的灰燼已冷卻多日，但補給箱中或許還有遺留物。',
    aiPromptHint: '廢棄的野外營地，帳篷架子仍完整但布料腐爛，空火盆與散落的補給殘骸，傳達人類曾在此求生的痕跡。',
    investigationHint: null,
    eventPool: [
      { eventTypeId: 'rest_recovery',  triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'item_discovery', triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'npc_encounter',  triggerChance: 0.35, triggerCondition: null, weight: 2 },
    ],
  },
  {
    typeId: 'outskirts_watchtower',
    name: '崩塌瞭望台',
    layer: 2,
    description: '軍用瞭望台的上半部已經倒塌，殘存的結構搖搖欲墜。從最高的完整樓層可以俯瞰裂隙方向，能量異常在這裡格外清晰可辨。',
    aiPromptHint: '半坍塌的瞭望台，金屬結構扭曲生鏽，從現存的高處可以看見遠方裂隙的光暈，視野開闊但環境不穩定。',
    investigationHint: '分析瞭望台殘留的記錄資料，觀測裂隙活動的方向與強度變化。',
    eventPool: [
      { eventTypeId: 'investigation',                triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'demon_private_moment',         triggerChance: null,  triggerCondition: { minAffection: 20, minWarmedUp: 2 }, weight: 2 },
      { eventTypeId: 'rescue.outskirts_watchtower',  triggerChance: 0.15, triggerCondition: null, weight: 1 },
    ],
  },
  {
    typeId: 'outskirts_road',
    name: '破碎公路',
    layer: 2,
    description: '昔日的主要幹道如今佈滿裂縫，地面的柏油被不明力量掀起，形成奇異的波浪狀斷面。路旁有翻覆的車輛與散落的個人物品。',
    aiPromptHint: '廢棄的主要公路，路面嚴重破損呈波浪狀，翻覆車輛，個人物品散落兩側，天空顏色異常，傳達大規模撤離後的荒廢感。',
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
    name: '裂隙邊界',
    layer: 3,
    description: '空間在這裡開始變得不穩定，視覺上有輕微的折疊感。地面的顏色變得深暗，植被完全消失，取而代之的是凝固的黑色物質，像是被燒焦的時間。',
    aiPromptHint: '裂隙邊界地帶，空間感扭曲，光源不明且方向混亂，地面材質異常（黑色焦化），隱約可見空間折疊的視覺效果。',
    investigationHint: '測量裂隙擴張速度，記錄能量讀數的異常波動規律。',
    eventPool: [
      { eventTypeId: 'rift_anomaly',    triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'encounter_combat', triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'investigation',   triggerChance: 0.35, triggerCondition: null, weight: 2 },
    ],
  },
  {
    typeId: 'rift_forest',
    name: '腐化森林',
    layer: 3,
    description: '曾經的森林被裂隙能量完全腐化，樹木扭曲成不自然的形狀，樹皮呈現深紫色的腐爛紋路。地面上有不明液體慢慢滲透，空氣甜膩令人作嘔。',
    aiPromptHint: '完全腐化的森林，樹木扭曲異形，深紫色樹皮，地面有黏稠的暗色液體，陰暗的光線透過扭曲的枝條形成怪異的陰影。',
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
    name: '魔物聚集地',
    layer: 3,
    description: '這裡有大量魔物的棲息痕跡——巨大的爪痕、咀嚼過的獵物殘骸、散發異味的巢穴材料。空氣中充斥著魔物的氣息，使人本能地想要逃離。',
    aiPromptHint: '魔物巢穴核心區域，地面有大量爪痕和腐蝕斑，獵物骨骸散落，巢穴材料堆積成奇異的結構，危機四伏的壓迫氣氛。',
    investigationHint: null,
    eventPool: [
      { eventTypeId: 'encounter_combat',   triggerChance: 0.80, triggerCondition: null, weight: 4 },
      { eventTypeId: 'item_discovery',     triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'rescue.rift_nest',   triggerChance: 0.20, triggerCondition: null, weight: 1 },
    ],
  },
  {
    typeId: 'rift_ruins',
    name: '古代遺跡',
    layer: 3,
    description: '比裂隙更古老的建築遺址，石塊上刻有失傳的封印紋路。部分紋路仍在發光，是某種古代防禦系統最後的殘留能量。空間在此相對穩定。',
    aiPromptHint: '古老石造遺跡，刻有發光封印紋路，空氣中有某種古老力量的殘留，相對穩定但隱藏著未知的危機，神秘而肅穆。',
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
    name: '封印殘跡',
    layer: 3,
    description: '某個巨大封印崩潰後留下的遺址，中央仍有能量在緩慢洩漏。周圍的地面被封印爆炸燒焦，但奇異的是，植被從焦痕邊緣開始重新生長，呈現反常的鮮豔綠色。',
    aiPromptHint: '崩潰的封印中心遺址，地面有燒焦的環形痕跡，中央有緩慢洩漏的能量光芒，邊緣有異常鮮豔的植被，對比強烈且令人不安。',
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
    name: '裂隙內部',
    layer: 4,
    description: '完全進入裂隙的空間，天地的概念在此變得模糊。重力方向似乎每隔幾步就會微妙地改變，視覺上呈現不斷流動的深藍與黑色紋路，像是凝固的虛空。',
    aiPromptHint: '裂隙內部空間，重力感不穩定，天地邊界模糊，流動的深藍黑色紋路構成環境，無自然光源，充滿壓迫感的宇宙性空曠。',
    investigationHint: '分析裂隙核心結構的能量流向，尋找結構規律。',
    eventPool: [
      { eventTypeId: 'rift_anomaly',    triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'encounter_combat', triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'investigation',   triggerChance: 0.35, triggerCondition: null, weight: 2 },
    ],
  },
  {
    typeId: 'deep_lair',
    name: '魔物巢穴',
    layer: 4,
    description: '高階魔物的棲息地，整個空間充斥著強烈的魔物氣息。巢穴結構複雜，由無法辨識的材料構成，有些部分似乎還是活的，在緩慢地蠕動。',
    aiPromptHint: '高階魔物的巢穴，有機體狀的結構材料，部分仍在蠕動，強烈的異味，極高的危機感，是獵手的領域。',
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
    name: '腐化祭壇',
    layer: 4,
    description: '某種儀式場所，但已被裂隙能量完全腐化。祭壇上的獻祭痕跡已難以辨認，但殘留的能量仍在共鳴，發出低頻振動，令人隱約感到恐懼。',
    aiPromptHint: '腐化的古代祭壇，能量低頻共鳴，表面有複雜的侵蝕紋路，空間中漂浮著細微的能量粒子，邪惡而神聖的矛盾感。',
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
    name: '能量漩渦',
    layer: 4,
    description: '裂隙能量在此形成可見的漩渦，中心處發出刺眼的白光。周圍的空間被漩渦拉扯，形成奇異的透視變形。靠近時能明顯感受到意志力被侵蝕的壓力。',
    aiPromptHint: '可見的能量漩渦，中心白光，周圍空間透視變形，具有強烈的吸引力與威脅感，讓人同時感到恐懼與著迷。',
    investigationHint: null,
    eventPool: [
      { eventTypeId: 'rift_anomaly',       triggerChance: 0.80, triggerCondition: null, weight: 4 },
      { eventTypeId: 'encounter_combat',    triggerChance: 0.35, triggerCondition: null, weight: 2 },
      { eventTypeId: 'rescue.deep_vortex', triggerChance: 0.35, triggerCondition: null, weight: 2 },
    ],
  },
  {
    typeId: 'deep_corridor',
    name: '崩塌通道',
    layer: 4,
    description: '連接裂隙各區域的通道，大部分已經崩塌，只剩下狹窄且不穩定的路徑。踏錯一步可能觸發進一步的崩塌，或者掉入看不見底的裂縫。',
    aiPromptHint: '崩塌的地下通道，不穩定的岩石結構，狹窄的可行路徑，深不見底的裂縫，極度壓迫的封閉空間感，每步都是試探。',
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
    name: '核心腔室',
    layer: 5,
    description: '裂隙能量最濃縮的腔室，空氣本身似乎在震動。人類的本能在此完全失效，感知到的顏色、聲音、距離都帶有欺騙性。這裡是屬於惡魔的空間。',
    aiPromptHint: '裂隙核心腔室，現實感完全喪失，顏色飽和度極端，感知全面扭曲，是惡魔的自然棲息地，人類在此顯得渺小而脆弱。',
    investigationHint: null,
    eventPool: [
      { eventTypeId: 'rift_anomaly',          triggerChance: 0.80, triggerCondition: null, weight: 4 },
      { eventTypeId: 'encounter_combat',       triggerChance: 0.60, triggerCondition: null, weight: 3 },
      { eventTypeId: 'demon_private_moment',   triggerChance: null,  triggerCondition: { minAffection: 40, minWarmedUp: 5 }, weight: 2 },
    ],
  },
  {
    typeId: 'demon_territory',
    name: '異界領域',
    layer: 5,
    description: '這片空間遵循著與人類世界完全不同的法則。引力、時間、空間都以惡魔的邏輯運行。越是了解惡魔的人，在這裡就越能感受到一種奇異的共鳴。',
    aiPromptHint: '遵循異界法則的領域，幾何形狀超自然，光影方向倒置，在此惡魔的存在比人類更「自然」，充滿異質美感與壓迫感。',
    investigationHint: '觀察異界領域的運行法則，尋找結構中可利用的弱點。',
    eventPool: [
      { eventTypeId: 'encounter_combat',      triggerChance: 0.80, triggerCondition: null, weight: 4 },
      { eventTypeId: 'demon_private_moment',  triggerChance: null,  triggerCondition: { minAffection: 40, minWarmedUp: 5 }, weight: 3 },
      { eventTypeId: 'investigation',         triggerChance: 0.35, triggerCondition: null, weight: 2 },
    ],
  },
  {
    typeId: 'core_threshold',
    name: '裂隙源點入口',
    layer: 5,
    description: '站在裂隙的起源面前，感覺到所有一切的開端都在這一點。能量在此匯聚而非擴散，有一種奇特的寧靜——像是風暴中心。通往Ch.E1的門就在此處。',
    aiPromptHint: '裂隙的源點入口，能量匯聚而非擴散，奇異的寂靜感，視野延伸至無盡深處，是旅程的終點也是新的開始，莊嚴而壓迫。',
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
