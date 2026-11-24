/** Personajes articulados de plastilina con animación procedimental:
 * caminar, gesticular, hablar, mirar, sentarse, bailar y sostener objetos. */
import * as T from 'three';
import {clay,rbox} from './kit';

export type HairStyle='largo'|'melena'|'afro'|'corto'|'calvo'|'mono'|'canoso'|'bob'|'tonsura';
export interface Look{
  skin:string;hair:string;hairStyle:HairStyle;top:string;top2?:string;bottom:string;shoes?:string;
  outfit:'chaqueta'|'cuello'|'vestido'|'sotana'|'traje'|'ruana'|'bata'|'falda';
  beard?:'bigote'|'barba'|'patillas';glasses?:boolean;hat?:'boina'|'sombrero';tie?:string;scale?:number;necklace?:boolean;heavy?:number;
}
export type Gesture='señalar'|'encogerse'|'brazosArriba'|'cruzarBrazos'|'jarras'|'beber'|'brindar'|'pensar'|'facepalm'|'saludar'|'asentir'|'negar'|'reverencia'|'explicar'|'reir'|'fumar'|'escribir'|'leer'|'rezar'|'llamar'|'abrazarse'|'sorpresa';
type Item='vaso'|'cigarrillo'|'periodico'|'libro'|'paraguas'|'pincel'|'telefono'|'papel'|'correa'|'pieza';

const ease=(t:number)=>t<0?0:t>1?1:t*t*(3-2*t);
const env=(p:number,a=.18,b=.18)=>p<a?ease(p/a):p>1-b?ease((1-p)/b):1;

