/** Caminabilidad, colisiones, relleno urbano y validación de la planta. */
import {ROADS,PATHS,PLAZAS,SITES,triggerOf,LANDMARKS,DISC_R,CERROS_X,RING_R,footprint,distPointPoly,closestOnRoad,closestRoad,pointInPoly,type V2,type Road} from './layout';

export const WALK_ROADS:Road[]=[...ROADS,...PATHS];

/** Semilla determinista para que la ciudad sea siempre la misma. */
export function rng(seed:number){return ()=>{seed=(Math.imul(seed^(seed>>>15),2246822507)+0x9e3779b9)>>>0;seed^=seed>>>13;return (seed>>>0)/4294967296}}

/** Obstáculos sólidos en planta (polígonos). */
export interface Solid{id:string;poly:V2[];kind:'site'|'landmark'|'house'|'tree'|'prop';pos:V2;r?:number}

// ── Casas de relleno: muestreo con rechazo, nunca sobre vías ni otros edificios ──
export interface House{id:string;pos:V2;size:V2;rot:number;floors:number;style:number}
function nearestRoadAngle(p:V2){const c=closestRoad(p,ROADS.filter(r=>r.id!=='anillo'));return Math.atan2(c.q[0]-p[0],c.q[1]-p[1])}

const baseSolids:Solid[]=[
  ...SITES.filter(s=>!s.open).map(s=>({id:s.id,poly:footprint(s.pos,s.size,s.rot),kind:'site' as const,pos:s.pos})),
  ...LANDMARKS.map(l=>({id:l.id,poly:footprint(l.pos,l.size,l.rot),kind:'landmark' as const,pos:l.pos,r:l.round?l.size[0]/2:undefined})),
  // templete y bancas del Parque Nacional (sólidos dentro de la plaza)
  {id:'templete',poly:circlePoly([-15,-8],2.55),kind:'prop',pos:[-15,-8]},
  ...[0,1,2,3].map(i=>{const a=i/4*Math.PI*2+Math.PI/4;const p:V2=[-15+Math.cos(a)*5.6,-8+Math.sin(a)*5.6];return {id:'banca'+i,poly:footprint(p,[1.7,.7],-a-Math.PI/2),kind:'prop' as const,pos:p}}),
  {id:'paradero',poly:footprint([4.25,1.0],[1.4,3.5],0),kind:'prop',pos:[4.25,1.0]},
];
function circlePoly(c:V2,r:number,n=14):V2[]{return Array.from({length:n},(_,i)=>[c[0]+Math.cos(i/n*Math.PI*2)*r,c[1]+Math.sin(i/n*Math.PI*2)*r] as V2)}

/** Altura del terreno (cerros) — 0 en la ciudad. */
export function terrainHeight(x:number,z:number){
  const r=Math.hypot(x,z);
  // rampa hacia el oriente
  let e=(x-CERROS_X)/(DISC_R-6-CERROS_X);if(e<=0)return 0;e=Math.min(1,e);
  const ramp=e*e*(3-2*e);
  // crestas redondeadas, como de plastilina
  const peaks:[number,number,number,number][]=[[50,-8,22,10],[47,10,18,9],[44,-26,17,8.5],[42,26,13,8],[55,4,16,8],[38,-40,10,7],[52,-22,15,7]];
  let h=0;for(const [px,pz,ph,pr] of peaks){const d=Math.hypot(x-px,z-pz)/pr;h=Math.max(h,ph*Math.exp(-d*d*.9))}
  h=Math.max(h,6*ramp)*ramp;
  // caer hacia el anillo vial del borde
  const rim=Math.min(1,Math.max(0,(RING_R-3.6-r)/5));
  h*=rim*rim*(3-2*rim);
  // vías que cruzan los cerros quedan talladas
  for(const id of ['calera','calle26']){const road=ROADS.find(r=>r.id===id)!;const c=closestOnRoad([x,z],road);
    const k=Math.min(1,Math.max(0,(c.d-road.width/2-.8)/6));h*=k*k*(3-2*k)}
  return h;
}

