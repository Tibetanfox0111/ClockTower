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

const taxIncomeRates = {
    consumption: 4,
    income: 3,
    resident: 4
};

const complaintPerTaxPoint = 2;

const seasonalEvents = {
    omens: [
        "「不穏な雲が、時計台の天辺に集まっている…台風の予兆か。」",
        "「他国の偵察兵が国境付近で目撃されたとの噂がある。防衛を怠るな。」",
        "「今期は星が綺麗に澄み渡っておる。大きな災害は起きぬだろう。」",
        "「風が恐ろしく乾いている…ひとたび火の手が上がれば、大火となりかねんぞ。」",
        "「大雨が降り続いておる。川の水位が不気味に上がってきたな…洪水に備えよ。」",
        "「大地がかすかに震えている。この微小な地鳴り、大地震の前触れでなければよいが。」",
        "「空が真っ黒な雲に覆われ、静電気が走っておる。大落雷が落ちるやもしれん。」",
        "「（冬限定）今年の冬の風は一段と肌を刺す。この冷害は時計塔をも凍らせるか。」",
        "「（冬限定）山に積もった雪が今にも崩れそうだ。雪崩の警戒を怠るな。」",
        "「国庫が寂しくなれば、民の胃袋も寂しくなる。飢饉の足音が聞こえるようだ。」",
        "「妙だな、すべての税率が奇妙な調和を見せている…世界がひっくり返るような天変地異が来ねばよいが…」",
        "「街が奇妙なほど静まり返っている。嵐の前の静けさというやつか。」"
    ],
    voices: [
        "「税金が高すぎると生活が立ち行かないよ。お上の慈悲を！」",
        "「不満が高まれば高まるほど、敵国に付け入る隙を与えることになるぞ…」",
        "「インフラを維持するためなら、多少の納税は市民の義務さ。」",
        "「最近、我が国の防衛体制は十分なのだろうか？」"
    ]
};

// HTML要素の取得
const startScreen = document.getElementById('start-screen');
const mainScreen = document.getElementById('main-screen');
const resultScreen = document.getElementById('result-screen');

const maxYearsRange = document.getElementById('max-years-range');
const maxYearsVal = document.getElementById('max-years-val');
const startBtn = document.getElementById('start-btn');

const turnBadge = document.getElementById('turn-badge');
const statusGold = document.getElementById('status-gold');
const statusTrust = document.getElementById('status-trust');
const statusComplaint = document.getElementById('status-complaint');
const statusMilitary = document.getElementById('status-military'); 

const towerImg = document.getElementById('tower-img');
const towerHpFill = document.getElementById('tower-hp-fill');
const towerHpNum = document.getElementById('tower-hp-num');
const flavorText = document.getElementById('flavor-text');

const disasterText = document.getElementById('disaster-text');
const omenText = document.getElementById('omen-text');
const voiceText = document.getElementById('voice-text');

const taxConsumptionRange = document.getElementById('tax-consumption-range');
const taxConsumptionVal = document.getElementById('tax-consumption-val');
const taxIncomeRange = document.getElementById('tax-income-range');
const taxIncomeVal = document.getElementById('tax-income-val');
const taxResidentRange = document.getElementById('tax-resident-range');
const taxResidentVal = document.getElementById('tax-resident-val');

const nextTurnBtn = document.getElementById('next-turn-btn');

const resultBadge = document.getElementById('result-badge');
const evaluationText = document.getElementById('evaluation-text');
const historyLog = document.getElementById('history-log');
const restartBtn = document.getElementById('restart-btn');

// 政策カード要素
const cardRepair = document.getElementById('card-repair');
const cardDefense = document.getElementById('card-defense');
const cardEducation = document.getElementById('card-education');
const cardTrain = document.getElementById('card-train'); 
const policyCards = document.querySelectorAll('.policy-card');
const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
const difficultyHint = document.getElementById('difficulty-hint');

maxYearsRange.addEventListener('input', (e) => {
    const years = parseInt(e.target.value);
    gameState.maxTurns = years * 4;
    if (years === 5 || years === 6) {
        maxYearsVal.textContent = `${years}年 (オススメ)`;
    } else {
        maxYearsVal.textContent = `${years}年 (${gameState.maxTurns}ターン)`;
    }
});

difficultyRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (!e.target.checked) return;
        gameState.difficulty = e.target.value;
        difficultyHint.textContent = difficultyLabels[e.target.value];
    });
});

startBtn.addEventListener('click', startGame);
nextTurnBtn.addEventListener('click', processTurn);
restartBtn.addEventListener('click', resetGame);

policyCards.forEach(card => {
    card.addEventListener('click', () => {
        if (card.classList.contains('disabled')) return;
        policyCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        gameState.selectedPolicy = card.getAttribute('data-policy');
    });
});

taxConsumptionRange.addEventListener('input', (e) => {
    gameState.taxConsumption = parseInt(e.target.value);
    taxConsumptionVal.textContent = `${gameState.taxConsumption}%`;
});
taxIncomeRange.addEventListener('input', (e) => {
    gameState.taxIncome = parseInt(e.target.value);
    taxIncomeVal.textContent = `${gameState.taxIncome}%`;
});
taxResidentRange.addEventListener('input', (e) => {
    gameState.taxResident = parseInt(e.target.value);
    taxResidentVal.textContent = `${gameState.taxResident}%`;
});

function startGame() {
    startScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    updateUI();
    generatePredictions();
}

function updateUI() {
    statusGold.textContent = gameState.gold;
    statusTrust.textContent = gameState.trust;
    statusComplaint.textContent = gameState.complaint;
    statusMilitary.textContent = gameState.military; 

    const year = Math.ceil(gameState.currentTurn / 4);
    const seasons = ['春', '夏', '秋', '冬'];
    const season = seasons[(gameState.currentTurn - 1) % 4];
    turnBadge.textContent = `${year}年目 ${season} / 全${gameState.maxTurns / 4}年`;

    towerHpFill.style.height = `${gameState.towerHp}%`;
    towerHpNum.textContent = `${gameState.towerHp}/100`;

    if (gameState.towerHp >= 80) {
        towerImg.src = "tower verygood .jpg";
        flavorText.textContent = "時計塔は眩しく美しく、国の確かな未来を告げている。";
    } else if (gameState.towerHp >= 50) {
        towerImg.src = "tower good.jpg";
        flavorText.textContent = "時計塔は美しく、力強く鐘を鳴らしている。";
    } else if (gameState.towerHp >= 25) {
        towerImg.src = "tower bad.jpg";
        flavorText.textContent = "時計塔に少し汚れや傷が目立つが、まだ機能している。";
    } else {
        towerImg.src = "tower sobad.jpg";
        flavorText.textContent = "不気味な軋み声をあげ、時計塔は今にも崩壊しそうだ…！";
    }

    if (gameState.towerHp >= 100) {
        cardRepair.classList.add('disabled');
        if (gameState.selectedPolicy === 'repair') {
            cardDefense.classList.add('active');
            gameState.selectedPolicy = 'defense';
        }
    } else {
        cardRepair.classList.remove('disabled');
    }
}

function generatePredictions() {
    const randomOmen = seasonalEvents.omens[Math.floor(Math.random() * seasonalEvents.omens.length)];
    const randomVoice = seasonalEvents.voices[Math.floor(Math.random() * seasonalEvents.voices.length)];
    omenText.textContent = randomOmen;
    voiceText.textContent = randomVoice;
}

