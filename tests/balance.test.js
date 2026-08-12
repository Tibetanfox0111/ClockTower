const fs = require('fs');
const vm = require('vm');
const path = require('path');

const context = {
  console,
  Math,
  setTimeout,
  clearTimeout,
  requestAnimationFrame: (fn) => fn(),
  document: {
    getElementById: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    body: { classList: { contains: () => false, remove: () => {}, add: () => {} } },
    documentElement: {},
    fullscreenElement: null,
    exitFullscreen: null,
    webkitExitFullscreen: null,
    mozCancelFullScreen: null,
    msExitFullscreen: null,
  },
  window: { addEventListener: () => {} },
  onTurnProcessed: () => {},
  endGame: () => {},
};

const configPath = path.join(__dirname, '..', 'config.js');
const statePath = path.join(__dirname, '..', 'state.js');
const gameLogicPath = path.join(__dirname, '..', 'gameLogic.js');

for (const file of [configPath, statePath, gameLogicPath]) {
  const code = fs.readFileSync(file, 'utf8');
  vm.runInNewContext(code, context);
}

const assert = require('node:assert/strict');

assert.equal(context.computeIncomeTaxTrustChange(25), 0, '25% should be neutral');
assert.equal(context.computeIncomeTaxTrustChange(40), -11, '40% should feel costly but not crushing');
assert.equal(context.computeIncomeTaxTrustChange(15), 7, '15% should give a moderate trust boost');

const challengeTemplates = context.getChallengeTemplates();
assert.ok(Array.isArray(challengeTemplates) && challengeTemplates.length >= 3, 'challenge templates should exist');
const challenge = context.rollChallenge(challengeTemplates);
assert.ok(challenge && challenge.id, 'challenge should be generated');
assert.equal(typeof context.evaluateChallenge, 'function', 'evaluateChallenge should exist');
assert.equal(context.evaluateChallenge({ kind: 'gold', target: 100 }, { gold: 120 }).cleared, true, 'gold challenge should clear above target');
assert.equal(context.evaluateChallenge({ kind: 'trust', target: 80 }, { trust: 60 }).cleared, false, 'trust challenge should fail below target');
assert.equal(typeof context.computeFinalScore, 'function', 'computeFinalScore should exist');
assert.equal(context.computeFinalScore({ gold: 150, trust: 90, complaint: 10, military: 80, towerHp: 90 }).score >= 500, true, 'score should reward strong overall leadership');
assert.equal(context.computeFinalScore({ gold: 500, trust: 100, complaint: 1, military: 100, towerHp: 100 }).score > 999, true, 'score should grow without a hard cap');
assert.equal(context.getScoreGrade(1300).label, '名君', 'grade should be named emperor');

const audioSandbox = {
  console,
  Math,
  setTimeout,
  clearTimeout,
  requestAnimationFrame: (fn) => fn(),
  window: {
    AudioContext: class {
      constructor() {
        this.currentTime = 0;
        this.state = 'running';
        this.destination = {};
      }
      resume() { this.state = 'running'; }
      createGain() {
        return {
          gain: {
            setValueAtTime() {},
            linearRampToValueAtTime() {},
            exponentialRampToValueAtTime() {},
          },
          connect() {},
        };
      }
      createOscillator() {
        return {
          type: 'sine',
          frequency: {
            setValueAtTime() {},
            linearRampToValueAtTime() {},
            exponentialRampToValueAtTime() {},
          },
          connect() {},
          start() {},
          stop() {},
        };
      }
    },
    webkitAudioContext: class {
      constructor() {
        this.currentTime = 0;
        this.state = 'running';
        this.destination = {};
      }
      resume() { this.state = 'running'; }
      createGain() {
        return {
          gain: {
            setValueAtTime() {},
            linearRampToValueAtTime() {},
            exponentialRampToValueAtTime() {},
          },
          connect() {},
        };
      }
      createOscillator() {
        return {
          type: 'sine',
          frequency: {
            setValueAtTime() {},
            linearRampToValueAtTime() {},
            exponentialRampToValueAtTime() {},
          },
          connect() {},
          start() {},
          stop() {},
        };
      }
    }
  }
};
audioSandbox.AudioContext = audioSandbox.window.AudioContext;
audioSandbox.webkitAudioContext = audioSandbox.window.webkitAudioContext;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'audio.js'), 'utf8'), audioSandbox);

assert.ok(audioSandbox.GameAudioManager, 'audio manager should be available');
assert.equal(typeof audioSandbox.GameAudioManager.prototype.startGameOverBGM, 'function', 'game over BGM hook should exist');
assert.equal(typeof audioSandbox.GameAudioManager.prototype.startEndingBGM, 'function', 'ending BGM hook should exist');

console.log('balance tests passed');
