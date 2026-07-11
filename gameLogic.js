// gameLogic.js - ターン進行やイベント処理のロジック
function processTurn() {
    if (gameState.pendingAuditResult) {
        gameState.pendingAuditResult = null;
    }
    let logMessage = `【第${gameState.currentTurn}期】`;
    const seasons = ['春', '夏', '秋', '冬'];
    const currentSeason = seasons[(gameState.currentTurn - 1) % 4];

    const diffConsumption = gameState.taxConsumption - 10;
    const diffIncome = gameState.taxIncome - 25;
    const diffResident = gameState.taxResident - 10;

    const consumptionGold = diffConsumption * taxIncomeRates.consumption;
    const incomeGold = diffIncome * taxIncomeRates.income;
    const residentGold = diffResident * taxIncomeRates.resident;
    const totalTaxGold = consumptionGold + incomeGold + residentGold;
    gameState.gold += totalTaxGold;
    logMessage += ` 税収により国庫金${totalTaxGold >= 0 ? '+' : ''}${totalTaxGold}。`;

    let totalComplaintChange = Math.round(diffConsumption * consumptionComplaintRate
        + diffIncome * incomeComplaintRate
        + diffResident * complaintPerTaxPoint);
    totalComplaintChange = Math.max(-10, Math.min(10, totalComplaintChange));
    gameState.complaint += totalComplaintChange;
    
    if (totalComplaintChange > 0) {
        logMessage += ` 税率の変動により不満度+${totalComplaintChange}。`;
    } else if (totalComplaintChange < 0) {
        logMessage += ` 税率の引き下げにより不満度${totalComplaintChange}。`;
    }

    let trustChange = 0;
    if (gameState.taxIncome > 25) {
        trustChange -= Math.floor((gameState.taxIncome - 25) / 5) + 1;
    } else if (gameState.taxIncome < 25) {
        trustChange += Math.floor((25 - gameState.taxIncome) / 5) + 1;
    }
    gameState.trust += trustChange;
    if (trustChange > 0) {
        logMessage += ` 低い所得税が評価され、信頼度+${trustChange}。`;
    } else if (trustChange < 0) {
        logMessage += ` 高い所得税により信頼度${trustChange}。`;
    }

    gameState.towerHp -= 5;
    logMessage += ` 時計塔の維持で塔HP-5。`;

    // 政策の実行処理
    if (gameState.selectedPolicy === 'repair') {
        gameState.gold -= 12;
        gameState.towerHp = Math.min(100, gameState.towerHp + 20);
        logMessage += ` 政策「時計塔修復」により、塔HP+20。`;
    } else if (gameState.selectedPolicy === 'defense') {
        gameState.gold -= 8;
        gameState.complaint = Math.max(0, gameState.complaint - 5);
        logMessage += ` 政策「防災備蓄」を行い、災害への備えを固めた。`;
    } else if (gameState.selectedPolicy === 'education') {
        gameState.gold -= 10;
        gameState.trust += 10;
        gameState.complaint = Math.max(0, gameState.complaint - 10);
        logMessage += ` 政策「教育投資」により、人々の信頼+10。`;
    } else if (gameState.selectedPolicy === 'train') { 
        gameState.gold -= 12;
        gameState.military += 10;
        logMessage += ` 政策「軍事訓練」を実施。軍事力+10。`;
    } else if (gameState.selectedPolicy === 'tempTax') {
        gameState.gold += 20;
        gameState.trust = Math.max(0, gameState.trust - 15);
        gameState.complaint = Math.min(100, gameState.complaint + 10);
        logMessage += ` 政策「臨時税」により国庫金+20。信頼度-15。不満度+10。`;
    } else if (gameState.selectedPolicy === 'audit') {
        gameState.gold -= 10;
        const p = computeEvaderProbability();
        const auditChance = Math.round(p * 100);
        const auditSuccess = Math.random() < p;
        if (auditSuccess) {
            gameState.gold += 15;
            logMessage += ` 🔎脱税調査に10ゴールドを支払い、調査で不正が発見され国庫金+15。`;
            gameState.pendingAuditResult = `🔎 脱税調査の結果: 不正が発見されました！国庫金+15。 (${auditChance}%)`;
        } else {
            gameState.trust = Math.max(0, gameState.trust - 20);
            gameState.complaint = Math.min(100, gameState.complaint + 15);
            logMessage += ` ❌脱税調査に10ゴールドを支払ったが不正は見つからず、冤罪騒ぎで信頼度-20・不満度+15。`;
            gameState.pendingAuditResult = `🔍 脱税調査の結果: 脱税は見つかりませんでした。 (${auditChance}%)`;
        }
    } else if (gameState.selectedPolicy === 'caravan') {
        gameState.gold -= 20;
        gameState.complaint = Math.max(0, gameState.complaint - 20);
        logMessage += ` 政策「キャラバン」による支援物資で、国庫金-20。不満度-20。`;
    }

    if (gameState.towerHp < 50) {
        gameState.trust -= 5;
        logMessage += ` 🏚️時計塔の荒廃が目立ち、民の信頼度-5。`;
    }

    gameState.complaint = Math.max(0, Math.min(100, gameState.complaint));
    gameState.trust = Math.max(0, Math.min(100, gameState.trust));

    let turnEventSummary = "";
    const isDefenseActive = (gameState.selectedPolicy === 'defense');

    // 災厄発生判定
    if (isDefenseActive && currentOmenTag === 'cataclysm') {
        turnEventSummary += `✨【神の加護】天変地異の危機がこの国を襲いましたが、「防災備蓄」により無効化されました！ `;
        logMessage += ` ✨政策「防災備蓄」により天変地異を完全防御。`;
    } else if (currentOmenTag === 'cataclysm') {
        if (Math.random() < 0.5) {
            gameState.towerHp = 0;
            logMessage += ` 🌎天変地異が発生！時計塔が消滅。`;
            gameState.history.push(logMessage);
            endGame(false, "天変地異。");
            return;
        }
    } else if (currentOmenTag && currentOmenTag !== 'none') {
        let availableDisasters = [
            { tag: 'typhoon', name: "台風", damage: 30, text: "⚠️災厄「猛烈な台風」が直撃" },
            { tag: 'fire', name: "大火", damage: 30, text: "⚠️災厄「謎の大火」が燃え広がり" },
            { tag: 'flood', name: "洪水", damage: 15, text: "⚠️災厄「大規模な洪水」が発生" },
            { tag: 'earthquake', name: "地震", damage: 20, text: "⚠️災厄「大地震」の揺れ" },
            { tag: 'lightning', name: "落雷", damage: 15, text: "⚠️災厄「激しい落雷」が直撃" }
        ];
        if (currentSeason === "冬") {
            availableDisasters.push({ tag: 'cold', name: "冷害", damage: 20, text: "⚠️災厄「記録的な冷害」" });
            availableDisasters.push({ tag: 'avalanche', name: "雪崩", damage: 25, text: "⚠️災厄「大雪崩」" });
        }
        if (gameState.gold < 60) {
            availableDisasters.push({ tag: 'famine', name: "飢饉", damage: 15, text: "⚠️災厄「大飢饉」" });
        }

        const chosen = availableDisasters.find(d => d.tag === currentOmenTag);
        if (chosen && !isDefenseActive && Math.random() < (1/3)) {
            gameState.towerHp -= chosen.damage;
            turnEventSummary += `${chosen.text} (-HP${chosen.damage}) `;
            logMessage += ` ⚠️災害発生（${chosen.name}）。`;
        }
    }

    // 他国からの侵攻ロジック
    let invasionOccurred = false;
    let invasionDetails = [];
    while (gameState.gold > 0) {
        let attackChance = 0;
        if (gameState.trust <= 0) attackChance = 1.0; 
        else if (gameState.gold < 75 && gameState.complaint > 20) attackChance = 2 / gameState.gold; 
        else break;
        
        if (Math.random() < attackChance) {
            invasionOccurred = true;
            const enemyPower = (gameState.complaint * 2) + 10;
            const governmentPower = gameState.military + Math.floor(gameState.trust / 2);
            const enemyType = (gameState.trust >= 50) ? "他国連合軍" : "他国軍";
            
            gameState.towerHp -= 10;
            if (governmentPower >= enemyPower) {
                const militaryLoss = Math.min(gameState.military, enemyPower);
                gameState.military = Math.max(0, gameState.military - militaryLoss);
                logMessage += ` ⚔️${enemyType}の侵攻を防衛成功（塔HP-10）。`;
                invasionDetails.push(`🛡️ 我が国の防衛隊が撃退成功！軍事力 -${militaryLoss}、時計塔HP -10。`);
            } else {
                logMessage += ` ❌${enemyType}の侵攻を防ぎきれず敗北。`;
                gameState.history.push(logMessage);
                endGame(false, `他国からの侵攻により国家が破滅しました。`);
                return; 
            }
            if (gameState.trust <= 0) break;
        } else {
            break;
        }
    }

    let combinedDisasterText = "";
    if (turnEventSummary) combinedDisasterText += turnEventSummary + "<br>";
    if (invasionOccurred) combinedDisasterText += invasionDetails.join("<br>");

    // 市民革命（暴動）判定
    let revolutionTriggered = false;
    let revolutionReason = "";
    if (gameState.complaint >= 100) {
        revolutionTriggered = true;
        revolutionReason = "限界に達した民衆の怒りが爆発し、市民革命が発生しました！";
    } else if (gameState.complaint > 50) {
        const revolutionChance = (gameState.complaint - 50) / 50;
        if (Math.random() < revolutionChance) {
            revolutionTriggered = true;
            revolutionReason = `不満度が抑えきれず、市民革命が勃発しました！`;
        }
    }

    if (revolutionTriggered) {
        const rebelPower = gameState.complaint * 2;
        const governmentPower = gameState.military + gameState.trust;
        gameState.towerHp -= 10;

        if (governmentPower >= rebelPower) {
            const militaryLoss = Math.min(gameState.military, rebelPower);
            gameState.military = Math.max(0, gameState.military - militaryLoss);
            gameState.complaint = 20;
            gameState.trust = Math.max(0, Math.min(100, gameState.trust - 15));
            const suppressionMsg = `💥【市民革命勃発】${revolutionReason}<br>⚔️政府軍により鎮圧成功。時計塔HP -10。`;
            combinedDisasterText = combinedDisasterText ? combinedDisasterText + "<br><br>" + suppressionMsg : suppressionMsg;
            logMessage += ` ⚔️市民革命を鎮圧（塔HP-10）。`;
        } else {
            logMessage += ` ❌市民革命の制裁に失敗、政権打倒。`;
            gameState.history.push(logMessage);
            endGame(false, `市民革命により現政権は打倒されました。`);
            return;
        }
    }

    // 画面側への結果受け渡し用グローバルコールバック（app.js側で上書きする）
    onTurnProcessed(combinedDisasterText, logMessage);
}