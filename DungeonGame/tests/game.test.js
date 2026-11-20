// 无需安装 npm 依赖。执行：node --test tests/game.test.js
// 使用最小 DOM 替身验证逻辑；不替代真实浏览器和手机测试。
import test from 'node:test';
import assert from 'node:assert/strict';
const noop = () => {};
const context = new Proxy({ createRadialGradient: () => ({ addColorStop: noop }) }, {
  get: (obj, key) => obj[key] || noop,
  set: (obj, key, value) => { obj[key] = value; return true; },
});
const elements = new Map();
const listeners = new Map();
const listen = (name, handler) => listeners.set(name, handler);
globalThis.document = {
  hidden: false,
  addEventListener: listen,
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, {
      hidden: true, style: {}, classList:{toggle(){},add(){},remove(){}}, setAttribute(key,value){this[key]=value;}, clientWidth: 960, clientHeight: 600,
      getContext: () => context, addEventListener: listen,
      querySelector: () => ({ style: {} }), focus: noop,
    });
    return elements.get(id);
  },
};
globalThis.window = { devicePixelRatio: 1, addEventListener: listen };
globalThis.requestAnimationFrame = noop;
const { game } = await import('../js/state.js?v=0.5.1');
const { reset, setPaused } = await import('../js/lifecycle.js?v=0.5.1');
const { shoot, updateBullets, hurtPlayer } = await import('../js/combat.js?v=0.5.1');
const { makeEnemy, updateEnemy } = await import('../js/enemies.js?v=0.5.1');
const { buildFlow, pursue } = await import('../js/navigation.js?v=0.5.1');
const { collides } = await import('../js/room.js?v=0.5.1');
const { updateMovement } = await import('../js/player.js?v=0.5.1');
const { update } = await import('../js/game.js?v=0.5.1');
const { draw, resize } = await import('../js/renderer.js?v=0.5.1');
function init() { reset(); game.nextWave = 999; }
function advanceBullets() { for (let i = 0; i < 30; i++) updateBullets(.01); }

test('主入口、全部依赖与绘制可加载', async () => {
  await import('../js/main.js?v=0.5.1'); resize(); draw();
  assert.equal(typeof listeners.get('keydown'), 'function');
});
test('斜向与横向移动速度一致，角色不能穿墙', () => {
  init(); game.keys.add('KeyD'); updateMovement(.1);
  const straight = game.player.x - 480;
  init(); game.keys.add('KeyD'); game.keys.add('KeyS'); updateMovement(.1);
  assert.ok(Math.abs(Math.hypot(game.player.x - 480, game.player.y - 440) - straight) < 1e-8);
  init(); game.keys.add('KeyA'); for (let i = 0; i < 300; i++) updateMovement(.02);
  assert.ok(game.player.x >= 53);
});
test('普通弹仅伤害一个目标一次；穿透弹不会重复结算', () => {
  for (const piercing of [false, true]) {
    init(); game.enemies = [makeEnemy('melee', 560, 440), makeEnemy('melee', 610, 440)];
    shoot(game.player, 0, 'player', { piercing }); advanceBullets();
    assert.deepEqual(game.enemies.map(e => e.hp), piercing ? [20, 20] : [20, 30]);
  }
});
test('子弹撞墙消失、寿命到期消失、玩家弹不伤玩家', () => {
  init(); shoot({ x: 400, y: 310 }, 0, 'player'); advanceBullets(); assert.equal(game.bullets.length, 0);
  shoot(game.player, 0, 'player', { maxLife: .01 }); updateBullets(.02); assert.equal(game.bullets.length, 0);
  shoot(game.player, 0, 'player'); updateBullets(.01); assert.equal(game.player.hp, 100);
});
test('敌人弹伤害玩家、短暂无敌、死亡与完整重开', () => {
  init(); shoot({ x: 430, y: 440 }, 0, 'enemy'); advanceBullets(); assert.equal(game.player.hp, 90);
  hurtPlayer(20); assert.equal(game.player.hp, 90);
  game.player.invincible = 0; hurtPlayer(100); assert.equal(game.state, 'dead');
  reset(); assert.equal(game.player.hp, 100); assert.equal(game.state, 'playing');
  assert.equal(game.bullets.length + game.enemies.length + game.spawns.length, 0);
});
test('射手先预警，随后按锁定方向射击', () => {
  init(); game.player.x = 480; game.player.y = 110;
  const e = makeEnemy('ranged', 480, 190); e.cooldown = 0;
  updateEnemy(e, .01); assert.equal(e.state, 'windup'); const locked = { ...e.dir };
  game.player.x = 650; updateEnemy(e, 1);
  assert.equal(e.state, 'cooldown'); assert.equal(game.bullets.length, 1);
  assert.ok(Math.abs(game.bullets[0].dx - locked.x) < 1e-8);
});
test('近战预警后扣血；冲锋进入攻击与冷却', () => {
  init(); const m = makeEnemy('melee', 450, 440); m.cooldown = 0;
  updateEnemy(m, .01); assert.equal(m.state, 'windup'); updateEnemy(m, .6); assert.equal(game.player.hp, 88);
  const c = makeEnemy('charger', 700, 440); c.cooldown = 0;
  updateEnemy(c, .01); updateEnemy(c, 1.1); assert.equal(c.state, 'charge');
  for (let i = 0; i < 40; i++) updateEnemy(c, .02);
  assert.equal(c.state, 'cooldown');
});
test('敌人绕过石柱到达玩家附近', () => {
  init(); game.player.x = 350; game.player.y = 230;
  const e = makeEnemy('melee', 180, 230);
  for (let i = 0; i < 600; i++) { if (i % 15 === 0) buildFlow(); pursue(e, 1 / 60); }
  assert.ok(Math.hypot(e.x - game.player.x, e.y - game.player.y) < 25);
  assert.equal(collides(e.x, e.y, 14), false);
});
test('暂停清空输入；60 秒后清场获胜', () => {
  init(); game.keys.add('KeyW'); game.firing = true; setPaused(true);
  assert.equal(game.keys.size, 0); assert.equal(game.firing, false);
  init(); game.elapsed = 60; update(.01); assert.equal(game.state, 'won');
});

