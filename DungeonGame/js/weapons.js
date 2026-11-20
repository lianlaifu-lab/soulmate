// v0.4.0：武器数值与简图唯一配置。icon 是 [x,y,width,height] 矩形数组。
import { game } from './state.js';
import { clearLine } from './room.js';
export const WEAPONS = {
  pistol: { name:'手枪', damage:12, speed:560, interval:.28, pellets:1, spread:0, maxLife:1.3, burst:1, burstGap:0, color:'#dbe8bc', icon:[[5,7,24,7],[8,14,8,11],[26,9,7,4]] },
  shotgun: { name:'霰弹枪', damage:5, speed:460, interval:.72, pellets:6, spread:.52, maxLife:.50, burst:1, burstGap:0, color:'#e8b878', icon:[[2,11,9,8],[10,8,26,5],[16,13,11,5],[10,17,5,6]] },
  burst: { name:'连发枪', damage:6, speed:600, interval:.46, pellets:1, spread:0, maxLife:1.15, burst:3, burstGap:.085, color:'#a7c8ef', icon:[[2,10,8,9],[10,8,20,9],[29,9,9,4],[15,17,5,8],[23,17,5,6],[15,4,8,3]] },
};
export function resetWeapons() {
  game.weaponState={owned:['pistol'],current:'pistol',pending:0,burstTimer:0,notice:'靠近地面武器自动拾取',noticeTime:4,
    pickups:[{id:'shotgun',x:370,y:440},{id:'burst',x:590,y:440}]};
  game.player.shot=0;
}
export function weaponState(){if(!game.weaponState)resetWeapons();return game.weaponState;}
export function currentWeapon(){return WEAPONS[weaponState().current];}
export function switchWeapon(id) {
  if(game.state!=='playing'||game.paused)return false;
  const s=weaponState();
  const next=id||s.owned[(s.owned.indexOf(s.current)+1)%s.owned.length];
  if(!s.owned.includes(next))return false;
  if(s.owned.length===1&&!id){s.notice='靠近地面武器解锁切换';s.noticeTime=2;return false;}
  if(next===s.current)return false;
  s.current=next;s.pending=0;s.burstTimer=0;
  // 保留原冷却，避免来回切枪绕过射速限制。
  game.player.shot=Math.max(game.player.shot,.12);
  s.notice=WEAPONS[next].name;s.noticeTime=1.4;return true;
}
function fireVolley(emit) {
  const w=currentWeapon();
  for(let i=0;i<w.pellets;i++){
    const offset=w.pellets===1?0:(i/(w.pellets-1)-.5)*w.spread;
    emit(game.player,game.player.angle+offset,'player',{damage:w.damage,speed:w.speed,maxLife:w.maxLife,piercing:false,color:w.color});
  }
}
export function updateWeapons(dt,emit) {
  if(game.state!=='playing'||game.paused)return;
  const s=weaponState();s.noticeTime=Math.max(0,s.noticeTime-dt);
  s.pickups=s.pickups.filter(p=>{
    if(Math.hypot(p.x-game.player.x,p.y-game.player.y)>32||!clearLine(p,game.player,3))return true;
    if(!s.owned.includes(p.id))s.owned.push(p.id);
    switchWeapon(p.id);s.notice='拾取 '+WEAPONS[p.id].name;s.noticeTime=2.2;return false;
  });
  game.player.shot=Math.max(0,game.player.shot-dt);
  if(s.pending>0){
    s.burstTimer-=dt;
    while(s.pending>0&&s.burstTimer<=0){fireVolley(emit);s.pending--;s.burstTimer+=currentWeapon().burstGap;}
  }
  const held=game.firing||Math.hypot(game.input.aim.x,game.input.aim.y)>.2;
  if(held&&game.player.shot<=0&&s.pending===0){
    const w=currentWeapon();fireVolley(emit);game.player.shot=w.interval;s.pending=w.burst-1;s.burstTimer=w.burstGap;
  }
}
export function weaponSVG(id){const w=WEAPONS[id];return `<svg viewBox="0 0 40 30" aria-hidden="true" focusable="false" fill="${w.color}">${w.icon.map(r=>`<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" rx="1"/>`).join('')}</svg>`;}
export function drawWeapon(ctx,id,x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle=WEAPONS[id].color;for(const r of WEAPONS[id].icon)ctx.fillRect(...r);ctx.restore();}
export function drawPickups(ctx){
  for(const p of weaponState().pickups){ctx.save();ctx.fillStyle='#10251fbf';ctx.beginPath();ctx.ellipse(p.x,p.y+10,26,12,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=WEAPONS[p.id].color;ctx.lineWidth=1.5;ctx.stroke();drawWeapon(ctx,p.id,p.x-20,p.y-16,1);ctx.fillStyle=WEAPONS[p.id].color;ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText(WEAPONS[p.id].name,p.x,p.y-24);ctx.restore();}
}
