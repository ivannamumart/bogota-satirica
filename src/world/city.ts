/** El globo-maqueta: base de cemento, meseta urbana, cerros, vías, vegetación y edificios. */
import * as T from 'three';
import {Batch,clay,rbox,mesh,P,signTexture} from './kit';
import {DISC_R,SPHERE_R,SPHERE_CUT,ROADS,PATHS,SITES,LANDMARKS,PLAZAS,doorOf,triggerOf,closestOnRoad,type Road,type Site,type PlaceId} from '../data/layout';
import {HOUSES,TREES,terrainHeight,rng} from '../data/world';
import {buildSite,buildLandmark,buildHouse} from './buildings';

export interface CityRefs{
  world:T.Group; sites:Map<PlaceId,T.Group>; doors:Map<PlaceId,{marker:T.Group;pos:T.Vector3;site:Site}>;
  labels:T.Sprite[]; lampLights:T.MeshStandardMaterial[]; occluders:{box:T.Box3;group:T.Object3D}[]; futures:Map<PlaceId,T.Group>;
}
const up=new T.Vector3(0,1,0);

function noise2(x:number,z:number){return Math.sin(x*.21+Math.cos(z*.17))*.5+Math.sin(z*.13-x*.07)*.5}

function buildGlobe(world:T.Group){
  // casquete inferior de cemento gris (esfera cortada arriba)
  const theta0=Math.acos(SPHERE_CUT/SPHERE_R);
  const geo=new T.SphereGeometry(SPHERE_R,120,64,0,Math.PI*2,theta0,Math.PI-theta0);
  const pos=geo.attributes.position as T.BufferAttribute;
  for(let i=0;i<pos.count;i++){const v=new T.Vector3().fromBufferAttribute(pos,i);const n=v.clone().normalize();
    const k=1+(Math.sin(v.x*.31)*Math.sin(v.y*.27)*Math.sin(v.z*.29))*.006;v.copy(n.multiplyScalar(SPHERE_R*k));pos.setXYZ(i,v.x,v.y,v.z)}
  geo.computeVertexNormals();
  const base=mesh(geo,clay(P.cement,{rough:.95}),0,-SPHERE_CUT,0,false,true);base.name='globo_cemento';world.add(base);
  // capa verde del borde (como una lámina de arcilla sobre el globo)
  const lip=mesh(new T.CylinderGeometry(DISC_R+.25,DISC_R+.05,1.1,160,1,true),clay(P.grassDark),0,-.55,0,false,true);world.add(lip);
  const lipTop=mesh(new T.TorusGeometry(DISC_R+.1,.42,10,160),clay(P.grass),0,-.08,0,false,true);lipTop.rotation.x=Math.PI/2;world.add(lipTop);
}

function buildGround(world:T.Group){
  const rings=120,segs=260;const verts:number[]=[],cols:number[]=[],idx:number[]=[];const c=new T.Color();
  const cG=new T.Color(P.grass),cGD=new T.Color(P.grassDark),cGL=new T.Color(P.grassLight),cH=new T.Color(P.hill),cHD=new T.Color(P.hillDark),cHL=new T.Color(P.hillLight);
  verts.push(0,0,0);c.copy(cG);cols.push(c.r,c.g,c.b);
  for(let i=1;i<=rings;i++){const r=DISC_R*Math.pow(i/rings,.9);
    for(let j=0;j<segs;j++){const a=j/segs*Math.PI*2;const x=Math.cos(a)*r,z=Math.sin(a)*r;const h=terrainHeight(x,z);verts.push(x,h,z);
      const n=noise2(x,z);
      if(h>.4){const k=Math.min(1,h/20);c.copy(cHD).lerp(cH,.5+n*.25).lerp(cHL,Math.max(0,k-.55)*2.2)}
      else{c.copy(cG).lerp(n>0?cGL:cGD,Math.abs(n)*.55)}
      cols.push(c.r,c.g,c.b)}}
  for(let j=0;j<segs;j++)idx.push(0,1+(j+1)%segs,1+j);
  for(let i=1;i<rings;i++)for(let j=0;j<segs;j++){const a=1+(i-1)*segs+j,b=1+(i-1)*segs+(j+1)%segs,cc=1+i*segs+j,d=1+i*segs+(j+1)%segs;idx.push(a,b,cc,b,d,cc)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('color',new T.Float32BufferAttribute(cols,3));geo.setIndex(idx);geo.computeVertexNormals();
  const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.92});
  const ground=new T.Mesh(geo,m);ground.receiveShadow=true;ground.castShadow=true;ground.name='suelo';world.add(ground);
}

