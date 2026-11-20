import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const html=await readFile(new URL('index.html',root),'utf8');
test('HTML、CSS 和运行模块的依赖使用同一版本，避免重复状态与旧缓存',async()=>{
 assert.match(html,/style\.css\?v=0\.5\.1/);assert.match(html,/immersive\.js\?v=0\.5\.1/);
 for(const file of await readdir(new URL('js/',root))){
  if(!file.endsWith('.js'))continue;
  const source=await readFile(new URL('js/'+file,root),'utf8');
  for(const match of source.matchAll(/(?:from\s*|import\s*)['"](\.\/[^'"]+)['"]/g)){
   assert.ok(match[1].endsWith('?v=0.5.1'),`${file}: ${match[1]}`);
   await readFile(new URL(match[1],new URL('js/',root)));
  }
 }
});
async function boot(fail){
 const elements=new Map();
 const context={document:{getElementById(id){if(!elements.has(id))elements.set(id,{disabled:true,hidden:true});return elements.get(id);}},console:{error(){}},loadModule:async()=>{if(fail)throw new Error('missing module');}};
 const source=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace('import(', 'loadModule(');
 await vm.runInNewContext(source,context);return elements;
}
test('整条依赖加载成功才启用开始按钮并显示运行版本',async()=>{
 const elements=await boot(false);assert.equal(elements.get('resume').disabled,false);
 assert.equal(elements.get('buildVersion').textContent,'v0.5.1 · 已加载');
});
test('依赖缺失时显示错误界面而非无响应的开始按钮',async()=>{
 const elements=await boot(true);assert.equal(elements.get('resume').disabled,true);
 assert.equal(elements.get('overlay').hidden,false);assert.equal(elements.get('buildVersion').textContent,'v0.5.1 · 加载失败');
});
