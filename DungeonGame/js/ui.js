// v0.4.0：动态血条与武器按钮。只有武器变化时才更新 SVG。
import { game } from './state.js';
import { weaponState, currentWeapon, weaponSVG } from './weapons.js';
let renderedWeapon='';
export function showOverlay(title,text,button){
  const ready=game.state==='ready';
  document.getElementById('overlayTitle').textContent=ready?'微光地牢':title;
  document.getElementById('overlayText').textContent=ready?'靠近地面武器拾取 · Q 或右下角按钮切换':text;
  document.getElementById('resume').textContent=ready?'开始游戏':button;
  document.getElementById('reset').hidden=game.state!=='playing';
  document.getElementById('overlay').hidden=false;
}
export function updateHUD(){
  document.getElementById('stats').textContent=game.elapsed<60?`${Math.ceil(60-game.elapsed)}s · 击败 ${game.kills}`:`清场 ${game.enemies.length+game.spawns.length}`;
  const max=game.player.maxHp||100,hp=Math.max(0,Math.min(max,game.player.hp)),ratio=hp/max;
  const panel=document.getElementById('healthPanel');
  panel.setAttribute('aria-valuemax',String(max));panel.setAttribute('aria-valuenow',String(hp));
  document.getElementById('healthFill').style.width=`${ratio*100}%`;
  document.getElementById('healthFill').style.background=ratio<=.3?'#fa626b':ratio<=.6?'#efbb67':'#8ed69a';
  document.getElementById('healthValue').textContent=`${hp}/${max}`;
  panel.classList.toggle('low',ratio<=.3);
  const s=weaponState(),w=currentWeapon(),button=document.getElementById('switchWeapon');
  if(renderedWeapon!==s.current){document.getElementById('weaponIcon').innerHTML=weaponSVG(s.current);renderedWeapon=s.current;}
  document.getElementById('weaponName').textContent=w.name;
  document.getElementById('weaponCount').textContent=`${s.owned.indexOf(s.current)+1}/${s.owned.length} ↻`;
  button.setAttribute('aria-label',`当前${w.name}，点击切换已拾取武器`);
  button.disabled=game.state!=='playing'||game.paused;
  const notice=document.getElementById('weaponNotice');notice.textContent=s.noticeTime>0?s.notice:'';notice.hidden=s.noticeTime<=0||game.state!=='playing'||game.paused;
}
