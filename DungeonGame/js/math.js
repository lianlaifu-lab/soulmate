// 不依赖游戏状态的数学工具。
// clamp：本模块功能函数。
export function clamp(n,a,b){
  return Math.max(a,Math.min(b,n));
}
// distance：本模块功能函数。
export function distance(a,b){
  return Math.hypot(a.x-b.x,a.y-b.y);
}
// direction：本模块功能函数。
export function direction(a,b){
  const d=distance(a,b)||1;
  return {
    x:(b.x-a.x)/d,y:(b.y-a.y)/d
  }
  ;
}
