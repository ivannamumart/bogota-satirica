/** LA BOGOTÁ SATÍRICA DE SIN REMEDIO · V09
 * Globo-maqueta navegable en tercera persona + viñetas 3D de cómic + concurso de futuros especulativos. */
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import './ui/styles.css';
import {createCity,futurePlaque} from './world/city';
import {Person} from './world/people';
import {LOOKS} from './story/cast';
import {DIALOGOS} from './story/expanded';
import {SITES,ROADS,LANDMARKS,DISC_R,RING_R,SPHERE_CUT,triggerOf,doorOf,closestOnRoad,footprint,type PlaceId,type V2} from './data/layout';
import {walkable,HOUSES,terrainHeight,validateLayout,WALK_ROADS} from './data/world';
import {Director} from './scenes/director';
import {car as makeCar,bus as makeBus} from './scenes/props';
import {clay,P} from './world/kit';

const $=<E extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as E;
try{
// ── Render ──────────────────────────────────────────
const mount=$('world');const mobile=matchMedia('(pointer:coarse)').matches;
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:1.75));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;mount.appendChild(renderer.domElement);
const pmrem=new T.PMREMGenerator(renderer);const envTex=pmrem.fromScene(new RoomEnvironment(),.04).texture;

const scene=new T.Scene();scene.environment=envTex;scene.environmentIntensity=.35;
const BG_DAY=new T.Color('#e4e3df'),BG_NIGHT=new T.Color('#1f2330');scene.background=BG_DAY.clone();
const camera=new T.PerspectiveCamera(42,innerWidth/innerHeight,.3,900);
const hemi=new T.HemisphereLight('#fbf6ec','#8a8f80',1.35);scene.add(hemi);
const sun=new T.DirectionalLight('#fff1dc',2.6);sun.position.set(-45,80,55);sun.castShadow=true;
sun.shadow.mapSize.set(mobile?2048:4096,mobile?2048:4096);Object.assign(sun.shadow.camera,{left:-74,right:74,top:74,bottom:-74,near:10,far:220});sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;sun.shadow.radius=3;
scene.add(sun,sun.target);
const fillL=new T.DirectionalLight('#cfe0ff',.55);fillL.position.set(50,30,-40);scene.add(fillL);
// sombra de contacto del globo sobre el "estudio"
const contact=new T.Mesh(new T.CircleGeometry(60,48),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.18,depthWrite:false}));
contact.rotation.x=-Math.PI/2;contact.position.y=-SPHERE_CUT-74+.5;scene.add(contact);

const city=createCity();scene.add(city.world);
const report=validateLayout();if(report.problems.length)console.warn('Planta con problemas',report.problems);

// ── Protagonista ────────────────────────────────────
const hero=new Person('escobar',{...LOOKS.escobar,scale:1.15});city.world.add(hero.root);
const START:V2=[1.4,-6];hero.place(START[0],START[1],Math.PI);
const heroShadowBlob=new T.Mesh(new T.CircleGeometry(.5,20),new T.MeshBasicMaterial({color:0,transparent:true,opacity:.18,depthWrite:false}));heroShadowBlob.rotation.x=-Math.PI/2;heroShadowBlob.position.y=.14;hero.root.add(heroShadowBlob);

// ── Transeúntes y tráfico ──────────────────────────
const walkers:{p:Person;road:typeof ROADS[number];d:number;dir:number;side:number;speed:number}[]=[];
['peaton','feligres','bailarina','ruben','ramon','feligres2','anamaria','poeta'].forEach((k,i)=>{
  const road=ROADS[[0,1,2,3,4,5,0,1][i]];const p=new Person('npc'+i,{...LOOKS[k],scale:1.1});city.world.add(p.root);
  walkers.push({p,road,d:8+i*9,dir:i%2?1:-1,side:i%2?1:-1,speed:1.1+((i*7)%5)*.12})});
function roadLen(r:typeof ROADS[number]){let L=0;for(let i=0;i<r.pts.length-1;i++)L+=Math.hypot(r.pts[i+1][0]-r.pts[i][0],r.pts[i+1][1]-r.pts[i][1]);return L}
function roadAt(r:typeof ROADS[number],d:number){let acc=0;for(let i=0;i<r.pts.length-1;i++){const a=r.pts[i],b=r.pts[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=acc+L||i===r.pts.length-2){const t=Math.max(0,Math.min(1,(d-acc)/L));return {x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,dx:(b[0]-a[0])/L,dz:(b[1]-a[1])/L}}acc+=L}return {x:0,z:0,dx:1,dz:0}}
const vehicles:{o:T.Object3D;road:typeof ROADS[number];d:number;dir:1|-1;speed:number;len:number;wait:number}[]=[];
[['septima',1,'#a33b2c'],['septima',-1,'#2f5d8a'],['calle26',1,'#e9e2cf'],['calle26',-1,'bus'],['anillo',1,'#d8c14a'],['anillo',1,'bus'],['anillo',-1,'#3e6a43'],['septima',-1,'bus']].forEach(([id,dir,c],i)=>{
  const road=ROADS.find(r=>r.id===id)!;const o=c==='bus'?makeBus():makeCar(c as string);o.scale.setScalar(c==='bus'?.62:.72);o.traverse(m=>{(m as T.Mesh).castShadow=true});city.world.add(o);
  vehicles.push({o,road,d:(i*37)%roadLen(road),dir:dir as 1|-1,speed:c==='bus'?5:7,len:roadLen(road),wait:0})});