function processTurn() {
    let logMessage = `【第${gameState.currentTurn}期】`;
    const seasons = ['春', '夏', '秋', '冬'];
    const currentSeason = seasons[(gameState.currentTurn - 1) % 4];

    const diffConsumption = gameState.taxConsumption - 10;
    const diffIncome = gameState.taxIncome - 25;
    const diffResident = gameState.taxResident - 10;

    const deltaConsumptionGold = diffConsumption * taxIncomeRates.consumption;
    const deltaIncomeGold = diffIncome * taxIncomeRates.income;
    const deltaResidentGold = diffResident * taxIncomeRates.resident;

    const totalTaxChangeGold = deltaConsumptionGold + deltaIncomeGold + deltaResidentGold;
    gameState.gold += totalTaxChangeGold;

    if (totalTaxChangeGold >= 0) {
        logMessage += ` 税制調整により国庫金+${totalTaxChangeGold}。`;
    } else {
        logMessage += ` 税制調整により国庫金${totalTaxChangeGold}。`;
    }

    const totalComplaintChange = (diffConsumption * complaintPerTaxPoint) + (diffIncome * complaintPerTaxPoint) + (diffResident * complaintPerTaxPoint);
    gameState.complaint += totalComplaintChange;

    if (totalComplaintChange > 0) {
        logMessage += ` 税率が基準を上回り、民の不満度+${totalComplaintChange}。`;
    } else if (totalComplaintChange < 0) {
        logMessage += ` 減税政策が評価され、民の不満度${totalComplaintChange}。`;
    }

    if (gameState.taxIncome > 35) { gameState.trust -= 4; }
    else if (gameState.taxIncome < 15) { gameState.trust += 3; }

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
    }

    // 🏚️ 時計塔HP50未満でのペナルティ判定
    if (gameState.towerHp < 50) {
        gameState.trust -= 5;
        logMessage += ` 🏚️時計塔の荒廃が目立ち、民の信頼度-5。`;
    }

    gameState.complaint = Math.max(0, Math.min(100, gameState.complaint));
    gameState.trust = Math.max(0, Math.min(100, gameState.trust));

    let turnEventSummary = "";

    // 🌀 厄災発生判定ロジック
    const isDefenseActive = (gameState.selectedPolicy === 'defense');

    // 天変地異の確率計算
    const cataclysmChance = (gameState.taxConsumption / 100) * (gameState.taxIncome / 100) * (gameState.taxResident / 100);
    
    if (Math.random() < cataclysmChance) {
        if (isDefenseActive) {
            turnEventSummary += `✨【神の加護】天変地異の危機がこの国を襲いましたが、徹底された「防災備蓄」により完全に無効化されました！ `;
            logMessage += ` ✨政策「防災備蓄」により天変地異を完全防御。`;
        } else {
            gameState.towerHp = 0;
            logMessage += ` 🌎天変地異が発生！時計塔が消滅。`;
            gameState.history.push(logMessage);
            endGame(false, "天変地異（すべての税率が噛み合った最悪の確率により世界が崩壊。防災対策を怠っていたため、時計塔を含め国家の全てが灰燼に帰しました）");
            return;
        }
    } else {
        // 難易度に応じた通常災厄の発生確率を設定
        let disasterChance = difficultyRates[gameState.difficulty] || 0.10;
        if (isDefenseActive) disasterChance = 0.00; 

        if (Math.random() < disasterChance) {
            // 発生可能な災厄プール
            let availableDisasters = [
                { name: "台風", damage: 30, text: "⚠️災厄「猛烈な台風」が直撃し、時計塔が大きく損壊" },
                { name: "大火", damage: 30, text: "⚠️災厄「謎の大火」が燃え広がり、時計塔が激しく炎上" },
                { name: "洪水", damage: 15, text: "⚠️災厄「大規模な洪水」が発生し、インフラが激しく水没" },
                { name: "地震", damage: 20, text: "⚠️災厄「大地震」の揺れにより、時計塔に亀裂が走る" },
                { name: "落雷", damage: 15, text: "⚠️災厄「激しい落雷」が時計塔の頂点に直撃" }
            ];

            // 冬限定の災厄を追加
            if (currentSeason === "冬") {
                availableDisasters.push({ name: "冷害", damage: 20, text: "⚠️災厄「記録的な冷害」により街が凍りつく" });
                availableDisasters.push({ name: "雪崩", damage: 25, text: "⚠️災厄「大雪崩」が防壁を越えて押し寄せる" });
            }

            // 国庫金60未満限定の災厄を追加
            if (gameState.gold < 60) {
                availableDisasters.push({ name: "飢饉", damage: 15, text: "⚠️災厄「大飢饉」が発生し、国内の困窮に引きずられ補修が滞る" });
            }

            // プールの中からランダムで1つを発動
            const chosenDisaster = availableDisasters[Math.floor(Math.random() * availableDisasters.length)];
            gameState.towerHp -= chosenDisaster.damage;
            turnEventSummary += `${chosenDisaster.text} (-HP${chosenDisaster.damage}) `;
            logMessage += ` ⚠️災害発生（${chosenDisaster.name}）。塔にダメージ。`;
        }
    }

    // 他国からの侵攻ロジック
    let invasionOccurred = false;
    let invasionDetails = [];

    while (gameState.gold > 0) {
        let attackChance = 0;
        
        if (gameState.trust <= 0) {
            attackChance = 1.0; 
        } else if (gameState.gold < 75 && gameState.complaint > 20) {
            attackChance = 2 / gameState.gold; 
        } else {
            break; 
        }
        
        if (Math.random() < attackChance) {
            invasionOccurred = true;
            const attackers = gameState.complaint; 
            
            const enemyPower = (attackers * 2) + 10;              
            const governmentPower = gameState.military + gameState.trust; 

            const displayEnemySoldiers = (enemyPower * 1000).toLocaleString();
            const displayGovSoldiers = (governmentPower * 1000).toLocaleString();
            const enemyType = (gameState.trust >= 50) ? "他国連合軍" : "他国軍";
            
            if (gameState.trust <= 0) {
                invasionDetails.push(`🚨【国家危機】外交的信用（信頼度0）が完全に失墜した結果、${enemyType} ${displayEnemySoldiers}人の大軍が確定侵攻してきました！`);
            } else {
                invasionDetails.push(`⚔️【侵攻警報】敵国が財政の隙と不満に漬け込み、${enemyType} ${displayEnemySoldiers}人の大軍で攻めてきました！`);
            }

            // 防衛戦により時計塔HPが必ず -10
            gameState.towerHp -= 10;

            if (governmentPower >= enemyPower) {
                const militaryLoss = Math.min(gameState.military, Math.floor(attackers * 0.5));
                gameState.military = Math.max(0, gameState.military - militaryLoss);

                logMessage += ` ⚔️${enemyType}の侵攻を防衛成功（塔HP-10）。`;
                invasionDetails.push(`🛡️ 我が国の防衛隊（${displayGovSoldiers}人）が撃退成功！戦闘により軍事力 -${militaryLoss}、戦火の余波で時計塔HP -10。`);
            } else {
                logMessage += ` ❌${enemyType}の侵攻を防ぎきれず敗北。`;
                gameState.history.push(logMessage);
                
                if (gameState.trust >= 50) {
                    endGame(false, `連合軍による侵攻（連合軍 ${displayEnemySoldiers} 人の前に防衛線が突破され、国が占領されました）`);
                } else if (gameState.trust <= 0) {
                    endGame(false, `信用の失墜による他国侵攻（孤立無援の状態で他国軍 ${displayEnemySoldiers} 人に蹂遊され、国家が破滅しました）`);
                } else {
                    endGame(false, `他国からの侵攻（他国軍 ${displayEnemySoldiers} 人の大軍の前に力及びませんでした）`);
                }
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
        revolutionReason = "限界に達した民衆の怒りが爆発し、国内全土で大規模な一斉蜂起（市民革命）が発生しました！";
    } else if (gameState.complaint > 50) {
        const revolutionNumerator = gameState.complaint - 50; 
        const revolutionChance = revolutionNumerator / 50;

        if (Math.random() < revolutionChance) {
            revolutionTriggered = true;
            revolutionReason = `不満度が ${gameState.complaint} に達したことで、確率 ${(revolutionChance * 100).toFixed(0)}% の暴動リスクを抑えきれず、市民革命が勃発しました！`;
        }
    }

    // 市民革命対決ロジック
    if (revolutionTriggered) {
        const rebelPower = gameState.complaint * 2;                  
        const governmentPower = gameState.military + gameState.trust; 

        const displayRebelSoldiers = (rebelPower * 1000).toLocaleString();
        const displayGovSoldiers = (governmentPower * 1000).toLocaleString();

        // 暴動により時計塔HPが必ず -10
        gameState.towerHp -= 10;

        if (governmentPower >= rebelPower) {
            const militaryLoss = Math.min(gameState.military, Math.floor(rebelPower * 0.5));
            gameState.military = Math.max(0, gameState.military - militaryLoss);
            
            gameState.complaint = 20; 
            gameState.trust = Math.max(0, Math.min(100, gameState.trust - 15));

            const suppressionMsg = `💥【市民革命勃発】${revolutionReason}<br>⚔️【武力制裁】政府軍 ${displayGovSoldiers} 人により、革命軍 ${displayRebelSoldiers} 人の鎮圧に成功。国内の混乱により時計塔HP -10。（軍事力-${militaryLoss}、不満度が20へ、信頼度-15）`;
            combinedDisasterText = combinedDisasterText ? combinedDisasterText + "<br><br>" + suppressionMsg : suppressionMsg;
            logMessage += ` ⚔️市民革命を鎮圧（塔HP-10）。`;
        } else {
            logMessage += ` ❌市民革命の制裁に失敗、政権打倒。`;
            gameState.history.push(logMessage);
            endGame(false, `市民革命（革命軍の総勢 ${displayRebelSoldiers} 人の暴力の前に防衛隊が瓦解。現政権は打倒されました）`);
            return;
        }
    }

    if (combinedDisasterText) {
        disasterText.innerHTML = combinedDisasterText;
    } else {
        disasterText.textContent = "今期は平穏に過ぎ去りました。大きな災害や敵国の侵攻はありません。";
    }

    gameState.history.push(logMessage);

    if (gameState.gold <= 0) {
        const displayAttackers = (gameState.complaint * 1000).toLocaleString();
        if (gameState.trust >= 50) {
            endGame(false, `他国連合軍による侵攻（国庫金が底をついたため、周辺国が『連合軍』を組織し、不満に乗じて ${displayAttackers} 人の大軍で一斉に侵攻してきました）`);
        } else {
            endGame(false, `他国からの侵攻（国庫金が底をつき、防衛の隙を突かれて他国から ${displayAttackers} 人の大軍による単独侵攻を許してしまいました）`);
        }
        return;
    }

    if (gameState.towerHp <= 0) {
        endGame(false, "時計塔の崩壊（インフレが完全に破壊され、国家が破綻しました）");
        return;
    }

    gameState.currentTurn++;
    if (gameState.currentTurn > gameState.maxTurns) {
        endGame(true, "無事、任期を全うしました！敵国の侵攻や天災を退けた名君として歴史に刻まれるでしょう。");
    } else {
        updateUI();
        generatePredictions();
    }
}

function endGame(isSuccess, reason) {
    mainScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');

    if (isSuccess) {
        resultBadge.textContent = "🏆 統治成功！ ゲームクリア";
        resultBadge.style.background = "#2e8253";
        evaluationText.innerHTML = `🌟 素晴らしい手腕です！<br>あなたは見事にインフレを維持し、強固な防衛体制を築いて国を守り抜きました。<br>勝因: ${reason}`;
    } else {
        resultBadge.textContent = "💀 統治失敗！ ゲームオーバー";
        resultBadge.style.background = "#b52b2b";
        evaluationText.innerHTML = `💔 志半ばで国家は崩壊しました…<br>原因: <strong>${reason}</strong><br>次は不満度を抑えるか、こまめに軍事訓練を行って備えましょう。`;
    }

    historyLog.innerHTML = "";
    gameState.history.forEach(log => {
        const li = document.createElement('li');
        li.textContent = log;
        historyLog.appendChild(li);
    });
}

function resetGame() {
    maxYearsRange.value = 6;
    maxYearsVal.textContent = "6年 (オススメ)";

    gameState = {
        currentTurn: 1,
        maxTurns: 6 * 4,
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
    
    difficultyRadios.forEach(radio => {
        radio.checked = radio.value === 'normal';
    });
    difficultyHint.textContent = difficultyLabels.normal;
    
    taxConsumptionRange.value = 10;
    taxConsumptionVal.textContent = "10%";
    taxIncomeRange.value = 25;
    taxIncomeVal.textContent = "25%";
    taxResidentRange.value = 10;
    taxResidentVal.textContent = "10%";

    policyCards.forEach(c => c.classList.remove('active'));
    cardRepair.classList.add('active');

    resultScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
}