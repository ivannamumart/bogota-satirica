/** Reparto: apariencia setentera de cada voz del guion. */
import type {Look} from '../world/people';

const SK={claro:'#eec3a0',medio:'#dcab84',trigueño:'#c48e66',moreno:'#a8714d'};
export const LOOKS:Record<string,Look>={
  escobar:{skin:SK.medio,hair:'#2b1d14',hairStyle:'largo',outfit:'chaqueta',top:'#8a5a34',top2:'#d9a441',bottom:'#3d4f6e',beard:'bigote',shoes:'#4a2f1f'},
  fina:{skin:SK.claro,hair:'#6b4026',hairStyle:'melena',outfit:'vestido',top:'#d9774a',top2:'#d9774a',bottom:'#e8b892',shoes:'#5b3a26'},
  diego:{skin:SK.trigueño,hair:'#1d1a18',hairStyle:'corto',outfit:'bata',top:'#d8cfb8',bottom:'#5a4c3c',beard:'barba',hat:'boina'},
  federico:{skin:SK.claro,hair:'#3a2a1f',hairStyle:'corto',outfit:'chaqueta',top:'#5f6b3e',top2:'#e6dcc4',bottom:'#4a4036',beard:'barba',glasses:true},
  anamaria:{skin:SK.claro,hair:'#2a1b12',hairStyle:'bob',outfit:'falda',top:'#4f8a6f',top2:'#3a5e8a',bottom:'#e6b48e'},
  eden:{skin:SK.moreno,hair:'#1b1310',hairStyle:'afro',outfit:'chaqueta',top:'#9b3e2e',top2:'#efe6d0',bottom:'#2e2e33',beard:'bigote'},
  narciso:{skin:SK.medio,hair:'#8d8a84',hairStyle:'canoso',outfit:'ruana',top:'#e4dccb',top2:'#7a6a52',bottom:'#4b443b',glasses:true},
  ruben:{skin:SK.trigueño,hair:'#2c211a',hairStyle:'largo',outfit:'cuello',top:'#2f3b4d',bottom:'#6b5b45',beard:'patillas'},
  ramon:{skin:SK.medio,hair:'#4b3324',hairStyle:'corto',outfit:'chaqueta',top:'#6f5844',top2:'#e8dfc9',bottom:'#3a3a3a',beard:'barba'},
  poeta:{skin:SK.trigueño,hair:'#4a3a2a',hairStyle:'largo',outfit:'ruana',top:'#ddd2bb',top2:'#6d5a3c',bottom:'#3f3a33',beard:'barba'},
  angela:{skin:SK.claro,hair:'#6a3c1f',hairStyle:'mono',outfit:'bata',top:'#8c2f3a',bottom:'#e2b08a',shoes:'#2e2420'},
  monsenor:{skin:SK.claro,hair:'#bdb8ae',hairStyle:'tonsura',outfit:'sotana',top:'#1f1f24',bottom:'#1f1f24',glasses:true,heavy:1.12},
  madre:{skin:SK.claro,hair:'#d4cfc7',hairStyle:'mono',outfit:'vestido',top:'#4c4a6a',top2:'#4c4a6a',bottom:'#d8b394',necklace:true,heavy:1.08},
  pablo:{skin:SK.medio,hair:'#9d998f',hairStyle:'canoso',outfit:'traje',top:'#4a4a4f',top2:'#efe9dc',bottom:'#4a4a4f',tie:'#7c2b2b',beard:'bigote',glasses:true,heavy:1.15},
  focion:{skin:SK.claro,hair:'#cfc8bb',hairStyle:'calvo',outfit:'traje',top:'#2f3542',top2:'#f1ece0',bottom:'#2f3542',tie:'#5a2a4a',beard:'bigote',heavy:1.12},
  fantasma:{skin:'#dfe7ee',hair:'#e9eef2',hairStyle:'calvo',outfit:'traje',top:'#c9d4de',top2:'#f4f7f9',bottom:'#c9d4de',tie:'#aab8c6',beard:'bigote',heavy:1.12},
  alicia:{skin:SK.claro,hair:'#d9b56c',hairStyle:'bob',outfit:'vestido',top:'#e6a6b7',top2:'#e6a6b7',bottom:'#f0cdb4',necklace:true,shoes:'#e8e1d6'},
  prima:{skin:SK.claro,hair:'#3a2414',hairStyle:'largo',outfit:'vestido',top:'#a7c7e7',top2:'#a7c7e7',bottom:'#eec3a0',scale:.9,shoes:'#f2efe6'},
  jefe:{skin:SK.medio,hair:'#5a4a3c',hairStyle:'calvo',outfit:'traje',top:'#5b5e66',top2:'#ece6d8',bottom:'#5b5e66',tie:'#2f4f7a',glasses:true,heavy:1.22},
  inga:{skin:SK.claro,hair:'#e8d28a',hairStyle:'largo',outfit:'vestido',top:'#c9473f',top2:'#c9473f',bottom:'#eec3a0',shoes:'#eec3a0'},
  mesero:{skin:SK.trigueño,hair:'#1f1812',hairStyle:'corto',outfit:'chaqueta',top:'#f2efe6',top2:'#f2efe6',bottom:'#222',tie:'#111',beard:'bigote'},
  bailarin:{skin:SK.trigueño,hair:'#2a1d15',hairStyle:'afro',outfit:'cuello',top:'#e0a63a',bottom:'#6a2f4f'},
  bailarina:{skin:SK.medio,hair:'#3b2416',hairStyle:'melena',outfit:'vestido',top:'#3f8fa3',top2:'#3f8fa3',bottom:'#dcab84'},
  feligres:{skin:SK.medio,hair:'#4a3a2e',hairStyle:'mono',outfit:'vestido',top:'#3c3a3e',top2:'#3c3a3e',bottom:'#3c3a3e'},
  feligres2:{skin:SK.trigueño,hair:'#2a2a2a',hairStyle:'corto',outfit:'traje',top:'#3e3a34',top2:'#ddd',bottom:'#3e3a34',tie:'#222'},
  peaton:{skin:SK.trigueño,hair:'#222',hairStyle:'corto',outfit:'chaqueta',top:'#4e5d6b',top2:'#ddd5c2',bottom:'#3b3b3b',hat:'sombrero'},
};

/** Voz del guion → identificador del personaje en escena. */
export const VOICE:Record<string,string>={
  'Escobar':'escobar','Ignacio':'escobar','Fina':'fina','Diego León':'diego','Federico':'federico','Ana María':'anamaria',
  'Edén':'eden','Narciso':'narciso','Poeta':'poeta','Ángela':'angela','Monseñor':'monsenor','Madre':'madre',
  'Tío Pablo':'pablo','Foción':'focion','Alicia':'alicia','Prima Alicia':'alicia','Prima adolescente':'prima','Jefe':'jefe','Inga':'inga',
};
/** Nombre que aparece en el globo de diálogo. */
export const DISPLAY:Record<string,string>={escobar:'IGNACIO ESCOBAR',fina:'FINA',diego:'DIEGO LEÓN',federico:'FEDERICO',anamaria:'ANA MARÍA',eden:'EDÉN',narciso:'NARCISO',
  poeta:'EL POETA',angela:'ÁNGELA',monsenor:'MONSEÑOR',madre:'DOÑA LEONOR',pablo:'TÍO PABLO',focion:'FOCIÓN',alicia:'ALICIA',prima:'LA PRIMA',jefe:'EL JEFE',inga:'INGA',ruben:'RUBÉN',ramon:'RAMÓN',mesero:'MESERO'};
