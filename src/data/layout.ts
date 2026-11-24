/** LA BOGOTÁ SATÍRICA · V09 — Planta escénica.
 * Sistema de coordenadas: x = oriente (+), z = sur (+); el norte es −z.
 * Unidad escénica ficticia (≈ 1 m de maqueta). La topología sigue el Plano 2D V04 aprobado:
 * Séptima N–S, Calle 26 E–O, ramales barriales al occidente y Cerros Orientales al oriente.
 * Todas las posiciones se comprueban con tests/validate-layout (sin solapes edificio/vía/edificio).
 */
export type V2 = [number, number];
export type PlaceId = 'apartamento'|'taller'|'oasis'|'unicornio'|'jockey'|'porciuncula'|'parque'|'casa_familiar'|'oficina'|'cementerio'|'septima';

/** Radio de la meseta urbana (corte plano del globo). */
export const DISC_R = 66;
/** Radio de la esfera y altura del corte: la esfera tiene centro en y = −SPHERE_CUT. */
export const SPHERE_R = 74;
export const SPHERE_CUT = Math.sqrt(SPHERE_R*SPHERE_R - DISC_R*DISC_R); // ≈ 33.5
/** Anillo vial que rodea el borde de la meseta (como en la maqueta de referencia). */
export const RING_R = 61.5;
/** Los cerros empiezan a elevarse a partir de este oriente. */
export const CERROS_X = 34;

export interface Road { id:string; name:string; kind:'avenida'|'calle'|'sendero'; width:number; pts:V2[] }
export const ROADS: Road[] = [
  { id:'septima', name:'Carrera Séptima', kind:'avenida', width:5.2, pts:[[0,42.5],[0,-41]] },
  { id:'calle26', name:'Calle 26', kind:'avenida', width:5.2, pts:[[-57.4,22],[-36,22],[32,22],[57.4,22]] },
  { id:'occidente', name:'Avenida Caracas · tramo barrial', kind:'calle', width:3.6, pts:[[-36,22],[-34,4],[-31,-16],[-22,-32],[-10,-40],[0,-41]] },
  { id:'calle45', name:'Calle 45 · Chapinero', kind:'calle', width:3.6, pts:[[-31,-16],[0,-16]] },
  { id:'parque', name:'Calle 36 · del Parque', kind:'calle', width:3.6, pts:[[-34,4],[-16,0.5],[0,0]] },
  { id:'oriente', name:'Circunvalar', kind:'calle', width:3.6, pts:[[0,-30],[16,-30],[26,-16],[26,22]] },
  { id:'calera', name:'Vía a La Calera', kind:'calle', width:3.6, pts:[[26,-16],[34,-26],[43.5,-43.5]] },
  { id:'usaquen', name:'Camino de Usaquén', kind:'calle', width:3.6, pts:[[-10,-40],[-21,-57.8]] },
  { id:'anillo', name:'Anillo de la maqueta', kind:'avenida', width:5.2, pts:ring(RING_R,72) },
];
function ring(r:number,n:number):V2[]{const p:V2[]=[];for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;p.push([Math.cos(a)*r,Math.sin(a)*r])}return p}

export type SiteKind = 'domestico'|'bohemio'|'institucional'|'paisaje'|'urbano'|'ritual'|'nocturno'|'memoria';
export interface Site {
  id: PlaceId; name: string; area: string; kind: SiteKind;
  /** centro de la huella */ pos: V2;
  /** ancho (x local) × fondo (z local) */ size: V2;
  height: number;
  /** ángulo de la fachada: la puerta mira hacia (sin rot, cos rot) */ rot: number;
  /** color de leyenda (plano V04) */ color: string;
  /** escenario abierto (parque, calle) en vez de edificio */ open?: boolean;
}
export const SITES: Site[] = [
  { id:'unicornio', name:'EL UNICORNIO', area:'Noche y contradicciones', kind:'nocturno', pos:[0,-50], size:[14,9], height:7.5, rot:0, color:'#a98aa0' },
  { id:'porciuncula', name:'LA PORCIÚNCULA', area:'Atrio y ritual', kind:'ritual', pos:[16,-42], size:[9,13], height:9, rot:0, color:'#d1c19a' },
  { id:'casa_familiar', name:'CASA DE DOÑA LEONOR', area:'La casa familiar de Ignacio', kind:'domestico', pos:[-27,-41], size:[12,9], height:8, rot:Math.PI/2, color:'#b9866d' },
  { id:'apartamento', name:'LA SOLEDAD', area:'Apartamento de Ignacio y Fina', kind:'domestico', pos:[-46,-13], size:[9,11], height:13, rot:Math.PI/2, color:'#b9866d' },
  { id:'taller', name:'TALLER DE DIEGO LEÓN', area:'Taller de arte y ajedrez', kind:'bohemio', pos:[-47,9], size:[9,8], height:7.5, rot:Math.PI/2, color:'#bd9682' },
  { id:'parque', name:'PARQUE NACIONAL', area:'El parque y los paseantes', kind:'paisaje', pos:[-15,-8], size:[14,14], height:0, rot:0, color:'#9cb08f', open:true },
  { id:'septima', name:'CARRERA SÉPTIMA', area:'Tránsito, lluvia y voces', kind:'urbano', pos:[8.5,4], size:[8,6.5], height:7, rot:-Math.PI/2, color:'#b2ada3' },
  { id:'oasis', name:'EL OASIS', area:'Bar y poetas', kind:'bohemio', pos:[-12,31.5], size:[9.5,8], height:6.5, rot:Math.PI, color:'#bd9682' },
  { id:'cementerio', name:'CEMENTERIO CENTRAL', area:'Muerte y memoria', kind:'memoria', pos:[-30,36.5], size:[14,9], height:5, rot:Math.PI, color:'#b2ada3' },
  { id:'oficina', name:'LA OFICINA', area:'La rutina', kind:'urbano', pos:[12,32.5], size:[8,8], height:17, rot:Math.PI, color:'#b2ada3' },
  { id:'jockey', name:'JOCKEY CLUB', area:'La ceremonia de la élite', kind:'institucional', pos:[0,50.5], size:[14,9], height:9, rot:Math.PI, color:'#c2aa82' },
];

