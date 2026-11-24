/** Arquitectura bogotana de época para cada escenario y los hitos. Todo en coordenadas locales:
 * la fachada principal mira hacia +z y la puerta queda centrada en z = +fondo/2. */
import * as T from 'three';
import {clay,rbox,mesh,P,signTexture} from './kit';
import type {Site,Landmark} from '../data/layout';

const g=()=>new T.Group();
const box=(w:number,h:number,d:number,c:string,x=0,y=0,z=0,r=.15)=>mesh(rbox(w,h,d,r),clay(c),x,y+h/2,z);
const cyl=(rt:number,rb:number,h:number,c:string,x=0,y=0,z=0,seg=20)=>mesh(new T.CylinderGeometry(rt,rb,h,seg),clay(c),x,y+h/2,z);
export const glassMat=()=>clay(P.window,{rough:.35,key:'glass'});
export const litMat=()=>clay(P.windowLit,{emissive:0xffb24a,ei:0,key:'lit'});

/** Rejilla de ventanas sobre un plano de fachada. */
function windows(parent:T.Object3D,w:number,h:number,z:number,cols:number,rows:number,y0:number,opts:{ww?:number;wh?:number;frame?:string;rotY?:number;x0?:number}={}){
  const ww=opts.ww??.8,wh=opts.wh??1.05;const grp=g();
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const x=(opts.x0??0)-w/2+(c+.5)*w/cols,y=y0+(r+.5)*h/rows;
    const lit=(r*7+c*3)%5===0;
    const fr=mesh(rbox(ww+.18,wh+.18,.12,.05),clay(opts.frame??P.white),x,y,z);grp.add(fr);
    const gl=mesh(new T.BoxGeometry(ww,wh,.08),lit?litMat():glassMat(),x,y,z+.05,false);grp.add(gl);
  }
  if(opts.rotY)grp.rotation.y=opts.rotY;parent.add(grp);return grp;
}
function door(parent:T.Object3D,z:number,w=1.5,h=2.4,color=P.wood){
  const d=g();
  d.add(mesh(rbox(w+.5,h+.35,.2,.08),clay(P.white),0,(h+.35)/2,z));
  const leaf=mesh(rbox(w,h,.2,.06),clay(color),0,h/2,z+.08);leaf.name='puerta';d.add(leaf);
  // umbral luminoso: indica que se puede entrar
  const glow=new T.Mesh(new T.PlaneGeometry(w*.92,h*.9),new T.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.0,depthWrite:false}));
  glow.position.set(0,h/2,z+.2);glow.name='umbral';d.add(glow);
  parent.add(d);return d;
}
function hipRoof(w:number,d:number,h:number,color=P.tile){
  const geo=new T.ConeGeometry(1,1,4,1);geo.rotateY(Math.PI/4);geo.scale(w*.72,h,d*.72);
  return mesh(geo,clay(color),0,h/2,0);
}
function gableRoof(w:number,d:number,h:number,color=P.tile){
  const s=new T.Shape();s.moveTo(-w/2-.3,0);s.lineTo(0,h);s.lineTo(w/2+.3,0);s.lineTo(-w/2-.3,0);
  const geo=new T.ExtrudeGeometry(s,{depth:d+.5,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:2});geo.translate(0,0,-(d+.5)/2);
  return mesh(geo,clay(color),0,0,0);
}
function sign(text:string,w:number,h:number,opts:Parameters<typeof signTexture>[1]={},glow=false){
  const tex=signTexture(text,{...opts,w:1024,h:Math.round(1024*h/w)});
  const m=new T.MeshStandardMaterial({map:tex,roughness:.7,emissive:glow?0xffffff:0x000000,emissiveMap:glow?tex:null,emissiveIntensity:glow?.55:0});
  const o=new T.Mesh(rbox(w,h,.16,.06),[clay('#3b2f27'),clay('#3b2f27'),clay('#3b2f27'),clay('#3b2f27'),m,clay('#3b2f27')]);o.castShadow=true;return o;
}
function balcony(parent:T.Object3D,x:number,y:number,z:number,w=1.8){
  parent.add(mesh(rbox(w,.18,.9,.05),clay(P.wood),x,y,z+.4));
  for(let i=0;i<=6;i++)parent.add(mesh(new T.BoxGeometry(.07,.7,.07),clay(P.woodDark),x-w/2+i*w/6,y+.4,z+.8));
  parent.add(mesh(rbox(w,.1,.12,.03),clay(P.woodDark),x,y+.8,z+.82));
}
function columns(parent:T.Object3D,n:number,w:number,h:number,z:number,y=0,r=.28,c=P.white){
  for(let i=0;i<n;i++){const x=-w/2+i*w/(n-1);parent.add(cyl(r,r*1.1,h,c,x,y,z,16));parent.add(box(r*2.8,.28,r*2.8,c,x,y+h,z,.06))}
}
function pediment(w:number,h:number,d:number,c=P.white){
  const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(0,h);s.lineTo(w/2,0);s.lineTo(-w/2,0);
  const geo=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.06,bevelThickness:.06,bevelSegments:2});return mesh(geo,clay(c));
}
function stepsUp(parent:T.Object3D,w:number,z:number,n=3,c=P.white){for(let i=0;i<n;i++)parent.add(box(w-i*.4,.2,1.4-i*.4,c,0,i*.2,z+.7-i*.2,.05))}
function awning(parent:T.Object3D,w:number,y:number,z:number,c1:string,c2:string){
  const n=Math.round(w/.6);for(let i=0;i<n;i++){const s=mesh(new T.BoxGeometry(w/n,.08,1.3),clay(i%2?c1:c2),-w/2+(i+.5)*w/n,y,z+.6);s.rotation.x=.32;parent.add(s)}
}