/** Cinta vial con aceras, juntas redondeadas y líneas discontinuas. */
function buildRoads(world:T.Group){
  const b=new Batch();
  const yAt=(x:number,z:number)=>terrainHeight(x,z);
  const strip=(r:Road,half:number,y:number,mat:T.Material)=>{
    for(let i=0;i<r.pts.length-1;i++){const [ax,az]=r.pts[i],[bx,bz]=r.pts[i+1];const L=Math.hypot(bx-ax,bz-az);if(L<.01)continue;
      const nx=-(bz-az)/L*half,nz=(bx-ax)/L*half;const ya=yAt(ax,az)+y,yb=yAt(bx,bz)+y;
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([ax+nx,ya,az+nz, bx+nx,yb,bz+nz, bx-nx,yb,bz-nz, ax-nx,ya,az-nz],3));
      g.setAttribute('normal',new T.Float32BufferAttribute([0,1,0,0,1,0,0,1,0,0,1,0],3));g.setIndex([0,1,2,0,2,3]);b.add(g,mat);}
    for(const [x,z] of r.pts){const c=new T.CircleGeometry(half,24);c.rotateX(-Math.PI/2);c.translate(x,yAt(x,z)+y,z);b.add(c,mat)}
  };
  for(const r of [...ROADS,...PATHS]){
    const walkEdge=r.width/2+(r.kind==='sendero'?.2:.9);
    if(r.kind!=='sendero'){strip(r,walkEdge+.25,.03,clay(P.curb));strip(r,walkEdge,.05,clay(P.sidewalk));strip(r,r.width/2,.08,clay(r.kind==='avenida'?P.asphalt:P.asphaltDark,{rough:.95}))}
    else strip(r,walkEdge,.06,clay('#d9cdb0'));
    if(r.kind==='avenida'){
      for(let i=0;i<r.pts.length-1;i++){const [ax,az]=r.pts[i],[bx,bz]=r.pts[i+1];const L=Math.hypot(bx-ax,bz-az);const ang=Math.atan2(bx-ax,bz-az);
        for(let d=1;d<L-.6;d+=3.2){const x=ax+(bx-ax)*d/L,z=az+(bz-az)*d/L;const dash=new T.BoxGeometry(.22,.04,1.3);dash.rotateY(ang);dash.translate(x,yAt(x,z)+.1,z);b.add(dash,clay(P.line))}}
    }
  }
  for(const p of PLAZAS){const c=new T.CylinderGeometry(p.r,p.r,.1,40);c.translate(p.pos[0],.06,p.pos[1]);b.add(c,clay(p.id==='plaza_parque'?'#d8ceb4':'#ddd3bd'));
    if(p.id!=='plaza_parque'){const rr=new T.TorusGeometry(p.r-.15,.08,6,40);rr.rotateX(Math.PI/2);rr.translate(p.pos[0],.12,p.pos[1]);b.add(rr,clay('#bfb29a'))}}
  // césped interior del parque y senderos radiales
  const lawn=new T.RingGeometry(2.8,6.2,40);lawn.rotateX(-Math.PI/2);lawn.translate(-15,.13,-8);b.add(lawn,clay(P.grassLight));
  for(let i=0;i<4;i++){const s=new T.BoxGeometry(1.3,.06,4);s.translate(0,.15,4.4);s.rotateY(i*Math.PI/2+Math.PI/4);s.translate(-15,0,-8);b.add(s,clay('#d8ceb4'))}
  const roads=b.build('vias',false,true);world.add(roads);
}

function treeGeo(kind:string,s:number,R:()=>number){
  const parts:{g:T.BufferGeometry;c:string}[]=[];
  const blob=(r:number,x:number,y:number,z:number,sy=1,c=P.green)=>{const gg=new T.IcosahedronGeometry(r,2);gg.scale(1,sy,1);gg.translate(x,y,z);parts.push({g:gg,c})};
  const trunk=(h:number,r=.16)=>{const gg=new T.CylinderGeometry(r*.7,r,h,8);gg.translate(0,h/2,0);parts.push({g:gg,c:P.trunk})};
  if(kind==='eucalipto'){trunk(3.2*s,.17);blob(.9*s,0,3.4*s,0,1.5,'#6f9a72');blob(.7*s,.4*s,4.4*s,.1,1.4,'#7ea880');blob(.6*s,-.3*s,2.7*s,.3,1.2,'#5f8a63')}
  else if(kind==='urapan'){trunk(1.6*s);blob(1.25*s,0,2.5*s,0,.95,'#5f9a4c');blob(.8*s,.6*s,2.9*s,.2,1,'#73ad5b')}
  else if(kind==='pino'){trunk(1*s,.14);for(let i=0;i<3;i++){const gg=new T.ConeGeometry((1.1-i*.28)*s,1.6*s,10);gg.translate(0,(1.5+i*.9)*s,0);parts.push({g:gg,c:i%2?'#3f7048':'#4b7d50'})}}
  else if(kind==='sauce'){trunk(1.5*s,.18);blob(1.3*s,0,2.4*s,0,.85,'#8fb06a');blob(1*s,0,1.9*s,0,1.1,'#9cbd76')}
  else {blob(.7*s,0,.5*s,0,.8,R()<.5?'#6b9a55':'#7aa85e');blob(.45*s,.45*s,.4*s,.2,.8,'#86b366')}
  return parts;
}

