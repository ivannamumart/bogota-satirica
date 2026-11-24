/** Galería de control visual: una captura por escenario (plano general y diálogo). */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';import {mkdirSync} from 'node:fs';
const OUT=process.env.QA_DIR||'docs/qa/escenas';mkdirSync(OUT,{recursive:true});
const srv=spawn('npx',['vite','preview','--port','4174','--strictPort'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,2500));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
await page.goto('http://127.0.0.1:4174/');await page.waitForFunction(()=>!!window.__BOGOTA_TEST__);await page.waitForTimeout(1200);
await page.click('#start');await page.waitForTimeout(1500);
const ids=(process.env.IDS||'apartamento,taller,oasis,septima,parque,porciuncula,jockey,casa_familiar,unicornio,oficina,cementerio').split(',');
const st=()=>page.evaluate(()=>window.__BOGOTA_TEST__.state());
for(const id of ids){
  await page.evaluate(id=>window.__BOGOTA_TEST__.enter(id),id);await page.waitForTimeout(2600);
  let shotN=0;
  for(let i=0;i<12;i++){const s=await st();if(s.director.phase!=='inicio')break;
    await page.evaluate(()=>window.__BOGOTA_TEST__.next());await page.waitForTimeout(250);await page.evaluate(()=>window.__BOGOTA_TEST__.next());await page.waitForTimeout(1900);
    if([1,3,5].includes(i)){await page.screenshot({path:`${OUT}/${id}-${++shotN}.png`})}}
  await page.evaluate(()=>window.__BOGOTA_TEST__.choose(0));await page.waitForTimeout(2600);
  await page.evaluate(()=>window.__BOGOTA_TEST__.next());await page.waitForTimeout(200);await page.evaluate(()=>window.__BOGOTA_TEST__.next());await page.waitForTimeout(1800);
  await page.screenshot({path:`${OUT}/${id}-futuro.png`});
  await page.evaluate(()=>{for(let i=0;i<30;i++)window.__BOGOTA_TEST__.next()});await page.waitForTimeout(500);
  await page.evaluate(()=>window.__BOGOTA_TEST__.finish());await page.waitForTimeout(1600);
  console.log(id,'ok',JSON.stringify((await st()).director));
}
await page.screenshot({path:`${OUT}/zz-mundo.png`});
console.log('errores',errs);await browser.close();srv.kill();
