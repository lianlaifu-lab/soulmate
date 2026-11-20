// 开始、暂停、死亡与胜利；与输入事件绑定分离。
import { resetCoins } from './coins.js';
import { resetWeapons } from "./weapons.js";
import { game, clearInput } from "./state.js";
import { canvas } from "./dom.js";
import { showOverlay } from "./ui.js";
// setPaused：本模块功能函数。
export function setPaused(value){
  if(game.state!=='playing')return;
  game.paused=value;
  clearInput();
  document.getElementById('overlay').hidden=!game.paused;
  if(game.paused)showOverlay('已暂停','战斗计时已停止','继续游戏');
  document.getElementById('pause').textContent=game.paused?'继续':'暂停';
  game.lastTime=0;
}
// 完整重开：清空弹丸、敌人、特效、输入和计时。
export function reset(){
  clearInput();
  Object.assign(game.player,{
    x:480,y:440,angle:-Math.PI/2,walk:0,moving:false,hp:100,invincible:0,shot:0
  }
  );
  game.player.maxHp=100;
  resetWeapons();
  resetCoins();
  game.enemies=[];
  game.bullets=[];
  game.effects=[];
  game.spawns=[];
  game.elapsed=0;
  game.kills=0;
  game.wave=0;
  game.nextWave=1;
  game.navTimer=0;
  game.state='playing';
  game.paused=false;
  document.getElementById('overlay').hidden=true;
  document.getElementById('pause').textContent='暂停';
  game.lastTime=0;
  canvas.focus({ preventScroll: true });
}
// finish：本模块功能函数。
export function finish(won){
  game.state=won?'won':'dead';
  clearInput();
  showOverlay(won?'试炼完成':'你倒下了',`坚持 ${Math.floor(game.elapsed)} 秒 · 击败 ${game.kills} 个敌人${won?' · 房间已清空':''}`,'重新挑战');
}
