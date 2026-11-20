import { screenToWorld } from './viewport.js';
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

export function setupPad(id,type){
  const el=document.getElementById(id),knob=el.querySelector('.knob');
  const stage=document.getElementById('playScreen');
  let active=null,origin={x:0,y:0};
  function release(){
    const previous=active;active=null;game.input[type]={x:0,y:0};
    el.classList.remove('active');knob.style.transform='translate(0px, 0px)';
    releaseCapture(stage,previous);
  }
  function change(e){
    const travel=28;
    let dx=e.clientX-origin.x,dy=e.clientY-origin.y,d=Math.hypot(dx,dy);
    // 超过行程后底座也跟随，回拉时无需跨越很远的原始触点。
    if(d>travel){origin.x=e.clientX-dx/d*travel;origin.y=e.clientY-dy/d*travel;dx=dx/d*travel;dy=dy/d*travel;d=travel;}
    const x=d<4?0:dx/travel,y=d<4?0:dy/travel;
    game.input[type]={x,y};if(type==='aim')game.input.mouse=null;
    el.style.left=`${origin.x-52}px`;el.style.top=`${origin.y-52}px`;
    knob.style.transform=`translate(${x*travel}px, ${y*travel}px)`;
  }
  stage.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='touch'||!playing()||active!==null)return;
    if(e.target?.closest?.('button, .overlay'))return;
    const r=stage.getBoundingClientRect();
    if((e.clientX<r.left+r.width/2)!==(type==='move'))return;
    e.preventDefault();active=e.pointerId;origin={x:e.clientX,y:e.clientY};
    try{stage.setPointerCapture(active);}catch{release();return;}
    el.classList.add('active');change(e);
  },{passive:false});
  stage.addEventListener('pointermove',e=>{
    if(e.pointerId!==active)return;
    e.preventDefault();if(!playing()){release();return;}change(e);
  },{passive:false});
  function end(e){if(e.pointerId===active)release();}
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,end);
  window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
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
    game.input.mouse = screenToWorld(e.clientX,e.clientY,r);
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
  weaponButton.addEventListener('pointerdown', e => {
    e.preventDefault();e.stopPropagation();
    if(e.pointerType!=='mouse'||e.button===0)switchWeapon();
  },{passive:false});
  // 指针已在按下时处理；只接受键盘/辅助技术产生的 click，避免重复切换。
  weaponButton.addEventListener('click', e => {e.preventDefault();e.stopPropagation();if(e.detail===0)switchWeapon();});
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
