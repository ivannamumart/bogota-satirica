/** Escenarios de las viñetas y coreografía de cada momento de la novela.
 * Cada `beat` corresponde, por índice, a una línea de `inicio` en story/expanded.ts. */
import * as T from 'three';
import * as Pr from './props';
import {P} from '../world/kit';
import type {Person,Dog,Gesture} from '../world/people';
import type {PlaceId} from '../data/layout';

export interface Ctx{
  a:Record<string,Person>;dog?:Dog;set:T.Group;
  sfx(text:string,color?:string):void; rain(on:boolean):void; flicker():void; lights(on:boolean):void;
  drive(obj:string,fromX:number,toX:number,z:number,secs:number,stopAt?:number):void;
}
export interface Beat{run?:(c:Ctx)=>void;cam?:'wide'|'close'|string}
export interface StageDef{
  build():{set:T.Group;props:Record<string,T.Object3D>};
  cast:{id:string;look:string;x:number;z:number;face?:number;setup?:(p:Person,c:Ctx)=>void;hidden?:boolean}[];
  wide?:{pos:[number,number,number];tgt:[number,number,number]};
  light:{sky:string;ground:string;key:string;keyI:number;amb:number;bg:string;night?:boolean};
  dog?:boolean;init?:(c:Ctx)=>void;beats:Beat[];branchInit?:(c:Ctx)=>void;
}
const F=Math.PI; // mirar hacia el fondo
const look=(c:Ctx,who:string[],at:string)=>who.forEach(w=>c.a[w]?.lookAt(c.a[at]));

