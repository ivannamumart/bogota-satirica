/** Utilería de escenario para las viñetas 3D. */
import * as T from 'three';
import {clay,rbox,mesh,P,signTexture} from '../world/kit';

export const grp=()=>new T.Group();
export const bx=(w:number,h:number,d:number,c:string,x=0,y=0,z=0,r=.08)=>mesh(rbox(w,h,d,r),clay(c),x,y+h/2,z);
export const cy=(rt:number,rb:number,h:number,c:string,x=0,y=0,z=0,s=20)=>mesh(new T.CylinderGeometry(rt,rb,h,s),clay(c),x,y+h/2,z);
export const sp=(r:number,c:string,x=0,y=0,z=0)=>mesh(new T.SphereGeometry(r,16,12),clay(c),x,y,z);

/** Habitación en corte: piso y dos paredes (fondo e izquierda). */
export function room(o:{floor:string;wall:string;wall2?:string;w?:number;d?:number;h?:number;skirting?:string;pattern?:'tablas'|'damero'|'baldosa'}){
  const g=grp();const w=o.w??15,d=o.d??11,h=o.h??6;
  g.add(bx(w,.3,d,o.floor,0,-.3,0,.05));
  if(o.pattern==='tablas')for(let i=0;i<w/1.2;i++)g.add(mesh(new T.BoxGeometry(.03,.012,d),clay('#6d4c33'),-w/2+i*1.2,.003,0,false));
  if(o.pattern==='damero')for(let i=0;i<w;i++)for(let j=0;j<d;j++)if((i+j)%2)g.add(mesh(new T.BoxGeometry(1,.012,1),clay('#2b2b2e'),-w/2+i+.5,.005,-d/2+j+.5,false));
  if(o.pattern==='baldosa')for(let i=0;i<w/1.5;i++)for(let j=0;j<d/1.5;j++)if((i+j)%2)g.add(mesh(new T.BoxGeometry(1.5,.012,1.5),clay('#b5674a'),-w/2+i*1.5+.75,.005,-d/2+j*1.5+.75,false));
  g.add(bx(w,h,.3,o.wall,0,0,-d/2-.15,.05));
  g.add(bx(.3,h,d,o.wall2??o.wall,-w/2-.15,0,0,.05));
  g.add(bx(w,.35,.12,o.skirting??'#5b4636',0,0,-d/2+.06,.03));
  return g;
}
export function windowFrame(w:number,h:number,sky:string,opts:{mountains?:boolean;night?:boolean;sun?:boolean}={}){
  const g=grp();g.add(bx(w+.4,h+.4,.2,'#efe7d6',0,-.2,0,.05));
  const c=document.createElement('canvas');c.width=256;c.height=192;const x=c.getContext('2d')!;
  const grd=x.createLinearGradient(0,0,0,192);grd.addColorStop(0,sky);grd.addColorStop(1,opts.night?'#2a2440':'#f6d6a6');x.fillStyle=grd;x.fillRect(0,0,256,192);
  if(opts.sun){x.fillStyle='#ffb36b';x.beginPath();x.arc(170,120,24,0,7);x.fill()}
  if(opts.night){x.fillStyle='#fff';for(let i=0;i<40;i++)x.fillRect(Math.random()*256,Math.random()*110,2,2)}
  if(opts.mountains!==false){x.fillStyle=opts.night?'#1f2a2c':'#5f8f62';x.beginPath();x.moveTo(0,192);for(let i=0;i<=8;i++)x.lineTo(i*32,110+Math.sin(i*1.7)*22-(i===5?30:0));x.lineTo(256,192);x.fill();
    x.fillStyle=opts.night?'#14191a':'#4f7a50';x.beginPath();x.moveTo(0,192);for(let i=0;i<=8;i++)x.lineTo(i*32,140+Math.cos(i*1.3)*14);x.lineTo(256,192);x.fill();}
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
  const pane=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:t}));pane.position.set(0,h/2,.11);g.add(pane);
  g.add(bx(.08,h,.1,'#efe7d6',0,0,.15,.02));g.add(bx(w,.08,.1,'#efe7d6',0,h/2-.04,.15,.02));return g;
}
export function poster(text:string,w:number,h:number,bg:string,fg='#2a2018'){
  const t=signTexture(text,{bg,fg,w:512,h:Math.round(512*h/w),border:fg});const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:t,roughness:.8}));return m;
}
export function table(w=1.6,d=1,h=.78,c=P.wood,round=false){const g=grp();
  if(round){g.add(cy(w/2,w/2,.08,c,0,h-.08,0,24));g.add(cy(.06,.08,h-.08,'#3a2a20'));g.add(cy(.35,.35,.04,'#3a2a20'))}
  else{g.add(bx(w,.08,d,c,0,h-.08,0,.03));for(const sx of [-1,1])for(const sz of [-1,1])g.add(bx(.08,h-.08,.08,c,sx*(w/2-.1),0,sz*(d/2-.1),.02))}
  return g}
