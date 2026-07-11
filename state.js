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
    pendingAuditResult: null,
    selectedPolicy: 'repair',
    taxConsumption: 10, 
    taxIncome: 25,      
    taxResident: 10,
    difficulty: 'normal',
    history: []
};

let currentOmenTag = 'none';

/**
 * 脱税確率の計算
 * 所得税・住民税・消費税の高さや、信頼度の低さに応じて確率が変動する
 */
function computeEvaderProbability() {
    let p = 0.02;
    p += Math.max(0, gameState.taxIncome - 20) * 0.015;
    p += Math.max(0, gameState.taxResident - 10) * 0.01;
    p += Math.max(0, gameState.taxConsumption - 12) * 0.005;
    if (gameState.trust < 40) p += 0.06;
    if (gameState.trust > 70) p -= 0.02;
    p = Math.max(0.02, Math.min(0.8, p));
    return p;
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
    const iTrust = typeof incomeTrustRate !== 'undefined' ? incomeTrustRate : 2;
    const rTrust = typeof residentTrustRate !== 'undefined' ? residentTrustRate : 1;
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
        policyComplaint = -20; 
    } else if (gameState.selectedPolicy === 'tempTax') { 
        policyCost = -20; // 臨時税は国庫金+20（マイナスコスト）
        policyTrust = -15; 
        policyComplaint = 10; 
    } else if (gameState.selectedPolicy === 'audit') {
        // 脱税調査は確率に基づいた期待値を算出
        const p = computeEvaderProbability();
        policyCost = 10; // 調査費用
        var auditExpectedGold = Math.round(15 * p);
        var auditExpectedTrust = Math.round(-20 * (1 - p));
        var auditExpectedComplaint = Math.round(15 * (1 - p));
    }

    // 国庫金の最終予測値
    const predictedGold = totalTaxGold - policyCost;

    // 信頼度の変動予測
    let predictedTrust = 0;
    if (gameState.taxIncome > 25) {
        predictedTrust -= Math.floor((gameState.taxIncome - 25) / 5) + 1;
    } else if (gameState.taxIncome < 25) {
        predictedTrust += Math.floor((25 - gameState.taxIncome) / 5) + 1;
    }
    predictedTrust += policyTrust;
    if (gameState.towerHp < 50) predictedTrust -= 5; // 時計塔荒廃ペナルティ

    // 不満度の変動予測
    let predictedComplaint = Math.round(
        diffConsumption * cRate
        + diffIncome * iRate
        + diffResident * pComplaint
        + policyComplaint
    );
    // 不満度の変動幅制限 (-10 〜 10)
    predictedComplaint = Math.max(-10, Math.min(10, predictedComplaint));

    // 軍事力の変動予測
    const predictedMilitary = policyMilitary;

    // 脱税調査が選択されている場合は、期待値を加算
    let finalPredictedGold = Math.round(predictedGold);
    let finalPredictedTrust = Math.round(predictedTrust);
    let finalPredictedComplaint = Math.round(predictedComplaint);

    if (gameState.selectedPolicy === 'audit') {
        finalPredictedGold += (auditExpectedGold || 0);
        finalPredictedTrust += (auditExpectedTrust || 0);
        finalPredictedComplaint += (auditExpectedComplaint || 0);
    }

    // 計算したデルタ（差分）オブジェクトを返す
    return {
        gold: finalPredictedGold,
        trust: finalPredictedTrust,
        complaint: finalPredictedComplaint,
        military: Math.round(predictedMilitary)
    };
}