// config.js - ゲームの設定やテキストデータ
const difficultyRates = {
    easy: 0.05,
    normal: 0.10,
    hard: 0.15
};

const difficultyLabels = {
    easy: 'イージー：災害発生確率 5%',
    normal: 'ノーマル：災害発生確率 10%',
    hard: 'ハード：災害発生確率 15%'
};

const specialPolicyChance = 0.2;

const taxIncomeRates = {
    consumption: 4,
    income: 2,
    resident: 2
};

const consumptionComplaintRate = 2;
const incomeComplaintRate = 0.5;
const incomeTrustRate = 2;
const residentTrustRate = 1;
const complaintPerTaxPoint = 1;

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