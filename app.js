// app.js - DOM操作、イベントリスナー、UIの更新、およびオーディオ管理

// --- 🎵 オーディオマネージャーの初期化 ---
let audioManager = null;

// ユーザーのアクション（ボタンクリックなど）があった瞬間に安全に音を立ち上げる関数
function getAudioManager() {
    if (!audioManager && typeof GameAudioManager !== 'undefined') {
        audioManager = new GameAudioManager();
    }
    return audioManager;
}

// --- 画面要素（DOM）の取得 ---
const startScreen = document.getElementById('start-screen');
const mainScreen = document.getElementById('main-screen');
const resultScreen = document.getElementById('result-screen');
const maxYearsRange = document.getElementById('max-years-range');
const maxYearsVal = document.getElementById('max-years-val');
const startBtn = document.getElementById('start-btn');
const turnBadge = document.getElementById('turn-badge');

// ステータス（現在値）の表示要素
const statusGold = document.getElementById('status-gold');
const statusTrust = document.getElementById('status-trust');
const statusComplaint = document.getElementById('status-complaint');
const statusMilitary = document.getElementById('status-military'); 

// リアルタイム変動予測（デルタ）の表示要素
const statusGoldDelta = document.getElementById('status-gold-delta');
const statusTrustDelta = document.getElementById('status-trust-delta');
const statusComplaintDelta = document.getElementById('status-complaint-delta');
const statusMilitaryDelta = document.getElementById('status-military-delta');

// 時計塔・テキスト関連
const towerImg = document.getElementById('tower-img');
const towerHpFill = document.getElementById('tower-hp-fill');
const towerHpNum = document.getElementById('tower-hp-num');
const flavorText = document.getElementById('flavor-text');
const disasterText = document.getElementById('disaster-text');
const omenText = document.getElementById('omen-text');
const voiceText = document.getElementById('voice-text');

// 税率スライダー
const taxConsumptionRange = document.getElementById('tax-consumption-range');
const taxConsumptionVal = document.getElementById('tax-consumption-val');
const taxIncomeRange = document.getElementById('tax-income-range');
const taxIncomeVal = document.getElementById('tax-income-val');
const taxResidentRange = document.getElementById('tax-resident-range');
const taxResidentVal = document.getElementById('tax-resident-val');

// ボタン・カード・その他設定
const nextTurnBtn = document.getElementById('next-turn-btn');
const resultBadge = document.getElementById('result-badge');
const evaluationText = document.getElementById('evaluation-text');
const historyLog = document.getElementById('history-log');
const restartBtn = document.getElementById('restart-btn');
const policyCards = document.querySelectorAll('.policy-card');
const difficultyRadios = document.querySelectorAll('input[name=\"difficulty\"]');
const difficultyHint = document.getElementById('difficulty-hint');
const optionsBtn = document.getElementById('options-btn');
const optionsPanel = document.getElementById('options-panel');
const optionBgm = document.getElementById('option-bgm');
const optionSfx = document.getElementById('option-sfx');
const optionDifficulty = document.getElementById('option-difficulty');
const optionQuitBtn = document.getElementById('option-quit-btn');
const meterDot = document.getElementById('meter-dot');
const meterLabel = document.getElementById('meter-label');

// --- イベントリスナーの設定 ---

// プレイ期間スライダー（動かした時にクリック音）
maxYearsRange.addEventListener('input', (e) => {
    const years = parseInt(e.target.value);
    gameState.maxTurns = years * 4;
    maxYearsVal.textContent = (years === 5 || years === 6) ? `${years}年 (オススメ)` : `${years}年 (${gameState.maxTurns}ターン)`;
    
    const am = getAudioManager();
    if (am) am.playClick(); // 🔊 クリック音！
});

function updateDifficultySelection(value) {
    const nextDifficulty = value || 'normal';
    gameState.difficulty = nextDifficulty;
    difficultyRadios.forEach(radio => {
        radio.checked = radio.value === nextDifficulty;
    });
    if (optionDifficulty) optionDifficulty.value = nextDifficulty;
    if (typeof difficultyLabels !== 'undefined' && difficultyHint) {
        difficultyHint.textContent = difficultyLabels[nextDifficulty];
    }
}

