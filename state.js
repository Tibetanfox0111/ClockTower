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
    history: []
};

let currentOmenTag = 'none';

function computeIncomeTaxTrustChange(taxIncome) {
    if (taxIncome > 25) {
        return -Math.round((taxIncome - 25) * 1.2);
    }
    if (taxIncome < 25) {
        return Math.round((25 - taxIncome) * 1.2);
    }
    return 0;
}

/**
 * 次ターンの変動予測（デルタ値）をリアルタイムに計算する関数
 * スライダーや政策カードが変更された時に呼び出され、画面右側の「+5」「-10」などの表示の元になる
 */
function computePredictedDeltas() {
    // config.jsから安全にデータを取得するためのフォールバック設定（未読み込み時のエラー防止）
    const rates = typeof taxIncomeRates !== 'undefined' ? taxIncomeRates : { consumption: 4, income: 2, resident: 2 };
    const cRate = typeof consumptionComplaintRate !== 'undefined' ? consumptionComplaintRate : 2;
    const iRate = typeof incomeComplaintRate !== 'undefined' ? incomeComplaintRate : 0.5;
    const pComplaint = typeof complaintPerTaxPoint !== 'undefined' ? complaintPerTaxPoint : 1;

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
        policyCost = 12;
    } else if (gameState.selectedPolicy === 'defense') {
        policyCost = 8;
        policyComplaint = -5;
    } else if (gameState.selectedPolicy === 'education') {
        policyCost = 10;
        policyTrust = 10;
        policyComplaint = -10;
    } else if (gameState.selectedPolicy === 'train') {
        policyCost = 12;
        policyMilitary = 10;
    } else if (gameState.selectedPolicy === 'caravan') {
        policyCost = 20;
        policyComplaint = -15;
        policyTrust = 5;
    } else if (gameState.selectedPolicy === 'tempTax') {
        policyCost = -20; // 臨時税は国庫金+20（マイナスコスト）
        policyTrust = -10;
        policyComplaint = 15;
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