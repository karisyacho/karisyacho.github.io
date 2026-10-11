// Explicit scope, no recursive deletion. Git retains the removed draft.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname),out=path.join(root,'evidence');
const fixed=['checks.json','mobile-scroll.mp4','cut-sheet.jpg','320-closing.jpg','no-js.jpg','pc-closing.jpg','pc-opening.jpg','sp-closing.jpg','sp-opening.jpg','recording.json','screenshot-presentation.json','interactive-overview.jpg','asset-comparison.png'];
const files=fs.readdirSync(out).filter(n=>fixed.includes(n)||/^(sp|pc)-cut\d+-(before|after)\.jpg$/.test(n)||/^(chromium|webkit)-(sp|pc)-(s0-membrane|s2-kasane|s3-aima|s4-paper)-(before|during|after)\.jpg$/.test(n));
const removed=[];for(const n of files){const f=path.resolve(out,n);if(!f.startsWith(root+path.sep))throw Error('Escaped scope');fs.unlinkSync(f);removed.push('evidence/'+n);}
// The old postprocessor resized pixel evidence; replace it with lossless originals.
for(const n of ['finalize-evidence.cjs','build-interactive-review.cjs']){const f=path.resolve(root,n);if(fs.existsSync(f)){fs.unlinkSync(f);removed.push(n);}}
fs.writeFileSync(path.join(out,'removed-files.json'),JSON.stringify({date:'2026-10-11',removed},null,2)+'\n');
console.log('Removed '+removed.length+' obsolete files; evidence/removed-files.json');
