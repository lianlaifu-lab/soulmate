// 原创 Canvas 像素怪物，无需下载图片；造型与碰撞体分离。
export function drawMonster(ctx,e,time){
 ctx.save();ctx.translate(Math.round(e.x),Math.round(e.y));
 const ink='#17232b', light=e.flash>0?'#fff':null;
 const r=(x,y,w,h,c)=>{ctx.fillStyle=light||c;ctx.fillRect(x,y,w,h);};
 const eye=(x,y)=>{ctx.fillStyle='#ffeeb0';ctx.fillRect(x,y,5,5);ctx.fillStyle=ink;ctx.fillRect(x+2,y+1,2,3);};
 if(e.type==='melee'){
   // 绿史莱姆：圆顶、黏液脚、两颗獠牙。
   const bob=Math.sin(time*7+e.id)*1.5;ctx.translate(0,bob);
   r(-15,-12,30,20,ink);r(-11,-19,22,8,ink);r(-13,-10,26,17,'#6cbe78');r(-9,-17,18,12,'#8bd28a');
   r(-16,6,9,5,'#5c9f64');r(6,6,10,5,'#5c9f64');r(-9,-14,5,4,'#bceca5');eye(-8,-8);eye(3,-8);
   r(-5,1,10,3,ink);r(-5,2,3,4,'#fff1ce');r(2,2,3,4,'#fff1ce');
 }else if(e.type==='ranged'){
   // 紫袍独眼巫师：尖帽、披风、法杖。
   r(-15,-14,27,25,ink);r(-11,-10,19,18,'#9362b3');r(-14,7,25,5,'#674581');
   r(-14,-24,26,9,'#6e448e');r(-8,-32,15,10,'#9362b3');r(-3,-38,7,8,'#b17ac8');r(-17,-17,32,4,'#c397da');
   r(-8,-11,14,11,ink);eye(-3,-9);r(17,-17,3,30,'#b29061');r(13,-24,11,9,'#d7a3f5');r(16,-27,5,15,'#f2d5ff');
 }else{
   // 橙甲角兽：双角、宽肩、铁鼻环。
   r(-18,-19,36,28,ink);r(-15,-17,30,23,'#c78248');r(-19,-26,7,13,'#f2dfac');r(12,-26,7,13,'#f2dfac');
   r(-22,-8,8,16,'#805740');r(14,-8,8,16,'#805740');r(-12,7,8,7,ink);r(4,7,8,7,ink);
   eye(-10,-13);eye(5,-13);r(-7,-3,14,9,'#e3ab68');r(-4,0,3,3,ink);r(2,0,3,3,ink);r(-3,5,6,3,'#ffe285');
 }
 ctx.restore();
}
