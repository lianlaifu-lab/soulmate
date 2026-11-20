// 刷怪计划；只负责排队，实际创建敌人在 game.js。
import { game } from "./state.js?v=0.5.1";
import { spawnPoints } from "./config.js?v=0.5.1";
import { distance } from "./math.js?v=0.5.1";
// queueWave：本模块功能函数。
export function queueWave(){
  game.wave++;
  const available=spawnPoints.filter(p=>distance(p,game.player)>220).sort(()=>Math.random()-.5);
  const types=game.wave===1?['melee','ranged','charger']:['melee','ranged','charger',...(game.wave>=4?['melee']:[])];
  types.forEach((type,i)=>{
    const p=available[i%available.length];game.spawns.push({
      x:p.x,y:p.y,type,time:1.5
    }
    );
  }
  );
}
