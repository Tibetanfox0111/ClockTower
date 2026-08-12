// state.js - ゲームの状態管理と予測計算

// ゲームの状態を管理するオブジェクト
let gameState = {
    currentTurn: 1,
    maxTurns: 24,
    gold: 90,
    trust: 50,
    complaint: 25,
    military: 20,
    towerHp: 75,
    selectedPolicy: 'repair',
    taxConsumption: 10,
    taxIncome: 25,
    taxResident: 10,
    difficulty: 'normal',
    history: [],
    activeChallenge: rollChallenge()
};

let currentOmenTag = 'none';

function computeIncomeTaxTrustChange(taxIncome) {
    if (taxIncome > 25) {
        return -Math.round((taxIncome - 25) * 0.7);
    }
    if (taxIncome < 25) {
        return Math.round((25 - taxIncome) * 0.7);
    }
    return 0;
}

function getChallengeTemplates() {
    return Array.isArray(challengeTemplates) ? challengeTemplates : [];
}

function rollChallenge(list = getChallengeTemplates()) {
    if (!Array.isArray(list) || list.length === 0) return null;
    return { ...list[Math.floor(Math.random() * list.length)] };
}

function evaluateChallenge(challenge, state) {
    if (!challenge) {
        return { challenge: null, cleared: false, progress: 0, target: 0 };
    }

    let progress = 0;
    if (challenge.kind === 'gold') progress = state.gold;
    else if (challenge.kind === 'trust') progress = state.trust;
    else if (challenge.kind === 'tower') progress = state.towerHp;
    else if (challenge.kind === 'military') progress = state.military;
    else progress = state.gold;

    return {
        challenge,
        cleared: progress >= challenge.target,
        progress,
        target: challenge.target
    };
}

function computeFinalScore(state) {
    const goldScore = Math.max(0, state.gold) * 2.4;
    const trustScore = Math.max(0, state.trust) * 4.6;
    const militaryScore = Math.max(0, state.military) * 5.2;
    const complaintScore = Math.max(0, 100 - state.complaint) * 3.4;
    const score = Math.round(goldScore + trustScore + militaryScore + complaintScore);
    return {
        score,
        breakdown: {
            gold: goldScore,
            trust: trustScore,
            military: militaryScore,
            complaint: complaintScore
        }
    };
}

function getScoreGrade(score) {
    const grades = Array.isArray(scoreGradeMap) ? scoreGradeMap : [
        { min: 800, label: '覇王' },
        { min: 650, label: '名君' },
        { min: 500, label: '優良統治' },
        { min: 350, label: '安定政権' },
        { min: 200, label: '苦闘の統治' },
        { min: 0, label: '試行錯誤' }
    ];

    const matched = grades.find(g => score >= g.min) || grades[grades.length - 1];
    return {
        label: matched.label,
        min: matched.min
    };
}

/**
 * 次ターンの変動予測（デルタ値）をリアルタイムに計算する関数
 * スライダーや政策カードが変更された時に呼び出され、画面右側の「+5」「-10」などの表示の元になる
 */
function computePredictedDeltas() {
    // config.jsから安全にデータを取得するためのフォールバック設定（未読み込み時のエラー防止）
    const rates = typeof taxIncomeRates !== 'undefined' ? taxIncomeRates : { consumption: 4, income: 2, resident: 2 };
    const cRate = typeof consumptionComplaintRate !== 'undefined' ? consumptionComplaintRate : 1.5;
    const iRate = typeof incomeComplaintRate !== 'undefined' ? incomeComplaintRate : 0.35;
    const pComplaint = typeof complaintPerTaxPoint !== 'undefined' ? complaintPerTaxPoint : 0.8;

    // 標準税率からの差分を計算
    const diffConsumption = gameState.taxConsumption - 10;
    const diffIncome = gameState.taxIncome - 25;
    const diffResident = gameState.taxResident - 10;

    // 税収による国庫金の変動予測
    const consumptionGold = diffConsumption * rates.consumption;
    const incomeGold = diffIncome * rates.income;
    const residentGold = diffResident * rates.resident;
    const totalTaxGold = consumptionGold + incomeGold + residentGold;

    let policyCost = 0;
    let policyTrust = 0;
    let policyComplaint = 0;
    let policyMilitary = 0;

    // 選択されている政策カードに応じたコスト・効果の割り当て
    if (gameState.selectedPolicy === 'repair') {
        policyCost = 10;
    } else if (gameState.selectedPolicy === 'defense') {
        policyCost = 7;
        policyComplaint = -5;
    } else if (gameState.selectedPolicy === 'education') {
        policyCost = 8;
        policyTrust = 8;
        policyComplaint = -8;
    } else if (gameState.selectedPolicy === 'train') {
        policyCost = 10;
        policyMilitary = 10;
    } else if (gameState.selectedPolicy === 'caravan') {
        policyCost = 18;
        policyComplaint = -12;
        policyTrust = 5;
    } else if (gameState.selectedPolicy === 'tempTax') {
        policyCost = -15; // 臨時税は国庫金+15（マイナスコスト）
        policyTrust = -8;
        policyComplaint = 12;
    }

    const predictedGold = totalTaxGold - policyCost;

    // 信頼度の変動予測
    let predictedTrust = computeIncomeTaxTrustChange(gameState.taxIncome);
    predictedTrust += policyTrust;
    if (gameState.towerHp < 50) predictedTrust -= 5; // 時計塔荒廃ペナルティ

    // 不満度の変動予測
    let predictedComplaint = Math.round(
        diffConsumption * cRate
        + diffIncome * iRate
        + diffResident * pComplaint
        + policyComplaint
    );

    const predictedMilitary = policyMilitary;

    return {
        gold: Math.round(predictedGold),
        trust: Math.round(predictedTrust),
        complaint: Math.round(predictedComplaint),
        military: Math.round(predictedMilitary)
    };
}