export class Person{
  root=new T.Group();name:string;look:Look;
  private hips=new T.Group();private spine=new T.Group();private neck=new T.Group();private head=new T.Group();
  private sh:[T.Group,T.Group]=[new T.Group(),new T.Group()];private el:[T.Group,T.Group]=[new T.Group(),new T.Group()];
  private hand:[T.Group,T.Group]=[new T.Group(),new T.Group()];
  private hipJ:[T.Group,T.Group]=[new T.Group(),new T.Group()];private knee:[T.Group,T.Group]=[new T.Group(),new T.Group()];
  private mouth!:T.Mesh;private brows:T.Mesh[]=[];private eyes:T.Mesh[]=[];
  // estado
  base:'idle'|'walk'|'sit'|'dance'|'lie'='idle';
  private phase=Math.random()*10;private walkBlend=0;private speedNow=0;
  private target:T.Vector3|null=null;private speed=1.4;private onArrive?:()=>void;
  private facing=0;private facingTarget:number|null=null;
  private look3:T.Vector3|null=null;talking=false;private talkT=0;
  private gesture:{g:Gesture;t:number;dur:number;loop:boolean}|null=null;
  private items=new Map<Item,T.Object3D>();private blinkT=Math.random()*4;
  private cur:Record<string,number>={};
  private seatY=0;
  constructor(name:string,look:Look){
    this.name=name;this.look=look;this.root.name='persona_'+name;this.build();
    const s=look.scale??1;this.root.scale.setScalar(s);
  }
  private part(g:T.BufferGeometry,color:string,parent:T.Object3D,x=0,y=0,z=0){const m=new T.Mesh(g,clay(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
  private build(){
    const L=this.look,W=L.heavy??1;
    const long=L.outfit==='sotana'||L.outfit==='vestido'||L.outfit==='bata'||L.outfit==='ruana';
    this.root.add(this.hips);this.hips.position.y=.92;
    // pelvis
    this.part(rbox(.42*W,.22,.26*W,.1),L.outfit==='vestido'||L.outfit==='falda'?L.top:L.bottom,this.hips,0,-.02,0);
    // piernas
    for(const i of [0,1] as const){const sx=i?.12:-.12;const hj=this.hipJ[i];hj.position.set(sx*W,-.08,0);this.hips.add(hj);
      const legC=L.outfit==='vestido'||L.outfit==='falda'?(L.bottom):L.bottom;
      this.part(new T.CapsuleGeometry(.085,.3,4,10),legC,hj,0,-.2,0);
      const k=this.knee[i];k.position.y=-.42;hj.add(k);
      // pantalón acampanado setentero
      const shin=new T.CylinderGeometry(.08,L.outfit==='vestido'||L.outfit==='falda'?.075:.12,.4,12);this.part(shin,legC,k,0,-.2,0);
      this.part(rbox(.15,.1,.28,.05),L.shoes??'#3a2a20',k,0,-.43,.05);
    }
    if(L.outfit==='vestido'||L.outfit==='falda'){const sk=new T.CylinderGeometry(.2*W,.33*W,.48,18);this.part(sk,L.top2??L.top,this.hips,0,-.25,0)}
    if(L.outfit==='sotana'||L.outfit==='bata'){const sk=new T.CylinderGeometry(.22*W,.36*W,.86,18);this.part(sk,L.top,this.hips,0,-.45,0)}
    if(L.outfit==='ruana'){const sk=new T.CylinderGeometry(.3,.42,.5,4);sk.rotateY(Math.PI/4);this.part(sk,L.top2??L.top,this.hips,0,.32,0)}
    // tronco
    this.hips.add(this.spine);this.spine.position.y=.08;
    const chestC=L.outfit==='chaqueta'||L.outfit==='traje'?(L.top2??L.top):L.top;
    this.part(rbox(.46*W,.5,.28*W,.13),chestC,this.spine,0,.27,0);
    if(L.outfit==='chaqueta'||L.outfit==='traje'){
      for(const sx of [-1,1]){const lap=this.part(rbox(.19*W,.48,.06,.03),L.top,this.spine,sx*.135*W,.27,.135*W);lap.rotation.z=sx*.06}
    }
    if(L.outfit==='cuello')this.part(new T.CylinderGeometry(.11,.12,.1,14),L.top,this.spine,0,.55,0);
    if(L.tie)this.part(rbox(.06,.3,.03,.01),L.tie,this.spine,0,.32,.15*W);
    if(L.outfit==='sotana'){this.part(new T.CylinderGeometry(.12,.12,.04,14),'#f4f1e8',this.spine,0,.53,0);this.part(rbox(.47*W,.08,.3*W,.03),'#7c2b5a',this.spine,0,.05,0)}
    if(L.outfit==='ruana'){const r=new T.ConeGeometry(.5,.62,4,1,true);r.rotateY(Math.PI/4);this.part(r,L.top2??L.top,this.spine,0,.25,0)}
    if(L.necklace)for(let i=0;i<9;i++){const a=-.9+i*.225;this.part(new T.SphereGeometry(.022,8,6),'#f6f0e0',this.spine,Math.sin(a)*.13,.47-Math.cos(a)*.05,.12)}
    // brazos
    for(const i of [0,1] as const){const sx=i?1:-1;const s=this.sh[i];s.position.set(sx*.27*W,.47,0);this.spine.add(s);
      const sleeve=L.outfit==='vestido'?L.skin:L.top;
      this.part(new T.CapsuleGeometry(.068,.2,4,10),sleeve,s,0,-.14,0);
      const e=this.el[i];e.position.y=-.3;s.add(e);
      this.part(new T.CapsuleGeometry(.06,.18,4,10),L.outfit==='vestido'?L.skin:sleeve,e,0,-.12,0);
      const h=this.hand[i];h.position.y=-.27;e.add(h);this.part(new T.SphereGeometry(.068,12,10),L.skin,h,0,0,0)}
    // cabeza
    this.spine.add(this.neck);this.neck.position.y=.55;this.part(new T.CylinderGeometry(.065,.075,.1,10),L.skin,this.neck,0,.04,0);
    this.neck.add(this.head);this.head.position.y=.1;
    const headM=this.part(new T.SphereGeometry(.2,24,18),L.skin,this.head,0,.17,0);headM.scale.set(1,1.08,1);
    this.part(new T.SphereGeometry(.045,10,8),L.skin,this.head,0,.15,.2); // nariz
    for(const sx of [-1,1]){this.part(new T.SphereGeometry(.035,8,6),L.skin,this.head,sx*.2,.16,0);
      const eye=this.part(new T.SphereGeometry(.028,10,8),'#231a16',this.head,sx*.075,.21,.175);this.eyes.push(eye);
      const brow=this.part(rbox(.08,.018,.02,.008),L.hairStyle==='calvo'?'#6b5243':L.hair,this.head,sx*.075,.27,.18);this.brows.push(brow)}
    this.mouth=this.part(new T.SphereGeometry(.04,12,8),'#6e2d27',this.head,0,.085,.18);this.mouth.scale.set(1.3,.35,.5);
    this.hair(L);
    if(L.beard==='bigote'||L.beard==='barba'){const m=this.part(new T.CapsuleGeometry(.022,.1,4,8),L.hair,this.head,0,.115,.19);m.rotation.z=Math.PI/2}
    if(L.beard==='barba'){const b=this.part(new T.SphereGeometry(.16,16,10,0,Math.PI*2,Math.PI*.45,Math.PI*.55),L.hair,this.head,0,.15,.03);b.scale.set(1.05,1,1.05)}
    if(L.beard==='patillas')for(const sx of [-1,1])this.part(rbox(.04,.12,.06,.02),L.hair,this.head,sx*.19,.17,.04);
    if(L.glasses){for(const sx of [-1,1]){const r=this.part(new T.TorusGeometry(.045,.01,6,16),'#2a2a2a',this.head,sx*.078,.21,.19)}this.part(rbox(.05,.012,.01,.004),'#2a2a2a',this.head,0,.215,.2)}
    if(L.hat==='boina'){const b=this.part(new T.SphereGeometry(.2,16,8,0,Math.PI*2,0,Math.PI/2),'#2d2d33',this.head,.02,.3,-.01);b.scale.set(1.1,.45,1.1);b.rotation.z=-.15}
    if(L.hat==='sombrero'){this.part(new T.CylinderGeometry(.3,.3,.02,20),'#3b3128',this.head,0,.33,0);this.part(new T.CylinderGeometry(.15,.17,.16,16),'#3b3128',this.head,0,.41,0)}
  }
  private hair(L:Look){const c=L.hair,h=this.head;
    const cap=(sy=1,r=.212,phi=Math.PI*.55)=>{const m=this.part(new T.SphereGeometry(r,20,12,0,Math.PI*2,0,phi),c,h,0,.18,-.01);m.scale.y=sy;return m};
    switch(L.hairStyle){
      case 'largo':{cap(1.04);const back=this.part(new T.CapsuleGeometry(.15,.16,6,12),c,h,0,.03,-.1);back.scale.set(1.25,1,.75);for(const sx of [-1,1]){const sd=this.part(new T.CapsuleGeometry(.05,.18,4,8),c,h,sx*.18,.06,-.01);sd.scale.z=1.4}break}
      case 'melena':cap(1.05);this.part(rbox(.44,.5,.2,.09),c,h,0,.0,-.1);for(const sx of [-1,1])this.part(rbox(.1,.46,.2,.05),c,h,sx*.19,.0,.02);break;
      case 'afro':{const m=this.part(new T.IcosahedronGeometry(.31,2),c,h,0,.24,-.05);m.scale.set(1,.92,.95);break}
      case 'corto':cap(1,.212,Math.PI*.42);break;
      case 'bob':cap(1.04);this.part(rbox(.46,.24,.42,.11),c,h,0,.1,-.02);break;
      case 'mono':cap(1,.212,Math.PI*.45);this.part(new T.SphereGeometry(.1,12,10),c,h,0,.38,-.12);break;
      case 'canoso':cap(.95,.212,Math.PI*.38);break;
      case 'tonsura':for(const sx of [-1,1])this.part(rbox(.06,.12,.2,.03),c,h,sx*.19,.2,-.03);this.part(rbox(.3,.12,.07,.03),c,h,0,.2,-.18);break;
      case 'calvo':for(const sx of [-1,1])this.part(rbox(.05,.08,.16,.02),c,h,sx*.195,.2,-.05);break;
    }}

  // ── objetos ───────────────────────────────
  hold(item:Item|null,side:0|1=1){
    for(const [k,o] of this.items){if(o.parent===this.hand[side]){o.removeFromParent();this.items.delete(k)}}
    if(!item)return;const g=new T.Group();
    const add=(geo:T.BufferGeometry,c:string,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,clay(c));m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
    switch(item){
      case 'vaso':add(new T.CylinderGeometry(.05,.04,.13,12),'#e4d3a2',0,-.02,.06);add(new T.CylinderGeometry(.045,.035,.09,12),'#c9862e',0,-.03,.06);break;
      case 'cigarrillo':add(new T.CylinderGeometry(.009,.009,.11,6),'#f6f2e6',.0,-.03,.07).rotation.x=Math.PI/2;add(new T.SphereGeometry(.013,6,4),'#ff7a2a',0,-.03,.13);break;
      case 'periodico':{const m=add(rbox(.32,.42,.02,.01),'#efe8d4',0,-.05,.1);m.rotation.x=-.3;break}
      case 'libro':{const m=add(rbox(.2,.27,.06,.01),'#7a3b2e',0,-.03,.09);m.rotation.x=-.4;break}
      case 'paraguas':add(new T.CylinderGeometry(.012,.012,1.05,6),'#2a2a2a',0,.45,0);add(new T.ConeGeometry(.55,.28,10),'#2c3a54',0,1.0,0);break;
      case 'pincel':add(new T.CylinderGeometry(.01,.012,.3,6),P2.wood,0,0,.08).rotation.x=Math.PI/2.4;add(new T.SphereGeometry(.02,6,4),'#c9452e',0,.1,.18);break;
      case 'telefono':add(rbox(.07,.22,.07,.03),'#222',0,0,.06).rotation.x=.2;break;
      case 'papel':add(rbox(.22,.3,.01,.005),'#fbf8ee',0,-.05,.08).rotation.x=-.5;break;
      case 'pieza':add(new T.CylinderGeometry(.03,.045,.12,10),'#f2efe6',0,0,.05);add(new T.SphereGeometry(.03,8,6),'#f2efe6',0,.08,.05);break;
      case 'correa':add(new T.CylinderGeometry(.008,.008,.9,5),'#7b3c22',0,-.4,.25).rotation.x=.6;break;
    }
    this.hand[side].add(g);this.items.set(item,g);
  }

  // ── órdenes ───────────────────────────────
  walkTo(x:number,z:number,speed=1.35,then?:()=>void){this.target=new T.Vector3(x,this.root.position.y,z);this.speed=speed;this.onArrive=then;if(this.base==='sit'||this.base==='lie')this.base='idle'}
  place(x:number,z:number,face?:number){this.root.position.x=x;this.root.position.z=z;if(face!==undefined){this.facing=face;this.facingTarget=null;this.root.rotation.y=face}}
  face(angle:number){this.facingTarget=angle}
  faceTo(p:T.Vector3|Person){const v=p instanceof Person?p.root.position:p;this.facingTarget=Math.atan2(v.x-this.root.position.x,v.z-this.root.position.z)}
  lookAt(p:T.Vector3|Person|null){this.look3=p===null?null:p instanceof Person?p.headWorld():p.clone()}
  sit(y=.0){this.base='sit';this.seatY=y;this.target=null}
  stand(){if(this.base==='sit'||this.base==='lie')this.base='idle'}
  dance(on=true){this.base=on?'dance':'idle'}
  lie(y=0){this.base='lie';this.seatY=y;this.target=null}
  play(g:Gesture,dur=1.6,loop=false){this.gesture={g,t:0,dur,loop}}
  stopGesture(){this.gesture=null}
  get moving(){return !!this.target}
  headWorld(){const v=new T.Vector3();this.head.getWorldPosition(v);v.y+=.2*(this.look.scale??1);return v}
  topWorld(){const v=new T.Vector3();this.head.getWorldPosition(v);v.y+=.5*(this.look.scale??1);return v}

  update(dt:number,t:number){
    // desplazamiento
    let moving=false;
    if(this.target){const p=this.root.position;const dx=this.target.x-p.x,dz=this.target.z-p.z,d=Math.hypot(dx,dz);
      if(d<.05){this.target=null;const cb=this.onArrive;this.onArrive=undefined;cb?.()}
      else{const st=Math.min(d,this.speed*dt);p.x+=dx/d*st;p.z+=dz/d*st;this.facingTarget=Math.atan2(dx,dz);moving=true;this.speedNow=this.speed}}
    this.setWalking(moving,this.speedNow,dt);
    if(this.facingTarget!==null){const df=Math.atan2(Math.sin(this.facingTarget-this.facing),Math.cos(this.facingTarget-this.facing));this.facing+=df*Math.min(1,dt*7);if(Math.abs(df)<.002)this.facingTarget=null}
    this.root.rotation.y=this.facing;
    this.animate(dt,t);
  }
  /** Para el protagonista controlado por el jugador. */
  drive(moving:boolean,speed:number,facing:number,dt:number,t:number){this.target=null;this.speedNow=speed;this.setWalking(moving,speed,dt);
    const df=Math.atan2(Math.sin(facing-this.facing),Math.cos(facing-this.facing));this.facing+=df*Math.min(1,dt*12);this.root.rotation.y=this.facing;this.animate(dt,t)}
  private setWalking(m:boolean,speed:number,dt:number){this.walkBlend=T.MathUtils.damp(this.walkBlend,m?1:0,10,dt);if(m){this.phase+=dt*speed*4.6}}

  private animate(dt:number,t:number){
    const tg:Record<string,number>={};const set=(k:string,v:number)=>{tg[k]=v};
    const wb=this.walkBlend,ph=this.phase,sw=Math.sin(ph),run=Math.min(1.6,this.speedNow/1.6);
    // reposo: respiración y peso
    const br=Math.sin(t*1.7+this.phase*.1);
    set('hipsY',.92+br*.004);set('spX',.03*br);set('spZ',Math.sin(t*.5)*.015);set('spY',0);
    set('sh0x',.05);set('sh1x',.05);set('sh0z',-.12);set('sh1z',.12);set('el0',-.18);set('el1',-.18);
    set('hip0',0);set('hip1',0);set('kn0',0);set('kn1',0);set('hdX',0);set('hdY',0);set('hdZ',Math.sin(t*.6)*.03);set('rootX',0);
    if(wb>.01){
      set('hip0',sw*.55*run*wb);set('hip1',-sw*.55*run*wb);
      set('kn0',Math.max(0,-Math.cos(ph))*.85*run*wb);set('kn1',Math.max(0,Math.cos(ph))*.85*run*wb);
      set('sh0x',-sw*.5*run*wb+.05);set('sh1x',sw*.5*run*wb+.05);set('el0',-.35*wb-.18);set('el1',-.35*wb-.18);
      set('hipsY',.92+Math.abs(Math.cos(ph))*.045*wb);set('spX',.07*run*wb);set('spY',sw*.12*wb);
    }
    if(this.base==='sit'){set('hip0',-1.5);set('hip1',-1.5);set('kn0',1.5);set('kn1',1.5);set('hipsY',.5+this.seatY);set('spX',-.05)}
    if(this.base==='lie'){set('hipsY',.25+this.seatY);set('rootX',-1.45);set('hip0',0);set('hip1',0)}
    if(this.base==='dance'){const d=t*5.2;set('hipsY',.9+Math.abs(Math.sin(d))*.06);set('spZ',Math.sin(d)*.16);set('spY',Math.sin(d*.5)*.3);
      set('sh0x',-1.4+Math.sin(d)*.6);set('sh1x',-1.4-Math.sin(d)*.6);set('sh0z',-.6);set('sh1z',.6);set('el0',-.8);set('el1',-.8);
      set('hip0',Math.max(0,Math.sin(d))*.5);set('hip1',Math.max(0,-Math.sin(d))*.5);set('kn0',Math.max(0,Math.sin(d))*.7);set('kn1',Math.max(0,-Math.sin(d))*.7);set('hdZ',Math.sin(d)*.2)}
    // hablar
    if(this.talking){this.talkT+=dt;const k=this.talkT;
      this.mouth.scale.y=.35+Math.abs(Math.sin(k*13))*.9*(.6+.4*Math.sin(k*3.1));
      set('hdX',Math.sin(k*4.3)*.06);set('hdY',(tg.hdY??0)+Math.sin(k*1.9)*.12);
      if(!this.gesture&&this.base!=='dance'){set('sh1x',-.55+Math.sin(k*3.3)*.3);set('el1',-1.25+Math.sin(k*4.1)*.25);set('sh1z',.25);
        set('sh0x',-.25+Math.sin(k*2.7+1)*.2);set('el0',-.7);}
    }else this.mouth.scale.y=T.MathUtils.damp(this.mouth.scale.y,.35,12,dt);
    // gesto
    if(this.gesture){const G=this.gesture;G.t+=dt;let p=G.t/G.dur;if(p>=1){if(G.loop){G.t=0;p=0}else{this.gesture=null;p=1}}
      const e=env(p),w=(k:string,v:number)=>{tg[k]=(tg[k]??0)*(1-e)+v*e};const wig=Math.sin(G.t*9);
      switch(G.g){
        case 'señalar':w('sh1x',-1.45);w('sh1z',.1);w('el1',-.05);w('spY',-.25);break;
        case 'encogerse':w('sh0x',-.4);w('sh1x',-.4);w('sh0z',-.65);w('sh1z',.65);w('el0',-1.5);w('el1',-1.5);w('hdZ',.22);w('hipsY',.95);break;
        case 'brazosArriba':w('sh0x',-2.7);w('sh1x',-2.7);w('sh0z',-.35);w('sh1z',.35);w('el0',-.2);w('el1',-.2);w('hdX',-.25);break;
        case 'cruzarBrazos':w('sh0x',-.55);w('sh1x',-.55);w('sh0z',.25);w('sh1z',-.25);w('el0',-1.9);w('el1',-1.9);w('hdX',-.06);break;
        case 'jarras':w('sh0z',-.75);w('sh1z',.75);w('el0',-1.6);w('el1',-1.6);w('sh0x',.25);w('sh1x',.25);break;
        case 'beber':w('sh1x',-1.05);w('sh1z',.35);w('el1',-2.3);w('hdX',-.22);break;
        case 'brindar':w('sh1x',-2.5);w('sh1z',.2);w('el1',-.4+wig*.05);break;
        case 'pensar':w('sh1x',-.75);w('sh1z',.2);w('el1',-2.35);w('sh0x',-.35);w('el0',-1.6);w('sh0z',.25);w('hdZ',.12);w('hdX',.08);break;
        case 'facepalm':w('sh1x',-1.25);w('sh1z',.3);w('el1',-2.45);w('hdX',.35);w('spX',.18);break;
        case 'saludar':w('sh1x',-2.6);w('sh1z',.55);w('el1',-.6+wig*.4);break;
        case 'asentir':w('hdX',Math.sin(G.t*11)*.22);break;
        case 'negar':w('hdY',Math.sin(G.t*10)*.35);break;
        case 'reverencia':w('spX',.6);w('hdX',.25);w('sh0x',.2);w('sh1x',-.3);w('el1',-1.4);break;
        case 'explicar':w('sh0x',-.7+Math.sin(G.t*4)*.25);w('sh1x',-.7-Math.sin(G.t*4)*.25);w('el0',-1.3);w('el1',-1.3);w('sh0z',-.3);w('sh1z',.3);break;
        case 'reir':w('spX',-.25+Math.sin(G.t*14)*.06);w('hdX',-.35);w('sh0z',-.3);w('sh1z',.3);w('el0',-1);w('el1',-1);this.mouth.scale.y=1.2;break;
        case 'fumar':{const q=(Math.sin(G.t*1.4)+1)/2;w('sh1x',-.9-q*.3);w('sh1z',.35);w('el1',-1.6-q*.8);break}
        case 'escribir':w('sh1x',-.75);w('el1',-1.2+wig*.08);w('sh0x',-.6);w('el0',-1.2);w('hdX',.35);w('spX',.15);break;
        case 'leer':w('sh0x',-.9);w('sh1x',-.9);w('el0',-1.4);w('el1',-1.4);w('sh0z',.12);w('sh1z',-.12);w('hdX',.3);break;
        case 'rezar':w('sh0x',-.85);w('sh1x',-.85);w('el0',-1.75);w('el1',-1.75);w('sh0z',.32);w('sh1z',-.32);w('hdX',.25);break;
        case 'llamar':w('sh1x',-.6);w('sh1z',.6);w('el1',-2.6);w('hdZ',.18);break;
        case 'abrazarse':w('sh0x',-.9);w('sh1x',-.9);w('sh0z',.55);w('sh1z',-.55);w('el0',-1.6);w('el1',-1.6);w('hipsY',.9);break;
        case 'sorpresa':w('sh0x',-.9);w('sh1x',-.9);w('sh0z',-.5);w('sh1z',.5);w('el0',-1.9);w('el1',-1.9);w('spX',-.18);w('hdX',-.15);this.mouth.scale.y=1.1;break;
      }
    }
    // mirada
    if(this.look3){const hp=new T.Vector3();this.root.getWorldPosition(hp);const v=this.look3.clone().sub(hp);
      const yaw=Math.atan2(v.x,v.z)-this.root.rotation.y-(this.root.parent?this.parentYaw():0);const a=Math.atan2(Math.sin(yaw),Math.cos(yaw));
      tg.hdY=(tg.hdY??0)+T.MathUtils.clamp(a,-1.1,1.1)*.75;tg.spY=(tg.spY??0)+T.MathUtils.clamp(a,-1.1,1.1)*.2}
    // parpadeo
    this.blinkT-=dt;const blink=this.blinkT<.12;if(this.blinkT<0)this.blinkT=2.5+Math.random()*3;for(const e of this.eyes)e.scale.y=blink?.15:1;
    // suavizado
    const k=this.walkBlend>.5?18:9;for(const [key,v] of Object.entries(tg)){this.cur[key]=T.MathUtils.damp(this.cur[key]??v,v,k,dt)}
    const c=this.cur;
    this.hips.position.y=c.hipsY;this.hips.rotation.x=c.rootX;this.spine.rotation.set(c.spX,c.spY,c.spZ);
    this.sh[0].rotation.set(c.sh0x,0,c.sh0z);this.sh[1].rotation.set(c.sh1x,0,c.sh1z);this.el[0].rotation.x=c.el0;this.el[1].rotation.x=c.el1;
    this.hipJ[0].rotation.x=-c.hip0;this.hipJ[1].rotation.x=-c.hip1;this.knee[0].rotation.x=c.kn0;this.knee[1].rotation.x=c.kn1;
    this.neck.rotation.set(c.hdX,c.hdY,c.hdZ);
    for(const b of this.brows)b.position.y=.27+(this.talking?Math.abs(Math.sin(this.talkT*2.3))*.015:0);
  }
  private parentYaw(){const q=new T.Quaternion();this.root.parent!.getWorldQuaternion(q);return new T.Euler().setFromQuaternion(q,'YXZ').y}
}
const P2={wood:'#7a5236'};

/** Perro grande de Ángela. */
export class Dog{
  root=new T.Group();private legs:T.Group[]=[];private tail=new T.Group();private headG=new T.Group();private ph=0;target:T.Vector3|null=null;private facing=0;speed=1.6;
  constructor(color='#8a6a4a'){
    const m=(g:T.BufferGeometry,c:string,p:T.Object3D,x=0,y=0,z=0)=>{const o=new T.Mesh(g,clay(c));o.position.set(x,y,z);o.castShadow=true;p.add(o);return o};
    m(new T.CapsuleGeometry(.2,.55,6,12),color,this.root,0,.55,0).rotation.x=Math.PI/2;
    this.headG.position.set(0,.78,.42);this.root.add(this.headG);m(new T.SphereGeometry(.17,14,10),color,this.headG);m(new T.CapsuleGeometry(.08,.12,4,8),color,this.headG,0,-.04,.17).rotation.x=Math.PI/2;
    m(new T.SphereGeometry(.035,8,6),'#1c1410',this.headG,0,-.01,.3);for(const sx of [-1,1]){m(new T.SphereGeometry(.07,8,6),'#5a4330',this.headG,sx*.12,.08,-.02).scale.set(.6,1.4,.6);m(new T.SphereGeometry(.022,6,4),'#1c1410',this.headG,sx*.07,.05,.14)}
    for(const [x,z] of [[-.13,.3],[.13,.3],[-.13,-.3],[.13,-.3]]){const l=new T.Group();l.position.set(x,.45,z);this.root.add(l);m(new T.CapsuleGeometry(.055,.3,4,8),color,l,0,-.2,0);this.legs.push(l)}
    this.tail.position.set(0,.65,-.45);this.root.add(this.tail);m(new T.CapsuleGeometry(.035,.3,4,8),color,this.tail,0,.15,-.05).rotation.x=-.6;
  }
  update(dt:number,t:number){let mv=false;if(this.target){const p=this.root.position,dx=this.target.x-p.x,dz=this.target.z-p.z,d=Math.hypot(dx,dz);
      if(d<.1)this.target=null;else{const s=Math.min(d,this.speed*dt);p.x+=dx/d*s;p.z+=dz/d*s;this.facing=Math.atan2(dx,dz);mv=true}}
    this.root.rotation.y=T.MathUtils.damp(this.root.rotation.y,this.facing,8,dt);
    if(mv)this.ph+=dt*9;this.legs.forEach((l,i)=>l.rotation.x=mv?Math.sin(this.ph+(i%2?Math.PI:0)+(i>1?Math.PI/2:0))*.6:0);
    this.tail.rotation.z=Math.sin(t*9)*.5;this.headG.rotation.x=mv?Math.sin(this.ph*.5)*.05:Math.sin(t*2)*.08-.15;}
}
