// 玩家移动与瞄准。
import { game } from "./state.js?v=0.5.1";
import { CONFIG } from "./config.js?v=0.5.1";
import { collides } from "./room.js?v=0.5.1";
// movePlayer：本模块功能函数。
export function movePlayer(dx,dy){
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/3));
  for(let i=0;i<steps;i++){
    if(!collides(game.player.x+dx/steps,game.player.y))game.player.x+=dx/steps;
    if(!collides(game.player.x,game.player.y+dy/steps))game.player.y+=dy/steps;
  }
}
// updateMovement：本模块功能函数。
export function updateMovement(dt){
  let x=Number(game.keys.has('KeyD')||game.keys.has('ArrowRight'))-Number(game.keys.has('KeyA')||game.keys.has('ArrowLeft'))+game.input.move.x;
  let y=Number(game.keys.has('KeyS')||game.keys.has('ArrowDown'))-Number(game.keys.has('KeyW')||game.keys.has('ArrowUp'))+game.input.move.y;
  const length=Math.hypot(x,y);
  if(length>1){
    x/=length;
    y/=length;
  }
  game.player.moving=length>0.05;
  movePlayer(x*CONFIG.speed*dt,y*CONFIG.speed*dt);
  if(game.player.moving)game.player.walk+=dt*12;
  if(Math.hypot(game.input.aim.x,game.input.aim.y)>0.12)game.player.angle=Math.atan2(game.input.aim.y,game.input.aim.x);
  else if(game.input.mouse)game.player.angle=Math.atan2(game.input.mouse.y-game.player.y,game.input.mouse.x-game.player.x);
}
