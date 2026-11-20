// 输入事件模拟：验证触点归属和中断处理，不代表真实 Safari/Android 验收。
import test from 'node:test';
import assert from 'node:assert/strict';
class Surface {
  constructor(rect = { left: 0, top: 0, width: 112, height: 112 }) {
    this.listeners = new Map(); this.captures = new Set(); this.rect = rect;
    this.style = {}; this.offsetWidth = 40; this.knob = { offsetWidth: 40, style: {} };
  }
  addEventListener(type, fn) { const list = this.listeners.get(type) || []; list.push(fn); this.listeners.set(type, list); }
  emit(type, props = {}) { const e = { pointerType: 'touch', pointerId: 1, button: 0, clientX: 56, clientY: 56, preventDefault() {}, stopPropagation() {}, ...props }; for (const fn of this.listeners.get(type) || []) fn(e); }
  getBoundingClientRect() { return this.rect; }
  querySelector() { return this.knob; }
  setPointerCapture(id) { this.captures.add(id); }
  hasPointerCapture(id) { return this.captures.has(id); }
  releasePointerCapture(id) { this.captures.delete(id); this.emit('lostpointercapture', { pointerId: id }); }
  focus(options) { this.focusOptions = options; }
  getContext() { return {}; }
}
const windowSurface = new Surface(); windowSurface.innerWidth = 390; windowSurface.innerHeight = 844;
globalThis.window = windowSurface;
const els = new Map(); const doc = new Surface(); doc.hidden = false;
doc.getElementById = id => { if (!els.has(id)) els.set(id, new Surface()); return els.get(id); };
globalThis.document = doc;
const { game, clearInput } = await import('../js/state.js');
const { bindInput } = await import('../js/input.js');
const { reset, setPaused } = await import('../js/lifecycle.js');
const { update } = await import('../js/game.js');
bindInput();
const left = els.get('movePad'), right = els.get('aimPad'), canvas = els.get('game');
function start() { reset(); game.nextWave = 999; }
function press(pad, id, x = 84, y = 56) { pad.emit('pointerdown', { pointerId: id, clientX: x, clientY: y }); }
function release(pad, id) { pad.emit('pointerup', { pointerId: id }); window.emit('pointerup', { pointerId: id }); }