const { WEAPONS, weaponState, switchWeapon, updateWeapons } = await import('../js/weapons.js?v=0.5.1');
const { updateHUD } = await import('../js/ui.js?v=0.5.1');
test('开局手枪与两处拾取，重复触碰不会重复入包', () => {
  init(); assert.deepEqual(weaponState().owned, ['pistol']);
  game.player.x=370;game.player.y=440;updateWeapons(.02,shoot);
  assert.equal(weaponState().current,'shotgun');assert.equal(weaponState().pickups.length,1);
  updateWeapons(.02,shoot);assert.equal(weaponState().owned.length,2);
  game.player.x=590;updateWeapons(.02,shoot);assert.equal(weaponState().current,'burst');
  assert.deepEqual(weaponState().owned,['pistol','shotgun','burst']);
});
test('三种武器分别产生一发、六颗散弹和三次定时连射', () => {
  for (const [id,count] of [['pistol',1],['shotgun',6],['burst',3]]) {
    init();weaponState().owned=['pistol','shotgun','burst'];weaponState().current=id;
    game.firing=true;updateWeapons(.01,shoot);
    assert.equal(game.bullets.length,id==='shotgun'?6:1);
    game.firing=false;updateWeapons(.085,shoot);updateWeapons(.085,shoot);
    assert.equal(game.bullets.length,count);
    assert.ok(game.bullets.every(b=>b.damage===WEAPONS[id].damage&&b.faction==='player'));
    if(id==='shotgun')assert.equal(new Set(game.bullets.map(b=>b.dx+','+b.dy)).size,6);
  }
});
test('短射程散弹与较远射程手枪、连发枪', () => {
  assert.ok(WEAPONS.shotgun.speed*WEAPONS.shotgun.maxLife<WEAPONS.pistol.speed*WEAPONS.pistol.maxLife);
  assert.ok(WEAPONS.shotgun.speed*WEAPONS.shotgun.maxLife<WEAPONS.burst.speed*WEAPONS.burst.maxLife);
});
test('切枪只循环已拾取武器；锁定武器不可装备；暂停不可切换', () => {
  init();assert.equal(switchWeapon('burst'),false);
  weaponState().owned.push('shotgun');switchWeapon();assert.equal(weaponState().current,'shotgun');
  switchWeapon();assert.equal(weaponState().current,'pistol');
  setPaused(true);assert.equal(switchWeapon(),false);assert.equal(weaponState().current,'pistol');
});
test('切枪不重置冷却，并取消未完成的连射', () => {
  init();weaponState().owned=['pistol','burst'];weaponState().current='burst';game.firing=true;
  updateWeapons(.01,shoot);const cooldown=game.player.shot;switchWeapon('pistol');
  assert.ok(game.player.shot>=cooldown);assert.equal(weaponState().pending,0);
  game.firing=false;updateWeapons(.2,shoot);assert.equal(game.bullets.length,1);
});
test('重开恢复手枪、拾取点和血条；低血量动态显示', () => {
  init();weaponState().owned.push('burst');weaponState().current='burst';game.player.hp=25;updateHUD();
  assert.equal(document.getElementById('healthFill').style.width,'25%');
  assert.equal(document.getElementById('healthPanel')['aria-valuenow'],'25');
  assert.equal(document.getElementById('weaponName').textContent,'连发枪');
  reset();updateHUD();assert.equal(document.getElementById('healthFill').style.width,'100%');
  assert.equal(document.getElementById('weaponName').textContent,'手枪');assert.equal(weaponState().pickups.length,2);
});