// ── Estado ─────────────────────────────────────────
type Mode='intro'|'walk'|'scene'|'transition'|'globe';
let mode:Mode='intro';let night=false;let nightK=0;
const SAVE='bogota-satirica-v09';
const progress:{visited:PlaceId[];futures:Partial<Record<PlaceId,number>>;discovered:PlaceId[]}=(()=>{try{return JSON.parse(localStorage.getItem(SAVE)||'')}catch{return null}})()??{visited:[],futures:{},discovered:[]};
const save=()=>{try{localStorage.setItem(SAVE,JSON.stringify(progress))}catch{}};
for(const [id,c] of Object.entries(progress.futures))if(c!==undefined&&c>=0)placeFuture(id as PlaceId,c);

// ── Cámara ─────────────────────────────────────────
const orbit=new OrbitControls(camera,renderer.domElement);orbit.enablePan=false;orbit.enableDamping=true;orbit.dampingFactor=.07;orbit.minDistance=95;orbit.maxDistance=330;orbit.target.set(0,-14,0);
orbit.minPolarAngle=.25;orbit.maxPolarAngle=1.62;orbit.rotateSpeed=.5;
camera.position.set(-40,95,215);orbit.update();
let yaw=Math.PI*.0,pitch=.48,dist=14,distWant=14,lastDrag=-10;const camPos=new T.Vector3(),camLook=new T.Vector3();
const boxes:T.Box3[]=[...city.occluders.map(o=>o.box)];
for(const h of HOUSES){const fp=footprint(h.pos,h.size,h.rot);const xs=fp.map(p=>p[0]),zs=fp.map(p=>p[1]);boxes.push(new T.Box3(new T.Vector3(Math.min(...xs)-.6,0,Math.min(...zs)-.6),new T.Vector3(Math.max(...xs)+.6,h.floors*2.7+2.2,Math.max(...zs)+.6)))}
for(const l of LANDMARKS){const fp=footprint(l.pos,l.size,l.rot);const xs=fp.map(p=>p[0]),zs=fp.map(p=>p[1]);boxes.push(new T.Box3(new T.Vector3(Math.min(...xs),0,Math.min(...zs)),new T.Vector3(Math.max(...xs),l.height+1,Math.max(...zs))))}
const ray=new T.Ray(),hit=new T.Vector3();
let pitchEff=pitch;
function clearance(head:T.Vector3,pt:number,want:number){
  const off=new T.Vector3(Math.sin(yaw)*Math.cos(pt),Math.sin(pt),Math.cos(yaw)*Math.cos(pt));ray.set(head,off);let allowed=want;
  for(const b of boxes){if(b.containsPoint(head))continue;if(ray.intersectBox(b,hit)){const d=hit.distanceTo(head);if(d<allowed)allowed=Math.max(3.2,d-.5)}}
  const tip=head.clone().addScaledVector(off,allowed);if(tip.y<terrainHeight(tip.x,tip.z)+1.2)allowed=Math.max(3.2,allowed*.75);
  return {allowed,off};
}
function followCamera(dt:number,snap=false){
  const head=hero.root.position.clone().add(new T.Vector3(0,1.8,0));
  // si una fachada tapa la vista, la cámara se eleva por encima en lugar de pegarse al personaje
  let pt=pitch,res=clearance(head,pt,distWant);
  while(res.allowed<distWant*.8&&pt<.98){pt+=.07;res=clearance(head,pt,distWant)}
  pitchEff=snap?pt:T.MathUtils.damp(pitchEff,pt,pt>pitchEff?6:2.5,dt);
  res=clearance(head,pitchEff,distWant);
  dist=snap?res.allowed:T.MathUtils.damp(dist,res.allowed,res.allowed<dist?14:3,dt);
  const want=head.clone().addScaledVector(res.off,dist);
  if(snap){camPos.copy(want);camLook.copy(head)}else{camPos.lerp(want,1-Math.exp(-dt*10));camLook.lerp(head,1-Math.exp(-dt*12))}
  camera.position.copy(camPos);camera.lookAt(camLook);
}

