// 每帧更新的协调器，保持原版更新顺序。
import { updateCoins } from './coins.js?v=0.5.1';
import { updateWeapons } from "./weapons.js?v=0.5.1";
import { game } from "./state.js?v=0.5.1";
import { updateMovement } from "./player.js?v=0.5.1";
import { shoot, updateBullets } from "./combat.js?v=0.5.1";
import { buildFlow } from "./navigation.js?v=0.5.1";
import { queueWave } from "./waves.js?v=0.5.1";
import { makeEnemy, updateEnemy } from "./enemies.js?v=0.5.1";
import { finish } from "./lifecycle.js?v=0.5.1";
// 战斗协调器：按固定顺序推进玩家、刷怪、AI、伤害与结算。
export function update(dt){
  game.elapsed+=dt;
  updateMovement(dt);
  game.player.invincible=Math.max(0,game.player.invincible-dt);
  updateWeapons(dt, shoot);
  game.navTimer-=dt;
  if(game.navTimer<=0){
    buildFlow();
    game.navTimer=.25;
  }
  if(game.elapsed<60&&game.elapsed>=game.nextWave&&game.enemies.length+game.spawns.length<14){
    queueWave();
    game.nextWave=game.elapsed+8;
  }
  for(const p of game.spawns){
    p.time-=dt;
    if(p.time<=0)game.enemies.push(makeEnemy(p.type,p.x,p.y));
  }
  game.spawns=game.spawns.filter(p=>p.time>0);
  for(const e of game.enemies){
    updateEnemy(e,dt);
    if(game.state!=='playing')break;
  }
  if(game.state==='playing')updateBullets(dt);
  game.enemies=game.enemies.filter(e=>e.hp>0);
  updateCoins(dt);
  game.effects.forEach(f=>{
    f.life-=dt;f.y-=dt*22;
  }
  );
  game.effects=game.effects.filter(f=>f.life>0);
  if(game.state==='playing'&&game.elapsed>=60&&game.enemies.length===0&&game.spawns.length===0)finish(true);
}
