/** Director de escena: viñetas 3D tipo cómic, globos de diálogo, cartuchos de narración,
 * planos de cámara, el concurso de decisiones y los futuros especulativos. */
import * as T from 'three';
import {Person,Dog} from '../world/people';
import {LOOKS,VOICE,DISPLAY} from '../story/cast';
import {DIALOGOS} from '../story/expanded';
import type {Linea} from '../story/dialogues';
import {rain as makeRain} from './props';
import {STAGES,autoGesture,type Ctx,type Beat} from './stages';
import {SITES,type PlaceId} from '../data/layout';

const $=<E extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as E;
type Phase='inicio'|'quiz'|'rama'|'final';

export class Director{
  scene=new T.Scene();camera=new T.PerspectiveCamera(38,1,.1,200);
  place:PlaceId|null=null;phase:Phase='inicio';index=-1;choice=-1;private ran=-1;
  private actors:Record<string,Person>={};private dog?:Dog;private props:Record<string,T.Object3D>={};private ctx!:Ctx;
  private set=new T.Group();private camPos=new T.Vector3();private camTgt=new T.Vector3();private wantPos=new T.Vector3();private wantTgt=new T.Vector3();
  private wide={pos:new T.Vector3(),tgt:new T.Vector3()};private side=1;
  private typing:{el:HTMLElement;full:string;n:number}|null=null;private speaker:Person|null=null;
  private tweens:{o:T.Object3D;from:number;to:number;z:number;t:number;dur:number}[]=[];private rainObj?:T.Points;private extraLights:T.Light[]=[];
  private balloon=$('balloon');private balloonText=$('balloon-text');private balloonName=$('balloon-name');private balloonSrc=$('balloon-src');
  private caption=$('caption');private captionText=$('caption-text');private captionSrc=$('caption-src');
  private quiz=$('quiz');private final=$('final');private sfxBox=$('sfx');private sceneHud=$('scene-hud');private progress=$('scene-progress');
  onExit:(place:PlaceId,choice:number)=>void=()=>{};
  constructor(){this.scene.add(this.set)}