export const STAGES:Record<PlaceId,StageDef>={
  apartamento:{
    light:{sky:'#ffd7a8',ground:'#6d5a4a',key:'#ffcf9a',keyI:2.6,amb:1.1,bg:'#e9d4b8'},
    build(){const g=Pr.room({floor:'#b08560',wall:'#e9dcc2',wall2:'#d8c7a8',pattern:'tablas'});
      const b=Pr.bed();b.position.set(-2.4,0,-3.9);g.add(b);
      const w=Pr.windowFrame(3,2.2,'#f7b27a',{sun:true});w.position.set(1.6,1.6,-5.35);g.add(w);
      const rp=Pr.poster('RIMBAUD',1.1,1.5,'#f1e2b3');rp.position.set(-2.4,2.6,-5.33);g.add(rp);
      const sh=Pr.shelf();sh.position.set(-7.1,0,1);sh.rotation.y=Math.PI/2;g.add(sh);
      const desk=Pr.table(1.5,.8);desk.position.set(4.6,0,-3.6);g.add(desk);const tw=Pr.typewriter();tw.position.set(4.6,.78,-3.7);g.add(tw);
      const ch=Pr.chair();ch.position.set(4.6,0,-2.7);ch.rotation.y=Math.PI;g.add(ch);
      const l=Pr.lamp();l.position.set(-4.4,0,-4.4);g.add(l);const pl=Pr.plant();pl.position.set(6.2,0,-4.6);g.add(pl);
      for(let i=0;i<7;i++){const p=Pr.bx(.5+Math.random()*.4,.06,.4,['#f1ece0','#3d4f6e','#d9a441','#a33b2c'][i%4],-1+Math.random()*4,0,-1+Math.random()*2.5,.05);p.rotation.y=Math.random()*3;g.add(p)}
      const bottle=Pr.bottles(3);bottle.position.set(-6.4,0,-4.5);g.add(bottle);
      return {set:g,props:{}}},
    cast:[{id:'escobar',look:'escobar',x:-2.7,z:-4.1,face:0,setup:p=>p.lie(.62)},{id:'fina',look:'fina',x:-1.9,z:-4.1,face:0,setup:p=>p.lie(.62)}],
    wide:{pos:[1.8,4.6,8.8],tgt:[-.6,1.1,-3]},
    beats:[
      {run:c=>{c.sfx('BRRRUMMM…');},cam:'wide'},
      {run:c=>{c.a.escobar.sit(.3);c.a.escobar.lookAt(new T.Vector3(-2.5,6,-3))},cam:'escobar'},
      {run:c=>{c.a.escobar.lookAt(new T.Vector3(-2.4,2.6,-5.3));c.a.escobar.play('pensar',4)},cam:'escobar'},
      {run:c=>{c.a.escobar.lookAt(c.a.fina);c.a.escobar.play('señalar',1.6);c.sfx('¡GNNNF!','#c9473f')},cam:'fina'},
      {run:c=>{c.a.escobar.stand();c.a.escobar.walkTo(1.4,-3.6,1.2,()=>c.a.escobar.face(F));c.sfx('PIP PIP · RRRR')},cam:'wide'},
      {run:c=>{c.a.escobar.face(-.3);c.a.escobar.play('brazosArriba',1.8)},cam:'escobar'},
      {run:c=>{c.a.escobar.walkTo(4.6,-2.75,1.2,()=>{c.a.escobar.face(F);c.a.escobar.sit(.0);c.a.escobar.play('facepalm',3)})},cam:'wide'},
    ],
    branchInit:c=>{c.a.fina.stand();c.a.fina.place(.4,-1.2,0);c.a.escobar.stand();c.a.escobar.place(-1.2,-1,.6);c.a.fina.faceTo(c.a.escobar);c.a.escobar.faceTo(c.a.fina)},
  },
  taller:{
    light:{sky:'#f1efe6',ground:'#6a6258',key:'#fff3de',keyI:2.4,amb:1.2,bg:'#d6d1c4'},
    build(){const g=Pr.room({floor:'#9b9284',wall:'#e5ddcc',wall2:'#cfc4ae'});
      const cols=['#c9452e','#2f5d8a','#e9b64c','#3e6a43','#6b3f6b'];
      [[-5,-4],[-3.2,-4.6],[5,-3.6],[-6,-1]].forEach(([x,z],i)=>{const e=Pr.easel(cols[i]);e.position.set(x,0,z);e.rotation.y=i*.4-.4;g.add(e)});
      const ct=Pr.chessTable();ct.position.set(.6,0,-1.6);g.add(ct);for(const [x,r] of [[-.2,Math.PI/2],[1.4,-Math.PI/2]] as const){const ch=Pr.chair();ch.position.set(x,0,-1.6);ch.rotation.y=r;g.add(ch)}
      for(let i=0;i<6;i++)g.add(Pr.cy(.15,.15,.3,cols[i%5],-6.4+i*.35,0,-4.9,12));
      const p=Pr.poster('¡ABAJO LA BURGUESÍA!',2.6,.8,'#f3ead2','#a33b2c');p.position.set(2,3.2,-5.33);g.add(p);
      const sky=Pr.windowFrame(2.4,1.6,'#cfe3f1',{mountains:true});sky.position.set(-1,2,-5.35);g.add(sky);
      return {set:g,props:{}}},
    cast:[{id:'diego',look:'diego',x:-.25,z:-1.6,face:Math.PI/2,setup:p=>{p.sit(0);p.hold('pieza')}},{id:'federico',look:'federico',x:-2.2,z:.6,face:.6},
      {id:'anamaria',look:'anamaria',x:3.1,z:.2,face:-.7,setup:p=>p.hold('cigarrillo')},{id:'escobar',look:'escobar',x:7.5,z:2.5,face:-Math.PI/2}],
    beats:[
      {run:c=>{c.a.escobar.walkTo(1.6,1.6,1.3,()=>c.a.escobar.faceTo(c.a.diego));look(c,['federico','anamaria','diego'],'escobar')},cam:'wide'},
      {run:c=>{c.a.diego.lookAt(new T.Vector3(.6,.8,-1.6));c.a.diego.play('pensar',3)},cam:'diego'},
      {run:c=>{c.a.federico.faceTo(c.a.escobar);c.a.federico.play('negar',1.6)}},
      {run:c=>{c.a.anamaria.play('reir',2)}},
      {run:c=>{c.a.diego.play('señalar',2)}},
      {run:c=>{c.a.diego.lookAt(new T.Vector3(.6,.8,-1.6));c.a.escobar.play('encogerse',1.8);c.a.federico.play('cruzarBrazos',3)},cam:'wide'},
    ],
  },
  oasis:{
    light:{sky:'#ff9a4a',ground:'#2a1a14',key:'#ffb36b',keyI:2.2,amb:.7,bg:'#3b2219',night:true},
    build(){const g=Pr.room({floor:'#5b3a2a',wall:'#7a3f26',wall2:'#6a3520',pattern:'baldosa'});
      g.add(Pr.bx(5,1.1,.9,'#4a2a1a',-3.5,0,-4,.1));g.add(Pr.bx(5.1,.1,1,'#c9862e',-3.5,1.1,-4,.03));
      const bt=Pr.bottles(10);bt.position.set(-5.6,1.9,-5.1);g.add(bt);g.add(Pr.bx(5,.08,.35,'#3b2219',-3.5,1.85,-5.1,.02));
      const nt=Pr.poster('MUSIC BAR · COMIDA · DANCING',3.6,.7,'#3b1d12','#ff9b3d');nt.position.set(2.5,3.4,-5.33);(nt.material as T.MeshStandardMaterial).emissive=new T.Color(0xff8a2a);(nt.material as T.MeshStandardMaterial).emissiveIntensity=.5;nt.name='neon';g.add(nt);
      const rt=Pr.table(1.6,1.6,.78,'#6d4c33',true);rt.position.set(1.8,0,-1.4);g.add(rt);
      for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4;const ch=Pr.chair();ch.position.set(1.8+Math.cos(a)*1.25,0,-1.4+Math.sin(a)*1.25);ch.rotation.y=-a-Math.PI/2;g.add(ch)}
      for(let i=0;i<5;i++)g.add(Pr.cy(.05,.04,.14,'#e4d3a2',1.4+i*.2,.78,-1.3+Math.sin(i)*.3,10));
      const jb=Pr.bx(1,1.7,.7,'#c9452e',6,0,-4.7,.3);g.add(jb);g.add(Pr.sp(.3,'#ffe08a',6,1.4,-4.35));
      const l=Pr.lamp('#ff9b3d');l.position.set(4.2,0,-4.2);g.add(l);return {set:g,props:{}}},
    cast:[{id:'eden',look:'eden',x:1.8+Math.cos(.4)*1.25,z:-1.4+Math.sin(.4)*1.25,setup:p=>{p.sit(0);p.hold('vaso')}},
      {id:'narciso',look:'narciso',x:1.8+Math.cos(.4+Math.PI/2)*1.25,z:-1.4+Math.sin(.4+Math.PI/2)*1.25,setup:p=>{p.sit(0);p.hold('cigarrillo')}},
      {id:'ruben',look:'ruben',x:1.8+Math.cos(.4+Math.PI)*1.25,z:-1.4+Math.sin(.4+Math.PI)*1.25,setup:p=>{p.sit(0);p.hold('vaso')}},
      {id:'ramon',look:'ramon',x:1.8+Math.cos(.4+Math.PI*1.5)*1.25,z:-1.4+Math.sin(.4+Math.PI*1.5)*1.25,setup:p=>{p.sit(0);p.hold('libro')}},
      {id:'mesero',look:'mesero',x:-3.5,z:-4.9,face:0},{id:'escobar',look:'escobar',x:7.5,z:3,face:-Math.PI/2}],
    init:c=>{for(const id of ['eden','narciso','ruben','ramon'])c.a[id].faceTo(new T.Vector3(1.8,0,-1.4))},
    beats:[
      {run:c=>{c.a.escobar.walkTo(4.4,1.4,1.2);c.sfx('♪ ♫ ♪','#ff9b3d')},cam:'wide'},
      {run:c=>{c.flicker()},cam:'wide'},
      {run:c=>{c.a.narciso.play('fumar',3,true);c.a.ramon.play('leer',4)},cam:'narciso'},
      {run:c=>{c.a.eden.stand();c.a.eden.lookAt(c.a.escobar);c.a.eden.play('saludar',1.5);c.a.escobar.walkTo(3.6,.2,1.1,()=>c.a.escobar.faceTo(c.a.eden));look(c,['narciso','ruben','ramon'],'escobar')}},
      {run:c=>{c.a.narciso.stopGesture();c.a.narciso.play('asentir',1.4)}},
      {run:c=>{for(const id of ['eden','narciso','ruben'])c.a[id].play('brindar',2.2);c.a.escobar.play('brindar',2.2);c.sfx('¡SALUD!')},cam:'wide'},
    ],
  },
  septima:{
    light:{sky:'#a9b6bf',ground:'#4c4f52',key:'#dfe6ea',keyI:1.6,amb:1.3,bg:'#8d979e'},
    build(){const g=Pr.grp();g.add(Pr.bx(26,.3,6,'#545657',0,-.3,-1,.05));
      for(let i=0;i<8;i++)g.add(Pr.bx(1.4,.02,.18,P.line,-10+i*3,0,-1,.01));
      g.add(Pr.bx(26,.32,4,'#b9b3a6',0,-.15,4,.05));g.add(Pr.bx(26,.4,.3,'#d7d1c4',0,-.2,2,.05));
      g.add(Pr.bx(26,.32,4,'#b9b3a6',0,-.15,-6,.05));
      const cols=['#e8dcc0','#c9805c','#d9cdb2','#b4613f','#e7d3b8'];
      for(let i=0;i<5;i++){const h=5+((i*7)%4)*1.6;const b=Pr.bx(4.6,h,3,cols[i],-10+i*5,0,-9,.12);g.add(b);
        for(let r=0;r<Math.floor(h/1.7);r++)for(let k=0;k<3;k++)g.add(Pr.bx(.7,.9,.08,'#3f4f5a',-11.4+i*5+k*1.4,.8+r*1.6,-7.45,.03))}
      const news=Pr.bx(.5,.02,.7,'#efe8d4',1.5,0,-.5,.01);news.rotation.y=.6;g.add(news);
      const st=Pr.poster('PARADERO',1,.3,'#f3ead2','#2f5d50');st.position.set(-4,2.6,4);g.add(st);g.add(Pr.cy(.05,.05,2.5,'#2f5d50',-4,0,4,8));
      const lp=Pr.lamp('#efe6d0');lp.scale.setScalar(2);lp.position.set(5,0,3.2);g.add(lp);
      const car1=Pr.car('#a33b2c');car1.rotation.y=Math.PI/2;car1.position.set(-16,0,-.2);car1.name='carro1';g.add(car1);
      const car2=Pr.car('#2f5d8a');car2.rotation.y=Math.PI/2;car2.position.set(-20,0,-2);car2.name='carro2';g.add(car2);
      const car3=Pr.car('#e9e2cf');car3.rotation.y=Math.PI/2;car3.position.set(-24,0,-.2);car3.name='carro3';g.add(car3);
      const bus=Pr.bus();bus.rotation.y=Math.PI/2;bus.position.set(-22,0,-.6);bus.name='bus';g.add(bus);
      return {set:g,props:{}}},
    cast:[{id:'escobar',look:'escobar',x:1.2,z:2.6,face:F*.85,setup:p=>p.hold('paraguas',0)},{id:'poeta',look:'poeta',x:-4.6,z:4.6,face:.8,setup:p=>p.hold('papel')},
      {id:'peaton',look:'peaton',x:9,z:5,face:-Math.PI/2,setup:p=>p.hold('paraguas',0)}],
    wide:{pos:[2,4,11.5],tgt:[0,1.4,-1]},
    beats:[
      {run:c=>{c.rain(true);c.drive('carro1',-16,18,-.2,5)},cam:'wide'},
      {run:c=>{c.a.escobar.play('saludar',2.2);c.drive('carro2',-20,18,-2,4.6);c.sfx('¡TAXIII!')},cam:'escobar'},
      {run:c=>{c.a.peaton.walkTo(-9,5,1.4);c.drive('carro3',-24,18,-.2,5.5)},cam:'wide'},
      {run:c=>{c.a.escobar.play('encogerse',2.2);c.a.escobar.lookAt(new T.Vector3(10,1,-1))},cam:'escobar'},
      {run:c=>{c.drive('bus',-22,-3,-.6,4);c.sfx('PSSSHH','#2f5d50');c.a.poeta.play('leer',4)},cam:'wide'},
    ],
    branchInit:c=>{c.a.poeta.place(-1.2,3,0.6);c.a.escobar.place(1.2,3,-.6);c.a.poeta.faceTo(c.a.escobar);c.a.escobar.faceTo(c.a.poeta)},
  },
  parque:{
    light:{sky:'#f0a76b',ground:'#4a5a3a',key:'#ffbf86',keyI:2,amb:1,bg:'#c58e6a'},
    dog:true,
    build(){const g=Pr.grp();g.add(Pr.bx(26,.3,18,'#8fae62',0,-.3,-2,.05));g.add(Pr.bx(26,.04,2.6,'#d8ceb4',0,0,1,.02));
      for(const [x,z] of [[-8,-4],[-4,-6],[3,-6.5],[7,-4],[10,-7],[-11,-8],[0,-9]]){const t=Pr.tree();t.position.set(x,0,z);t.scale.setScalar(1.2);g.add(t)}
      const b=Pr.sofa('#6d4c33',2);b.scale.set(1,.7,.7);b.position.set(-2,0,-1.2);g.add(b);
      const lp=Pr.lamp('#fff1c9');lp.scale.setScalar(2.1);lp.position.set(4,0,-.8);lp.name='farol';g.add(lp);
      const tp=Pr.grp();tp.add(Pr.cy(1.5,1.6,.3,'#e6dfcf'));for(let i=0;i<6;i++){const a=i/6*Math.PI*2;tp.add(Pr.cy(.1,.1,2,'#f1ece0',Math.cos(a)*1.2,.3,Math.sin(a)*1.2,8))}
      const dome=Pr.sp(1.4,'#b9c7c0',0,2.3,0);dome.scale.y=.6;tp.add(dome);tp.position.set(-7,0,-5);g.add(tp);
      const sky=Pr.windowFrame(28,10,'#f4a26a',{sun:true});sky.position.set(0,-.2,-12);g.add(sky);
      return {set:g,props:{}}},
    cast:[{id:'angela',look:'angela',x:-7,z:1.2,face:Math.PI/2,setup:p=>p.hold('correa')},{id:'escobar',look:'escobar',x:-10,z:2,face:Math.PI/2}],
    wide:{pos:[1,4,11],tgt:[0,1.2,-1]},
    init:c=>{c.dog!.root.position.set(-5.6,0,1.4);c.dog!.root.rotation.y=Math.PI/2},
    beats:[
      {run:c=>{c.dog!.target=new T.Vector3(-1,0,1.4);c.a.angela.walkTo(-2.6,1.1,1.5);c.sfx('¡GUAU!')},cam:'wide'},
      {run:c=>{c.dog!.target=new T.Vector3(1.5,0,.4);c.a.angela.walkTo(.2,.8,1.6,()=>c.a.angela.play('jarras',2.4))},cam:'angela'},
      {run:c=>{c.lights(true)},cam:'wide'},
      {run:c=>{c.a.escobar.walkTo(-1.8,1.6,1.1,()=>{c.a.escobar.faceTo(c.a.angela);c.a.escobar.play('encogerse',1.6)});c.a.angela.lookAt(c.a.escobar);c.dog!.target=new T.Vector3(3.2,0,1.6)},cam:'wide'},
    ],
  },
  porciuncula:{
    light:{sky:'#cfd6da',ground:'#5b554c',key:'#f3e6cf',keyI:2.2,amb:1.2,bg:'#b7bcbf'},
    build(){const g=Pr.grp();g.add(Pr.bx(26,.3,16,'#c9c3b5',0,-.3,0,.05));
      for(let i=0;i<4;i++)g.add(Pr.bx(8-i*.6,.22,1.2,'#d8d2c4',0,i*.22,-4.6+i*.25-1,.04));
      g.add(Pr.bx(14,9,2,P.brick,0,0,-7,.2));g.add(Pr.bx(3,6,.5,P.brickDark,0,0,-5.9,.8));g.add(Pr.bx(2.2,4,.3,'#5b3b25',0,.9,-5.6,.4));
      const rose=Pr.cy(1.1,1.1,.2,'#6a87a6',0,6.6,-5.95,24);rose.rotation.x=Math.PI/2;g.add(rose);
      for(const x of [-5.5,5.5])g.add(Pr.bx(1,10,1,P.brickDark,x,0,-5.9,.1));
      const pb=Pr.phoneBooth();pb.position.set(6.5,0,1);pb.rotation.y=-.5;g.add(pb);
      return {set:g,props:{}}},
    cast:[{id:'escobar',look:'escobar',x:6.4,z:.9,face:-.5+F,setup:p=>p.hold('telefono')},{id:'monsenor',look:'monsenor',x:0,z:-4.9,face:0},
      {id:'madre',look:'madre',x:-2.5,z:-1.8,face:.4},{id:'feligres',look:'feligres',x:-6,z:3,face:F},{id:'feligres2',look:'feligres2',x:-8,z:4,face:F}],
    wide:{pos:[1.5,4.5,12],tgt:[0,2,-2]},
    beats:[
      {run:c=>{c.sfx('¡DONG! ¡DONG!','#7d5a44');c.a.feligres.walkTo(-1,-3.4,1.1);c.a.feligres2.walkTo(1,-3.6,1.1)},cam:'wide'},
      {run:c=>{c.a.escobar.play('llamar',4,true)},cam:'escobar'},
      {run:c=>{c.a.escobar.stopGesture();c.a.escobar.hold(null,1);c.a.escobar.walkTo(3.6,1.8,1.4,()=>{c.a.escobar.face(-.3);c.a.escobar.play('facepalm',2)});c.sfx('¡CLIC!')},cam:'wide'},
      {run:c=>{c.a.escobar.play('encogerse',2);c.a.madre.lookAt(c.a.escobar);c.a.monsenor.lookAt(c.a.escobar)},cam:'escobar'},
    ],
    branchInit:c=>{c.a.monsenor.place(-.6,-1.4,.3);c.a.escobar.place(1.6,.8);c.a.escobar.faceTo(c.a.monsenor);c.a.madre.place(-2.6,.4);c.a.madre.faceTo(c.a.escobar)},
  },
  jockey:{
    light:{sky:'#ffe8c2',ground:'#5b4a3a',key:'#ffe2b0',keyI:2.4,amb:1.1,bg:'#d8c6a4'},
    build(){const g=Pr.room({floor:'#efe6d0',wall:'#e8dcc0',wall2:'#d9cbab',pattern:'damero'});
      for(const x of [-5,-1.5,2,5.5]){const c=Pr.column(5.4);c.position.set(x,0,-4.7);g.add(c)}
      const cur=Pr.bx(2.6,5.5,.2,'#7c2b3a',-3.3,0,-5.2,.3);g.add(cur);const cur2=Pr.bx(2.6,5.5,.2,'#7c2b3a',3.8,0,-5.2,.3);g.add(cur2);
      const ch=Pr.chandelier();ch.position.set(0,5.2,-1);g.add(ch);
      const p=Pr.poster('BAILE BLANCO · ABRIL',2.4,.9,'#f3ead2','#20382e');p.position.set(.3,3.6,-5.33);g.add(p);
      const t=Pr.table(2.4,1,.85,'#f6f1e2');t.position.set(-5,0,-2.5);g.add(t);for(let i=0;i<6;i++)g.add(Pr.cy(.04,.03,.18,'#f1e2b3',-5.9+i*.35,.85,-2.5,8));
      return {set:g,props:{}}},
    cast:[{id:'prima',look:'prima',x:.4,z:-.6,face:.3},{id:'alicia',look:'alicia',x:-1.6,z:.4,face:.8,setup:p=>p.hold('vaso')},
      {id:'focion',look:'focion',x:2.6,z:-1.2,face:-.6,setup:p=>p.hold('vaso')},{id:'escobar',look:'escobar',x:1.4,z:1.9,face:F*.9},{id:'mesero',look:'mesero',x:-6,z:.5,face:Math.PI/2}],
    init:c=>{c.a.escobar.faceTo(c.a.prima)},
    beats:[
      {run:c=>{c.a.mesero.walkTo(5,1,1);look(c,['alicia','focion'],'escobar');c.a.focion.play('reverencia',1.6)},cam:'wide'},
      {run:c=>{c.a.prima.faceTo(c.a.escobar);look(c,['escobar','alicia'],'prima')}},
      {run:c=>{c.a.alicia.play('beber',1.8);c.a.focion.play('asentir',1.6)}},
      {run:c=>{c.a.focion.play('brindar',2);c.a.alicia.play('brindar',2);c.a.escobar.play('cruzarBrazos',3)},cam:'wide'},
    ],
  },
  casa_familiar:{
    light:{sky:'#ffe2b8',ground:'#5b4a3a',key:'#ffe0b0',keyI:2.3,amb:1.1,bg:'#d1b894'},
    build(){const g=Pr.room({floor:'#8a5c3c',wall:'#efe3c8',wall2:'#e2d1ad',pattern:'tablas'});
      const t=Pr.table(4.6,1.6,.8,'#6d4c33');t.position.set(0,0,-1.4);g.add(t);g.add(Pr.bx(4.4,.02,1.4,'#f6f1e2',0,.8,-1.4,.01));
      for(let i=0;i<5;i++){g.add(Pr.cy(.22,.18,.04,'#f8f5ec',-1.8+i*.9,.82,-1.4+(i%2?.4:-.4),16))}
      const ch=Pr.chandelier();ch.position.set(0,4.4,-1.4);g.add(ch);
      for(const [x,c] of [[-3,'#7a3b2e'],[0,'#3e5a4a'],[3,'#5a4a6b']] as const){const f=Pr.bx(1.3,1.6,.1,'#c9b06a',x,2.4,-5.33,.03);g.add(f);g.add(Pr.bx(1,1.3,.06,c,x,2.55,-5.27,.02))}
      const sb=Pr.bx(2.4,1,.7,'#5b3b25',-5.6,0,-4.7,.08);g.add(sb);const pl=Pr.plant();pl.position.set(6.2,0,-4.6);g.add(pl);
      return {set:g,props:{}}},
    cast:[{id:'pablo',look:'pablo',x:-2.6,z:-1.4,face:Math.PI/2,setup:p=>p.sit(0)},{id:'madre',look:'madre',x:2.6,z:-1.4,face:-Math.PI/2,setup:p=>p.sit(0)},
      {id:'alicia',look:'alicia',x:-.6,z:-2.6,face:0,setup:p=>p.sit(0)},{id:'focion',look:'focion',x:.9,z:-2.6,face:0,setup:p=>p.sit(0)},
      {id:'escobar',look:'escobar',x:.2,z:-.2,face:F,setup:p=>p.sit(0)}],
    init:c=>{look(c,['pablo','madre','alicia','focion'],'escobar')},
    beats:[
      {run:c=>{c.sfx('CLIN · CLIN','#7d5a44')},cam:'wide'},
      {run:c=>{c.a.pablo.lookAt(c.a.escobar);c.a.escobar.lookAt(c.a.pablo)}},
      {run:c=>{c.a.escobar.lookAt(c.a.alicia);c.a.pablo.play('negar',1.5)}},
      {run:c=>{c.a.madre.play('negar',1.6);c.a.focion.play('cruzarBrazos',2.5);c.a.escobar.play('facepalm',2.4)},cam:'wide'},
    ],
  },
  unicornio:{
    light:{sky:'#b46bd6',ground:'#1b1026',key:'#ff8ad5',keyI:2.4,amb:.6,bg:'#2a1838',night:true},
    build(){const g=Pr.room({floor:'#2c1f3a',wall:'#3a2450',wall2:'#2f1d42'});
      const cols=['#ff6fb0','#ffd25a','#5ad1ff','#9b6bff'];const tiles=Pr.grp();tiles.name='pista';
      for(let i=0;i<6;i++)for(let j=0;j<5;j++){const t=Pr.bx(.95,.06,.95,cols[(i+j)%4],-2.5+i,0,-3.2+j,.03);(t.material as T.MeshStandardMaterial)=(t.material as T.MeshStandardMaterial).clone();
        (t.material as T.MeshStandardMaterial).emissive=new T.Color(cols[(i+j)%4]);(t.material as T.MeshStandardMaterial).emissiveIntensity=.5;tiles.add(t)}
      g.add(tiles);const db=Pr.discoBall();db.position.set(0,5.4,-1);g.add(db);
      const booth=Pr.sofa('#7c2b5a',3);booth.position.set(-5,0,1);booth.rotation.y=Math.PI/2;g.add(booth);const t=Pr.table(1,1.4,.7,'#2a1a2a');t.position.set(-3.8,0,1);g.add(t);
      const n=Pr.poster('EL UNICORNIO',3.2,.8,'#2c1f3a','#ff9ad5');(n.material as T.MeshStandardMaterial).emissive=new T.Color(0xff6fb0);(n.material as T.MeshStandardMaterial).emissiveIntensity=.6;n.position.set(2,3.6,-5.33);g.add(n);
      return {set:g,props:{}}},
    cast:[{id:'inga',look:'inga',x:.2,z:-1.4,face:.2},{id:'bailarin',look:'bailarin',x:-1.6,z:-2.4,face:.6,setup:p=>p.dance()},{id:'bailarina',look:'bailarina',x:1.8,z:-2.3,face:-.4,setup:p=>p.dance()},
      {id:'federico',look:'federico',x:-5,z:1.6,face:Math.PI/2,setup:p=>{p.sit(0);p.hold('vaso')}},{id:'escobar',look:'escobar',x:7.5,z:3,face:-Math.PI/2}],
    beats:[
      {run:c=>{c.a.escobar.walkTo(3,2.2,1.2,()=>c.a.escobar.faceTo(c.a.inga));c.sfx('♫ BUM-CHIKA ♫','#ff6fb0')},cam:'wide'},
      {run:c=>{c.a.inga.dance(true);c.lights(true)},cam:'inga'},
      {run:c=>{c.a.escobar.play('encogerse',1.8)}},
      {run:c=>{c.a.federico.stand();c.a.federico.lookAt(c.a.escobar);c.a.federico.play('señalar',1.8);c.a.escobar.lookAt(c.a.federico)}},
      {run:c=>{c.a.escobar.walkTo(-2.9,1.9,1.2,()=>{c.a.escobar.faceTo(c.a.federico);c.a.federico.faceTo(c.a.escobar);c.a.federico.play('explicar',3)})},cam:'wide'},
    ],
  },
  oficina:{
    light:{sky:'#e8f0f2',ground:'#55585a',key:'#f3f6f2',keyI:2.2,amb:1.3,bg:'#c7cdca'},
    build(){const g=Pr.room({floor:'#8f9390',wall:'#dfe2da',wall2:'#ccd0c6'});
      const d=Pr.table(1.8,1,.78,'#7c8a86');d.position.set(0,0,-1.6);g.add(d);const tw=Pr.typewriter();tw.position.set(0,.78,-1.7);g.add(tw);
      for(let i=0;i<5;i++)g.add(Pr.bx(.5,.08+i*.05,.4,'#fbf8ee',.6+(i%2)*.1,.78+i*.06,-1.4,.01));
      for(let i=0;i<4;i++){const fc=Pr.bx(.8,1.5,.7,'#6b7a76',-6+i*.9,0,-4.9,.05);g.add(fc)}
      const clk=Pr.cy(.5,.5,.08,'#f6f1e2',2.5,3.4,-5.3,24);clk.rotation.x=Math.PI/2;g.add(clk);g.add(Pr.bx(.04,.38,.03,'#222',2.5,3.48,-5.22,.01));
      const p=Pr.poster('LA EFICIENCIA ES NUESTRO LEMA',3.2,.6,'#f3ead2','#2f4f7a');p.position.set(-2,3.5,-5.33);g.add(p);
      const ch=Pr.chair();ch.position.set(0,0,-.8);ch.rotation.y=Math.PI;g.add(ch);const ch2=Pr.chair('#444','#2f4f7a');ch2.position.set(4.5,0,-3);g.add(ch2);
      for(let i=0;i<8;i++)g.add(Pr.bx(.5,.04,.38,'#fbf8ee',-5.5+i*.5,0,1+Math.sin(i)*.6,.01));
      return {set:g,props:{}}},
    cast:[{id:'escobar',look:'escobar',x:0,z:-.85,face:F,setup:p=>p.sit(0)},{id:'jefe',look:'jefe',x:5.6,z:1.2,face:-Math.PI/2}],
    beats:[
      {run:c=>{c.a.escobar.play('escribir',3,true)},cam:'wide'},
      {run:c=>{c.a.jefe.walkTo(1.8,-.6,1.2,()=>{c.a.jefe.faceTo(c.a.escobar);c.a.jefe.play('jarras',3)});c.a.escobar.stopGesture()},cam:'wide'},
      {run:c=>{c.a.escobar.face(1.2);c.a.escobar.lookAt(c.a.jefe);c.a.escobar.play('explicar',2.4)}},
      {run:c=>{c.sfx('TIC · TAC · TIC');c.a.escobar.face(F);c.a.escobar.play('facepalm',2.6);c.a.jefe.play('cruzarBrazos',3)},cam:'escobar'},
    ],
  },
  cementerio:{
    light:{sky:'#aeb6bb',ground:'#4f544f',key:'#e3e7e8',keyI:1.5,amb:1.3,bg:'#9aa3a6'},
    build(){const g=Pr.grp();g.add(Pr.bx(26,.3,18,'#7d9567',0,-.3,-2,.05));g.add(Pr.bx(2.4,.04,18,'#cfc8b8',0,0,-2,.02));
      for(const [x,z] of [[-4,-3],[-6.5,-3],[-4,-6],[-6.5,-6],[4,-3],[6.5,-3],[4.2,-6],[6.8,-6.4]]){const gr=Pr.grave();gr.position.set(x,0,z);g.add(gr)}
      const mau=Pr.grp();mau.add(Pr.bx(3.4,3.2,3,'#ece7dc',0,0,0,.1));mau.add(Pr.bx(3.8,.4,3.4,'#ece7dc',0,3.2,0,.05));mau.add(Pr.bx(1.2,2,.1,'#3e3e3c',0,0,1.52,.05));
      mau.position.set(0,0,-9);g.add(mau);for(const x of [-9,-2.4,2.4,9]){const cp=Pr.cypress();cp.position.set(x,0,-8);cp.scale.setScalar(1.3);g.add(cp)}
      const sky=Pr.windowFrame(30,12,'#9aa6ad',{mountains:true});sky.position.set(0,-.2,-14);g.add(sky);
      return {set:g,props:{}}},
    cast:[{id:'escobar',look:'escobar',x:.4,z:1.4,face:F*.95,setup:p=>p.hold('papel')},{id:'feligres',look:'feligres',x:-11,z:2,face:Math.PI/2,setup:p=>p.hold('paraguas',0)},
      {id:'feligres2',look:'feligres2',x:-12.5,z:3,face:Math.PI/2,setup:p=>p.hold('paraguas',0)},{id:'focion',look:'fantasma',x:2.6,z:-1.2,face:-.7,hidden:true}],
    wide:{pos:[1.5,4.2,11],tgt:[0,1.4,-2]},
    beats:[
      {run:c=>{c.a.escobar.play('leer',5,true);c.rain(true)},cam:'escobar'},
      {run:c=>{c.a.escobar.stopGesture();c.a.escobar.play('sorpresa',2)},cam:'escobar'},
      {run:c=>{c.sfx('HA MUERTO','#1b1612');c.a.escobar.play('abrazarse',3)},cam:'wide'},
      {run:c=>{c.a.feligres.walkTo(-3.6,0,1);c.a.feligres2.walkTo(-4.8,1.2,1)},cam:'wide'},
    ],
    branchInit:c=>{c.a.focion.root.visible=true;c.a.focion.faceTo(c.a.escobar);c.a.escobar.faceTo(c.a.focion);c.sfx('¡UUUH!','#7a8fa3')},
  },
};

/** Gesto automático para los diálogos sin coreografía explícita. */
export function autoGesture(text:string,i:number):Gesture{
  if(/\?/.test(text))return i%2?'encogerse':'explicar';
  if(/!/.test(text))return 'brazosArriba';
  const pool:Gesture[]=['explicar','señalar','jarras','pensar','cruzarBrazos','asentir'];return pool[i%pool.length];
}
