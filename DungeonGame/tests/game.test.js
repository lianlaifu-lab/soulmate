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
      hidden: true, style: {}, clientWidth: 960, clientHeight: 600,
      getContext: () => context, addEventListener: listen,
      querySelector: () => ({ style: {} }), focus: noop,
    });
    return elements.get(id);
  },
};
globalThis.window = { devicePixelRatio: 1, addEventListener: listen };
globalThis.requestAnimationFrame = noop;
const { game } = await import('../js/state.js');
const { reset, setPaused } = await import('../js/lifecycle.js');
const { shoot, updateBullets, hurtPlayer } = await import('../js/combat.js');
const { makeEnemy, updateEnemy } = await import('../js/enemies.js');
const { buildFlow, pursue } = await import('../js/navigation.js');
const { collides } = await import('../js/room.js');
const { updateMovement } = await import('../js/player.js');
const { update } = await import('../js/game.js');
const { draw, resize } = await import('../js/renderer.js');
function init() { reset(); game.nextWave = 999; }
function advanceBullets() { for (let i = 0; i < 30; i++) updateBullets(.01); }

test('主入口、全部依赖与绘制可加载', async () => {
  await import('../js/main.js'); resize(); draw();
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
