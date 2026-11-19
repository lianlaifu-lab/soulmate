// 弹丸生成、敌我伤害及命中去重。
import { game } from "./state.js";
import { CONFIG } from "./config.js";
import { distance } from "./math.js";
import { collides } from "./room.js";
import { finish } from "./lifecycle.js";
// 创建弹丸；options 可覆盖速度、伤害、寿命及穿透设置。
export function shoot(owner,angle,faction,options={
}
){
  const bullet={
    x:owner.x,y:owner.y,dx:Math.cos(angle),dy:Math.sin(angle),speed:faction==='player'?540:230,damage:faction==='player'?10:10,faction,maxLife:2.4,life:0,piercing:false,radius:4,hitIds:new Set(),dead:false,...options
  }
  ;
  game.bullets.push(bullet);
}
// hurtEnemy：本模块功能函数。
export function hurtEnemy(e,damage){
  if(e.hp<=0)return;
  e.hp=Math.max(0,e.hp-damage);
  e.flash=.1;
  game.effects.push({
    x:e.x,y:e.y-25,text:String(damage),life:.5,color:'#e6f3b7'
  }
  );
  if(e.hp===0){
    e.state='dead';
    game.kills++;
    game.effects.push({
      x:e.x,y:e.y,text:'✦',life:.45,color:e.color
    }
    );
  }
}
// hurtPlayer：本模块功能函数。
export function hurtPlayer(damage){
  if(game.player.invincible>0||game.state!=='playing')return;
  game.player.hp=Math.max(0,game.player.hp-damage);
  game.player.invincible=.75;
  game.effects.push({
    x:game.player.x,y:game.player.y-35,text:'−'+damage,life:.6,color:'#ff8d83'
  }
  );
  if(game.player.hp===0)finish(false);
}
// 小步推进子弹，检查墙壁、阵营与命中去重。
export function updateBullets(dt){
  for(const b of game.bullets){
    b.life+=dt;
    if(b.life>=b.maxLife){
      b.dead=true;
      continue;
    }
    const n=Math.max(1,Math.ceil(b.speed*dt/3));
    for(let i=0;i<n&&!b.dead;i++){
      b.x+=b.dx*b.speed*dt/n;
      b.y+=b.dy*b.speed*dt/n;
      if(collides(b.x,b.y,b.radius)){
        b.dead=true;
        break;
      }
      const targets=b.faction==='player'?game.enemies:[game.player];
      for(const target of targets){
        const id=b.faction==='player'?target.id:'player';
        if(target.hp<=0||b.hitIds.has(id))continue;
        if(distance(b,target)<b.radius+(target.radius||CONFIG.radius)){
          b.hitIds.add(id);
          if(b.faction==='player')hurtEnemy(target,b.damage);
          else hurtPlayer(b.damage);
          if(!b.piercing){
            b.dead=true;
            break;
          }
        }
      }
    }
  }
  game.bullets=game.bullets.filter(b=>!b.dead);
}
