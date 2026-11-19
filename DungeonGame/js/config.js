// 只保存静态配置；运行中的血量、敌人等数据位于 state.js。
export const CONFIG = {
  width:960, height:600, speed:210, radius:13, wall:40
}
;
export const TYPES={
  melee:{
    hp:30,speed:82,color:'#91ba75',damage:12
  }
  ,ranged:{
    hp:30,speed:66,color:'#be96e8',damage:10
  }
  ,charger:{
    hp:50,speed:64,color:'#e3a264',damage:18
  }
}
;
export const obstacles=[{
  x:224,y:192,w:80,h:80
}
,{
  x:656,y:192,w:80,h:80
}
,{
  x:432,y:280,w:96,h:64
}
];
export const walls=[{
  x:0,y:0,w:960,h:40
}
,{
  x:0,y:560,w:960,h:40
}
,{
  x:0,y:0,w:40,h:600
}
,{
  x:920,y:0,w:40,h:600
}
];
export const solids=[...walls,...obstacles];
export const spawnPoints=[{
  x:100,y:130
}
,{
  x:480,y:110
}
,{
  x:860,y:130
}
,{
  x:100,y:470
}
,{
  x:860,y:470
}
];
