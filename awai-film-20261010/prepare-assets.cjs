// Reproducible derivatives from approved existing images; no image generation.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '../../..');
const out = path.join(__dirname, 'assets');
const entries = [];
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const g1 = 'docs/awai/g1-keyframes/assets';
const fabric = [
  {file:'site-kasane/assets/fabric-rib.webp', author:'Marcus Urbenz', url:'https://unsplash.com/photos/Xag89-CFc0s'},
  {file:'site-kasane/assets/fabric-linen.webp', author:'Ashes Sitoula', url:'https://unsplash.com/photos/k9gLfaJq60Y'},
];
async function record(name, source, transform, status, credit) {
  const buffer = fs.readFileSync(path.join(out,name));
  const m = await sharp(buffer).metadata();
  entries.push({file:'assets/'+name, source, sourceURL:credit?.url||null, author:credit?.author||'本人（G1キーフレーム）', license:credit?'Unsplash License; G0で権利確認済み':'本人制作物・今回使用承認済み', acquired:'元の取得日不明', processed:'2026-10-11', status, transform, width:m.width,height:m.height,alpha:!!m.hasAlpha,bytes:buffer.length,sha256:sha(buffer)});
}
const smooth = (a,b,x) => {const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
async function main() {
  fs.mkdirSync(out,{recursive:true});
  for(let scene=0;scene<5;scene++) for(const viewport of ['pc','sp']) {
    const name=`s${scene}-${viewport}.webp`, src=g1+'/'+name;
    const b=fs.readFileSync(path.join(root,src)); fs.writeFileSync(path.join(out,name),b);
    if(sha(b)!==sha(fs.readFileSync(path.join(out,name)))) throw Error('Copy mismatch: '+name);
    await record(name,src,'元画像をbyte一致でコピー','承認済み');
  }
  for(const viewport of ['pc','sp']) {
    let src=g1+`/s1-${viewport}.webp`, name=`s1-${viewport}-blur.webp`;
    await sharp(path.join(root,src)).blur(14).webp({quality:74,effort:5}).toFile(path.join(out,name));
    await record(name,src,'事前blur sigma=14; 元画像と同じ寸法','承認済み');
    src=g1+`/s3-${viewport}.webp`; name=`s3-${viewport}-black.webp`;
    const original=await sharp(path.join(root,src)).removeAlpha().raw().toBuffer({resolveWithObject:true});
    const indigo=Buffer.alloc(original.info.width*original.info.height*3),black=Buffer.alloc(indigo.length);
    for(let i=0;i<indigo.length;i+=3){
      const r=original.data[i],g=original.data[i+1],b=original.data[i+2];
      const y=.2126*r+.7152*g+.0722*b;
      // Ink palette: navy shadows, muted indigo highlights. The original folds
      // control luminance; existing blue veins retain slightly more chroma.
      const dark=[24,27,57],middle=[42,46,78],high=[22,94,131];
      const t=y<100?Math.max(0,Math.min(1,(y-40)/60)):Math.min(1,(y-100)/110);
      const lo=y<100?dark:middle,hi=y<100?middle:high;
      const palette=lo.map((v,k)=>v+(hi[k]-v)*t);
      const paletteY=.2126*palette[0]+.7152*palette[1]+.0722*palette[2];
      const gray=.12-.06*Math.max(0,Math.min(1,(b-r)/80));
      const targetY=Math.min(y*.55*.90,paletteY),scale=paletteY?targetY/paletteY:0;
      for(let k=0;k<3;k++)indigo[i+k]=Math.round((palette[k]*(1-gray)+paletteY*gray)*scale);
      black[i]=black[i+1]=black[i+2]=Math.round(y*.55);
    }
    await sharp(black,{raw:{width:original.info.width,height:original.info.height,channels:3}}).webp({lossless:true,effort:5}).toFile(path.join(out,name));
    await record(name,src,'同じG1画素の輝度Yを0.55倍、無彩色の黒布。色差の余地を残すため元0.45から変更。lossless WebP','仮');
    name=`s3-${viewport}-indigo.webp`;
    await sharp(indigo,{raw:{width:original.info.width,height:original.info.height,channels:3}}).webp({lossless:true,effort:5}).toFile(path.join(out,name));
    await record(name,src,'G1 から色処理・仮。#181B39→#2A2E4E→#165E83の灰みの藍へ、targetY=min(0.90×0.55×元Y,paletteY)。灰混合6〜12%。既存藍筋は灰混合を減らす。同じ画素・lossless WebP','仮');
    const width=viewport==='pc'?1280:731, height=viewport==='pc'?731:1280;
    for(let layer=0;layer<3;layer++) {
      const credit=fabric[layer===0?0:1];
      const {data,info}=await sharp(path.join(root,credit.file)).resize(width,height,{fit:'cover'}).grayscale().raw().toBuffer({resolveWithObject:true});
      const rgba=Buffer.alloc(width*height*4);
      for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
        const u=x/(width-1), v=y/(height-1), at=y*width+x;
        const lum=data[at*info.channels]/255;
        // Shared descending diagonal; independently translated layers expose depth.
        const diagonal=viewport==='pc'?0.13+0.53*u:0.12+0.52*u;
        let shape, light;
        if(layer===0) {shape=(1-smooth(diagonal+0.035,diagonal+0.055,v))*(1-smooth(0.61,0.64,u));light=0.47+0.53*Math.exp(-Math.pow((v-diagonal+0.12)/0.11,2));}
        else if(layer===1) {const d=u-(0.43+0.58*v);shape=(1-smooth(0.19,0.215,Math.abs(d)));light=0.38+0.62*Math.exp(-Math.pow((d+0.07)/0.075,2));}
        else {shape=smooth(0.68,0.705,u)*(1-smooth(0.94,0.98,u));light=0.44+0.56*Math.exp(-Math.pow((u-0.78)/0.1,2));}
        const a=255*shape*Math.pow(lum,1.6)*(layer===1?0.42:0.83);
        const rgb=Math.round((layer===0?96:layer===1?81:68)*light);
        rgba[at*4]=rgba[at*4+1]=rgba[at*4+2]=rgb;rgba[at*4+3]=Math.round(a);
      }
      name=`kasane-${viewport}-${layer}.webp`;
      await sharp(rgba,{raw:{width,height,channels:4}}).webp({quality:76,alphaQuality:88,effort:5}).toFile(path.join(out,name));
      await record(name,credit.file,`G0布の明度alpha抜き、層${layer}、斜め縁・照明マスク、黒地screen合成用`,'仮',credit);
    }
  }
  const totalBytes=entries.reduce((n,e)=>n+e.bytes,0);
  fs.writeFileSync(path.join(__dirname,'asset-manifest.json'),JSON.stringify({processed:'2026-10-11',totalBytes,entries},null,2)+'\n');
  const rows=entries.map(e=>`| ${e.file} | ${e.sourceURL||e.source} | ${e.author} | ${e.license} | ${e.acquired}（加工 ${e.processed}） | ${e.status} | ${e.transform} |`);
  const ledger=['# 通し版素材台帳','','新しい画像生成は行っていない。元G1 10枚はSHA-256でbyte一致を確認。','','- G1：本人制作物、今回の使用承認。助任珈琲豆店・KASANE・AIMAはコンセプト制作。実在の受注事例として表記しない。','- G0布：docs/awai/01-assets.md の US-fabric-linen / US-fabric-rib、site-kasane/CREDITS.md が根拠。無料Unsplash写真、加工済み原素材。Unsplash+不使用。','- S2仮素材：G0写真の明度で抜いた独立alpha 3層。G1の稜線方向へ寄せた切抜きであり、G1の繊細な透け布を完全再現する素材ではない。黒地でscreen合成を前提とする。','- S3：G1 から色処理・仮。2026-10-11本人承認。元画像・黒布・全面藍は同じ画素から作り皺が一致。全面藍は黒布より明るくせず、濃紺から灰みの藍へ移す。元の明暗から陰影を保持し、既存藍筋は灰混合を減らす。lossless WebP・丸めの差あり。','- 原素材の取得日は既存資料に記載がなく不明。今回の加工日は原取得日と区別して記録。','','| ファイル | 出典URL/内部出典 | 作者 | ライセンス/使用根拠 | 取得日 | 状態 | 加工 |','|---|---|---|---|---|---|---|',...rows,'',`画像合計：${entries.length}点 / ${totalBytes} bytes（${(totalBytes/1048576).toFixed(2)} MiB）。`,'','再加工：このフォルダで `node prepare-assets.cjs`。asset-manifest.json に寸法・alpha・SHA-256・容量を記録。',''];
  fs.writeFileSync(path.join(__dirname,'assets-ledger.md'),ledger.join('\n'));
  console.log(JSON.stringify({images:entries.length,totalBytes,totalMiB:(totalBytes/1048576).toFixed(2),derivatives:entries.filter(e=>e.transform!=='元画像をbyte一致でコピー').map(e=>({file:e.file,bytes:e.bytes,alpha:e.alpha}))}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
