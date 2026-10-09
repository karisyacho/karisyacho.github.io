// Contact load and optical visibility are independent. No solver calls or timers.
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function createContactState(){
 const s={contact:0,reveal:0,target:0,hit:[.42,.55],down:false,began:0,releasedAt:0,graceUntil:0,releaseReveal:0,reason:'rest',events:0};
 function begin(hit,now){s.hit=[...hit];s.down=true;s.target=1;s.began=now;s.graceUntil=0;s.releasedAt=0;s.reason='contact';s.contact=Math.max(s.contact,.06);s.reveal=Math.max(s.reveal,.08);s.events++;return snapshot();}
 function move(hit){if(s.down)s.hit=[...hit];}
 function release(reason,now,normal=false){
  const wasDown=s.down,age=now-s.began;s.down=false;s.target=0;s.reason=reason;s.releasedAt=now;
  const short=normal&&wasDown&&age>=0&&age<=160;
  s.graceUntil=short?Math.max(now,s.began+280):now;s.releaseReveal=short?Math.max(s.reveal,.72):s.reveal;s.reveal=s.releaseReveal;s.events++;return short;
 }
 function update(now,dt){
  dt=Math.max(0,Math.min(dt,1/30));s.contact+=(s.target-s.contact)*(1-Math.exp(-dt*(s.down?24:4.8)));
  if(Math.abs(s.contact-s.target)<.0005)s.contact=s.target;
  if(s.down)s.reveal+=(1-s.reveal)*(1-Math.exp(-dt*6.5));
  else if(now<s.graceUntil)s.reveal=s.releaseReveal;
  else s.reveal=s.releaseReveal*(1-smooth((now-s.graceUntil)/700));
  if(s.reveal<.0005)s.reveal=0;return snapshot();
 }
 function reset(){Object.assign(s,{contact:0,reveal:0,target:0,down:false,began:0,releasedAt:0,graceUntil:0,releaseReveal:0,reason:'reset',hit:[.42,.55]});}
 function snapshot(){return{...s,hit:[...s.hit],active:s.down||s.contact>0||s.reveal>0};}
 return{begin,move,release,update,reset,snapshot};
}