// ── Entrada ────────────────────────────────────────
const keys=new Set<string>();const stick={x:0,y:0,active:false};let runBtn=false;
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(e.target instanceof HTMLButtonElement&&(k===' '||k==='enter'))e.preventDefault();
  if($('about').classList.contains('open')){if(k==='escape')closeAbout();return}
  if(mode==='scene'){onSceneKey(e);return}
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
  keys.add(k);
  if(mode==='walk'){if(k==='e'||k==='enter')tryEnter();if(k==='m')toggleMap();if(k==='j')toggleJournal();if(k==='g')toGlobe();if(k==='escape'){closePanels()}}
  else if(mode==='globe'||mode==='intro'){if(k==='enter'||k===' '||k==='w'||k==='arrowup')startWalk()}
  if(k==='n')toggleNight();
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
let dragging=false,dragX=0,dragY=0,downAt=0;
renderer.domElement.addEventListener('pointerdown',e=>{if(mode==='walk'){dragging=true;dragX=e.clientX;dragY=e.clientY;downAt=performance.now()}});
addEventListener('pointermove',e=>{if(!dragging||mode!=='walk')return;yaw-=(e.clientX-dragX)*.006;pitch=T.MathUtils.clamp(pitch+(e.clientY-dragY)*.004,.12,1.2);dragX=e.clientX;dragY=e.clientY;lastDrag=performance.now()/1000});
addEventListener('pointerup',()=>{dragging=false});
renderer.domElement.addEventListener('wheel',e=>{if(mode==='walk'){distWant=T.MathUtils.clamp(distWant+e.deltaY*.014,6,42)}},{passive:true});
renderer.domElement.addEventListener('click',()=>{if(mode==='scene')director.next()});
renderer.domElement.addEventListener('dblclick',()=>{if(mode==='globe'||mode==='intro')startWalk()});
// joystick táctil
const stickEl=$('stick'),knob=stickEl.querySelector('span') as HTMLElement;let stickId=-1;
function stickOwns(e:PointerEvent){return e.pointerId===stickId}
stickEl.addEventListener('pointerdown',e=>{stickId=e.pointerId;stick.active=true;stickEl.setPointerCapture(e.pointerId);moveStick(e)});
stickEl.addEventListener('pointermove',e=>{if(e.pointerId===stickId)moveStick(e)});
stickEl.addEventListener('pointerup',()=>{stickId=-1;stick.active=false;stick.x=stick.y=0;knob.style.transform=''});
function moveStick(e:PointerEvent){const r=stickEl.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/(r.width/2),y=(e.clientY-r.top-r.height/2)/(r.height/2);const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}stick.x=x;stick.y=y;knob.style.transform=`translate(${x*38}px,${y*38}px)`}
$('pad-run').addEventListener('pointerdown',()=>runBtn=!runBtn);

// ── Movimiento ─────────────────────────────────────
let heroFacing=Math.PI,velocity=new T.Vector3();
function blockedByVehicle(x:number,z:number){for(const v of vehicles){if(Math.hypot(v.o.position.x-x,v.o.position.z-z)<(v.o.scale.x>.7?1.6:2.2))return true}return false}
function moveHero(dt:number,t:number){
  let ix=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+stick.x;
  let iz=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)-stick.y;
  const L=Math.hypot(ix,iz);if(L>1){ix/=L;iz/=L}
  const run=keys.has('shift')||runBtn;const speed=(run?9.5:5.4)*Math.min(1,L);
  const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=-fz,rz=fx;
  const want=new T.Vector3(fx*iz+rx*ix,0,fz*iz+rz*ix).multiplyScalar(speed);
  velocity.lerp(want,1-Math.exp(-dt*12));
  const p=hero.root.position;let moved=false;
  if(velocity.lengthSq()>.02){
    const steps=Math.ceil(velocity.length()*dt/.15);const sx=velocity.x*dt/steps,sz=velocity.z*dt/steps;
    for(let i=0;i<steps;i++){
      const tryP=(x:number,z:number)=>walkable([x,z])&&!blockedByVehicle(x,z);
      if(tryP(p.x+sx,p.z+sz)){p.x+=sx;p.z+=sz;moved=true;continue}
      // deslizarse a lo largo del borde (sensación de juego natural, sin quedarse pegado)
      const c=nearestRoadDir(p.x,p.z);const dot=sx*c[0]+sz*c[1];
      if(Math.abs(dot)>.001&&tryP(p.x+c[0]*dot,p.z+c[1]*dot)){p.x+=c[0]*dot;p.z+=c[1]*dot;moved=true;continue}
      if(tryP(p.x+sx,p.z)){p.x+=sx;moved=true;continue}
      if(tryP(p.x,p.z+sz)){p.z+=sz;moved=true;continue}
      velocity.multiplyScalar(.5);break;
    }
    if(want.lengthSq()>.01)heroFacing=Math.atan2(want.x,want.z);
    // la cámara se reacomoda detrás del jugador si no la ha girado recientemente
    if(t-lastDrag>2.2&&iz>.3){const target=heroFacing+Math.PI;const d=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw));yaw+=d*Math.min(1,dt*.9)}
  }
  p.y=terrainHeight(p.x,p.z);
  const sp=velocity.length();hero.drive(moved&&sp>.3,sp/3.4,heroFacing,dt,t);
}
function nearestRoadDir(x:number,z:number):[number,number]{let best=Infinity,dir:[number,number]=[1,0];
  for(const r of WALK_ROADS){const c=closestOnRoad([x,z],r);if(c.d<best){best=c.d;const a=r.pts[c.seg],b=r.pts[c.seg+1];const L=Math.hypot(b[0]-a[0],b[1]-a[1])||1;dir=[(b[0]-a[0])/L,(b[1]-a[1])/L]}}return dir}