  open(place:PlaceId){
    this.close();this.place=place;this.phase='inicio';this.index=-1;this.ran=-1;this.choice=-1;
    const def=STAGES[place];const L=def.light;
    this.scene.background=new T.Color(L.bg);this.scene.fog=new T.Fog(L.bg,22,48);
    const hemi=new T.HemisphereLight(L.sky,L.ground,L.amb);const key=new T.DirectionalLight(L.key,L.keyI);key.position.set(5,9,7);key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:40});key.shadow.bias=-.0008;key.shadow.radius=4;
    const fill=new T.DirectionalLight('#cfe0ff',.5);fill.position.set(-6,4,6);
    this.set.add(hemi,key,fill);
    const {set,props}=def.build();set.traverse(o=>{const m=o as T.Mesh;if(m.isMesh){m.receiveShadow=true;if(m.castShadow!==false)m.castShadow=true}});this.set.add(set);this.props=props;
    for(const c of def.cast){const p=new Person(c.id,LOOKS[c.look]);p.place(c.x,c.z,c.face??0);this.set.add(p.root);this.actors[c.id]=p;if(c.hidden)p.root.visible=false}
    if(def.dog){this.dog=new Dog();this.set.add(this.dog.root)}
    this.ctx=this.makeCtx(set);
    for(const c of def.cast)c.setup?.(this.actors[c.id],this.ctx);def.init?.(this.ctx);
    const w=def.wide??{pos:[2.2,4.4,10.5],tgt:[0,1.3,-1.4]};this.wide.pos.set(...w.pos);this.wide.tgt.set(...w.tgt);
    this.camPos.copy(this.wide.pos).add(new T.Vector3(0,1.5,4));this.camTgt.copy(this.wide.tgt);this.wantPos.copy(this.wide.pos);this.wantTgt.copy(this.wide.tgt);
    document.body.classList.add('in-scene');document.body.classList.remove('futuro');
    const site=SITES.find(s=>s.id===place)!;$('scene-title').textContent=site.name;$('scene-sub').textContent=site.area;
    this.sceneHud.classList.add('on');this.hideBubbles();
    setTimeout(()=>this.next(),900);
  }
  close(){for(const c of [...this.set.children])this.set.remove(c);this.actors={};this.dog=undefined;this.tweens=[];this.rainObj=undefined;this.extraLights=[];
    this.hideBubbles();this.quiz.classList.remove('on');this.final.classList.remove('on');this.sceneHud.classList.remove('on');document.body.classList.remove('in-scene','futuro')}
  private makeCtx(set:T.Group):Ctx{
    return {a:this.actors,dog:this.dog,set,
      sfx:(text,color)=>this.sfx(text,color),
      rain:on=>{if(on&&!this.rainObj){this.rainObj=makeRain();this.set.add(this.rainObj)}else if(!on&&this.rainObj){this.set.remove(this.rainObj);this.rainObj=undefined}},
      flicker:()=>{const n=set.getObjectByName('neon') as T.Mesh|undefined;if(!n)return;const m=n.material as T.MeshStandardMaterial;let k=0;const iv=setInterval(()=>{m.emissiveIntensity=k%2?.1:1;if(++k>9){clearInterval(iv);m.emissiveIntensity=.6}},110)},
      lights:on=>{if(!on)return;const pista=set.getObjectByName('pista');
        if(pista){for(const [c,x] of [['#ff6fb0',-3],['#5ad1ff',3],['#ffd25a',0]] as const){const l=new T.SpotLight(c,40,18,.5,.6);l.position.set(x,6,1);l.target.position.set(0,0,-1.5);this.set.add(l,l.target);this.extraLights.push(l)}}
        else{const l=new T.PointLight('#ffd89a',18,9);l.position.set(4,4,-.8);this.set.add(l);this.extraLights.push(l)}},
      drive:(name,from,to,z,secs)=>{const o=set.getObjectByName(name);if(o)this.tweens.push({o,from,to,z,t:0,dur:secs})},
    };
  }
  private sfx(text:string,color='#1b1612'){const e=this.sfxBox;e.textContent=text;e.style.color=color;e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}

  // ── Flujo de lectura ───────────────────────────────
  private lines():Linea[]{const d=DIALOGOS[this.place!];if(this.phase==='rama')return d.bifurcaciones[this.choice].lineas;return d.inicio}
  next(){
    if(!this.place||this.phase==='quiz'||this.phase==='final')return;
    if(this.typing&&this.typing.n<this.typing.full.length){this.typing.n=this.typing.full.length;this.typing.el.textContent=this.typing.full;return}
    const L=this.lines();
    if(this.index>=L.length-1){if(this.phase==='inicio')this.openQuiz();else this.openFinal();return}
    this.index++;this.show(true);
  }
  prev(){if(!this.place)return;if(this.phase==='quiz'||this.phase==='final')return;if(this.index<=0)return;this.index--;this.show(false)}
  private show(forward:boolean){
    const L=this.lines();const line=L[this.index];const def=STAGES[this.place!];
    const beat:Beat|undefined=this.phase==='inicio'?def.beats[this.index]:undefined;
    const runKey=(this.phase==='rama'?1000:0)+this.index;
    for(const p of Object.values(this.actors))p.talking=false;
    if(forward&&runKey>this.ran){this.ran=runKey;try{beat?.run?.(this.ctx)}catch(e){console.warn(e)}}
    this.progress.style.width=`${((this.index+1)/L.length)*100}%`;
    $('scene-step').textContent=(this.phase==='rama'?'FUTURO · ':'')+`${this.index+1} / ${L.length}`;
    const isDialog=line.tipo==='dialogo'&&!!line.voz;
    const actorId=isDialog?VOICE[line.voz]??null:null;const actor=actorId?this.actors[actorId]:null;
    this.hideBubbles();
    const src=line.fuente?`Novela · ${line.fuente}`:'Reinterpretación · no es cita';
    if(isDialog&&actor){
      actor.talking=true;this.speaker=actor;
      if(!beat?.run&&forward){actor.play(autoGesture(line.texto,this.index),2.2)}
      for(const [id,p] of Object.entries(this.actors))if(p!==actor&&p.root.visible&&!['bailarin','bailarina'].includes(id))p.lookAt(actor);
      this.balloonName.textContent=DISPLAY[actorId!]??line.voz.toUpperCase();this.balloonSrc.textContent=src;
      this.balloon.classList.toggle('literal',!!line.fuente);this.balloon.classList.add('on');this.type(this.balloonText,line.texto);
      this.shot(beat?.cam??actorId!);
      setTimeout(()=>{if(this.speaker===actor)actor.talking=false},Math.min(5200,600+line.texto.length*45));
    }else{
      this.speaker=null;this.captionSrc.textContent=src;this.caption.classList.add('on');this.caption.classList.toggle('literal',!!line.fuente);
      this.type(this.captionText,line.texto);
      if(this.phase==='rama'&&forward&&!beat){const ids=Object.keys(this.actors).filter(i=>this.actors[i].root.visible&&i!=='escobar');const p=this.actors[ids[this.index%Math.max(1,ids.length)]];
        if(p&&p.base!=='sit'){const o=p.root.position.clone();p.walkTo(o.x+(this.index%2?.9:-.9),o.z+.5,1.1,()=>p.faceTo(this.actors.escobar??p))}}
      this.shot(beat?.cam??'wide');
    }
  }
  private type(el:HTMLElement,full:string){el.textContent='';this.typing={el,full,n:0}}
  private hideBubbles(){this.balloon.classList.remove('on');this.caption.classList.remove('on')}

  // ── Cámara ─────────────────────────────────────────
  private shot(which:string){
    const prev=this.wantPos.clone();
    if(which==='wide'||!this.actors[which]){this.wantPos.copy(this.wide.pos);this.wantTgt.copy(this.wide.tgt)}
    else{const a=this.actors[which];const head=a.headWorld();this.side*=-1;
      const toWide=this.wide.pos.clone().sub(head).setY(0).normalize();const fwd=new T.Vector3(Math.sin(a.root.rotation.y),0,Math.cos(a.root.rotation.y));
      // encuadre que muestra la cara del hablante sin salir del decorado
      const toCam=fwd.clone().multiplyScalar(.9).add(toWide).normalize();toCam.applyAxisAngle(new T.Vector3(0,1,0),this.side*.22);
      this.wantPos.copy(head).addScaledVector(toCam,a.base==='sit'?3.9:4.4).add(new T.Vector3(0,1.05,0));this.wantTgt.copy(head).add(new T.Vector3(0,-.45,0));
      this.wantPos.x=T.MathUtils.clamp(this.wantPos.x,-6.6,9);this.wantPos.z=T.MathUtils.clamp(this.wantPos.z,-3.6,13)}
    if(prev.distanceTo(this.wantPos)>2.5){$('panel-flash').classList.remove('go');void $('panel-flash').offsetWidth;$('panel-flash').classList.add('go')}
  }

  // ── Concurso y futuros ─────────────────────────────
  private openQuiz(){
    this.phase='quiz';this.hideBubbles();for(const p of Object.values(this.actors))p.talking=false;
    const d=DIALOGOS[this.place!];const box=$('quiz-options');box.innerHTML='';
    $('quiz-place').textContent=SITES.find(s=>s.id===this.place)!.name;
    d.bifurcaciones.forEach((b,i)=>{const btn=document.createElement('button');btn.className='quiz-opt';btn.type='button';
      btn.innerHTML=`<span class="quiz-letter">${'ABC'[i]}</span><span class="quiz-body"><strong>${b.titulo}</strong><em>${b.contexto}</em></span>`;
      btn.addEventListener('click',()=>this.choose(i));box.appendChild(btn)});
    this.quiz.classList.add('on');this.shot('wide');
  }
  choose(i:number){
    if(this.phase!=='quiz')return;this.choice=i;
    const btns=[...document.querySelectorAll<HTMLButtonElement>('.quiz-opt')];btns.forEach((b,k)=>b.classList.toggle('picked',k===i));
    $('quiz').classList.add('locked');
    setTimeout(()=>{this.quiz.classList.remove('on','locked');this.phase='rama';this.index=-1;document.body.classList.add('futuro');
      $('futuro-title').textContent=DIALOGOS[this.place!].bifurcaciones[i].titulo;
      STAGES[this.place!].branchInit?.(this.ctx);for(const p of Object.values(this.actors)){p.stopGesture();if(!['bailarin','bailarina','inga'].includes(p.name))p.dance(false)}
      this.next()},1300);
  }
  private openFinal(){
    this.phase='final';this.hideBubbles();const b=DIALOGOS[this.place!].bifurcaciones[this.choice];
    $('final-title').textContent=b.titulo;$('final-text').textContent=b.contexto;this.final.classList.add('on');
  }
  replay(){if(!this.place)return;this.final.classList.remove('on');document.body.classList.remove('futuro');const p=this.place;this.open(p)}
  otherFuture(){if(!this.place)return;this.final.classList.remove('on');document.body.classList.remove('futuro');this.phase='inicio';this.index=DIALOGOS[this.place].inicio.length-1;this.openQuiz()}
  finish(){if(!this.place)return;const p=this.place,c=this.choice;this.close();this.place=null;this.onExit(p,c)}
  abort(){if(!this.place)return;const p=this.place;this.close();this.place=null;this.onExit(p,-1)}

  update(dt:number,t:number,w:number,h:number){
    if(!this.place)return;
    for(const p of Object.values(this.actors))p.update(dt,t);this.dog?.update(dt,t);
    for(const tw of this.tweens){tw.t+=dt;const k=Math.min(1,tw.t/tw.dur);const e=1-Math.pow(1-k,2.2);tw.o.position.x=tw.from+(tw.to-tw.from)*e;tw.o.position.z=tw.z}
    this.tweens=this.tweens.filter(tw=>tw.t<tw.dur);
    (this.rainObj?.userData.tick as ((d:number)=>void)|undefined)?.(dt);
    const ball=this.set.getObjectByName('bola');if(ball)ball.rotation.y+=dt*.8;
    this.extraLights.forEach((l,i)=>{if((l as T.SpotLight).isSpotLight){(l as T.SpotLight).target.position.set(Math.sin(t*1.3+i*2)*3,0,-1.5+Math.cos(t*1.1+i)*2)}});
    // cámara con dolly suave
    const k=1-Math.exp(-dt*3.2);this.camPos.lerp(this.wantPos,k);this.camTgt.lerp(this.wantTgt,k);
    this.camera.position.copy(this.camPos).add(new T.Vector3(Math.sin(t*.4)*.05,Math.sin(t*.53)*.04,0));this.camera.lookAt(this.camTgt);
    this.camera.aspect=w/h;this.camera.fov=w/h<1?58:38;this.camera.updateProjectionMatrix();
    // tipografía progresiva
    if(this.typing&&this.typing.n<this.typing.full.length){this.typing.n=Math.min(this.typing.full.length,this.typing.n+Math.max(1,Math.round(dt*62)));this.typing.el.textContent=this.typing.full.slice(0,this.typing.n)}
    // globo anclado a la cabeza del hablante
    if(this.speaker&&this.balloon.classList.contains('on')){
      const p=this.speaker.topWorld().project(this.camera);let x=(p.x*.5+.5)*w,y=(-p.y*.5+.5)*h;
      const bw=this.balloon.offsetWidth,bh=this.balloon.offsetHeight;
      let left=x-bw*.3,top=y-bh-34;const pad=18;
      left=Math.max(pad,Math.min(w-bw-pad,left));top=Math.max(118,Math.min(h-bh-150,top));
      this.balloon.style.transform=`translate(${left}px,${top}px)`;
      const tail=Math.max(24,Math.min(bw-24,x-left));this.balloon.style.setProperty('--tail',tail+'px');
      const below=y<top+bh;this.balloon.classList.toggle('tail-up',below);
    }
  }
  state(){return {place:this.place,phase:this.phase,index:this.index,choice:this.choice}}
}