const {dropCoins,updateCoins,COIN_CONFIG}=await import('../js/coins.js?v=0.5.1');
const {hurtEnemy}=await import('../js/combat.js?v=0.5.1');
const {camera,screenToWorld}=await import('../js/viewport.js?v=0.5.1');
test('金币数量上下界、范围、不可落进墙体；死亡仅掉落一次',()=>{
 init();dropCoins({x:480,y:440},()=>0);assert.equal(game.coins.length,2);
 init();dropCoins({x:480,y:440},()=>.999999);assert.equal(game.coins.length,6);
 for(const c of game.coins){assert.ok(Math.hypot(c.x-480,c.y-440)<=COIN_CONFIG.scatter);assert.equal(collides(c.x,c.y,5),false);}
 init();const e=makeEnemy('melee',480,440);hurtEnemy(e,1000);const count=game.coins.length;hurtEnemy(e,1000);assert.equal(game.coins.length,count);
});
test('吸附拾取只计数一次，暂停停止，重开清零',()=>{
 init();game.coins=[{x:530,y:440,phase:0}];game.paused=true;updateCoins(1);assert.equal(game.coins[0].x,530);
 game.paused=false;updateCoins(1);assert.equal(game.gold,1);assert.equal(game.coins.length,0);updateCoins(1);assert.equal(game.gold,1);
 reset();assert.equal(game.gold,0);assert.equal(game.coins.length,0);
});
test('金币不会隔墙吸附',()=>{
 init();game.player.x=210;game.player.y=220;game.coins=[{x:320,y:220,phase:0}];updateCoins(1);assert.equal(game.gold,0);assert.equal(game.coins[0].x,320);
});
test('宽屏、竖屏、电脑视口均等比覆盖，鼠标坐标逆变换正确',()=>{
 init();for(const [width,height] of [[852,393],[393,852],[1920,1080],[960,600]]){
 const c=camera(width,height);assert.ok(960*c.scale>=width);assert.ok(600*c.scale>=height);
 assert.ok(c.x>=0&&c.y>=0);assert.ok(c.x+width/c.scale<=960.0001);assert.ok(c.y+height/c.scale<=600.0001);
 const point=screenToWorld((480-c.x)*c.scale,(440-c.y)*c.scale,{left:0,top:0,width,height});assert.ok(Math.abs(point.x-480)<1e-8);assert.ok(Math.abs(point.y-440)<1e-8);
 }
});

test('击杀掉落金币→附近全部吸附→金币 HUD 增加→重开清零',()=>{
 init();const enemy=makeEnemy('melee',510,440);game.enemies=[enemy];
 hurtEnemy(enemy,enemy.hp);const count=game.coins.length;
 assert.ok(count>=2&&count<=6);updateCoins(.3);updateHUD();
 assert.equal(game.coins.length,0);assert.equal(game.gold,count);
 assert.equal(document.getElementById('coinCount').textContent,String(count));
 reset();updateHUD();assert.equal(document.getElementById('coinCount').textContent,'0');
});

test('靠墙击杀多次随机掉落均保持散落范围与可拾取路径',()=>{
 let seed=123;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 for(const origin of [{x:54,y:54},{x:209,y:210},{x:480,y:359},{x:905,y:545}]){
  for(let i=0;i<25;i++){
   init();dropCoins(origin,random);assert.ok(game.coins.length>=2&&game.coins.length<=6);
   for(const c of game.coins){assert.ok(Math.hypot(c.x-origin.x,c.y-origin.y)<=42.00001);assert.equal(collides(c.x,c.y,5),false);}
  }
 }
});
