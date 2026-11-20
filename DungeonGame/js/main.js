// 由 immersive.js 加载的主循环入口：绑定操作、设置画布并启动主循环。
import { game } from "./state.js?v=0.5.1";
import { bindInput } from "./input.js?v=0.5.1";
import { resize, draw } from "./renderer.js?v=0.5.1";
import { update } from "./game.js?v=0.5.1";
import { showOverlay } from "./ui.js?v=0.5.1";
// 按真实时间推进；暂停时不推进游戏，异常帧间隔限制为 0.05 秒。
export function frame(now){
  const dt=game.lastTime?Math.min((now-game.lastTime)/1000,0.05):0;
  game.lastTime=now;
  if(!game.paused&&game.state==='playing'){
    game.clock+=dt;
    update(dt);
  }
  draw();
  requestAnimationFrame(frame);
}
bindInput();
window.addEventListener('resize',resize);
resize();
showOverlay('一分钟试炼','生存 60 秒，再清除剩余敌人。按住鼠标左键射击，利用石柱躲避攻击。','开始战斗');
requestAnimationFrame(frame);
