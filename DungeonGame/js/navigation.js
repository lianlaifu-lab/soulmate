// 障碍物绕行；仅在网格构建时读取房间碰撞数据。
import { game } from "./state.js";
import { clamp, direction } from "./math.js";
import { collides, clearLine, moveBody } from "./room.js";
const CELL=20,COLS=48,ROWS=30,walkable=[],flow=new Int16Array(COLS*ROWS);
for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)walkable[y*COLS+x]=!collides(x*CELL+10,y*CELL+10,16);
// cellAt：本模块功能函数。
export function cellAt(p){
  return clamp(Math.floor(p.y/CELL),0,ROWS-1)*COLS+clamp(Math.floor(p.x/CELL),0,COLS-1);
}
// neighbors：本模块功能函数。
export function neighbors(i){
  const x=i%COLS,y=Math.floor(i/COLS);
  return [x>0?i-1:-1,x<COLS-1?i+1:-1,y>0?i-COLS:-1,y<ROWS-1?i+COLS:-1].filter(j=>j>=0&&walkable[j]);
}
// 为所有敌人建立共享 BFS 距离场，每 0.25 秒更新一次。
export function buildFlow(){
  flow.fill(-1);
  let start=cellAt(game.player);
  if(!walkable[start]){
    let best=Infinity;
    for(let i=0;i<walkable.length;i++)if(walkable[i]){
      const d=Math.hypot(i%COLS*CELL+10-game.player.x,Math.floor(i/COLS)*CELL+10-game.player.y);
      if(d<best){
        best=d;
        start=i;
      }
    }
  }
  const queue=[start];
  flow[start]=0;
  for(let h=0;h<queue.length;h++){
    const i=queue[h];
    for(const j of neighbors(i))if(flow[j]===-1){
      flow[j]=flow[i]+1;
      queue.push(j);
    }
  }
}
// 直线可达时直接追击，否则沿网格距离场绕开障碍。
export function pursue(e,dt){
  let target=game.player;
  if(!clearLine(e,game.player,16)){
    const current=cellAt(e);
    let best=current;
    for(const n of neighbors(current))if(flow[n]>=0&&(flow[best]<0||flow[n]<flow[best]))best=n;
    target={
      x:best%COLS*CELL+10,y:Math.floor(best/COLS)*CELL+10
    }
    ;
  }
  const d=direction(e,target);
  moveBody(e,d.x*e.speed*dt,d.y*e.speed*dt);
}