function roadClear(p:V2,margin:number){for(const r of [...ROADS,...PATHS]){if(closestOnRoad(p,r).d<r.width/2+margin)return false}return true}
function polyClear(poly:V2[],margin:number,solids:Solid[]){
  for(const s of solids){for(const q of poly){if(distPointPoly(q,s.poly)<margin)return false}for(const q of s.poly){if(distPointPoly(q,poly)<margin)return false}}
  return true;
}
function polyRoadClear(poly:V2[],margin:number,roads:Road[],self=''){
  // muestreo denso del contorno y del interior
  const pts:V2[]=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];for(let t=0;t<1;t+=.1)pts.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}
  const cx=poly.reduce((s,p)=>s+p[0],0)/poly.length,cz=poly.reduce((s,p)=>s+p[1],0)/poly.length;pts.push([cx,cz]);
  for(const r of roads){if(self&&r.id==='sendero_'+self)continue;for(const p of pts){if(closestOnRoad(p,r).d<r.width/2+margin)return false}
    // la vía no puede atravesar el polígono
    for(const q of r.pts)if(pointInPoly(q,poly))return false}
  for(const pl of PLAZAS){if(self&&(pl.id==='plaza_'+self||pl.id.endsWith('_'+self)))continue;for(const p of pts)if(Math.hypot(p[0]-pl.pos[0],p[1]-pl.pos[1])<pl.r+margin)return false}
  return true;
}

export const HOUSES:House[]=[];
{
  const R=rng(1972);const solids=[...baseSolids];let tries=0;
  while(HOUSES.length<30&&tries<6000){tries++;
    const a=R()*Math.PI*2,rad=Math.sqrt(R())*54;const p:V2=[Math.cos(a)*rad,Math.sin(a)*rad];
    if(p[0]>CERROS_X-4||terrainHeight(p[0],p[1])>.01)continue;
    const c=closestRoad(p,WALK_ROADS);if(c.d>14||c.d<4.5)continue; // frente a una vía, sin pegarse
    const size:V2=[4.2+R()*2.2,4.2+R()*1.8],rot=nearestRoadAngle(p);
    const poly=footprint(p,size,rot);
    if(Math.max(...poly.map(q=>Math.hypot(q[0],q[1])))>RING_R-6)continue;
    if(!polyRoadClear(poly,1.8,WALK_ROADS))continue;
    if(!polyClear(poly,2.6,solids))continue;
    if(Math.hypot(p[0]+15,p[1]+8)<12)continue; // el parque queda libre
    const h:House={id:'casa_'+HOUSES.length,pos:p,size,rot,floors:R()<.35?3:2,style:Math.floor(R()*4)};
    HOUSES.push(h);solids.push({id:h.id,poly,kind:'house',pos:p});
  }
}

// ── Árboles (decorativos y sólidos) ─────────────────────────────
export interface Tree{pos:V2;kind:'eucalipto'|'urapan'|'pino'|'sauce'|'arbusto';s:number;y:number}
export const TREES:Tree[]=[];
{
  const R=rng(31);
  const solids=[...baseSolids,...HOUSES.map(h=>({id:h.id,poly:footprint(h.pos,h.size,h.rot),kind:'house' as const,pos:h.pos}))];
  const ok=(p:V2,m:number)=>{if(!roadClear(p,1.3))return false;for(const pl of PLAZAS)if(Math.hypot(p[0]-pl.pos[0],p[1]-pl.pos[1])<pl.r+.9)return false;
    for(const s of solids)if(distPointPoly(p,s.poly)<m)return false;for(const t of TREES)if(Math.hypot(t.pos[0]-p[0],t.pos[1]-p[1])<1.7)return false;return true};
  // alineaciones de urapanes a lo largo de las avenidas
  for(const road of ROADS.filter(r=>r.kind==='avenida'&&r.id!=='anillo')){
    for(let i=0;i<road.pts.length-1;i++){const a=road.pts[i],b=road.pts[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);
      const nx=-(b[1]-a[1])/L,nz=(b[0]-a[0])/L;
      for(let d=4;d<L-2;d+=7)for(const side of [-1,1]){const off=road.width/2+2.1;
        const p:V2=[a[0]+(b[0]-a[0])*d/L+nx*off*side,a[1]+(b[1]-a[1])*d/L+nz*off*side];
        if(Math.hypot(...p)<RING_R-4.5&&terrainHeight(...p)<.3&&ok(p,1.8))TREES.push({pos:p,kind:'urapan',s:.9+R()*.3,y:0})}}
  }
  // bosques de eucalipto y pino en los cerros
  for(let i=0;i<900&&TREES.length<260;i++){const a=R()*Math.PI*2,rad=Math.sqrt(R())*(RING_R-4);const p:V2=[Math.cos(a)*rad,Math.sin(a)*rad];
    const h=terrainHeight(...p);if(h<1.2||h>17)continue;if(!ok(p,1))continue;TREES.push({pos:p,kind:R()<.6?'eucalipto':'pino',s:.9+R()*.5,y:h})}
  // arboleda del Parque Nacional
  for(let i=0;i<70;i++){const a=R()*Math.PI*2,rad=8.6+R()*4.2;const p:V2=[-15+Math.cos(a)*rad,-8+Math.sin(a)*rad];if(ok(p,1.4))TREES.push({pos:p,kind:R()<.5?'sauce':'urapan',s:.9+R()*.3,y:0})}
  // vegetación andina dispersa
  for(let i=0;i<700&&TREES.length<420;i++){const a=R()*Math.PI*2,rad=Math.sqrt(R())*(RING_R-5);const p:V2=[Math.cos(a)*rad,Math.sin(a)*rad];
    if(terrainHeight(...p)>.2)continue;if(!ok(p,2.2))continue;TREES.push({pos:p,kind:R()<.45?'arbusto':R()<.5?'pino':'eucalipto',s:.7+R()*.5,y:0})}
}