/** Hitos de época no transitables. */
export interface Landmark { id:string; label:string; pos:V2; size:V2; height:number; rot:number; round?:boolean }
export const LANDMARKS: Landmark[] = [
  { id:'plaza_toros', label:'Plaza de Toros La Santamaría', pos:[18.2,13.2], size:[9.4,9.4], height:4.2, rot:0, round:true },
  { id:'torre_a', label:'Torres del Parque', pos:[9.5,-6.5], size:[4.4,4.4], height:13, rot:0, round:true },
  { id:'torre_b', label:'Torres del Parque', pos:[16,-11], size:[4.8,4.8], height:16, rot:0, round:true },
  { id:'torre_c', label:'Torres del Parque', pos:[19.5,-5], size:[4,4], height:11, rot:0, round:true },
  { id:'museo_nacional', label:'Museo Nacional', pos:[-12,11], size:[12,7.5], height:6, rot:Math.PI, round:false },
  { id:'tequendama', label:'Centro Internacional Tequendama', pos:[26,34], size:[6.5,6.5], height:24, rot:Math.PI, round:false },
];

/** Punto de la puerta (zona de interacción caminable) de un sitio. */
export function doorOf(s: Site): V2 {
  if (s.open) return s.pos;
  const d = s.size[1]/2 + 2.4;
  return [s.pos[0] + Math.sin(s.rot)*d, s.pos[1] + Math.cos(s.rot)*d];
}

// ── Geometría 2D ──────────────────────────────────────────────
export function closestOnSeg(p:V2,a:V2,b:V2):{q:V2;d:number;t:number}{
  const abx=b[0]-a[0],abz=b[1]-a[1],L=abx*abx+abz*abz||1e-9;
  let t=((p[0]-a[0])*abx+(p[1]-a[1])*abz)/L;t=Math.max(0,Math.min(1,t));
  const q:V2=[a[0]+abx*t,a[1]+abz*t];return {q,d:Math.hypot(p[0]-q[0],p[1]-q[1]),t};
}
export function closestOnRoad(p:V2,r:Road){let best={q:r.pts[0] as V2,d:Infinity,seg:0,t:0};
  for(let i=0;i<r.pts.length-1;i++){const c=closestOnSeg(p,r.pts[i],r.pts[i+1]);if(c.d<best.d)best={q:c.q,d:c.d,seg:i,t:c.t}}return best}
export function closestRoad(p:V2,roads:Road[]=ROADS){let best:{road:Road;q:V2;d:number}|null=null;
  for(const r of roads){const c=closestOnRoad(p,r);if(!best||c.d<best.d)best={road:r,q:c.q,d:c.d}}return best!}

/** Senderos peatonales automáticos: de cada puerta a la vía más próxima. */
export const PATHS: Road[] = SITES.filter(s=>!s.open).map(s=>{
  const door=doorOf(s);const c=closestRoad(door);
  return { id:'sendero_'+s.id, name:'Acceso · '+s.name, kind:'sendero' as const, width:2.8, pts:[c.q, door] };
});
/** Zonas abiertas caminables (plazoletas y el parque). */
export interface Plaza { id:string; pos:V2; r:number }
export const PLAZAS: Plaza[] = [
  ...SITES.map(s=>({ id:'plaza_'+s.id, pos:doorOf(s), r: s.open? 7.2 : 3.1 })),
  { id:'atrio_porciuncula', pos:[16,-32.5], r:3.4 },
];

/** Punto de interacción (umbral) de cada lugar. */
export function triggerOf(s:Site):V2{return s.open?[s.pos[0]+4.2,s.pos[1]]:doorOf(s)}

/** Rectángulo orientado de una huella (esquinas en planta). */
export function footprint(pos:V2,size:V2,rot:number,pad=0):V2[]{
  const [w,d]=[size[0]/2+pad,size[1]/2+pad];const c=Math.cos(rot),s=Math.sin(rot);
  return ([[-w,-d],[w,-d],[w,d],[-w,d]] as V2[]).map(([x,z])=>[pos[0]+x*c+z*s,pos[1]-x*s+z*c] as V2);
}
export function pointInPoly(p:V2,poly:V2[]){let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,zi]=poly[i],[xj,zj]=poly[j];
    if(((zi>p[1])!==(zj>p[1]))&&(p[0]<(xj-xi)*(p[1]-zi)/(zj-zi)+xi))inside=!inside}return inside}
export function distPointPoly(p:V2,poly:V2[]){if(pointInPoly(p,poly))return 0;let d=Infinity;
  for(let i=0;i<poly.length;i++)d=Math.min(d,closestOnSeg(p,poly[i],poly[(i+1)%poly.length]).d);return d}