export function chair(c=P.woodDark,cushion?:string){const g=grp();g.add(bx(.5,.07,.5,c,0,.45,0,.02));if(cushion)g.add(bx(.45,.06,.45,cushion,0,.52,0,.03));
  g.add(bx(.5,.6,.07,c,0,.5,-.22,.02));for(const sx of [-1,1])for(const sz of [-1,1])g.add(bx(.05,.45,.05,c,sx*.2,0,sz*.2,.01));return g}
export function sofa(c:string,w=2.2){const g=grp();g.add(bx(w,.45,.9,c,0,0,0,.15));g.add(bx(w,.8,.25,c,0,.3,-.35,.12));for(const sx of [-1,1])g.add(bx(.25,.65,.9,c,sx*(w/2-.12),0,0,.1));return g}
export function bed(){const g=grp();g.add(bx(2.2,.45,2.6,'#6d4c33',0,0,0,.08));g.add(bx(2.1,.25,2.5,'#f1ece0',0,.45,0,.12));
  g.add(bx(2.15,.18,1.7,'#b3874f',0,.62,.4,.12));g.add(bx(.8,.18,.45,'#fbf8ee',-.5,.7,-.95,.09));g.add(bx(.8,.18,.45,'#fbf8ee',.5,.7,-.95,.09));
  g.add(bx(2.2,1.2,.15,'#6d4c33',0,0,-1.3,.06));return g}
export function shelf(w=1.6,h=2.2){const g=grp();g.add(bx(w,h,.4,'#6d4c33',0,0,0,.04));const cols=['#a33b2c','#2f5d8a','#d9a441','#3e6a43','#efe6d0','#6b3f6b'];
  for(let r=0;r<4;r++)for(let i=0;i<7;i++){const bh=.3+((i*7+r*3)%4)*.04;g.add(bx(.13,bh,.3,cols[(i+r*2)%cols.length],-w/2+.18+i*.2,.12+r*h/4,.05,.01))}return g}
export function lamp(c='#d9a441'){const g=grp();g.add(cy(.03,.03,1.5,'#333'));g.add(cy(.2,.2,.04,'#333'));g.add(mesh(new T.ConeGeometry(.3,.35,16,1,true),clay(c,{emissive:0xffc27a,ei:.5,key:'lampshade'}),0,1.55,0));return g}
export function plant(){const g=grp();g.add(cy(.22,.17,.4,'#b5674a'));for(let i=0;i<6;i++){const l=sp(.22,'#4f7a46',Math.cos(i)*.15,.55+i*.06,Math.sin(i)*.15);l.scale.set(.6,1.4,.6);g.add(l)}return g}
export function typewriter(){const g=grp();g.add(bx(.55,.18,.42,'#2f3a36',0,0,0,.05));g.add(bx(.5,.08,.2,'#1d2523',0,.18,-.08,.03));g.add(cy(.05,.05,.6,'#111',0,.3,-.16,10).rotateZ(Math.PI/2));
  g.add(bx(.36,.35,.01,'#fbf8ee',0,.3,-.14,.003));return g}
export function easel(color:string){const g=grp();g.add(bx(.06,1.9,.06,'#7a5236',-.35,0,0,.02));g.add(bx(.06,1.9,.06,'#7a5236',.35,0,0,.02));g.add(bx(.06,1.8,.06,'#7a5236',0,0,-.45,.02));
  g.add(bx(.9,1.1,.05,color,0,.85,.06,.02));g.add(bx(.5,.4,.06,'#fbf8ee',.12,1.15,.09,.02));g.add(bx(.25,.6,.06,'#2f5d8a',-.2,1,.1,.02));return g}
export function chessTable(){const g=table(.9,.9,.75);for(let i=0;i<8;i++)for(let j=0;j<8;j++)g.add(mesh(new T.BoxGeometry(.09,.012,.09),clay((i+j)%2?'#2a2420':'#efe6d0'),-.315+i*.09,.755,-.315+j*.09,false));
  for(let i=0;i<10;i++){const c=i%2?'#2a2420':'#efe6d0';g.add(cy(.022,.03,.08,c,-.3+((i*37)%8)*.09,.76,-.3+((i*13)%8)*.09,8))}return g}
