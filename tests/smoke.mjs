/** Prueba de juego en navegador real (WebGL): portada, caminata con colisiones, puerta, escena, concurso, futuro y regreso. */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
const OUT=process.env.QA_DIR||'docs/qa';mkdirSync(OUT,{recursive:true});
const srv=spawn('npx',['vite','preview','--port','4173','--strictPort'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,2500));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const errors=[];const page=await browser.newPage({viewport:{width:1440,height:900}});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const st=()=>page.evaluate(()=>window.__BOGOTA_TEST__.state());const shot=n=>page.screenshot({path:`${OUT}/${n}.png`});const wait=ms=>page.waitForTimeout(ms);
let ok=false;
try{
  await page.goto('http://127.0.0.1:4173/');await page.waitForFunction(()=>!!window.__BOGOTA_TEST__,null,{timeout:60000});await wait(2500);
  await shot('01-portada');
  console.log('layout',JSON.stringify((await st()).layout.problems));
  await page.click('#start');await wait(1800);await shot('02-caminar');
  const a=await st();await page.keyboard.down('w');await wait(1500);await page.keyboard.up('w');const b=await st();
  console.log('avance',a.hero,b.hero);if(a.hero[0]===b.hero[0]&&a.hero[1]===b.hero[1])throw Error('W no mueve');
  // colisión: intentar entrar en el Museo Nacional desde la calle del parque
  await page.evaluate(()=>window.__BOGOTA_TEST__.teleport(-12,2.2,0));await page.keyboard.down('s');await wait(1800);await page.keyboard.up('s');
  const c=await st();console.log('colisión museo',c.hero);if(c.hero[1]>6)throw Error('Atravesó el museo');
  await shot('03-colision');
  // puerta de El Oasis
  await page.evaluate(()=>window.__BOGOTA_TEST__.teleport(-12,23.2,Math.PI));await wait(900);await shot('04-puerta');
  const d=await st();console.log('cerca de',d.nearDoor);
  await page.keyboard.press('e');await wait(2600);await shot('05-escena');
  for(let i=0;i<3;i++){await page.keyboard.press('Space');await wait(300);await page.keyboard.press('Space');await wait(1400)}
  await shot('06-dialogo');
  for(let i=0;i<10&&(await st()).director.phase!=='quiz';i++){await page.keyboard.press('Space');await wait(200);await page.keyboard.press('Space');await wait(500)}
  await wait(700);await shot('07-concurso');
  await page.keyboard.press('b');await wait(2600);await shot('08-futuro');
  for(let i=0;i<10&&(await st()).director.phase!=='final';i++){await page.keyboard.press('Space');await wait(200);await page.keyboard.press('Space');await wait(500)}
  await wait(500);await shot('09-final');
  await page.click('#final-back');await wait(1800);await shot('10-regreso');
  const e=await st();console.log('progreso',JSON.stringify(e.progress));
  if(!e.progress.futures.oasis&&e.progress.futures.oasis!==0)throw Error('No quedó registrado el futuro');
  await page.evaluate(()=>window.__BOGOTA_TEST__.setView(2.3,.75,34));await wait(800);await shot('11-vista-alta');
  ok=true;
}catch(err){console.error('FALLO',err.message);await shot('99-fallo')}
console.log('errores',errors.slice(0,8));
await browser.close();srv.kill();process.exit(ok&&!errors.length?0:1);
