// 敌人实例与状态机，AI 通过战斗模块产生伤害。
import { game } from "./state.js";
import { TYPES } from "./config.js";
import { distance, direction } from "./math.js";
import { clearLine, moveBody } from "./room.js";
import { pursue } from "./navigation.js";
import { shoot, hurtPlayer } from "./combat.js";
// makeEnemy：本模块功能函数。
export function makeEnemy(type,x,y){
  const t=TYPES[type];
  return {
    id:++game.serial,type,x,y,radius:14,...t,maxHp:t.hp,state:'approach',timer:0,cooldown:.6,flash:0,dir:{
      x:0,y:1
    }
  }
  ;
}
// 状态机：接近 → 预警 → 攻击 → 冷却；冲锋方向在预警时锁定。
export function updateEnemy(e,dt){
  if(e.hp<=0)return;
  e.flash=Math.max(0,e.flash-dt);
  e.cooldown=Math.max(0,e.cooldown-dt);
  const dist=distance(e,game.player);
  if(e.state==='windup'){
    e.timer-=dt;
    if(e.timer<=0){
      if(e.type==='ranged'){
        shoot(e,Math.atan2(e.dir.y,e.dir.x),'enemy');
        e.state='cooldown';
        e.timer=1.35;
      }
      else if(e.type==='melee'){
        if(dist<57&&clearLine(e,game.player))hurtPlayer(e.damage);
        e.state='cooldown';
        e.timer=.85;
      }
      else{
        e.state='charge';
        e.timer=.65;
        e.hit=false;
      }
    }
    return;
  }
  if(e.state==='charge'){
    e.timer-=dt;
    const moved=moveBody(e,e.dir.x*440*dt,e.dir.y*440*dt);
    if(!e.hit&&distance(e,game.player)<29){
      hurtPlayer(e.damage);
      e.hit=true;
    }
    if(e.timer<=0||moved<440*dt*.6){
      e.state='cooldown';
      e.timer=1.2;
    }
    return;
  }
  if(e.state==='cooldown'){
    e.timer-=dt;
    if(e.timer<=0){
      e.state='approach';
      e.cooldown=.15;
    }
    return;
  }
  const attackRange=e.type==='melee'?44:e.type==='ranged'?310:290;
  if(dist<attackRange&&e.cooldown<=0&&clearLine(e,game.player,e.type==='charger'?16:3)){
    e.state='windup';
    e.timer=e.type==='melee'?.55:e.type==='ranged'?.85:1.0;
    e.dir=direction(e,game.player);
  }
  else pursue(e,dt);
}
