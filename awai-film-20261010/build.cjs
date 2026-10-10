const fs=require('fs'),path=require('path');
const ts=require('../../../site-awai-v3/paper-prototype/node_modules/typescript');
for(const file of ['film','config','washi']){
 const src=fs.readFileSync(path.join(__dirname,'lib',file+'.ts'),'utf8');
 const js=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2020}}).outputText.replace(/from '\.\/config'/g,"from './config.js'");
 fs.writeFileSync(path.join(__dirname,'lib',file+'.js'),js);
}
