/**
 * 時計塔領 〜まだ見ぬ国の歴史〜 
 * Web Audio API 専用 BGM / 効果音システム（メンデルスゾーン風ロマン派アレンジ版）
 */

class GameAudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.sequenceTimer = null;
        this.bgmEnabled = true;
        this.sfxEnabled = true;
        
        // メンデルスゾーン風の疾走感と流麗さを出すためのテンポ設定 (BPM)
        this.bpm = 108; 
        this.beatDuration = 60 / this.bpm; // 1拍の長さ(秒)
        this.stepDuration = this.beatDuration / 2; // 8分音符の長さ
        this.currentStep = 0;

        // ロマン派音楽に対応する広範な音高定義 (Hz)
        this.notes = {
            'A2': 110.00, 'B2': 123.47, 'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'G#3': 207.65,
            'A3': 220.00, 'B3': 246.94, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'G#4': 415.30,
            'A4': 440.00, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'G#5': 830.61,
            'A5': 880.00, 'B5': 987.77, 'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51
        };

        // --- 🎵 メンデルスゾーン風・ドラマチック旋律データ（32ステップ = 4拍子×4小節×2） ---
        
        // 通常BGM：希望と不安が混じる、壮大な国政の風景
        this.defaultMelodyTrack = [
            'E5', null, 'A5', 'B5', 'C6', null, 'B5', 'A5', 'E5', null, 'C5', 'D5', 'E5', null, null, null,
            'D5', null, 'F5', 'A5', 'D6', null, 'C6', 'B5', 'E5', null, 'G#5', 'B5', 'A5', null, null, null
        ];
        this.defaultHarpsichordTrack = [
            'A3', 'E4', 'A4', 'C5', 'A3', 'E4', 'A4', 'C5', 'A3', 'E4', 'A4', 'C5', 'E3', 'B3', 'E4', 'G#4',
            'D3', 'A3', 'D4', 'F4', 'D3', 'A3', 'D4', 'F4', 'E3', 'B3', 'E4', 'G#4', 'A3', 'E4', 'A4', null
        ];
        this.defaultBassTrack = [
            'A2', null, null, null, 'A2', null, null, null, 'C3', null, null, null, 'E2', null, null, null,
            'D2', null, null, null, 'F2', null, null, null, 'E2', null, null, null, 'A2', null, null, null
        ];

        // エンディング用：明るく落ち着いた大団円の旋律
        this.endingMelodyTrack = [
            'C5', null, 'E5', 'G5', 'A5', null, 'G5', 'E5', 'D5', null, 'F5', 'A5', 'G5', null, null, null,
            'A4', null, 'C5', 'E5', 'G5', null, 'F5', 'E5', 'D5', null, 'G5', 'F5', 'E5', null, null, null
        ];
        this.endingHarpsichordTrack = [
            'C3', 'G3', 'C4', 'E4', 'C3', 'G3', 'C4', 'E4', 'D3', 'A3', 'D4', 'F4', 'E3', 'B3', 'E4', 'G#4',
            'A3', 'E4', 'A4', 'C5', 'F3', 'C4', 'F4', 'A4', 'G3', 'D4', 'G4', 'B4', 'C4', 'G4', 'C5', null
        ];
        this.endingBassTrack = [
            'C2', null, null, null, 'C2', null, null, null, 'G2', null, null, null, 'A2', null, null, null,
            'F2', null, null, null, 'G2', null, null, null, 'C2', null, null, null, 'C2', null, null, null
        ];

        // ゲームオーバー用：重く、暗く、静かに世界の終わりを示す旋律
        this.gameOverMelodyTrack = [
            'A4', null, 'G4', 'F4', 'E4', null, 'D4', 'C4', 'A3', null, 'G3', 'F3', 'E3', null, null, null,
            'D3', null, 'E3', 'G3', 'A3', null, 'G3', 'F3', 'E3', null, 'D3', 'C3', 'A2', null, null, null
        ];
        this.gameOverHarpsichordTrack = [
            'A2', 'E3', 'A3', 'C4', 'G2', 'D3', 'G3', 'B3', 'F2', 'C3', 'F3', 'A3', 'E2', 'B2', 'E3', 'G3',
            'D2', 'A2', 'D3', 'F3', 'C2', 'G2', 'C3', 'E3', 'A2', 'E3', 'A3', 'C4', 'A2', 'E3', 'A3', null
        ];
        this.gameOverBassTrack = [
            'A1', null, null, null, 'G1', null, null, null, 'F1', null, null, null, 'E1', null, null, null,
            'D1', null, null, null, 'C1', null, null, null, 'A1', null, null, null, 'A1', null, null, null
        ];

        this.melodyTrack = this.defaultMelodyTrack.slice();
        this.harpsichordTrack = this.defaultHarpsichordTrack.slice();
        this.bassTrack = this.defaultBassTrack.slice();
    }

    /**
     * オーディオ文脈の初期化
     */
    init() {
        if (this.ctx) return;
        
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime); // 歌の邪魔をしない音量
        this.masterGain.connect(this.ctx.destination);
    }

    // ==========================================
    // 🔊 手作り効果音（SE）プログラム
    // ==========================================

    /**
     * 🖱️ 1. クリック音
     */
    playClick() {
        if (!this.sfxEnabled) return;
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * ⚠️ 2. 災害発生音
     */
    playDisaster() {
        if (!this.sfxEnabled) return;
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const duration = 0.6;
        const freqs = [130, 135, 147]; 
        
        freqs.forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth'; 
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.linearRampToValueAtTime(freq - 20, now + duration);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + duration);
        });
    }

    /**
     * 🏆 3. 統治成功音（華やかなファンファーレ）
     */
    playSuccess() {
        if (!this.sfxEnabled) return;
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const chord = [440.00, 554.37, 659.25, 880.00]; 
        
        chord.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle'; 
            const startTime = now + (index * 0.1);
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0, now);
            gain.gain.setValueAtTime(0.12, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(startTime);
            osc.stop(startTime + 0.6);
        });
    }

    /**
     * 💀 4. 滅亡音（ゲームオーバー）
     */
    playGameOver() {
        if (!this.sfxEnabled) return;
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const duration = 1.2;
        const darkChord = [220.00, 261.63, 311.13, 369.99];

        darkChord.forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth'; 
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + duration);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + duration);
        });
    }

    // ==========================================
    // 🎵 ロマン派シンセ・音色シミュレータ
    // ==========================================

    /**
     * 主旋律トラック：高貴な管楽器、またはオーケストラのストリングス風
     */
    playOrgan(noteName, startTime, duration) {
        const freq = this.notes[noteName];
        if (!freq) return;

        const now = startTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        // 三角波とサイン波を絶妙に混ぜて、オルガンというよりはフルートやストリングスに近いリッチな響きに
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, now);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, now); // 倍音

        // ロマン派特有の、優しく膨らんで滑らかに消える包絡線
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.07, now + 0.05);
        gainNode.gain.setValueAtTime(0.07, now + duration - 0.06);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc1.start(now);
        osc1.stop(now + duration);
        osc2.start(now);
        osc2.stop(now + duration);
    }

    /**
     * 伴奏トラック：ロマン派風ピアノのペダルを踏んだような流麗な減衰音
     */
    playHarpsichord(noteName, startTime, duration) {
        // チェンバロ（harpsichord）のメソッド名ですが、音色はマイルドなピアノ・ハープ風に改良
        const freq = this.notes[noteName];
        if (!freq) return;

        const now = startTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        // 鋭すぎるノコギリ波から、丸みのある三角波ベースに変更して流麗さを演出
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // 弦が滑らかに響きを残すように少し長めのディケイを設定
        gainNode.gain.setValueAtTime(0.06, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration * 1.5);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration * 1.5);
    }

    /**
     * 低音トラック：重厚なチェロ・コントラバス群のピチカートおよび持続音
     */
    playBass(noteName, startTime, duration) {
        let freq = this.notes[noteName];
        if (!freq) return;
        freq = freq / 2; // 1オクターブ下げる

        const now = startTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'sine'; // 濁りのない重低音
        osc.frequency.setValueAtTime(freq, now);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.14, now + 0.03);
        gainNode.gain.setValueAtTime(0.14, now + duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * シーケンサーのループ駆動
     */
    scheduler() {
        while (this.nextStepTime < this.ctx.currentTime + 0.1) {
            const time = this.nextStepTime;
            
            const melodyNote = this.melodyTrack[this.currentStep];
            const harpNote = this.harpsichordTrack[this.currentStep];
            const bassNote = this.bassTrack[this.currentStep];

            if (melodyNote) this.playOrgan(melodyNote, time, this.stepDuration * 1.7);
            if (harpNote) this.playHarpsichord(harpNote, time, this.stepDuration * 1.2);
            if (bassNote) this.playBass(bassNote, time, this.stepDuration * 3.8);

            this.currentStep = (this.currentStep + 1) % 32;
            this.nextStepTime += this.stepDuration;
        }
        
        this.sequenceTimer = setTimeout(() => this.scheduler(), 25);
    }

    /**
     * BGMの再生開始（通常曲）
     */
    startBGM() {
        this.startLoop(this.defaultMelodyTrack, this.defaultHarpsichordTrack, this.defaultBassTrack);
    }

    /**
     * エンディングBGMの再生開始
     */
    startEndingBGM() {
        this.startLoop(this.endingMelodyTrack, this.endingHarpsichordTrack, this.endingBassTrack);
    }

    /**
     * ゲームオーバーBGMの再生開始
     */
    startGameOverBGM() {
        this.startLoop(this.gameOverMelodyTrack, this.gameOverHarpsichordTrack, this.gameOverBassTrack);
    }

    /**
     * 任意のBGMトラックをループ再生
     */
    startLoop(melodyTrack, harpsichordTrack, bassTrack) {
        if (!this.bgmEnabled) return;
        this.init();
        if (this.isPlaying) {
            clearTimeout(this.sequenceTimer);
        }

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        this.melodyTrack = melodyTrack || this.defaultMelodyTrack;
        this.harpsichordTrack = harpsichordTrack || this.defaultHarpsichordTrack;
        this.bassTrack = bassTrack || this.defaultBassTrack;
        this.currentStep = 0;
        this.isPlaying = true;
        this.nextStepTime = this.ctx.currentTime + 0.05;
        this.scheduler();
    }

    /**
     * BGMの停止
     */
    stopBGM() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        clearTimeout(this.sequenceTimer);
        this.sequenceTimer = null;
    }

    setBgmEnabled(enabled) {
        this.bgmEnabled = !!enabled;
        if (!this.bgmEnabled) {
            this.stopBGM();
        }
    }

    setSfxEnabled(enabled) {
        this.sfxEnabled = !!enabled;
    }
}

if (typeof globalThis !== 'undefined') {
    globalThis.GameAudioManager = GameAudioManager;
}
if (typeof window !== 'undefined') {
    window.GameAudioManager = GameAudioManager;
}