// ── Puertas y escenas ──────────────────────────────
let nearDoor:PlaceId|null=null,doorCooldown=0;
function updateDoors(t:number,dt:number){
  nearDoor=null;const p=hero.root.position;let best=99;
  for(const [id,d] of city.doors){const dd=Math.hypot(d.pos.x-p.x,d.pos.z-p.z);
    const gem=d.marker.getObjectByName('gema')!;gem.position.y=3.4+Math.sin(t*2.4+d.pos.x)*.3;gem.rotation.y+=dt*1.6;
    const ring=d.marker.getObjectByName('anillo') as T.Mesh;const s=1+Math.sin(t*3+d.pos.z)*.08+(dd<3.2?.25:0);ring.scale.setScalar(s);
    (gem as T.Mesh).visible=dd>6;
    const site=city.sites.get(id)!;const um=site.getObjectByName('umbral') as T.Mesh|undefined;if(um)(um.material as T.MeshBasicMaterial).opacity=T.MathUtils.damp((um.material as T.MeshBasicMaterial).opacity,dd<9?.55+Math.sin(t*4)*.15:0,6,dt);
    if(dd<3.4&&dd<best){best=dd;nearDoor=id}
    if(dd<25&&!progress.discovered.includes(id)){progress.discovered.push(id);save();toast(`Descubriste ${d.site.name}`)}
  }
  doorCooldown=Math.max(0,doorCooldown-dt);
  const pr=$('prompt');if(nearDoor&&mode==='walk'){$('prompt-name').textContent=city.doors.get(nearDoor)!.site.name;pr.classList.add('on');
    if(best<1.15&&doorCooldown<=0&&velocity.length()>1)enterSite(nearDoor)}else pr.classList.remove('on');
}
$('prompt').addEventListener('click',()=>tryEnter());
function tryEnter(){if(nearDoor&&mode==='walk')enterSite(nearDoor)}
const director=new Director();
function iris(close:boolean){$('fade').classList.toggle('close',close)}
function enterSite(id:PlaceId){
  if(mode!=='walk')return;mode='transition';$('prompt').classList.remove('on');closePanels();iris(true);velocity.set(0,0,0);
  setTimeout(()=>{director.open(id);mode='scene';document.body.classList.remove('walking');iris(false)},620);
}
director.onExit=(id,choice)=>{
  mode='transition';iris(true);
  setTimeout(()=>{
    if(!progress.visited.includes(id))progress.visited.push(id);
    if(choice>=0){progress.futures[id]=choice;placeFuture(id,choice);}
    save();updateJournal();
    const s=SITES.find(s=>s.id===id)!;const tp=triggerOf(s);const door=doorOf(s);
    // reaparece fuera del umbral, mirando hacia la calle
    const out=s.open?[tp[0]+2.2,tp[1]]:(()=>{const c=closestRoadPoint(door);return [door[0]+(c[0]-door[0])*.6,door[1]+(c[1]-door[1])*.6]})();
    hero.place(out[0],out[1]);heroFacing=Math.atan2(out[0]-tp[0],out[1]-tp[1]);yaw=heroFacing;lastDrag=clock.elapsedTime;doorCooldown=2.5;
    mode='walk';document.body.classList.add('walking');followCamera(0,true);iris(false);
    if(choice>=0)toast(`Futuro inscrito en la ciudad: «${DIALOGOS[id].bifurcaciones[choice].titulo}»`);
    if(progress.visited.length===SITES.length)setTimeout(()=>toast('Has recorrido toda la Bogotá de Sin remedio. Abre la libreta para ver tu ciudad transformada.'),3500);
  },620);
};
function closestRoadPoint(p:V2):V2{let best:{q:V2;d:number}|null=null;for(const r of ROADS){const c=closestOnRoad(p,r);if(!best||c.d<best.d)best={q:c.q,d:c.d}}return best!.q}
function placeFuture(id:PlaceId,choice:number){const g=city.futures.get(id)!;g.clear();const b=DIALOGOS[id].bifurcaciones[choice];const pl=futurePlaque(b.titulo);
  const s=SITES.find(s=>s.id===id)!;
  if(s.open){const tp=triggerOf(s);g.position.set(tp[0]+1.2,0,tp[1]-3.4);pl.rotation.y=Math.PI/2;g.add(pl);return}
  // estandarte colgado en la fachada, encima de la puerta: transforma el edificio sin invadir la calle
  const site=city.sites.get(id)!;g.position.set(0,0,0);site.add(g);
  const f=s.size[1]/2;const Y:Partial<Record<PlaceId,[number,number]>>={unicornio:[5.4,f+2.2],septima:[5.3,f+.3],oasis:[4.5,f+.3],cementerio:[0,f+3.2],porciuncula:[5.6,f+.5],jockey:[7.6,f+2.7],oficina:[5.2,f+.3],casa_familiar:[4.4,f+.6],apartamento:[4.4,f+.3],taller:[4.1,f+.3]};
  const [y,z]=Y[id]??[4.4,f+.3];
  if(id==='cementerio'){pl.position.set(5.2,0,z-.8);g.add(pl);return}
  pl.position.set(0,y-2.9,z);pl.children.filter(c=>(c as T.Mesh).geometry?.type==='CylinderGeometry').forEach(c=>c.visible=false);g.add(pl)}
