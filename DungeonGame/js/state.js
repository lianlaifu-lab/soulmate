// 唯一的共享运行状态。其他模块导入 game，不使用隐式全局变量。
export const game = {
  player:{
    x:480,y:440,angle:-Math.PI/2,walk:0,moving:false,hp:100,invincible:0,shot:0
  }
  ,
  keys:new Set(), input:{
    move:{
      x:0,y:0
    }
    ,aim:{
      x:0,y:0
    }
    ,mouse:null
  }
  ,
  paused:false,lastTime:0,clock:0,state:'ready',firing:false,
  enemies:[],bullets:[],effects:[],spawns:[],elapsed:0,kills:0,wave:0,nextWave:1,serial:0,navTimer:0,padResets:[]
}
;
// 失焦、暂停和重开时释放所有输入，防止持续移动或射击。
export function clearInput(){
  game.firing=false;
  game.keys.clear();
  game.input.move={
    x:0,y:0
  }
  ;
  game.input.aim={
    x:0,y:0
  }
  ;
  game.input.mouse=null;
  game.padResets.forEach(fn=>fn());
}
