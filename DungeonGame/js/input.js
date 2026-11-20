// v0.3.2：每个控件独立跟踪 pointerId，支持双指同时移动和射击。
import { switchWeapon } from './weapons.js';
import { game, clearInput } from './state.js';
import { canvas } from './dom.js';
import { setPaused, reset } from './lifecycle.js';

let bound = false;
const playing = () => game.state === 'playing' && !game.paused;

function releaseCapture(element, id) {
  // 系统取消触点时可能已经释放捕获；不让这一操作阻断清理流程。
  try {
    if (id !== null && element.hasPointerCapture?.(id)) element.releasePointerCapture(id);
  } catch { /* 触点已不存在，无需进一步操作。 */ }
}

export function setupPad(id, type) {
  const el = document.getElementById(id);
  const knob = el.querySelector('.knob');
  let active = null;

  function release() {
    const previous = active;
    active = null; // 先清除归属，避免 lostpointercapture 再入。
    game.input[type] = { x: 0, y: 0 };
    knob.style.transform = 'translate(0px, 0px)';
    releaseCapture(el, previous);
  }

  function change(e) {
    const r = el.getBoundingClientRect();
    // 行程随控件尺寸调整，横屏缩小时不会出现摇杆脱离底座。
    const travel = Math.max(1, (Math.min(r.width, r.height) - knob.offsetWidth) / 2 - 8);
    let x = (e.clientX - r.left - r.width / 2) / travel;
    let y = (e.clientY - r.top - r.height / 2) / travel;
    const length = Math.hypot(x, y);
    if (length > 1) { x /= length; y /= length; }
    if (length < 0.12) { x = 0; y = 0; }
    game.input[type] = { x, y };
    if (type === 'aim') game.input.mouse = null;
    knob.style.transform = `translate(${x * travel}px, ${y * travel}px)`;
  }

  el.addEventListener('pointerdown', e => {
    if (!playing() || active !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    active = e.pointerId;
    try { el.setPointerCapture(active); }
    catch { release(); return; }
    change(e);
  }, { passive: false });

  // 捕获使手指移出底座后仍然控制原摇杆；不能抢占另一个摇杆。
  el.addEventListener('pointermove', e => {
    if (e.pointerId !== active) return;
    e.preventDefault();
    if (!playing()) { release(); return; }
    change(e);
  }, { passive: false });

  function end(e) { if (e.pointerId === active) release(); }
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(event, end);
  // 兜底：事件即使被派到其他元素，也按触点 ID 释放，不影响另一只手。
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  el.addEventListener('contextmenu', e => e.preventDefault());
  game.padResets.push(release);
}

export function bindInput() {
  if (bound) return;
  bound = true;
  const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);
  let firePointer = null;
  function stopFire() {
    const previous = firePointer;
    firePointer = null;
    game.firing = false;
    releaseCapture(canvas, previous);
  }
  game.padResets.push(stopFire);

  function pointMouse(e) {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    game.input.mouse = { x: (e.clientX - r.left) * 960 / r.width, y: (e.clientY - r.top) * 600 / r.height };
  }
  window.addEventListener('keydown', e => {
    if (movementKeys.has(e.code)) {
      e.preventDefault();
      if (playing()) game.keys.add(e.code);
    }
    if (playing() && !e.repeat) {
      if (e.code === 'KeyQ') { e.preventDefault(); switchWeapon(); }
      const slots={Digit1:'pistol',Digit2:'shotgun',Digit3:'burst'};
      if (slots[e.code]) { e.preventDefault(); switchWeapon(slots[e.code]); }
    }
    if (e.code === 'Escape' && !e.repeat) setPaused(!game.paused);
  });
  window.addEventListener('keyup', e => game.keys.delete(e.code));
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'touch') pointMouse(e);
  });
  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' || e.button !== 0 || !playing() || firePointer !== null) return;
    canvas.focus({ preventScroll: true });
    pointMouse(e);
    firePointer = e.pointerId;
    try { canvas.setPointerCapture(firePointer); }
    catch { stopFire(); return; }
    game.firing = true;
  });
  function endFire(e) { if (e.pointerId === firePointer) stopFire(); }
  window.addEventListener('pointerup', endFire);
  window.addEventListener('pointercancel', endFire);
  canvas.addEventListener('lostpointercapture', endFire);
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  function interrupt() {
    clearInput();
    if (game.state === 'playing') setPaused(true);
  }
  window.addEventListener('blur', interrupt);
  window.addEventListener('pagehide', interrupt);
  document.addEventListener('visibilitychange', () => { if (document.hidden) interrupt(); });
  window.addEventListener('orientationchange', interrupt);
  // 支持没有 orientationchange 的环境；地址栏伸缩不应反复暂停。
  let landscape = window.innerWidth > window.innerHeight;
  window.addEventListener('resize', () => {
    const next = window.innerWidth > window.innerHeight;
    if (next !== landscape) { landscape = next; interrupt(); }
  });

  const weaponButton=document.getElementById('switchWeapon');
  weaponButton.addEventListener('pointerdown', e => e.stopPropagation());
  weaponButton.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); switchWeapon(); });
  document.getElementById('pause').onclick = () => setPaused(!game.paused);
  document.getElementById('resume').onclick = () => {
    if (game.state === 'playing') setPaused(false); else reset();
    // 触屏上不把焦点滚动回画布，防止摇杆跳出可视区域。
    canvas.focus({ preventScroll: true });
  };
  document.getElementById('reset').onclick = reset;
  setupPad('movePad', 'move');
  setupPad('aimPad', 'aim');
}