function buildVegetation(world:T.Group){
  const b=new Batch();const R=rng(7);const m=new T.Matrix4();
  for(const t of TREES){const parts=treeGeo(t.kind,t.s,R);m.makeRotationY(R()*6.28).setPosition(t.pos[0],t.y-.05,t.pos[1]);for(const p of parts)b.add(p.g,clay(p.c),m)}
  // árboles que asoman por el costado del globo, como en la maqueta de referencia
  const theta0=Math.acos(SPHERE_CUT/SPHERE_R);
  for(let i=0;i<70;i++){const th=theta0+.05+R()*.75,ph=R()*Math.PI*2;
    const n=new T.Vector3(Math.sin(th)*Math.cos(ph),Math.cos(th),Math.sin(th)*Math.sin(ph));const p=n.clone().multiplyScalar(SPHERE_R-.1).add(new T.Vector3(0,-SPHERE_CUT,0));
    const q=new T.Quaternion().setFromUnitVectors(up,n.clone().lerp(up,.35).normalize());m.compose(p,q,new T.Vector3(1,1,1));
    for(const part of treeGeo(R()<.5?'arbusto':'urapan',.8+R()*.5,R))b.add(part.g,clay(part.c),m)}
  world.add(b.build('vegetacion',true,true));
}

function buildLamps(world:T.Group,refs:CityRefs){
  const b=new Batch();const glass=clay('#fff1c9',{emissive:0xffc865,ei:.0,key:'farol'});refs.lampLights.push(glass);
  for(const r of ROADS.filter(r=>r.kind==='avenida')){
    for(let i=0;i<r.pts.length-1;i++){const [ax,az]=r.pts[i],[bx,bz]=r.pts[i+1];const L=Math.hypot(bx-ax,bz-az);const nx=-(bz-az)/L,nz=(bx-ax)/L;
      const step=r.id==='anillo'?L+1:11;
      for(let d=r.id==='anillo'?L/2:5;d<L-1;d+=step){const side=(Math.floor(d/step)+i)%2?1:-1;const off=r.width/2+1.45;
        const x=ax+(bx-ax)*d/L+nx*off*side,z=az+(bz-az)*d/L+nz*off*side;if(terrainHeight(x,z)>.2)continue;
        if(PATHS.some(pp=>closestOnRoad([x,z],pp).d<pp.width/2+.8)||PLAZAS.some(pl=>Math.hypot(pl.pos[0]-x,pl.pos[1]-z)<pl.r+.8))continue;
        if(r.id==='anillo'&&(i%3))continue;
        const post=new T.CylinderGeometry(.07,.1,3.6,8);post.translate(x,1.8,z);b.add(post,clay('#2f3a36'));
        const head=new T.SphereGeometry(.28,12,8);head.translate(x,3.75,z);b.add(head,glass);
        const cap=new T.ConeGeometry(.34,.3,10);cap.translate(x,4.08,z);b.add(cap,clay('#2f3a36'))}}
  }
  world.add(b.build('faroles',true,false));
}

/** Rótulo flotante que identifica el lugar desde lejos. */
function label(text:string,sub:string){
  const c=document.createElement('canvas');c.width=640;c.height=180;const x=c.getContext('2d')!;
  x.fillStyle='rgba(247,241,226,.96)';x.beginPath();x.roundRect(8,8,624,130,26);x.fill();x.lineWidth=6;x.strokeStyle='#3b2f27';x.stroke();
  x.beginPath();x.moveTo(300,136);x.lineTo(320,172);x.lineTo(340,136);x.closePath();x.fillStyle='rgba(247,241,226,.96)';x.fill();x.stroke();
  x.fillStyle='rgba(247,241,226,1)';x.fillRect(296,128,48,12);
  x.fillStyle='#3b2f27';x.textAlign='center';x.font='400 62px "Bangers", "Arial Black", sans-serif';x.fillText(text,320,76);
  x.font='italic 400 30px "Instrument Serif", Georgia, serif';x.fillStyle='#7d5a44';x.fillText(sub,320,118);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
  const s=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(7.2,2.03,1);s.renderOrder=5;return s;
}

