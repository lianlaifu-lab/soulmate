// 输入事件模拟：验证触点归属和中断处理，不代表真实 Safari/Android 验收。
import test from 'node:test';
import assert from 'node:assert/strict';
class Surface {
  constructor(rect = { left: 0, top: 0, width: 112, height: 112 }) {
    this.listeners = new Map(); this.captures = new Set(); this.rect = rect;
    this.classList={add(){},remove(){}}; this.style = {}; this.offsetWidth = 40; this.knob = { offsetWidth: 40, style: {} };
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
const stage=els.get('playScreen'),button=els.get('switchWeapon');
stage.rect={left:0,top:0,width:900,height:400};
function start(){reset();game.nextWave=999;}
function down(id,x,y=200){stage.emit('pointerdown',{pointerId:id,clientX:x,clientY:y});}
function move(id,x,y=200){stage.emit('pointermove',{pointerId:id,clientX:x,clientY:y});}
function up(id){stage.emit('pointerup',{pointerId:id});}
test('任意位置起手，双指同时移动射击，释放互不干扰',()=>{
 start();down(1,120);down(2,700);assert.equal(game.input.move.x,0);
 move(1,160);move(2,740);update(.02);assert.ok(game.player.x>480);assert.equal(game.bullets.length,1);
 up(1);assert.equal(game.input.move.x,0);assert.equal(game.input.aim.x,1);up(2);assert.equal(game.input.aim.x,0);
});
test('越过中线仍保持归属，第三指不抢占；浮动底座跟随',()=>{
 start();down(1,120);move(1,600);assert.equal(game.input.move.x,1);
 down(3,100);up(3);assert.equal(game.input.move.x,1);
 assert.equal(els.get('movePad').style.left,'520px');
 move(1,560);assert.ok(game.input.move.x<0);up(1);
});
test('移动+瞄准时第三指切枪立即生效，无重复切换',()=>{
 start();game.weaponState.owned=['pistol','shotgun','burst'];down(1,120);move(1,160);down(2,700);move(2,740);
 button.emit('pointerdown',{pointerId:3});assert.equal(game.weaponState.current,'shotgun');
 button.emit('click',{pointerId:3,detail:1});assert.equal(game.weaponState.current,'shotgun');
 assert.equal(game.input.move.x,1);assert.equal(game.input.aim.x,1);assert.equal(stage.captures.size,2);
 button.emit('click',{detail:0});assert.equal(game.weaponState.current,'burst');
});
test('按钮区域不会启动摇杆；暂停释放所有捕获',()=>{
 start();stage.emit('pointerdown',{clientX:100,target:{closest:()=>true}});assert.equal(stage.captures.size,0);
 down(1,120);move(1,160);setPaused(true);assert.equal(stage.captures.size,0);assert.equal(game.input.move.x,0);
 setPaused(false);move(1,200);assert.equal(game.input.move.x,0);
});
test('取消、失去捕获、后台中断不会留下卡住的输入',()=>{
 for(const event of ['pointercancel','lostpointercapture']){start();down(1,120);move(1,160);stage.emit(event,{pointerId:1});assert.equal(game.input.move.x,0);}
 start();down(1,120);move(1,160);window.emit('blur');assert.equal(game.paused,true);assert.equal(game.input.move.x,0);
});