function setOptionsPanelVisible(visible) {
    if (!optionsPanel) return;
    optionsPanel.classList.toggle('hidden', !visible);
}

// 難易度ラジオボタン（切り替えた時にクリック音）
difficultyRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (!e.target.checked) return;
        updateDifficultySelection(e.target.value);
        
        const am = getAudioManager();
        if (am) am.playClick(); // 🔊 クリック音！
    });
});

if (optionsBtn) {
    optionsBtn.addEventListener('click', () => {
        const am = getAudioManager();
        if (am) am.playClick();
        setOptionsPanelVisible(optionsPanel && optionsPanel.classList.contains('hidden'));
    });
}

if (optionBgm) {
    optionBgm.addEventListener('change', (e) => {
        const am = getAudioManager();
        if (am) {
            am.setBgmEnabled(e.target.checked);
            if (e.target.checked && !mainScreen.classList.contains('hidden')) {
                am.startBGM();
            }
        }
    });
}

if (optionSfx) {
    optionSfx.addEventListener('change', (e) => {
        const am = getAudioManager();
        if (am) am.setSfxEnabled(e.target.checked);
    });
}

if (optionDifficulty) {
    optionDifficulty.addEventListener('change', (e) => {
        updateDifficultySelection(e.target.value);
        const am = getAudioManager();
        if (am) am.playClick();
    });
}

if (optionQuitBtn) {
    optionQuitBtn.addEventListener('click', () => {
        const am = getAudioManager();
        if (am) {
            am.playClick();
            am.stopBGM();
        }
        resetGame();
        setOptionsPanelVisible(false);
    });
}

updateDifficultySelection(gameState.difficulty);

// 開始ボタン（ゲーム開始と同時にBGMをスタート！）
startBtn.addEventListener('click', () => {
    const am = getAudioManager();
    if (am) {
        am.playClick();   // 🔊 開始のクリック音
        am.startBGM();    // 🎵 BGMループ再生開始！
    }
    startGame();
});

// 次の季節へ進行ボタン
nextTurnBtn.addEventListener('click', () => {
    const am = getAudioManager();
    if (am) am.playClick(); // 🔊 クリック音！

    playTurnAnimation().then(() => {
        if (typeof processTurn === 'function') processTurn();
    });
});

// もう一度挑戦ボタン（BGMば一度止めてリセット）
restartBtn.addEventListener('click', () => {
    const am = getAudioManager();
    if (am) {
        am.playClick();
        am.stopBGM(); // 🎵 BGMを一旦止める
    }
    resetGame();
});

// 政策カードのクリックイベント（選択した時にクリック音）
policyCards.forEach(card => {
    card.addEventListener('click', () => {
        if (card.classList.contains('disabled')) return;
        
        const am = getAudioManager();
        if (am) am.playClick(); // 🔊 クリック音！

        policyCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        gameState.selectedPolicy = card.getAttribute('data-policy');
        updateUI();
    });
});

// 税率スライダーのリアルタイム連動（スライダーを動かすたびにプチプチ鳴るばい）
taxConsumptionRange.addEventListener('input', (e) => { 
    gameState.taxConsumption = parseInt(e.target.value); 
    taxConsumptionVal.textContent = `${gameState.taxConsumption}%`; 
    updateUI(); 
    const am = getAudioManager(); if (am) am.playClick(); // 🔊 クリック音！
});
taxIncomeRange.addEventListener('input', (e) => { 
    gameState.taxIncome = parseInt(e.target.value); 
    taxIncomeVal.textContent = `${gameState.taxIncome}%`; 
    updateUI(); 
    const am = getAudioManager(); if (am) am.playClick(); // 🔊 クリック音！
});
taxResidentRange.addEventListener('input', (e) => { 
    gameState.taxResident = parseInt(e.target.value); 
    taxResidentVal.textContent = `${gameState.taxResident}%`; 
    updateUI(); 
    const am = getAudioManager(); if (am) am.playClick(); // 🔊 クリック音！
});

// --- 各種ゲーム制御関数 ---

function startGame() {
    startScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    resultScreen.classList.add('hidden');
    setOptionsPanelVisible(false);
    refreshSpecialPolicyAvailability();
    updateUI();
    generatePredictions();
}