function onSceneKey(e:KeyboardEvent){const k=e.key.toLowerCase();if(k===' '||k==='enter'){e.preventDefault();(document.activeElement as HTMLElement|null)?.blur?.()}
  if(director.phase==='quiz'){const i='abc'.indexOf(k)>=0?'abc'.indexOf(k):'123'.indexOf(k);if(i>=0)director.choose(i);if(k==='escape')director.abort();return}
  if(director.phase==='final'){if(k==='enter'||k===' ')director.finish();return}
  if([' ','enter','arrowright','d','arrowdown','s'].includes(k)){e.preventDefault();director.next()}
  else if(['arrowleft','a','arrowup','w'].includes(k)){e.preventDefault();director.prev()}
  else if(k==='escape')director.abort();
}
$('scene-next').addEventListener('click',e=>{e.stopPropagation();director.next()});$('scene-prev').addEventListener('click',e=>{e.stopPropagation();director.prev()});
$('scene-exit').addEventListener('click',()=>director.abort());
$('final-back').addEventListener('click',()=>director.finish());$('final-other').addEventListener('click',()=>director.otherFuture());$('final-replay').addEventListener('click',()=>director.replay());
$('balloon').addEventListener('click',()=>director.next());$('caption').addEventListener('click',()=>director.next());