export function bottles(n=8){const g=grp();const cs=['#3e6a43','#7a3b2e','#c9a64a','#2f5d8a','#e8dcc0'];for(let i=0;i<n;i++){const c=cs[i%cs.length];g.add(cy(.07,.08,.3,c,i*.22,0,0,10));g.add(cy(.025,.03,.14,c,i*.22,.3,0,8))}return g}
export function chandelier(){const g=grp();g.add(cy(.02,.02,1,'#c9b06a',0,0,0,6));g.add(mesh(new T.TorusGeometry(.6,.04,8,24),clay('#c9b06a'),0,0,0).rotateX(Math.PI/2));
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;g.add(sp(.08,'#fff4cf',Math.cos(a)*.6,.1,Math.sin(a)*.6))}g.children.forEach(c=>c.castShadow=false);return g}
export function column(h=5,c=P.white){const g=grp();g.add(cy(.3,.34,h,c,0,0,0,18));g.add(bx(.85,.3,.85,c,0,h,0,.05));g.add(bx(.85,.25,.85,c,0,0,0,.05));return g}
export function cypress(){const g=grp();g.add(cy(.08,.1,.6,P.trunk));const c=mesh(new T.ConeGeometry(.5,3.2,12),clay('#3e6a43'),0,2.1,0);g.add(c);return g}
export function tree(){const g=grp();g.add(cy(.15,.2,2,P.trunk));const a=sp(1.3,'#5f9a4c',0,2.8,0);a.scale.y=.9;g.add(a);g.add(sp(.9,'#73ad5b',.6,3.2,.3));return g}
export function grave(c='#e3ded2'){const g=grp();g.add(bx(.9,.25,1.8,c,0,0,0,.05));g.add(bx(.8,1,.18,c,0,.2,-.8,.08));g.add(bx(.08,.5,.08,c,0,1.2,-.8,.02));g.add(bx(.35,.08,.08,c,0,1.35,-.8,.02));return g}
export function car(c:string){const g=grp();g.add(bx(1.7,.55,3.4,c,0,.25,0,.22));g.add(bx(1.45,.5,1.8,c,0,.75,-.2,.2));
  g.add(mesh(new T.BoxGeometry(1.4,.38,1.82),clay('#4b5a66',{rough:.3}),0,1,-.2,false));for(const sx of [-1,1])for(const sz of [-1,1])g.add(cy(.3,.3,.22,'#222',sx*.82,.3,sz*1.1,14).rotateZ(Math.PI/2));
  g.add(sp(.12,'#fff1c9',-.55,.6,1.7));g.add(sp(.12,'#fff1c9',.55,.6,1.7));return g}
export function bus(){const g=grp();g.add(bx(2.3,2.2,6.5,'#d8c14a',0,.35,0,.35));g.add(bx(2.32,.5,6.52,'#2f5d50',0,.6,0,.2));
  for(let i=0;i<5;i++)for(const sx of [-1,1])g.add(mesh(new T.BoxGeometry(.05,.7,.9),clay('#4b5a66',{rough:.3}),sx*1.16,1.85,-2.4+i*1.15,false));
  for(const sx of [-1,1])for(const sz of [-1,1])g.add(cy(.42,.42,.3,'#222',sx*1.05,.42,sz*2.2,14).rotateZ(Math.PI/2));
  const s=poster('CHAPINERO · CENTRO',1.9,.35,'#f3ead2');s.position.set(0,2.3,3.27);g.add(s);return g}
export function phoneBooth(){const g=grp();g.add(bx(1.1,2.4,1,'#2f5d8a',0,0,0,.08));g.add(mesh(new T.BoxGeometry(.9,1.6,.05),clay('#9ab3c9',{rough:.3}),0,1.3,.5,false));
  const s=poster('TELÉFONO',.9,.22,'#f3ead2','#2f5d8a');s.position.set(0,2.25,.52);g.add(s);return g}
export function discoBall(){const g=grp();g.add(cy(.01,.01,1,'#aaa'));const b=mesh(new T.IcosahedronGeometry(.45,1),new T.MeshStandardMaterial({color:0xdddddd,metalness:.9,roughness:.15,flatShading:true}),0,-.45,0);b.name='bola';g.add(b);return g}
export function rain(n=600,area=[16,10,12]){const geo=new T.BufferGeometry();const p=new Float32Array(n*3);for(let i=0;i<n;i++){p[i*3]=(Math.random()-.5)*area[0];p[i*3+1]=Math.random()*area[1];p[i*3+2]=(Math.random()-.5)*area[2]}
  geo.setAttribute('position',new T.BufferAttribute(p,3));const m=new T.PointsMaterial({color:0xcfe0f0,size:.06,transparent:true,opacity:.7,depthWrite:false});const o=new T.Points(geo,m);o.name='lluvia';
  o.userData.tick=(dt:number)=>{const a=geo.attributes.position as T.BufferAttribute;for(let i=0;i<n;i++){let y=a.getY(i)-dt*14;if(y<0)y+=area[1];a.setY(i,y)}a.needsUpdate=true};return o}
