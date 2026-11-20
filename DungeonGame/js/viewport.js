// 等比铺满屏幕，超出视野的房间由跟随镜头展示。
import { game } from './state.js';
export function camera(width,height){
  const scale=Math.max(width/960,height/600);
  const w=width/scale,h=height/scale;
  return {scale,x:Math.max(0,Math.min(960-w,game.player.x-w/2)),y:Math.max(0,Math.min(600-h,game.player.y-h/2))};
}
export function screenToWorld(x,y,rect){
  const c=camera(rect.width,rect.height);
  return {x:c.x+(x-rect.left)/c.scale,y:c.y+(y-rect.top)/c.scale};
}
