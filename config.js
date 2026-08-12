// config.js - ゲームの設定やテキストデータ
const difficultyRates = {
    easy: 0.06,
    normal: 0.12,
    hard: 0.18
};

const difficultyLabels = {
    easy: 'イージー：災害は少なめ・被害も軽め',
    normal: 'ノーマル：標準的な難易度',
    hard: 'ハード：災害が多め・被害も大きめ'
};

const specialPolicyChance = 0.2;

const taxIncomeRates = {
    consumption: 4,
    income: 2,
    resident: 2
};

const consumptionComplaintRate = 1.5;
const incomeComplaintRate = 0.35;
const incomeTrustRate = 1.2;
const residentTrustRate = 0.8;
const complaintPerTaxPoint = 0.8;

const seasonalEvents = {
    omens: [
        { text: "「不穏な雲が、時計台の天辺に集まっている…台風の予兆か。」", tag: 'typhoon' },
        { text: "「他国の偵察兵が国境付近で目撃されたとの噂がある。防衛を怠るな。」", tag: 'invasion' },
        { text: "「今期は星が綺麗に澄み渡っておる。大きな災害は起きぬだろう。」", tag: 'none' },
        { text: "「風が恐ろしく乾いている…ひとたび火の手が上がれば、大火となりかねんぞ。」", tag: 'fire' },
        { text: "「大雨が降り続いておる。川の水位が不気味に上がってきたな…洪水に備えよ。」", tag: 'flood' },
        { text: "「大地がかすかに震えている。この微小な地鳴り、大地震の前触れでなければよいが。」", tag: 'earthquake' },
        { text: "「空が真っ黒な雲に覆われ、静電気が走っておる。大落雷が落ちるやもしれん。」", tag: 'lightning' },
        { text: "「今年の冬の風は一段と肌を刺す。この冷害は時計塔をも凍らせるか。」", tag: 'cold' },
        { text: "「山に積もった雪が今にも崩れそうだ。雪崩の警戒を怠るな。」", tag: 'avalanche' },
        { text: "「国庫が寂しくなれば、民の胃袋も寂しくなる。飢饉の足音が聞こえるようだ。」", tag: 'famine' },
        { text: "「妙だな、すべての税率が奇妙な調和を見せている…世界がひっくり返るような天変地異が来ねばよいが…」", tag: 'cataclysm' },
        { text: "「街が奇妙なほど静まり返っている。嵐の前の静けさというやつか。」", tag: 'none' }
    ],
    voices: [
        "「税金が高すぎると生活が立ち行かないよ。お上の慈悲を！」",
        "「不満が高まれば高まるほど、敵国に付け入る隙を与えることになるぞ…」",
        "「インフラを維持するためなら、多少の納税は市民の義務さ。」",
        "「最近、我が国の防衛体制は十分なのだろうか？」"
    ]
};

const challengeTemplates = [
    { id: 'gold-120', kind: 'gold', title: '財政の余裕', description: '国庫金120以上で任期を終える', target: 120 },
    { id: 'trust-80', kind: 'trust', title: '民の信頼', description: '信頼度80以上で任期を終える', target: 80 },
    { id: 'tower-85', kind: 'tower', title: '塔の守護者', description: '塔HP85以上で任期を終える', target: 85 },
    { id: 'military-70', kind: 'military', title: '国防体制', description: '軍事力70以上で任期を終える', target: 70 }
];

const scoreGradeMap = [
    { min: 2000, label: '覇王' },
    { min: 1300, label: '名君' },
    { min: 900, label: '優良統治' },
    { min: 600, label: '安定政権' },
    { min: 300, label: '苦闘の統治' },
    { min: 0, label: '試行錯誤' }
];