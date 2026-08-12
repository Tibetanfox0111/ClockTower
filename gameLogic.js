// gameLogic.js - ターン進行やイベント処理のロジック
function processTurn() {
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
    gameState.complaint += totalComplaintChange;
    
    if (totalComplaintChange > 0) {
        logMessage += ` 税率の変動により不満度+${totalComplaintChange}。`;
    } else if (totalComplaintChange < 0) {
        logMessage += ` 税率の引き下げにより不満度${totalComplaintChange}。`;
    }

    let trustChange = computeIncomeTaxTrustChange(gameState.taxIncome);
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
        gameState.gold -= 10;
        gameState.towerHp = Math.min(100, gameState.towerHp + 18);
        logMessage += ` 政策「時計塔修復」により、塔HP+18。`;
    } else if (gameState.selectedPolicy === 'defense') {
        gameState.gold -= 7;
        gameState.complaint -= 5;
        logMessage += ` 政策「防災備蓄」を行い、災害への備えを固めた。`;
    } else if (gameState.selectedPolicy === 'education') {
        gameState.gold -= 8;
        gameState.trust += 8;
        gameState.complaint -= 8;
        logMessage += ` 政策「教育投資」により、人々の信頼+8。`;
    } else if (gameState.selectedPolicy === 'train') { 
        gameState.gold -= 10;
        gameState.military += 10;
        logMessage += ` 政策「軍事訓練」を実施。軍事力+10。`;
    } else if (gameState.selectedPolicy === 'tempTax') {
        gameState.gold += 15;
        gameState.trust -= 8;
        gameState.complaint += 12;
        logMessage += ` 政策「臨時税」により国庫金+15。信頼度-8。不満度+12。`;
    } else if (gameState.selectedPolicy === 'caravan') {
        gameState.gold -= 18;
        gameState.trust += 5;
        gameState.complaint -= 12;
        logMessage += ` 政策「キャラバン」による支援物資で、国庫金-18。信頼度+5。不満度-12。`;
    }

    if (gameState.towerHp < 50) {
        gameState.trust -= 3;
        logMessage += ` 🏚️時計塔の荒廃が目立ち、民の信頼度-3。`;
    }

    let turnEventSummary = "";
    const isDefenseActive = (gameState.selectedPolicy === 'defense');

    const difficultyKey = gameState.difficulty || 'normal';
    const disasterChance = difficultyRates[difficultyKey] ?? difficultyRates.normal;
    const damageMultiplier = difficultyKey === 'easy' ? 0.8 : difficultyKey === 'hard' ? 1.1 : 1.0;
    const cataclysmChance = difficultyKey === 'easy' ? 0.06 : difficultyKey === 'hard' ? 0.18 : 0.12;

    // 災厄発生判定
    if (isDefenseActive && currentOmenTag === 'cataclysm') {
        turnEventSummary += `✨【神の加護】天変地異の危機がこの国を襲いましたが、「防災備蓄」により無効化されました！ `;
        logMessage += ` ✨政策「防災備蓄」により天変地異を完全防御。`;
    } else if (currentOmenTag === 'cataclysm') {
        if (Math.random() < cataclysmChance) {
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
        if (currentSeason === "夏") {
            availableDisasters.push({ tag: 'cold', name: "冷害", damage: 20, text: "⚠️災厄「記録的な冷害」" });
        }
        if (currentSeason === "冬") {
            availableDisasters.push({ tag: 'avalanche', name: "雪崩", damage: 25, text: "⚠️災厄「大雪崩」" });
        }
        if (gameState.gold < 60) {
            availableDisasters.push({ tag: 'famine', name: "飢饉", damage: 15, text: "⚠️災厄「大飢饉」" });
        }

        const chosen = availableDisasters.find(d => d.tag === currentOmenTag);
        if (chosen && !isDefenseActive && Math.random() < disasterChance) {
            const actualDamage = Math.max(1, Math.round(chosen.damage * damageMultiplier));
            gameState.towerHp -= actualDamage;
            turnEventSummary += `${chosen.text} (-HP${actualDamage}) `;
            logMessage += ` ⚠️災害発生（${chosen.name}）。`;
        }
    }

    // 市民蜂起判定（信頼度0で即発生）
    let revolutionTriggered = false;
    let revolutionReason = "";
    if (gameState.trust <= 0) {
        revolutionTriggered = true;
        revolutionReason = "信頼度が0に落ち、市民が蜂起しました！";
    } else if (gameState.complaint >= 100) {
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
        const rebelPower = Math.max(20, gameState.complaint * 2 + (gameState.trust <= 0 ? 15 : 0));
        const governmentPower = gameState.military + Math.max(0, gameState.trust);
        gameState.towerHp -= 10;

        if (governmentPower >= rebelPower) {
            const militaryLoss = Math.min(gameState.military, rebelPower);
            gameState.military = Math.max(0, gameState.military - militaryLoss);
            gameState.complaint = 20;
            gameState.trust = Math.max(0, gameState.trust);
            const suppressionMsg = `💥【市民蜂起】${revolutionReason}<br>⚔️政府軍により鎮圧成功。時計塔HP -10。`;
            combinedDisasterText = combinedDisasterText ? combinedDisasterText + "<br><br>" + suppressionMsg : suppressionMsg;
            logMessage += ` ⚔️市民蜂起を鎮圧（塔HP-10）。`;
        } else {
            logMessage += ` ❌市民蜂起の制裁に失敗、政権打倒。`;
            gameState.history.push(logMessage);
            endGame(false, `市民蜂起により現政権は打倒されました。`);
            return;
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

    // 画面側への結果受け渡し用グローバルコールバック（app.js側で上書きする）
    onTurnProcessed(combinedDisasterText, logMessage);
}