function updateUI() {
    statusGold.textContent = gameState.gold;
    statusTrust.textContent = gameState.trust;
    statusComplaint.textContent = gameState.complaint;
    statusMilitary.textContent = gameState.military; 

    if (typeof computePredictedDeltas === 'function') {
        const deltas = computePredictedDeltas();
        setDeltaDisplay(statusGoldDelta, deltas.gold);
        setDeltaDisplay(statusTrustDelta, deltas.trust);
        setDeltaDisplay(statusComplaintDelta, deltas.complaint);
        setDeltaDisplay(statusMilitaryDelta, deltas.military);
    }

    const year = Math.ceil(gameState.currentTurn / 4);
    const seasons = ['春', '夏', '秋', '冬'];
    turnBadge.textContent = `${year}年目 ${seasons[(gameState.currentTurn - 1) % 4]} / 全${gameState.maxTurns / 4}年`;

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

    const cardRepair = document.getElementById('card-repair');
    if (cardRepair) {
        if (gameState.towerHp >= 100) {
            cardRepair.classList.add('disabled');
            if (gameState.selectedPolicy === 'repair') {
                const cardDefense = document.getElementById('card-defense');
                if (cardDefense) cardDefense.classList.add('active');
                cardRepair.classList.remove('active');
                gameState.selectedPolicy = 'defense';
                setTimeout(updateUI, 0);
            }
        } else {
            cardRepair.classList.remove('disabled');
        }
    }

    updateTurnMeterUI();
}

function setDeltaDisplay(el, value) {
    if (!el) return;
    if (value > 0) {
        el.textContent = `+${value}`;
        el.classList.remove('negative', 'zero'); 
        el.classList.add('positive');
    } else if (value < 0) {
        el.textContent = `${value}`;
        el.classList.remove('positive', 'zero'); 
        el.classList.add('negative');
    } else {
        el.textContent = '±0';
        el.classList.remove('positive', 'negative'); 
        el.classList.add('zero');
    }
}

function updateTurnMeterUI() {
    if (!meterDot || !meterLabel) return;
    const percent = ((gameState.currentTurn - 1) / Math.max(1, gameState.maxTurns - 1)) * 100;
    meterDot.style.transition = 'none';
    meterDot.style.left = `${percent}%`;
    const seasons = ['春', '夏', '秋', '冬'];
    meterLabel.textContent = `${Math.ceil(gameState.currentTurn / 4)}年目 ${seasons[(gameState.currentTurn - 1) % 4]}`;
    requestAnimationFrame(() => { 
        meterDot.style.transition = 'left 900ms cubic-bezier(.22,.9,.35,1)'; 
    });
}

function playTurnAnimation() {
    return new Promise((resolve) => {
        if (!meterDot || gameState.currentTurn >= gameState.maxTurns) return resolve();
        const endPercent = (gameState.currentTurn / Math.max(1, gameState.maxTurns - 1)) * 100;
        
        const seasons = ['春', '夏', '秋', '冬'];
        if (meterLabel) {
            meterLabel.textContent = `${Math.ceil((gameState.currentTurn + 1) / 4)}年目 ${seasons[(gameState.currentTurn) % 4]}`;
        }

        meterDot.style.left = `${endPercent}%`;
        setTimeout(resolve, 900);
    });
}

function refreshSpecialPolicyAvailability() {
    const cardCaravan = document.getElementById('card-caravan');
    const cardTempTax = document.getElementById('card-temptax');

    const chanceCaravan = typeof specialPolicyChance !== 'undefined' ? specialPolicyChance : 0.2;

    if (cardCaravan) cardCaravan.classList.toggle('hidden', Math.random() >= chanceCaravan);
    if (cardTempTax) cardTempTax.classList.toggle('hidden', Math.random() >= (1/7));

    const currentActiveCard = document.querySelector('.policy-card.active');
    if (currentActiveCard && currentActiveCard.classList.contains('hidden')) {
        policyCards.forEach(c => c.classList.remove('active'));
        const cardDefense = document.getElementById('card-defense');
        if (cardDefense) cardDefense.classList.add('active');
        gameState.selectedPolicy = 'defense';
    }
}

