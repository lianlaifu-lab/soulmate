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

window.innerHeight=393;
window.innerWidth=852;
window.visualViewport={height:360,addEventListener:listen};
document.documentElement={style:{setProperty(key,value){this[key]=value;}}};
document.getElementById('playScreen').requestFullscreen=async()=>{throw new Error('unsupported in test')};
const {enterFullscreen}=await import('../js/immersive.js?v=0.5.1');
const {game}=await import('../js/state.js?v=0.5.1');

test('完整沉浸入口可加载，并按实际可视高度调整画布容器',()=>{
 assert.equal(document.documentElement.style['--screen-h'],'360px');
 assert.equal(game.state,'ready');
 assert.equal(document.getElementById('overlay').hidden,false);
 assert.equal(typeof listeners.get('keydown'),'function');
 window.visualViewport.height=320;listeners.get('resize')();
 assert.equal(document.documentElement.style['--screen-h'],'320px');
});
test('全屏请求失败时显示提示，游戏不崩溃',async()=>{
 await enterFullscreen();assert.match(document.getElementById('screenHint').textContent,/未允许全屏/);
 assert.equal(game.state,'ready');
});
