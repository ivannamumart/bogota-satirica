/** Kit de maqueta: materiales de "plastilina" mate y piezas redondeadas. */
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const cache=new Map<string,T.MeshStandardMaterial>();
/** Material mate de arcilla, compartido por color. */
export function clay(color:string|number,opts:{rough?:number;emissive?:number;ei?:number;key?:string;transparent?:boolean}={}){
  const k=String(color)+'|'+(opts.key??'')+(opts.emissive??'')+(opts.rough??'');
  let m=cache.get(k);
  if(!m){m=new T.MeshStandardMaterial({color,roughness:opts.rough??.86,metalness:0,emissive:opts.emissive??0x000000,emissiveIntensity:opts.ei??1,...(opts.transparent?{transparent:true}:{})});cache.set(k,m)}
  return m;
}
export const P={
  cement:'#a7a7a1',cementDark:'#8e8f8a',asphalt:'#6c6c6a',asphaltDark:'#5d5e5c',line:'#f2efe2',curb:'#cfcbc0',sidewalk:'#c9c3b5',
  grass:'#9fbd6b',grassDark:'#86a85a',grassLight:'#b6cf80',sabana:'#a9c27a',hill:'#7fae62',hillDark:'#5f9150',hillLight:'#a7cf86',paramo:'#b9c99a',
  brick:'#b4613f',brickDark:'#93492f',brickLight:'#c9805c',tile:'#b5543a',tileDark:'#9b4630',white:'#f1ece0',cream:'#e8dcc0',stucco:'#e9e1cf',
  window:'#3f4f5a',windowLit:'#ffd98a',wood:'#7a5236',woodDark:'#5b3b25',green:'#4f7a46',trunk:'#6e5340',
};
export function rbox(w:number,h:number,d:number,r=.18,seg=2){return new RoundedBoxGeometry(w,h,d,seg,Math.min(r,w/2-.01,h/2-.01,d/2-.01))}
export function mesh(g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0,cast=true,receive=true){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=receive;return o}

/** Acumulador: agrupa geometrías por material para dibujarlas en una sola llamada. */
export class Batch{
  private parts=new Map<T.Material,T.BufferGeometry[]>();
  add(g:T.BufferGeometry,m:T.Material,matrix?:T.Matrix4){const gg=g.index?g.toNonIndexed():g.clone();if(matrix)gg.applyMatrix4(matrix);
    for(const k of Object.keys(gg.attributes))if(!['position','normal','uv'].includes(k))gg.deleteAttribute(k);
    if(!gg.attributes.uv)gg.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(gg.attributes.position.count*2),2));
    (this.parts.get(m)??this.parts.set(m,[]).get(m)!).push(gg)}
  addMesh(o:T.Object3D){o.updateMatrixWorld(true);o.traverse(c=>{const mm=c as T.Mesh;if(mm.isMesh)this.add(mm.geometry,mm.material as T.Material,mm.matrixWorld)})}
  build(name='lote',cast=true,receive=true){const g=new T.Group();g.name=name;
    for(const [m,list] of this.parts){const merged=mergeGeometries(list,false);if(!merged)continue;const o=new T.Mesh(merged,m);o.castShadow=cast;o.receiveShadow=receive;g.add(o)}
    this.parts.clear();return g}
}

/** Textura de rótulo vintage (letrero esmaltado). */
export function signTexture(text:string,opts:{bg?:string;fg?:string;w?:number;h?:number;font?:string;border?:string}={}){
  const w=opts.w??512,h=opts.h??128,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d')!;
  x.fillStyle=opts.bg??'#f3ead2';x.beginPath();x.roundRect(4,4,w-8,h-8,h*.22);x.fill();
  x.strokeStyle=opts.border??'#3b2f27';x.lineWidth=7;x.stroke();
  x.fillStyle=opts.fg??'#3b2f27';x.textAlign='center';x.textBaseline='middle';
  let size=h*.52;x.font=`700 ${size}px ${opts.font??'"Bangers", "Arial Black", sans-serif'}`;
  while(x.measureText(text).width>w*.86&&size>10){size-=2;x.font=`700 ${size}px ${opts.font??'"Bangers", "Arial Black", sans-serif'}`}
  x.fillText(text,w/2,h/2+2);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