// ── Escenarios ───────────────────────────────────────────────────
export function buildSite(s:Site):T.Group{
  const o=g();o.name='sitio_'+s.id;const [w,d]=s.size,h=s.height,f=d/2;
  switch(s.id){
  case 'unicornio':{ // discoteca setentera: estuco malva, fachada curva y neón
    o.add(box(w,h,d,'#b58fae',0,0,0,.5));
    o.add(box(w+.4,.5,d+.4,'#8d6b88',0,h,0,.2));
    const front=mesh(new T.CylinderGeometry(3.6,3.6,h*.86,32,1,false,-Math.PI/2,Math.PI),clay('#c9a5c2'),0,h*.43,f-1.6);o.add(front);
    for(let i=0;i<9;i++){const a=-Math.PI/2+i*Math.PI/8;o.add(mesh(new T.SphereGeometry(.16,10,8),clay('#fff1c1',{emissive:0xffcc66,ei:.9,key:'bulb'}),Math.sin(a)*3.75,h*.86,f-1.6+Math.cos(a)*3.75,false))}
    const sg=sign('EL UNICORNIO',7.5,1.6,{bg:'#2c1f3a',fg:'#ff9ad5',border:'#ff9ad5'},true);sg.position.set(0,h+1.6,f-.6);o.add(sg);
    windows(o,w-8,h*.5,f+.05,2,1,h*.32,{x0:-5,frame:'#8d6b88'});windows(o,w-8,h*.5,f+.05,2,1,h*.32,{x0:5,frame:'#8d6b88'});
    door(o,f+2.05,2,2.6,'#3a2440');break;}
  case 'porciuncula':{ // iglesia neogótica de ladrillo con torre
    o.add(box(w,h*.75,d-3,P.brick,0,0,-1.5,.2));
    const roof=gableRoof(w,d-3,3.2,P.tileDark);roof.position.set(0,h*.75,-1.5);o.add(roof);
    const tw=4.2;o.add(box(tw,h*1.25,3.2,P.brickLight,0,0,f-1.6,.2));
    const spire=mesh(new T.ConeGeometry(2.1,5.5,4),clay(P.brickDark),0,h*1.25+2.75,f-1.6);spire.rotation.y=Math.PI/4;o.add(spire);
    o.add(mesh(new T.BoxGeometry(.18,1.6,.18),clay('#e9d9a6'),0,h*1.25+6.2,f-1.6));o.add(mesh(new T.BoxGeometry(.9,.18,.18),clay('#e9d9a6'),0,h*1.25+6.3,f-1.6));
    for(const sx of [-1,1]){o.add(mesh(new T.ConeGeometry(.5,2,4),clay(P.brickDark),sx*(w/2-.3),h*.75+1,f-3.2));o.add(box(1,h*.75,1,P.brickDark,sx*(w/2-.3),0,f-3.2,.1))}
    const rose=mesh(new T.CylinderGeometry(1.05,1.05,.2,24),clay('#6a87a6',{rough:.4}),0,h*.95,f+.01);rose.rotation.x=Math.PI/2;o.add(rose);
    for(const sx of [-1,1])for(let i=0;i<3;i++){const wnd=mesh(rbox(.9,2.4,.15,.4),clay('#6a87a6',{rough:.4}),sx*(w/2+.02),2.8,-d/2+2.5+i*2.6);wnd.rotation.y=Math.PI/2;o.add(wnd)}
    const arch=mesh(rbox(2.4,3.6,.4,1),clay(P.brickDark),0,1.8,f+.05);o.add(arch);
    door(o,f+.25,1.7,2.9,'#5b3b25');stepsUp(o,4.6,f+.2,3,'#d8d2c4');break;}
  case 'casa_familiar':{ // casona republicana blanca, teja y balcones
    o.add(box(w,h*.62,d,P.stucco,0,0,0,.2));
    o.add(box(w+.3,.35,d+.3,P.cream,0,h*.62,0,.1));
    const roof=hipRoof(w+1.6,d+1.6,3.2);roof.position.y=h*.62+.2;o.add(roof);
    windows(o,w,h*.25,f+.05,4,1,.6,{frame:P.wood,ww:.9,wh:1.4});
    for(const x of [-3.6,-1.2,1.2,3.6])balcony(o,x,h*.32,f,1.6);
    windows(o,w,h*.25,f+.05,4,1,h*.33,{frame:P.wood,ww:.9,wh:1.3});
    o.add(box(w+2,.9,1.4,P.green,0,0,f+1.4,.4).translateX(0));
    door(o,f+.05,1.8,2.6,P.woodDark);break;}
  case 'apartamento':{ // edificio de ladrillo de La Soledad
    o.add(box(w,h,d,P.brickLight,0,0,0,.25));o.add(box(w+.5,.4,d+.5,P.cream,0,h,0,.12));
    for(let fl=1;fl<4;fl++)o.add(box(w+.25,.22,d+.25,P.cream,0,fl*h/4,0,.06));
    windows(o,w,h-1,f+.05,3,4,.5,{frame:P.cream,ww:1.3,wh:1.25});
    for(let fl=1;fl<4;fl++){o.add(box(2.6,.18,1.1,P.cream,2.6,fl*h/4,f+.55,.06));o.add(box(2.6,.55,.12,P.cream,2.6,fl*h/4+.18,f+1.05,.04))}
    windows(o,d,h-1,w/2+.05,3,4,.5,{frame:P.cream,ww:1.2,wh:1.2,rotY:Math.PI/2});
    o.add(box(3,.25,1.6,P.cream,0,2.6,f+.8,.08));
    door(o,f+.05,1.6,2.4,'#4d5b52');break;}
  case 'taller':{ // taller con cubierta de diente de sierra
    o.add(box(w,h*.7,d,P.brick,0,0,0,.2));
    for(let i=0;i<3;i++){const s=new T.Shape();s.moveTo(0,0);s.lineTo(0,2);s.lineTo(d/3,0);s.lineTo(0,0);
      const geo=new T.ExtrudeGeometry(s,{depth:w,bevelEnabled:false});geo.rotateY(-Math.PI/2);geo.translate(w/2,h*.7,-d/2+i*d/3);
      o.add(mesh(geo,clay(i%2?P.cementDark:P.cement)));o.add(mesh(new T.BoxGeometry(w-.4,1.8,.06),glassMat(),0,h*.7+.95,-d/2+i*d/3+.04,false))}
    windows(o,w,h*.5,f+.05,3,1,.9,{frame:P.cement,ww:2,wh:2.6});
    const easel=g();easel.add(mesh(new T.BoxGeometry(.1,2.2,.1),clay(P.wood),-.4,1.1,0));easel.add(mesh(new T.BoxGeometry(.1,2.2,.1),clay(P.wood),.4,1.1,0));
    easel.add(mesh(rbox(1.3,1,.08,.03),clay('#e9b64c'),0,1.5,.08));easel.position.set(3.2,0,f+1.2);easel.rotation.y=-.4;o.add(easel);
    const sg=sign('TALLER',3.2,.8,{bg:'#e9dfc8'});sg.position.set(0,h*.7-.7,f+.12);o.add(sg);
    door(o,f+.05,2.2,2.6,'#3f5b6e');break;}
  case 'septima':{ // edificio esquinero con café y paradero
    o.add(box(w,h,d,P.cream,0,0,0,.2));o.add(box(w+.4,.4,d+.4,P.white,0,h,0,.1));
    windows(o,w,h*.45,f+.05,3,1,h*.5,{frame:P.white});
    o.add(mesh(rbox(w-1,2.4,.1,.05),glassMat(),0,1.7,f+.04,false));
    awning(o,w-.6,3.25,f,'#c8453c','#f3ead2');
    const sg=sign('CAFÉ · LA SÉPTIMA',5.8,.9,{bg:'#f3ead2',fg:'#7d2a22'});sg.position.set(0,3.95,f+.1);o.add(sg);
    door(o,f+.1,1.5,2.4,'#7d2a22');
    // paradero de bus junto a la acera
    const st=g();st.add(mesh(rbox(3.4,.15,1.3,.05),clay('#2f5d50'),0,2.45,0));
    st.add(mesh(new T.BoxGeometry(.12,2.4,.12),clay('#2f5d50'),-1.5,1.2,-.5));st.add(mesh(new T.BoxGeometry(.12,2.4,.12),clay('#2f5d50'),1.5,1.2,-.5));
    st.add(mesh(rbox(3,.12,.5,.04),clay(P.wood),0,.55,-.35));const sg2=sign('PARADERO',1.6,.4,{bg:'#f3ead2',fg:'#2f5d50'});sg2.position.set(0,2.85,0);st.add(sg2);
    st.position.set(-3.1,0,f+1.05);o.add(st);break;}
  case 'oasis':{ // bar con neón naranja
    o.add(box(w,h,d,'#d7a46a',0,0,0,.25));o.add(box(w+.4,.45,d+.4,'#a56f3f',0,h,0,.12));
    windows(o,w,h*.35,f+.05,3,1,h*.55,{frame:'#a56f3f'});
    o.add(mesh(rbox(3,2.2,.1,.05),clay('#ffcf8a',{emissive:0xff9a3c,ei:.6,key:'oasisglass'}),-2.8,1.6,f+.04,false));
    o.add(mesh(rbox(3,2.2,.1,.05),clay('#ffcf8a',{emissive:0xff9a3c,ei:.6,key:'oasisglass'}),2.8,1.6,f+.04,false));
    const sg=sign('EL OASIS',4.8,1.3,{bg:'#3b1d12',fg:'#ff9b3d',border:'#ff9b3d'},true);sg.position.set(0,h+1.25,f-.4);o.add(sg);
    const sg2=sign('MUSIC BAR · COMIDA · DANCING',6.4,.62,{bg:'#f3ead2',fg:'#3b1d12'});sg2.position.set(0,3.3,f+.12);o.add(sg2);
    awning(o,2.6,2.95,f,'#2f5d50','#f3ead2');
    door(o,f+.05,1.6,2.4,'#3b1d12');break;}
  case 'cementerio':{ // muro blanco y pórtico neoclásico
    const wallH=2.4;o.add(box(w,wallH,.6,P.white,0,0,f-.3,.15));o.add(box(w,wallH,.6,P.white,0,0,-f+.3,.15));
    o.add(box(.6,wallH,d,P.white,-w/2+.3,0,0,.15));o.add(box(.6,wallH,d,P.white,w/2-.3,0,0,.15));
    o.add(box(5,4.2,1.6,P.white,0,0,f-.6,.15));const ped=pediment(5.6,1.5,1.4);ped.position.set(0,4.2,f-1.3);o.add(ped);
    columns(o,4,4.4,3.6,f+.45,0,.22);o.add(box(5.2,.4,1.2,P.white,0,3.6,f+.3,.08));
    o.add(mesh(new T.BoxGeometry(.14,1.1,.14),clay(P.white),0,6.3,f-.6));o.add(mesh(new T.BoxGeometry(.6,.14,.14),clay(P.white),0,6.5,f-.6));
    for(const [x,z,hh] of [[-4.5,-1.5,2.6],[4.5,-1.6,3],[-1.6,-2.4,2.2],[2.2,-.2,2],[-4.2,1.4,1.8]] as const){o.add(box(1.6,hh,1.6,'#ece7dc',x,0,z,.12));o.add(pediment(1.9,.6,1.4,'#ece7dc').translateX(x).translateY(hh).translateZ(z-.7))}
    for(const [x,z] of [[-6,-3],[6,-3],[-6,2.5],[6,2.6],[0,-3.4]] as const){o.add(cyl(.12,.15,1,P.trunk,x,0,z,8));o.add(mesh(new T.ConeGeometry(.55,3.4,10),clay('#3e6a43'),x,2.6,z))}
    door(o,f+.25,1.9,2.9,'#3e3e3c');break;}
  case 'oficina':{ // torre de oficinas moderna
    o.add(box(w,h,d,'#e3dcc9',0,0,0,.25));o.add(box(w-1,1.2,d-1,'#cfc6b0',0,h,0,.2));
    for(const side of [0,1,2,3]){const grp=g();windows(grp,w-1,h-4,f+.05,4,7,3.4,{frame:'#cfc6b0',ww:1.15,wh:1.2});grp.rotation.y=side*Math.PI/2;o.add(grp)}
    o.add(mesh(rbox(w-.6,2.8,.1,.05),glassMat(),0,1.5,f+.04,false));o.add(box(w+1,.3,2,'#cfc6b0',0,3,f+.9,.08));
    const sg=sign('MINISTERIO DE ASUNTOS VARIOS',6.6,.55,{bg:'#f3ead2'});sg.position.set(0,3.6,f+.12);o.add(sg);
    door(o,f+.1,1.8,2.5,'#4d5b52');break;}
  case 'jockey':{ // club neoclásico de la élite
    o.add(box(w,h*.7,d,P.cream,0,0,0,.2));o.add(box(w+.6,.5,d+.6,P.white,0,h*.7,0,.12));
    const roof=hipRoof(w+.6,d+.6,2.2,'#7d8f8a');roof.position.y=h*.7+.4;o.add(roof);
    columns(o,6,w-3.4,h*.62,f+1.25,0,.3);o.add(box(w-2,.5,2.8,P.white,0,h*.62,f+1.1,.1));
    const ped=pediment(w-2,1.8,2.4);ped.position.set(0,h*.62+.45,f-.1);o.add(ped);
    windows(o,w,h*.25,f+.05,5,1,h*.36,{frame:P.white,ww:.8,wh:1.6});
    for(const x of [-w/2-.6,w/2+.6]){o.add(cyl(.06,.06,6,'#ddd',x,0,f+1,6));const fl=mesh(new T.BoxGeometry(1.5,.9,.04),clay(x<0?'#f1c93b':'#2c4f8a'),x+.8,5.4,f+1);o.add(fl)}
    const sg=sign('JOCKEY CLUB',4.2,.75,{bg:'#20382e',fg:'#f1e2b3',border:'#c9b06a'});sg.position.set(0,h*.62+.25,f+2.55);o.add(sg);
    stepsUp(o,7,f+2,3);door(o,f+.05,1.8,2.7,'#20382e');break;}
  case 'parque':{ // templete y fuente, sin muros
    o.add(cyl(2.3,2.5,.4,'#e6dfcf',0,0,0,32));
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;o.add(cyl(.14,.16,2.6,P.white,Math.cos(a)*1.8,.4,Math.sin(a)*1.8,10))}
    o.add(mesh(new T.SphereGeometry(2.1,24,12,0,Math.PI*2,0,Math.PI/2),clay('#b9c7c0'),0,3,0));
    o.add(cyl(2.15,2.15,.3,P.white,0,2.9,0,32));o.add(mesh(new T.SphereGeometry(.25,12,8),clay('#e9d9a6'),0,5.2,0));
    for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/4;const b=g();b.add(mesh(rbox(1.6,.12,.5,.04),clay(P.wood),0,.5,0));b.add(mesh(rbox(1.6,.5,.1,.04),clay(P.wood),0,.8,-.22));
      b.add(mesh(new T.BoxGeometry(.1,.5,.4),clay('#333'),-.7,.25,0));b.add(mesh(new T.BoxGeometry(.1,.5,.4),clay('#333'),.7,.25,0));b.position.set(Math.cos(a)*5.6,0,Math.sin(a)*5.6);b.rotation.y=-a-Math.PI/2;o.add(b)}
    break;}
  }
  return o;
}

