// Valida la planta: compila src/data/world.ts con esbuild y comprueba solapes y accesos.
import {build} from 'esbuild';
const out=await build({entryPoints:['src/data/world.ts'],bundle:true,format:'esm',write:false,platform:'node'});
const mod=await import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
const r=mod.validateLayout();
console.log(`Casas: ${r.houses} · Árboles: ${r.trees}`);
if(r.problems.length){console.log('PROBLEMAS:\n - '+r.problems.join('\n - '));process.exit(1)}
// recorrido: BFS en rejilla caminable para comprobar que todas las puertas están conectadas
const {walkable}=mod;const lay=await import('data:text/javascript;base64,'+Buffer.from((await build({entryPoints:['src/data/layout.ts'],bundle:true,format:'esm',write:false})).outputFiles[0].text).toString('base64'));
const step=.8,key=(i,j)=>i+','+j,seen=new Set();const start=[0,10];const q=[[Math.round(start[0]/step),Math.round(start[1]/step)]];seen.add(key(...q[0]));
while(q.length){const [i,j]=q.pop();for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=key(i+di,j+dj);if(seen.has(k))continue;if(walkable([(i+di)*step,(j+dj)*step])){seen.add(k);q.push([i+di,j+dj])}}}
let bad=0;for(const p of [...lay.SITES.map(s=>({id:s.id,pos:lay.triggerOf(s)})),...lay.PLAZAS.filter(p=>p.id!=='plaza_parque')]){const ok=[...seen].some(k=>{const [i,j]=k.split(',').map(Number);return Math.hypot(i*step-p.pos[0],j*step-p.pos[1])<1.2});if(!ok){console.log('Inalcanzable desde la Séptima:',p.id);bad++}}
console.log(`Celdas caminables conectadas: ${seen.size}`);
if(bad)process.exit(1);console.log('Planta válida ✓');
