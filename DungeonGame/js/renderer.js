import { camera } from './viewport.js';
import { drawCoins } from './coins.js';
import { drawMonster } from './monsters.js';
import { weaponState, drawWeapon, drawPickups } from './weapons.js';
// 画面绘制；不在绘制阶段修改生命值、位置或战斗计时。
import { game } from "./state.js";
import { canvas, ctx } from "./dom.js";
import { walls, obstacles } from "./config.js";
import { clamp } from "./math.js";
import { updateHUD } from "./ui.js";
// rect：本模块功能函数。
export function rect(x,y,w,h,c){
  ctx.fillStyle=c;
  ctx.fillRect(x,y,w,h);
}
// stone：本模块功能函数。
export function stone(r){
  rect(r.x+6,r.y+9,r.w,r.h,'#10191988');
  rect(r.x,r.y,r.w,r.h,'#4d6058');
  rect(r.x,r.y,r.w,7,'#788572');
  rect(r.x,r.y+r.h-12,r.w,12,'#2d413b');
  ctx.strokeStyle='#233b34';
  ctx.lineWidth=2;
  ctx.strokeRect(r.x+1,r.y+1,r.w-2,r.h-2);
  for(let y=r.y+24;y<r.y+r.h-12;y+=24){
    ctx.beginPath();
    ctx.moveTo(r.x,y);
    ctx.lineTo(r.x+r.w,y);
    ctx.stroke();
  }
}
// torch：本模块功能函数。
export function torch(x,y){
  const glow=ctx.createRadialGradient(x,y,0,x,y,86);
  glow.addColorStop(0,'#e9ad4a30');
  glow.addColorStop(1,'#e9ad4a00');
  ctx.fillStyle=glow;
  ctx.fillRect(x-86,y-86,172,172);
  rect(x-4,y+4,8,15,'#58462d');
  rect(x-6,y-7,12,15,'#db8840');
  rect(x-3,y-10-Math.sin(game.clock*8)*2,6,16,'#ffe5a1');
}
// drawRoom：本模块功能函数。
export function drawRoom(){
  ctx.clearRect(0,0,960,600);
  rect(0,0,960,600,'#263932');
  for(let y=40;y<560;y+=40)for(let x=40;x<920;x+=40){
    const n=((x*17+y*31)%101);
    rect(x+1,y+1,38,38,n%3===0?'#2b3f36':'#293b33');
    if(n%7===0)rect(x+9,y+25,9,2,'#33483b');
  }
  // 出生区域的地面标记。
  ctx.strokeStyle='#8ca86722';
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.arc(480,440,44,0,Math.PI*2);
  ctx.stroke();
  for(const r of walls)stone(r);
  rect(436,4,88,32,'#172b25');
  rect(446,8,68,6,'#789262');
  rect(446,17,68,15,'#344d38');
  torch(130,62);
  torch(830,62);
  torch(130,530);
  torch(830,530);
  for(const r of obstacles)stone(r);
  // 地面阴影与角色：碰撞中心位于角色脚边，而非头顶。
  ctx.fillStyle='#09150e77';
  ctx.beginPath();
  ctx.ellipse(game.player.x,game.player.y+8,19,8,0,0,Math.PI*2);
  ctx.fill();
  const bob=game.player.moving?Math.sin(game.player.walk)*1.5:0;
  ctx.save();
  ctx.translate(Math.round(game.player.x),Math.round(game.player.y+bob));
  const step=game.player.moving?Math.sin(game.player.walk)*3:0;
  rect(-10,4+step,8,9,'#162824');
  rect(2,4-step,8,9,'#162824');
  rect(-12,-13,24,20,'#799f74');
  rect(-10,-11,5,16,'#b2c593');
  rect(-12,-30,24,19,'#253b32');
  rect(-9,-28,18,13,'#d6c29a');
  rect(-13,-32,26,9,'#aec488');
  rect(-15,-24,7,8,'#7b9c6b');
  const face=Math.cos(game.player.angle)>=0?3:-7;
  rect(face,-22,4,4,'#26352b');
  ctx.restore();
  ctx.save();
  ctx.translate(game.player.x,game.player.y-3);
  ctx.rotate(game.player.angle);
  drawWeapon(ctx,weaponState().current,3,-12,.85);
  ctx.restore();
  const ax=game.player.x+Math.cos(game.player.angle)*65,ay=game.player.y+Math.sin(game.player.angle)*65;
  ctx.strokeStyle='#c9dd9b99';
  ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.arc(ax,ay,6,0,Math.PI*2);
  ctx.moveTo(ax-10,ay);
  ctx.lineTo(ax-4,ay);
  ctx.moveTo(ax+4,ay);
  ctx.lineTo(ax+10,ay);
  ctx.moveTo(ax,ay-10);
  ctx.lineTo(ax,ay-4);
  ctx.moveTo(ax,ay+4);
  ctx.lineTo(ax,ay+10);
  ctx.stroke();
}
// circle：本模块功能函数。
export function circle(x,y,r,color){
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fill();
}
// draw：本模块功能函数。
export function draw(){
  const c=camera(canvas.clientWidth,canvas.clientHeight);
  const dpr=canvas.width/canvas.clientWidth;
  ctx.setTransform(c.scale*dpr,0,0,c.scale*dpr,-c.x*c.scale*dpr,-c.y*c.scale*dpr);
  drawRoom();
  drawCoins(ctx);
  drawPickups(ctx);
  for(const p of game.spawns){
    ctx.strokeStyle='#edd6a5';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(p.x,p.y,24+Math.sin(game.clock*12)*3,0,Math.PI*2);
    ctx.stroke();
    ctx.font='12px sans-serif';
    ctx.fillStyle='#ead7ad';
    ctx.textAlign='center';
    ctx.fillText('即将出现',p.x,p.y-32);
  }
  for(const e of game.enemies){
    if(e.state==='windup'){
      ctx.save();
      if(e.type==='melee'){
        circle(e.x,e.y,57,'#ef6b6633');
        ctx.strokeStyle='#ff8b7c';
        ctx.beginPath();
        ctx.arc(e.x,e.y,57,0,Math.PI*2);
        ctx.stroke();
      }
      else{
        ctx.strokeStyle=e.type==='charger'?'#ffae5677':'#dd9bff88';
        ctx.lineWidth=e.type==='charger'?28:3;
        ctx.setLineDash(e.type==='charger'?[]:[7,8]);
        ctx.beginPath();
        ctx.moveTo(e.x,e.y);
        ctx.lineTo(e.x+e.dir.x*(e.type==='charger'?286:360),e.y+e.dir.y*(e.type==='charger'?286:360));
        ctx.stroke();
      }
      ctx.restore();
    }
    circle(e.x,e.y+9,17,'#09150e66');
    const c=e.flash>0?'#ffffff':e.color;
    drawMonster(ctx,e,game.clock);
    rect(e.x-17,e.y-46,34,4,'#182620');
    rect(e.x-17,e.y-46,34*e.hp/e.maxHp,4,c);
  }
  for(const b of game.bullets){
    circle(b.x,b.y,b.radius+3,b.faction==='player'?'#e5eaae22':'#e59cec33');
    circle(b.x,b.y,b.radius,b.faction==='player'?(b.color||'#f4ecaf'):'#edabed');
  }
  if(game.player.invincible>0){
    ctx.strokeStyle='#ffa6a0';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(game.player.x,game.player.y,20+Math.sin(game.clock*35)*2,0,Math.PI*2);
    ctx.stroke();
  }
  ctx.textAlign='center';
  ctx.font='bold 16px sans-serif';
  for(const f of game.effects){
    ctx.globalAlpha=clamp(f.life*3,0,1);
    ctx.fillStyle=f.color;
    ctx.fillText(f.text,f.x,f.y);
  }
  ctx.globalAlpha=1;
  updateHUD();
}
// resize：本模块功能函数。
export function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=canvas.clientWidth,h=canvas.clientHeight;
  canvas.width=Math.round(w*dpr);
  canvas.height=Math.round(h*dpr);
  ctx.setTransform(canvas.width/960,0,0,canvas.height/600,0,0);
  ctx.imageSmoothingEnabled=false;
  draw();
}