export function buildLandmark(l:Landmark):T.Group{
  const o=g();o.name='hito_'+l.id;const [w]=l.size,h=l.height;
  if(l.id==='plaza_toros'){
    o.add(cyl(w/2,w/2,h,P.brick,0,0,0,40));o.add(cyl(w/2+.15,w/2+.15,.35,P.brickLight,0,h,0,40));
    for(let i=0;i<20;i++){const a=i/20*Math.PI*2;const ar=mesh(rbox(.9,1.6,.3,.4),clay('#6b3a26'),Math.cos(a)*(w/2+.02),h*.55,Math.sin(a)*(w/2+.02));ar.rotation.y=-a+Math.PI/2;o.add(ar)}
    o.add(cyl(w/2-1.2,w/2-1.2,.2,'#d9b98a',0,h-.05,0,40));
    const flag=mesh(new T.BoxGeometry(.9,.55,.04),clay('#f1c93b'),.5,h+2.3,0);o.add(cyl(.05,.05,2.6,'#ddd',0,h,0,6));o.add(flag);
  }else if(l.id.startsWith('torre_')){
    // Torres del Parque: ladrillo escalonado
    const steps=5;for(let i=0;i<steps;i++){const r=w/2*(1-i*.11);o.add(cyl(r,r,h/steps,i%2?P.brick:P.brickLight,0,i*h/steps,0,28));
      for(let k=0;k<10;k++){const a=k/10*Math.PI*2+i*.2;const wn=mesh(rbox(.55,.7,.1,.05),glassMat(),Math.cos(a)*(r+.02),i*h/steps+h/steps*.5,Math.sin(a)*(r+.02),false);wn.rotation.y=-a+Math.PI/2;o.add(wn)}}
  }else if(l.id==='museo_nacional'){
    const d=l.size[1];o.add(box(w,h,d,'#d9cdb2',0,0,0,.15));
    for(let i=0;i<9;i++)o.add(box(.6,.6,.6,'#d9cdb2',-w/2+.3+i*(w-.6)/8,h,d/2-.3,.05));
    for(let i=0;i<9;i++)o.add(box(.6,.6,.6,'#d9cdb2',-w/2+.3+i*(w-.6)/8,h,-d/2+.3,.05));
    o.add(box(2.4,h+1.6,2,'#cfc2a5',0,0,d/2-.6,.15));windows(o,w,h*.5,d/2+.05,8,1,h*.3,{frame:'#bba98a',ww:.5,wh:1.1});
    o.add(mesh(rbox(1.4,2.2,.2,.6),clay(P.woodDark),0,1.1,d/2+.42));
    const sg=sign('MUSEO NACIONAL',3.4,.55,{bg:'#f3ead2'});sg.position.set(0,h+.9,d/2+.45);o.add(sg);
  }else if(l.id==='tequendama'){
    const d=l.size[1];o.add(box(w,h,d,'#d2d6d6',0,0,0,.25));
    for(const side of [0,1,2,3]){const grp=g();windows(grp,w-.6,h-2,d/2+.05,5,12,1.4,{frame:'#b7bebf',ww:.9,wh:1.05});grp.rotation.y=side*Math.PI/2;o.add(grp)}
    o.add(box(w-1,1,d-1,'#b7bebf',0,h,0,.2));o.add(cyl(.05,.05,3,'#999',1.6,h+1,0,6));o.add(cyl(.05,.05,2.2,'#999',-1.4,h+1,.8,6));
  }
  return o;
}

/** Casa bogotana de relleno (republicana o de ladrillo). */
export function buildHouse(size:[number,number],floors:number,style:number):T.Group{
  const o=g();const [w,d]=size,fh=2.7,h=floors*fh;
  const wall=[P.stucco,P.brickLight,P.cream,'#e7d3b8'][style],roofC=[P.tile,P.tileDark,P.tile,'#a65a3d'][style];
  o.add(box(w,h,d,wall,0,0,0,.2));
  const roof=style===1?gableRoof(w,d,1.8,roofC):hipRoof(w+1.1,d+1.1,2);roof.position.y=h;o.add(roof);
  windows(o,w,h-.6,d/2+.05,2,floors,.4,{frame:style===1?P.cream:P.wood,ww:.8,wh:1.1});
  if(floors>1&&style!==1)balcony(o,0,fh+.1,d/2,1.6);
  o.add(mesh(rbox(1,2,.15,.05),clay(P.woodDark),0,1,d/2+.03));
  if(style===0||style===2){o.add(cyl(.12,.12,.9,'#9b9b9b',w/2-.6,h+.3,-d/4,8))}
  return o;
}