export const SOLIDS:Solid[]=[
  ...baseSolids,
  ...HOUSES.map(h=>({id:h.id,poly:footprint(h.pos,h.size,h.rot),kind:'house' as const,pos:h.pos})),
];

// ── Caminabilidad ───────────────────────────────────────────────
const PLAYER_R=.45;
/** ¿Puede estar Escobar en p? Sólo vías, aceras, senderos y plazoletas, nunca dentro de edificios. */
export function walkable(p:V2){
  if(Math.hypot(p[0],p[1])>RING_R+2.4)return false;
  let onGround=false;
  for(const r of WALK_ROADS){if(closestOnRoad(p,r).d<=r.width/2+(r.kind==='sendero'?.2:.9)){onGround=true;break}}
  if(!onGround)for(const pl of PLAZAS)if(Math.hypot(p[0]-pl.pos[0],p[1]-pl.pos[1])<=pl.r){onGround=true;break}
  if(!onGround)return false;
  for(const s of SOLIDS){if(Math.abs(s.pos[0]-p[0])>16||Math.abs(s.pos[1]-p[1])>16)continue;if(distPointPoly(p,s.poly)<PLAYER_R)return false}
  return true;
}

// ── Validación (se ejecuta en tests y en desarrollo) ─────────────
export function validateLayout(){
  const problems:string[]=[];
  const all=baseSolids.filter(s=>s.kind!=='prop');
  for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
    if(!polyClear(all[i].poly,1.5,[all[j]]))problems.push(`Solape/proximidad: ${all[i].id} ↔ ${all[j].id}`)}
  for(const s of all){if(!polyRoadClear(s.poly,.9,WALK_ROADS,s.id))problems.push(`Edificio sobre vía/plaza: ${s.id}`);
    if(Math.max(...s.poly.map(q=>Math.hypot(q[0],q[1])))>RING_R-4)problems.push(`Fuera de la meseta: ${s.id}`)}
  for(const p of PATHS){const solidsOther=all.filter(s=>'sendero_'+s.id!==p.id);
    for(let t=0;t<=1;t+=.05){const q:V2=[p.pts[0][0]+(p.pts[1][0]-p.pts[0][0])*t,p.pts[0][1]+(p.pts[1][1]-p.pts[0][1])*t];
      for(const s of solidsOther)if(distPointPoly(q,s.poly)<1.2){problems.push(`Sendero ${p.id} roza ${s.id}`);t=2;break}}}
  for(const s of SITES){if(!walkable(triggerOf(s)))problems.push(`Puerta no alcanzable: ${s.id}`)}
  return {problems,houses:HOUSES.length,trees:TREES.length};
}
