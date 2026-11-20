import { game } from './state.js';
import { clearLine, collides } from './room.js';
export const COIN_CONFIG={min:2,max:6,scatter:42,magnet:110,speed:340,pickup:16};
export function resetCoins(){game.coins=[];game.gold=0;}
export function dropCoins(enemy,random=Math.random){
  game.coins??=[];
  const count=COIN_CONFIG.min+Math.floor(random()*(COIN_CONFIG.max-COIN_CONFIG.min+1));
  for(let i=0;i<count;i++){
    let pos={x:enemy.x,y:enemy.y};
    for(let attempt=0;attempt<12;attempt++){
      const a=random()*Math.PI*2,r=Math.sqrt(random())*COIN_CONFIG.scatter;
      const next={x:enemy.x+Math.cos(a)*r,y:enemy.y+Math.sin(a)*r};
      if(!collides(next.x,next.y,5)&&clearLine(enemy,next,5)){pos=next;break;}
    }
    game.coins.push({...pos,phase:random()*Math.PI*2});
  }
}
export function updateCoins(dt){
  if(game.paused||game.state!=='playing')return;
  game.coins=(game.coins||[]).filter(c=>{
    const dx=game.player.x-c.x,dy=game.player.y-c.y,d=Math.hypot(dx,dy);
    if(d>COIN_CONFIG.magnet||!clearLine(c,game.player,5))return true;
    if(d<=COIN_CONFIG.pickup){game.gold=(game.gold||0)+1;return false;}
    const step=Math.min(d,COIN_CONFIG.speed*dt);
    c.x+=dx/d*step;c.y+=dy/d*step;
    if(d-step<=COIN_CONFIG.pickup){game.gold=(game.gold||0)+1;return false;}
    return true;
  });
}
export function drawCoins(ctx){
  for(const c of game.coins||[]){
    const y=c.y+Math.sin(game.clock*5+c.phase)*2;
    ctx.fillStyle='#12271d88';ctx.beginPath();ctx.ellipse(c.x,c.y+7,7,3,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffce50';ctx.strokeStyle='#b8791c';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(c.x,y,5,7,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff1a0';ctx.fillRect(c.x-1,y-4,2,8);
  }
}