// ── Paneles ────────────────────────────────────────
let toastT=0;function toast(msg:string){const t=$('toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=window.setTimeout(()=>t.classList.remove('on'),3600)}
function openAbout(){$('about').classList.add('open');$('about').setAttribute('aria-hidden','false')}
function closeAbout(){$('about').classList.remove('open');$('about').setAttribute('aria-hidden','true')}
$('moon').addEventListener('click',openAbout);$('intro-about').addEventListener('click',openAbout);$('about-close').addEventListener('click',closeAbout);
function closePanels(){$('bigmap').classList.remove('on');$('journal').classList.remove('on')}
function toggleMap(){const on=!$('bigmap').classList.contains('on');closePanels();if(on){drawMap($('bigmap-canvas') as HTMLCanvasElement,true);$('bigmap').classList.add('on')}}
function toggleJournal(){const on=!$('journal').classList.contains('on');closePanels();if(on){updateJournal();$('journal').classList.add('on')}}
$('btn-map').addEventListener('click',toggleMap);$('minimap').addEventListener('click',toggleMap);$('bigmap-close').addEventListener('click',closePanels);
$('btn-journal').addEventListener('click',toggleJournal);$('journal-close').addEventListener('click',closePanels);
$('btn-night').addEventListener('click',toggleNight);$('btn-globe').addEventListener('click',()=>mode==='globe'?startWalk():toGlobe());
function updateJournal(){const ol=$('journal-list');ol.innerHTML='';$('journal-count').textContent=`${progress.visited.length}/${SITES.length}`;
  for(const s of SITES){const li=document.createElement('li');const seen=progress.visited.includes(s.id);li.className=seen?'seen':'';const f=progress.futures[s.id];
    li.innerHTML=`<b>${s.name}</b><span>${s.area}</span>${seen?(f!==undefined?`<span class="fut">Futuro: ${DIALOGOS[s.id].bifurcaciones[f].titulo}</span>`:'<span>Visitado · sin futuro elegido</span>'):'<span>Sin visitar</span>'}`;
    if(progress.discovered.includes(s.id)||seen){const b=document.createElement('button');b.textContent='Ir a la puerta';b.onclick=()=>{closePanels();travel(s.id)};li.appendChild(b)}
    ol.appendChild(li)}}
function travel(id:PlaceId){if(mode!=='walk')return;iris(true);setTimeout(()=>{const s=SITES.find(s=>s.id===id)!;const door=doorOf(s),tp=triggerOf(s);const c=s.open?[tp[0]+2.4,tp[1]] as V2:closestRoadPoint(door);
  hero.place(c[0],c[1]);heroFacing=Math.atan2(tp[0]-c[0],tp[1]-c[1]);yaw=heroFacing+Math.PI;doorCooldown=1;followCamera(0,true);iris(false)},560)}

// ── Mapas ──────────────────────────────────────────
const mapBase=document.createElement('canvas');mapBase.width=mapBase.height=900;
{const x=mapBase.getContext('2d')!;const S=900/(DISC_R*2+6),c=450;const m=(v:number)=>c+v*S;
  x.fillStyle='#8e8f8a';x.beginPath();x.arc(c,c,(DISC_R+3)*S,0,7);x.fill();x.fillStyle='#a9c27a';x.beginPath();x.arc(c,c,DISC_R*S,0,7);x.fill();
  for(let i=-DISC_R;i<DISC_R;i+=1.5)for(let j=-DISC_R;j<DISC_R;j+=1.5){const h=terrainHeight(i,j);if(h>.5){x.fillStyle=`rgba(63,110,70,${Math.min(.85,.15+h/22)})`;x.fillRect(m(i),m(j),1.5*S+1,1.5*S+1)}}
  for(const r of WALK_ROADS){x.strokeStyle=r.kind==='sendero'?'#e8dcbf':'#f4efe2';x.lineCap='round';x.lineJoin='round';x.lineWidth=(r.width+1.6)*S;x.beginPath();r.pts.forEach((p,i)=>i?x.lineTo(m(p[0]),m(p[1])):x.moveTo(m(p[0]),m(p[1])));x.stroke();
    if(r.kind!=='sendero'){x.strokeStyle=r.kind==='avenida'?'#6c6c6a':'#7d7d7a';x.lineWidth=r.width*S;x.stroke()}}
  for(const h of HOUSES){const fp=footprint(h.pos,h.size,h.rot);x.fillStyle='#c98d6a';x.beginPath();fp.forEach((p,i)=>i?x.lineTo(m(p[0]),m(p[1])):x.moveTo(m(p[0]),m(p[1])));x.fill()}
  for(const l of LANDMARKS){const fp=footprint(l.pos,l.size,l.rot);x.fillStyle='#b98d72';x.beginPath();if(l.round){x.arc(m(l.pos[0]),m(l.pos[1]),l.size[0]/2*S,0,7)}else fp.forEach((p,i)=>i?x.lineTo(m(p[0]),m(p[1])):x.moveTo(m(p[0]),m(p[1])));x.fill()}
  for(const s of SITES){x.fillStyle=s.color;x.strokeStyle='#1b1612';x.lineWidth=3;x.beginPath();if(s.open)x.arc(m(s.pos[0]),m(s.pos[1]),7*S,0,7);else footprint(s.pos,s.size,s.rot).forEach((p,i)=>i?x.lineTo(m(p[0]),m(p[1])):x.moveTo(m(p[0]),m(p[1])));x.closePath();x.fill();x.stroke()}
}
function drawMap(cv:HTMLCanvasElement,big:boolean){const x=cv.getContext('2d')!;const W=cv.width;const S=W/(DISC_R*2+6),c=W/2,m=(v:number)=>c+v*S;
  x.clearRect(0,0,W,W);x.drawImage(mapBase,0,0,W,W);
  for(const s of SITES){const tp=triggerOf(s);const seen=progress.visited.includes(s.id),disc=progress.discovered.includes(s.id);
    x.fillStyle=seen?'#20382e':disc?'#f1c93b':'rgba(255,255,255,.6)';x.strokeStyle='#1b1612';x.lineWidth=big?3:2;x.beginPath();x.arc(m(tp[0]),m(tp[1]),big?11:9,0,7);x.fill();x.stroke();
    if(big&&(disc||seen)){x.font='400 26px Bangers, sans-serif';x.textAlign='center';x.lineWidth=5;x.strokeStyle='#f6f0e1';x.strokeText(s.name,m(s.pos[0]),m(s.pos[1])-(s.open?60:30));x.fillStyle='#1b1612';x.fillText(s.name,m(s.pos[0]),m(s.pos[1])-(s.open?60:30))}}
  const p=hero.root.position;x.save();x.translate(m(p.x),m(p.z));x.rotate(-heroFacing+Math.PI);x.fillStyle='#c8453c';x.strokeStyle='#fff';x.lineWidth=3;
  const k=big?1.4:1.2;x.beginPath();x.moveTo(0,-16*k);x.lineTo(10*k,10*k);x.lineTo(0,5*k);x.lineTo(-10*k,10*k);x.closePath();x.fill();x.stroke();x.restore();
  if(!big){x.globalCompositeOperation='destination-in';x.beginPath();x.arc(c,c,c,0,7);x.fill();x.globalCompositeOperation='source-over'}
}
($('bigmap-canvas') as HTMLCanvasElement).addEventListener('click',e=>{const cv=e.currentTarget as HTMLCanvasElement;const r=cv.getBoundingClientRect();const S=(DISC_R*2+6)/r.width;
  const wx=(e.clientX-r.left-r.width/2)*S,wz=(e.clientY-r.top-r.height/2)*S;let best:PlaceId|null=null,bd=7;
  for(const s of SITES){const tp=triggerOf(s);const d=Math.hypot(tp[0]-wx,tp[1]-wz);if(d<bd&&(progress.discovered.includes(s.id)||progress.visited.includes(s.id))){bd=d;best=s.id}}
  if(best){closePanels();travel(best)}else toast('Ese lugar aún no ha sido descubierto: acércate caminando.')});

// ── Objetivo y nombre de calle ─────────────────────
function updateObjective(){const p=hero.root.position;let best:typeof SITES[number]|null=null,bd=1e9;
  for(const s of SITES){if(progress.visited.includes(s.id))continue;const tp=triggerOf(s);const d=Math.hypot(tp[0]-p.x,tp[1]-p.z);if(d<bd){bd=d;best=s}}
  if(!best){$('obj-name').textContent='Ciudad completa';$('obj-dist').textContent='✓';$('obj-arrow').style.transform='';return}
  const tp=triggerOf(best);$('obj-name').textContent=best.name;$('obj-dist').textContent=`${Math.round(bd)} m`;
  const ang=Math.atan2(tp[0]-p.x,tp[1]-p.z);const rel=ang-(yaw+Math.PI);$('obj-arrow').style.transform=`rotate(${-rel*180/Math.PI+180}deg)`;
  let road='',rd=9;for(const r of ROADS){const c=closestOnRoad([p.x,p.z],r);if(c.d<rd){rd=c.d;road=r.name}}$('street').textContent=road;
}

// ── Día y noche ────────────────────────────────────
const litMat=clay(P.windowLit,{emissive:0xffb24a,ei:0,key:'lit'});
function toggleNight(){night=!night;toast(night?'Cae la noche sobre Bogotá':'Amanece sobre los cerros')}
function updateLight(dt:number){nightK=T.MathUtils.damp(nightK,night?1:0,2.5,dt);
  hemi.intensity=1.35-nightK*1.08;sun.intensity=2.6-nightK*2.35;renderer.toneMappingExposure=1.05-nightK*.22;hemi.color.set('#fbf6ec').lerp(new T.Color('#9fb0e8'),nightK);sun.color.set('#fff1dc').lerp(new T.Color('#8fa6ff'),nightK);fillL.intensity=.55-nightK*.3;
  (scene.background as T.Color).copy(BG_DAY).lerp(BG_NIGHT,nightK);scene.environmentIntensity=.35-nightK*.25;
  litMat.emissiveIntensity=.2+nightK*1.6;for(const m of city.lampLights)m.emissiveIntensity=nightK*2.2;}

// ── Modos ──────────────────────────────────────────
function startWalk(){if(mode!=='intro'&&mode!=='globe')return;(document.activeElement as HTMLElement|null)?.blur?.();const from=mode;mode='transition';iris(true);$('intro').classList.remove('on');
  setTimeout(()=>{orbit.enabled=false;city.world.rotation.y=0;mode='walk';applyOffset();document.body.classList.add('walking');if(from==='intro'){yaw=0;heroFacing=Math.PI;pitch=.48}followCamera(0,true);iris(false);
    if(!progress.visited.length)toast('Camina con W A S D o las flechas. Sigue la flecha dorada hasta el primer escenario.')},600)}
function toGlobe(){if(mode!=='walk')return;mode='transition';iris(true);setTimeout(()=>{mode='globe';document.body.classList.remove('walking');orbit.enabled=true;camera.position.set(-40,95,215);orbit.target.set(0,-14,0);orbit.update();iris(false);toast('Vista del globo · pulsa el globo o Enter para volver a caminar')},560)}
$('start').addEventListener('click',startWalk);

// ── Bucle ──────────────────────────────────────────
const clock=new T.Clock();let mapT=0;
function frame(){
  const dt=Math.min(.05,clock.getDelta()),t=clock.elapsedTime;
  if(mode==='scene'||(mode==='transition'&&director.place)){renderer.toneMappingExposure=1.05;director.update(dt,t,innerWidth,innerHeight);renderer.render(director.scene,director.camera);requestAnimationFrame(frame);return}
  if(mode==='intro'||mode==='globe'){city.world.rotation.y+=dt*(mode==='intro'?.06:.02);orbit.update();hero.drive(false,0,heroFacing,dt,t)}
  if(mode==='walk'){moveHero(dt,t);followCamera(dt);camera.aspect=innerWidth/innerHeight;mapT-=dt;if(mapT<=0){drawMap($('minimap') as HTMLCanvasElement,false);updateObjective();mapT=.1}}
  updateDoors(t,dt);updateLight(dt);
  for(const w of walkers){const L=roadLen(w.road);w.d+=w.dir*w.speed*dt;if(w.d>L-1||w.d<1){w.dir*=-1;w.d=Math.max(1,Math.min(L-1,w.d))}
    const a=roadAt(w.road,w.d);const off=w.road.width/2+.55;w.p.root.position.set(a.x-a.dz*off*w.side,0,a.z+a.dx*off*w.side);
    w.p.drive(true,w.speed/1.5,Math.atan2(a.dx*w.dir,a.dz*w.dir),dt,t)}
  for(const v of vehicles){const a=roadAt(v.road,v.d);const hx=hero.root.position.x,hz=hero.root.position.z;
    const ahead=roadAt(v.road,(v.d+v.dir*4+v.len)%v.len);const lane=v.road.width*.25*v.dir;
    const near=Math.hypot(ahead.x-a.dz*lane-hx,ahead.z+a.dx*lane-hz)<3.2;
    v.wait=near?1:Math.max(0,v.wait-dt);if(!v.wait)v.d=(v.d+v.dir*v.speed*dt+v.len)%v.len;
    v.o.position.set(a.x-a.dz*lane,terrainHeight(a.x,a.z),a.z+a.dx*lane);v.o.rotation.y=Math.atan2(a.dx*v.dir,a.dz*v.dir)}
  for(const lb of city.labels){const d=camera.position.distanceTo(lb.position);const s=T.MathUtils.clamp(d*.075,4.5,mode==='walk'?13:30);lb.scale.set(s,s*.28,1);
    (lb.material as T.SpriteMaterial).opacity=mode==='walk'?T.MathUtils.clamp((d-6)/8,0,1):1}
  for(const g of city.futures.values()){const st=g.getObjectByName('estrella');if(st){st.rotation.y+=dt*2;st.position.y=3.8+Math.sin(t*2)*.12}}
  renderer.render(scene,camera);requestAnimationFrame(frame);
}
function applyOffset(){const shift=mode==='intro'&&innerWidth>760?-innerWidth*.2:0;if(shift)camera.setViewOffset(innerWidth,innerHeight,shift,0,innerWidth,innerHeight);else camera.clearViewOffset();camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);applyOffset()});applyOffset();
updateJournal();requestAnimationFrame(frame);
document.fonts?.ready.then(()=>{for(const lb of city.labels)((lb.material as T.SpriteMaterial).map as T.Texture).needsUpdate=true});
setTimeout(()=>$('loader').classList.add('done'),300);

// ── Ganchos de prueba ──────────────────────────────
(window as any).__BOGOTA_TEST__={
  state:()=>({mode,nightK:+nightK.toFixed(2),sunI:+sun.intensity.toFixed(2),hero:[+hero.root.position.x.toFixed(2),+hero.root.position.z.toFixed(2)],nearDoor,dist:+dist.toFixed(2),director:director.state(),progress,layout:report}),
  walk:()=>startWalk(),teleport:(x:number,z:number,face=0)=>{hero.place(x,z);heroFacing=face;yaw=face+Math.PI;followCamera(0,true)},
  enter:(id:PlaceId)=>{if(mode!=='walk'){mode='walk'}enterSite(id)},next:()=>director.next(),choose:(i:number)=>director.choose(i),finish:()=>director.finish(),
  setView:(y:number,p:number,d:number)=>{yaw=y;pitch=p;distWant=d;followCamera(0,true)},night:()=>toggleNight(),
  globe:()=>{camera.position.set(-40,95,215);orbit.target.set(0,-14,0);orbit.update()},
};
}catch(err){console.error(err);$('loader').classList.add('done');$('error').hidden=false;$('error-message').textContent=String((err as Error)?.message||err);$('retry').addEventListener('click',()=>location.reload())}