function doorMarker(){
  const g=new T.Group();
  const ring=new T.Mesh(new T.RingGeometry(1.05,1.35,40),new T.MeshBasicMaterial({color:0xffcf5a,transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.16;ring.name='anillo';g.add(ring);
  const fill=new T.Mesh(new T.CircleGeometry(1.05,40),new T.MeshBasicMaterial({color:0xffe9a8,transparent:true,opacity:.35,depthWrite:false}));fill.rotation.x=-Math.PI/2;fill.position.y=.15;g.add(fill);
  const gem=new T.Mesh(new T.OctahedronGeometry(.42,0),new T.MeshStandardMaterial({color:0xffc94a,emissive:0xff9f1a,emissiveIntensity:.55,roughness:.4}));gem.scale.y=1.5;gem.position.y=3.6;gem.name='gema';gem.castShadow=true;g.add(gem);
  return g;
}

export function createCity():CityRefs{
  const world=new T.Group();world.name='mundo';
  const refs:CityRefs={world,sites:new Map(),doors:new Map(),labels:[],lampLights:[],occluders:[],futures:new Map()};
  buildGlobe(world);buildGround(world);buildRoads(world);buildVegetation(world);buildLamps(world,refs);
  for(const s of SITES){const o=buildSite(s);o.position.set(s.pos[0],0,s.pos[1]);o.rotation.y=s.rot;
    o.traverse(c=>{const mm=c as T.Mesh;if(mm.isMesh){mm.castShadow=mm.castShadow!==false;mm.receiveShadow=true}});
    world.add(o);refs.sites.set(s.id,o);
    const dp=doorOf(s);const mk=doorMarker();mk.position.set(dp[0],0,dp[1]);if(s.open){const tp=triggerOf(s);mk.position.set(tp[0],0,tp[1])}world.add(mk);
    refs.doors.set(s.id,{marker:mk,pos:mk.position.clone(),site:s});
    const lb=label(s.name,s.area);lb.position.set(s.pos[0],(s.open?6.5:s.height+ (s.id==='porciuncula'?9:s.id==='unicornio'?5:4.2)),s.pos[1]);world.add(lb);refs.labels.push(lb);
    if(!s.open){o.updateMatrixWorld(true);refs.occluders.push({box:new T.Box3().setFromObject(o),group:o})}
    const fut=new T.Group();fut.name='futuro_'+s.id;fut.position.set(dp[0],0,dp[1]);world.add(fut);refs.futures.set(s.id,fut);
  }
  const houses=new Batch();
  for(const l of LANDMARKS){const o=buildLandmark(l);o.position.set(l.pos[0],0,l.pos[1]);o.rotation.y=l.rot;o.updateMatrixWorld(true);houses.addMesh(o)}
  for(const h of HOUSES){const o=buildHouse(h.size,h.floors,h.style);o.position.set(h.pos[0],0,h.pos[1]);o.rotation.y=h.rot;o.updateMatrixWorld(true);houses.addMesh(o)}
  const hb=houses.build('casas_e_hitos');world.add(hb);
  // Monserrate en la cima de los cerros
  const mx=50,mz=-8,my=terrainHeight(mx,mz);const mon=new T.Group();
  mon.add(mesh(rbox(2.4,1.6,3.4,.15),clay(P.white),0,.8,0));mon.add(mesh(new T.ConeGeometry(1.9,1.1,4),clay(P.tileDark),0,2.1,0).rotateY(Math.PI/4));
  mon.add(mesh(rbox(1,3,1,.1),clay(P.white),0,1.5,1.6));mon.add(mesh(new T.ConeGeometry(.75,1,4),clay(P.tileDark),0,3.5,1.6).rotateY(Math.PI/4));
  mon.position.set(mx,my-.3,mz);mon.rotation.y=-Math.PI/2;mon.traverse(c=>{(c as T.Mesh).castShadow=true});world.add(mon);
  const ml=label('MONSERRATE','Cerros Orientales · no transitable');ml.position.set(mx,my+6,mz);ml.scale.multiplyScalar(.85);world.add(ml);refs.labels.push(ml);
  return refs;
}

/** Rótulo del futuro elegido, que transforma la ciudad tras cada decisión. */
export function futurePlaque(text:string){
  const g=new T.Group();
  const tex=signTexture(text,{bg:'#20382e',fg:'#ffe08a',border:'#ffe08a',w:1024,h:200});
  const m=new T.MeshStandardMaterial({map:tex,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.35,roughness:.6});
  const board=new T.Mesh(rbox(4.6,.9,.14,.05),[clay('#20382e'),clay('#20382e'),clay('#20382e'),clay('#20382e'),m,m]);board.position.y=2.9;board.castShadow=true;g.add(board);
  for(const x of [-2,2])g.add(mesh(new T.CylinderGeometry(.06,.06,2.6,8),clay('#20382e'),x,1.3,0));
  const star=new T.Mesh(new T.IcosahedronGeometry(.35,0),new T.MeshStandardMaterial({color:0xffe08a,emissive:0xffb800,emissiveIntensity:.8}));star.position.y=3.8;star.name='estrella';g.add(star);
  return g;
}
