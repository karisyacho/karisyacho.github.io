export type SeamKind = 'same' | 'white' | 'dark' | 'cut';
export type Scene = {id:string;lengthVh:number;owner:'user'|'site';touch:boolean;surface:string;back:string;seamIn:SeamKind};
export const scenes:Scene[] = [
 {id:'open',lengthVh:100,owner:'user',touch:true,surface:'paper',back:'dusk',seamIn:'same'},
 {id:'part',lengthVh:200,owner:'user',touch:false,surface:'paper',back:'dusk',seamIn:'same'},
 {id:'breath',lengthVh:100,owner:'user',touch:false,surface:'paper',back:'dusk',seamIn:'same'},
 {id:'door',lengthVh:80,owner:'user',touch:false,surface:'paper',back:'suketo',seamIn:'same'},
 {id:'suketo',lengthVh:180,owner:'user',touch:true,surface:'suketo',back:'suketo-web',seamIn:'same'},
 {id:'interlude',lengthVh:60,owner:'user',touch:false,surface:'paper',back:'paper',seamIn:'white'},
 {id:'okinohama',lengthVh:60,owner:'user',touch:false,surface:'none',back:'okinohama',seamIn:'dark'},
 {id:'uchimachi',lengthVh:120,owner:'user',touch:false,surface:'none',back:'uchimachi',seamIn:'white'},
 {id:'kasane',lengthVh:120,owner:'site',touch:false,surface:'black',back:'kasane',seamIn:'dark'},
 {id:'arc',lengthVh:80,owner:'user',touch:false,surface:'none',back:'arc',seamIn:'cut'},
 {id:'studiofree',lengthVh:120,owner:'site',touch:false,surface:'none',back:'studiofree',seamIn:'cut'},
 {id:'rest',lengthVh:60,owner:'user',touch:false,surface:'paper',back:'shadow-placeholder',seamIn:'white'},
 {id:'aima-in',lengthVh:60,owner:'user',touch:false,surface:'paper',back:'cloth-wide-placeholder',seamIn:'dark'},
 {id:'aima',lengthVh:120,owner:'user',touch:true,surface:'cloth-plain-placeholder',back:'cloth-dyed-placeholder',seamIn:'white'},
 {id:'aima-fuse',lengthVh:80,owner:'user',touch:false,surface:'cloth-plain-placeholder',back:'cloth-dyed-placeholder',seamIn:'same'},
 {id:'aima-return',lengthVh:80,owner:'user',touch:false,surface:'cloth-dyed-placeholder',back:'paper',seamIn:'same'},
 {id:'silence',lengthVh:100,owner:'user',touch:false,surface:'paper',back:'dusk',seamIn:'same'},
 {id:'human',lengthVh:80,owner:'user',touch:false,surface:'paper',back:'paper',seamIn:'same'},
 {id:'credits',lengthVh:160,owner:'user',touch:false,surface:'paper',back:'paper',seamIn:'same'},
 {id:'blank',lengthVh:100,owner:'user',touch:true,surface:'paper',back:'white',seamIn:'same'},
];
export const totalVh = scenes.reduce((sum,s)=>sum+s.lengthVh,0);
export const clamp = (n:number)=>Math.max(0,Math.min(1,n));
export const smooth = (n:number)=>{const v=clamp(n);return v*v*(3-2*v);};
export function sceneStart(index:number){return scenes.slice(0,index).reduce((n,s)=>n+s.lengthVh,0);}
// Coordinates are scroll pixels, independent of DOM and drawing state.
export function resolve(scrollY:number,viewportH:number){
 const vh = Number.isFinite(viewportH)&&viewportH>0?viewportH:1;
 const position = Math.max(0,Math.min(totalVh,Number.isFinite(scrollY)?Math.round(scrollY/vh*100*1e8)/1e8:0));
 let start=0,index=scenes.length-1;
 for(let i=0;i<scenes.length;i++){if(position<start+scenes[i].lengthVh||i===scenes.length-1){index=i;break;}start+=scenes[i].lengthVh;}
 const scene=scenes[index],p=clamp((position-start)/scene.lengthVh),prev=scenes[index-1],next=scenes[index+1];
 const seamStart=scene.touch?.90:.78;
 const seam=next&&next.seamIn!=='same'&&next.seamIn!=='cut'&&p>=seamStart?{from:scene.id,to:next.id,t:clamp((p-seamStart)/(1-seamStart)),kind:next.seamIn}:undefined;
 return {scene,p,prev,next,seam,index,startVh:start};
}
