const fs=require('fs'),path=require('path'),sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=__dirname,out=path.join(root,'evidence');
(async()=>{
 const names=fs.readdirSync(out).filter(n=>/^(chromium|webkit)-(pc|sp)-.*\.jpg$/.test(n));
 for(const n of names){const f=path.join(out,n),max=n.includes('-sp-')?390:640,b=await sharp(fs.readFileSync(f)).resize({width:max,withoutEnlargement:true}).jpeg({quality:82}).toBuffer();fs.writeFileSync(f,b);}
 const ids=['s0-membrane','seam-01','s1-suketo','seam-12','s2-kasane','seam-23','s3-aima','seam-34','s4-paper'];
 const composites=[];for(let i=0;i<ids.length;i++)for(const [col,size] of [[0,'pc'],[1,'sp']]){
  const b=await sharp(path.join(out,`chromium-${size}-center-${ids[i]}.jpg`)).resize(280,190,{fit:'contain',background:'#090a0c'}).jpeg().toBuffer();composites.push({input:b,left:col*280,top:i*216+26});
 }
 const label=Buffer.from(`<svg width="560" height="1944"><style>text{font:14px sans-serif;fill:#d6d7da}</style>${ids.map((s,i)=>`<text x="8" y="${i*216+18}">${s} / PC</text><text x="288" y="${i*216+18}">${s} / SP</text>`).join('')}</svg>`);composites.push({input:label,left:0,top:0});
 await sharp({create:{width:560,height:1944,channels:3,background:'#111316'}}).composite(composites).jpeg({quality:85}).toFile(path.join(out,'interactive-overview.jpg'));
 fs.writeFileSync(path.join(out,'screenshot-presentation.json'),JSON.stringify({screenshots:names.length,spRasterWidth:390,pcRasterWidth:640,viewports:{sp:[390,844],pc:[1280,800]},note:'Browser captures downsampled for mobile review after interaction verification; viewport size unchanged.'},null,2));
 console.log('84 screenshots optimized; PC/SP overview saved');
})().catch(e=>{console.error(e);process.exitCode=1});
