// v0.3.3：所有操作集中在菜单；战斗中仅保留精简状态和右上角暂停键。
import { game } from './state.js';
export function showOverlay(title, text, button) {
  const ready = game.state === 'ready';
  document.getElementById('overlayTitle').textContent = ready ? '微光地牢' : title;
  document.getElementById('overlayText').textContent = ready ? '生存 60 秒，再清空房间' : text;
  document.getElementById('resume').textContent = ready ? '开始游戏' : button;
  // 死亡/胜利时主按钮已是重新挑战，不显示重复按钮。
  document.getElementById('reset').hidden = game.state !== 'playing';
  document.getElementById('overlay').hidden = false;
}
export function updateHUD() {
  const progress = game.elapsed < 60 ? `${Math.ceil(60 - game.elapsed)}s` : `剩余 ${game.enemies.length + game.spawns.length}`;
  document.getElementById('stats').textContent = `♥ ${game.player.hp}  ·  ${progress}  ·  击败 ${game.kills}`;
}