test('双指同时移动、瞄准与开火，放开左手不影响右手', () => {
  start(); press(left, 1); press(right, 2); update(.02);
  assert.ok(game.player.x > 480); assert.equal(game.bullets.length, 1);
  release(left, 1); assert.equal(game.input.move.x, 0); assert.equal(game.input.aim.x, 1);
  release(right, 2); assert.equal(game.input.aim.x, 0);
});
test('放开右手立即停止续射，左手可以继续移动', () => {
  start(); press(left, 3); press(right, 4); update(.02); release(right, 4);
  const count = game.bullets.length, x = game.player.x; update(.2);
  assert.equal(game.bullets.length, count); assert.ok(game.player.x > x);
});
test('第三指无法抢占摇杆，移动触点越界仍保持归属和单位长度', () => {
  start(); press(left, 5); press(left, 6, 28);
  assert.equal(game.input.move.x, 1);
  left.emit('pointermove', { pointerId: 5, clientX: 800, clientY: -300 });
  assert.ok(Math.abs(Math.hypot(game.input.move.x, game.input.move.y) - 1) < 1e-8);
  release(left, 6); assert.ok(game.input.move.x > 0); release(left, 5); assert.equal(game.input.move.x, 0);
});
test('pointercancel、捕获丢失和全局松手均会释放正确摇杆', () => {
  for (const event of ['pointercancel', 'lostpointercapture', 'global-up']) {
    start(); press(left, 7); press(right, 8);
    if (event === 'global-up') window.emit('pointerup', { pointerId: 7 }); else left.emit(event, { pointerId: 7 });
    assert.equal(game.input.move.x, 0); assert.equal(game.input.aim.x, 1);
  }
});
test('暂停清空输入并释放捕获，原手指后续移动不会偷偷恢复操作', () => {
  start(); press(left, 9); press(right, 10); setPaused(true);
  assert.equal(left.captures.size + right.captures.size, 0);
  setPaused(false); left.emit('pointermove', { pointerId: 9, clientX: 84 });
  assert.equal(game.input.move.x, 0); assert.equal(game.input.aim.x, 0);
  press(left, 11); assert.equal(game.input.move.x, 1);
});
test('旋转屏幕、切到后台和失焦都暂停；地址栏高度变化不暂停', () => {
  for (const event of ['orientationchange', 'blur', 'pagehide']) {
    start(); press(left, 12); window.emit(event); assert.equal(game.paused, true); assert.equal(game.input.move.x, 0);
  }
  start(); doc.hidden = true; doc.emit('visibilitychange'); assert.equal(game.paused, true); doc.hidden = false;
  start(); window.innerHeight = 780; window.emit('resize'); assert.equal(game.paused, false);
  window.innerWidth = 844; window.innerHeight = 390; window.emit('resize'); assert.equal(game.paused, true);
});
test('横屏小摇杆使用实际尺寸计算行程，中心死区不误触开火', () => {
  start(); right.rect.width = 88; right.rect.height = 88;
  press(right, 13, 44, 44); assert.deepEqual(game.input.aim, { x: 0, y: 0 });
  right.emit('pointermove', { pointerId: 13, clientX: 60, clientY: 44 });
  assert.equal(game.input.aim.x, 1); assert.equal(right.knob.style.transform, 'translate(16px, 0px)');
  release(right, 13); right.rect.width = right.rect.height = 112;
});
test('触摸画布不触发鼠标开火，触点松开不干扰鼠标按住射击', () => {
  start(); canvas.emit('pointerdown', { pointerId: 14 }); assert.equal(game.firing, false);
  canvas.emit('pointerdown', { pointerId: 15, pointerType: 'mouse' }); assert.equal(game.firing, true);
  window.emit('pointerup', { pointerId: 14 }); assert.equal(game.firing, true);
  window.emit('pointerup', { pointerId: 15, pointerType: 'mouse' }); assert.equal(game.firing, false);
});
test('捕获失败安全恢复；重复绑定不重复注册；重开不会滚动画面', () => {
  start(); const old = left.setPointerCapture; left.setPointerCapture = () => { throw Error('cancelled'); };
  press(left, 16); assert.equal(game.input.move.x, 0); left.setPointerCapture = old;
  const count = left.listeners.get('pointerdown').length; bindInput(); assert.equal(left.listeners.get('pointerdown').length, count);
  reset(); assert.deepEqual(canvas.focusOptions, { preventScroll: true }); clearInput();
});
test('持续一分钟双摇杆输入可完成计时，松手与重开都无残留', () => {
  start(); press(left, 17); press(right, 18);
  for (let i = 0; i < 3602; i++) { if (game.state !== 'playing') break; update(1 / 60); }
  assert.equal(game.state, 'won'); assert.equal(game.input.move.x, 0); assert.equal(game.input.aim.x, 0);
  assert.equal(left.captures.size + right.captures.size, 0);
  reset(); assert.equal(game.player.hp, 100); assert.equal(game.elapsed, 0);
});

test('右手按住瞄准时点击切枪，不影响左右摇杆归属', () => {
  start();game.weaponState.owned.push('shotgun');press(left,21);press(right,22);
  els.get('switchWeapon').emit('pointerdown',{pointerId:23});els.get('switchWeapon').emit('click',{pointerId:23});
  assert.equal(game.weaponState.current,'shotgun');assert.equal(game.input.move.x,1);assert.equal(game.input.aim.x,1);
  release(right,22);assert.equal(game.input.move.x,1);release(left,21);
});
