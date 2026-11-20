// 碰撞、视线检测与移动约束；房间布局在 config.js。
import { CONFIG, solids } from "./config.js?v=0.5.1";
import { clamp, distance } from "./math.js?v=0.5.1";
// collides：本模块功能函数。
export function collides(x,y,radius=CONFIG.radius){
  return solids.some(r=>{
    const dx=x-clamp(x,r.x,r.x+r.w),dy=y-clamp(y,r.y,r.y+r.h);return dx*dx+dy*dy<radius*radius;
  }
  );
}
// moveBody：本模块功能函数。
export function moveBody(body,dx,dy){
  const before={
    x:body.x,y:body.y
  }
  ;
  const n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/3));
  for(let i=0;i<n;i++){
    if(!collides(body.x+dx/n,body.y,body.radius))body.x+=dx/n;
    if(!collides(body.x,body.y+dy/n,body.radius))body.y+=dy/n;
  }
  return distance(before,body);
}
// clearLine：本模块功能函数。
export function clearLine(a,b,r=3){
  const n=Math.max(1,Math.ceil(distance(a,b)/6));
  for(let i=0;i<=n;i++)if(collides(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,r))return false;
  return true;
}