function generatePredictions() {
    if (typeof seasonalEvents === 'undefined') return;
    
    const omenObj = seasonalEvents.omens[Math.floor(Math.random() * seasonalEvents.omens.length)];
    omenText.textContent = omenObj.text;
    voiceText.textContent = seasonalEvents.voices[Math.floor(Math.random() * seasonalEvents.voices.length)];
    currentOmenTag = omenObj.tag || 'none';
}

/**
 * ターン処理結果の反映（ここで災害発生音のトリガーを仕掛けるばい！）
 */
window.onTurnProcessed = function(combinedDisasterText, logMessage) {
    disasterText.innerHTML = combinedDisasterText || "今期は平穏に過ぎ去りました。";
    gameState.history.push(logMessage);

    // 平穏じゃなかった（文字列の中に危険な文字が含まれとる）場合は災害音を鳴らす！
    const am = getAudioManager();
    if (combinedDisasterText && am) {
        if (combinedDisasterText.includes('⚠️') || combinedDisasterText.includes('⚔️') || combinedDisasterText.includes('💥')) {
            am.playDisaster(); // 🔊 災害・戦争発生時の不穏な音！
        }
    }

    // ゲームオーバー判定
    if (gameState.gold <= 0) {
        endGame(false, `国庫金が底をつき、財政破綻により他国からの侵攻を許してしまいました。`);
        return;
    }
    if (gameState.towerHp <= 0) {
        endGame(false, "時計塔の崩壊（インフラが完全に破壊され、国家が維持できなくなりました）");
        return;
    }

    gameState.currentTurn++;
    
    // 任期満了（ゲームクリア）判定
    if (gameState.currentTurn > gameState.maxTurns) {
        endGame(true);
    } else {
        refreshSpecialPolicyAvailability();
        updateUI();
        generatePredictions();
    }
};

function getVictoryEnding() {
    if (gameState.towerHp >= 80) {
        return {
            title: '🏆 保護勝利！ 時計塔を守り抜いた',
            message: '🌟 時計塔は揺るがず、国の未来を守り抜きました。民は新たな時代を信じています。'
        };
    }
    if (gameState.gold >= 110) {
        return {
            title: '🏆 財政勝利！ 国庫を豊かにした',
            message: '🌟 国庫は潤い、次の時代に備える余裕が生まれました。'
        };
    }
    if (gameState.trust >= 80) {
        return {
            title: '🏆 信頼勝利！ 民の信頼を勝ち取った',
            message: '🌟 国民の信頼を失わず、名君として語り継がれる統治を成し遂げました。'
        };
    }
    return {
        title: '🏆 通常勝利！ 任期を全うした',
        message: '🌟 さまざまな試練を乗り越え、平穏な任期を終えることができました。'
    };
}

/**
 * ゲーム終了（ここでクリア音 / ゲームオーバー音を鳴らし分けるばい！）
 */
function endGame(isSuccess, reason) {
    mainScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    
    const am = getAudioManager();
    if (am) {
        am.stopBGM(); // 🎵 終了したけん一旦BGMは止めるばい
        if (isSuccess) {
            am.playSuccess(); // 🔊 🏆 ファンファーレを鳴らす！
        } else {
            am.playGameOver(); // 🔊 💀 滅亡の下降和音を鳴らす！
        }
    }
    
    if (isSuccess) {
        const victory = getVictoryEnding();
        resultBadge.textContent = victory.title;
        resultBadge.style.background = "#2e8253";
        evaluationText.innerHTML = `${victory.message}<br>勝因: ${reason || '任期を無事に全うしました。'} `;
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
    
    updateDifficultySelection('normal');

    if (optionBgm) optionBgm.checked = true;
    if (optionSfx) optionSfx.checked = true;
    if (optionDifficulty) optionDifficulty.value = 'normal';
    
    taxConsumptionRange.value = 10;
    taxConsumptionVal.textContent = "10%";
    taxIncomeRange.value = 25;
    taxIncomeVal.textContent = "25%";
    taxResidentRange.value = 10;
    taxResidentVal.textContent = "10%";

    policyCards.forEach(c => c.classList.remove('active', 'disabled'));
    const cardRepair = document.getElementById('card-repair');
    if (cardRepair) cardRepair.classList.add('active');

    resultScreen.classList.add('hidden');
    mainScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
}