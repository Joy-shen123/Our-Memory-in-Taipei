// Headed, matched scroll captures. Usage: node scripts/verify-realism.cjs before|after [zone]
const fs = require('node:fs');
const path = require('node:path');
let pw;
try { pw = require('playwright'); } catch (_) {
  pw = require('/Users/cjthewestie/Documents/CJ-project-vault/agent-flow-studio/node_modules/playwright');
}
const phase = process.argv[2] || 'after', zone = Number(process.argv[3] || 0);
const out = path.resolve('research/realism-dadao/verification');
const positions = {1: 0.35, 2: 0.44, 3: 0.48, 4: 0.52};
const frames = (p,n=60) => p.evaluate(n=>new Promise(resolve=>{let k=0;const f=()=>++k>=n?resolve():requestAnimationFrame(f);requestAnimationFrame(f)}),n);
const position = async(p,u) => {
  await p.evaluate(u=>scrollTo(0,u*(document.documentElement.scrollHeight-innerHeight)),u);
  await p.waitForFunction(()=>Math.abs(__fog.progress-scrollY/(document.documentElement.scrollHeight-innerHeight))<1e-8);
  await frames(p,90);
  return p.evaluate(()=>({u:__fog.progress,camZ:__fog.camZ,year:__fog.year,scrollY,width:innerWidth,height:innerHeight,photo:__fog.photo.a}));
};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await pw.chromium.launch({channel:'chromium',headless:false});
 const result={phase,zone,shots:{},fps:[],console:[],errors:[],httpErrors:[]};
 try {
  const p=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  p.on('console',m=>result.console.push({type:m.type(),text:m.text()}));
  p.on('pageerror',e=>result.errors.push(e.message));
  p.on('response',r=>{if(r.status()>=400)result.httpErrors.push({status:r.status(),url:r.url()})});
  await p.goto('http://localhost:8141',{waitUntil:'networkidle'});
  await p.bringToFront(); await p.mouse.move(720,450);
  for(const [z,u] of Object.entries(positions)) {
   if(zone && Number(z)!==zone) continue;
   result.shots[z]=await position(p,u);
   await p.screenshot({path:path.join(out,`zone${z}-${phase}.png`)});
  }
  if(phase==='after' || (phase==='before' && zone===1)) {
   for(let pass=1;pass<=2;pass++) for(const u of [.38,.44,.52]) {
    await position(p,u);
    const sample=await p.evaluate(()=>new Promise(resolve=>{let start=null,n=0;const f=t=>{if(start===null)start=t;else n++;if(t-start>=1500)resolve({fps:1000*n/(t-start),frames:n,elapsed:t-start});else requestAnimationFrame(f)};requestAnimationFrame(f)}));
    result.fps.push({pass,u,...sample});
   }
   await p.setViewportSize({width:390,height:844}); await p.mouse.move(195,422);
   result.mobile={};
   for(const [z,u] of Object.entries(positions)) {
    if(zone && Number(z)!==zone) continue;
    result.mobile[z]=await position(p,u);
    await p.screenshot({path:path.join(out,`zone${z}-mobile.png`)});
   }
   result.overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   result.rerun=await p.evaluate(async()=>{const out=[];for(const file of ['scene-red.js','scene-dadao.js','scene-tower.js']){try{(0,eval)(await(await fetch(file)).text());out.push({file,ok:true})}catch(e){out.push({file,ok:false,error:String(e)})}}return out});
   await frames(p,30);
  }
  fs.writeFileSync(path.join(out,`${phase}-${zone||'all'}.json`),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
