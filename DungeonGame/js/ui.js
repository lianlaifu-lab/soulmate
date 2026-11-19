// 文字、按钮与覆盖层；不负责战斗推进。
import { game } from "./state.js";
// showOverlay：本模块功能函数。
export function showOverlay(title,text,button){
  document.getElementById('overlayTitle').textContent=title;
  document.getElementById('overlayText').textContent=text;
  document.getElementById('resume').textContent=button;
  document.getElementById('overlay').hidden=false;
}
// updateHUD：本模块功能函数。
export function updateHUD(){
  document.getElementById('stats').textContent=`生命 ${game.player.hp}/100 · 击败 ${game.kills} · ${game.elapsed<60?'剩余 '+Math.ceil(60-game.elapsed)+' 秒':'清除剩余 '+(game.enemies.length+game.spawns.length)+' 个敌人'}`;
}
