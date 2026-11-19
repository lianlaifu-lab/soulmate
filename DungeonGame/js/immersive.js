// v0.3.3 新入口：先启动原主程序，再添加全屏能力；不改战斗和触控模块。
import './main.js';
import { game } from './state.js';
import { setPaused } from './lifecycle.js';
import { resize } from './renderer.js';

const screen = document.getElementById('playScreen');
const fullButton = document.getElementById('fullscreen');
const hint = document.getElementById('screenHint');
const touch = () => window.matchMedia?.('(any-pointer: coarse)').matches ?? false;
const activeFullscreen = () => document.fullscreenElement || document.webkitFullscreenElement;
const request = screen.requestFullscreen || screen.webkitRequestFullscreen;
let requesting = false;

function fitViewport() {
  // 使用实际可视高度；地址栏伸缩后及时重设画布清晰度和鼠标映射尺寸。
  const height = activeFullscreen() ? window.innerHeight : (window.visualViewport?.height || window.innerHeight);
  document.documentElement.style.setProperty('--screen-h', `${height}px`);
  resize();
}

function updateFullscreenButton() {
  fullButton.hidden = !request;
  fullButton.textContent = activeFullscreen() ? '退出全屏' : '进入全屏';
}

export async function enterFullscreen() {
  if (!request || requesting || activeFullscreen()) return;
  requesting = true;
  hint.textContent = '';
  try {
    // 必须从用户点击事件中调用，不能在页面加载时强制进入全屏。
    await request.call(screen);
    if (touch() && window.screen?.orientation?.lock) {
      try { await window.screen.orientation.lock('landscape'); }
      catch { /* 锁定不支持时由用户手动横置，不阻断游戏。 */ }
    }
  } catch {
    hint.textContent = '当前浏览器未允许全屏，请横置手机游玩。';
  } finally {
    requesting = false;
    updateFullscreenButton();
    fitViewport();
  }
}

fullButton.addEventListener('click', async () => {
  if (activeFullscreen()) {
    try {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) await exit.call(document);
    } catch { hint.textContent = '请使用浏览器的退出全屏操作。'; }
  } else await enterFullscreen();
});
// 捕获阶段请求全屏，保留 input.js 已有的开始/继续逻辑。
document.getElementById('resume').addEventListener('click', () => {
  if (touch()) void enterFullscreen();
}, { capture: true });

function fullscreenChanged() {
  updateFullscreenButton();
  fitViewport();
  // 离开系统全屏时保护玩家，避免操作失焦后仍遭到攻击。
  if (!activeFullscreen() && game.state === 'playing') setPaused(true);
}
document.addEventListener('fullscreenchange', fullscreenChanged);
document.addEventListener('webkitfullscreenchange', fullscreenChanged);
window.addEventListener('resize', fitViewport);
window.visualViewport?.addEventListener('resize', fitViewport);
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => resize()).observe(canvasElement());
function canvasElement() { return document.getElementById('game'); }
updateFullscreenButton();
fitViewport();
