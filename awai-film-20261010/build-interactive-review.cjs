const fs=require('fs'),path=require('path');const root=__dirname;
const report=JSON.parse(fs.readFileSync(path.join(root,'evidence/checks-interactive.json'))),lh=JSON.parse(fs.readFileSync(path.join(root,'evidence/lighthouse-mobile.json'))),input=JSON.parse(fs.readFileSync(path.join(root,'evidence/input-performance.json')));
const names={'s0-membrane':'S0 黒い膜','seam-01':'膜から珈琲','s1-suketo':'S1 助任珈琲豆店','seam-12':'琥珀が闇に沈む','s2-kasane':'S2 KASANE','seam-23':'奥の布がAIMAへ','s3-aima':'S3 AIMA','seam-34':'藍から白','s4-paper':'S4 白い紙'};
const ids=Object.keys(names),touchIds=['s0-membrane','s2-kasane','s3-aima','s4-paper'];
const photo=(file,label)=>`<a href="evidence/${file}"><img src="evidence/${file}" alt="${label}" loading="lazy"></a>`;
let sections='';for(const engine of ['chromium','webkit']){
 sections+=`<h2>${engine==='chromium'?'Chromium（Google Chrome）':'WebKit'}</h2><p>${engine==='chromium'?'スマホ操作はCDPタッチ入力。PCはマウス。':'スマホ操作は合成PointerEvent。実機の縦スワイプ結果ではありません。PCはマウス。'}</p><h3>5場面と4つのつなぎ</h3><table><thead><tr><th>場面</th><th>PC 1280×800</th><th>SP 390×844</th></tr></thead><tbody>`;
 for(const id of ids)sections+=`<tr><th>${names[id]}</th><td>${photo(`${engine}-pc-center-${id}.jpg`,names[id]+' PC')}</td><td>${photo(`${engine}-sp-center-${id}.jpg`,names[id]+' SP')}</td></tr>`;
 sections+='</tbody></table><h3>4か所の介入</h3>';
 for(const id of touchIds){sections+=`<h4>${names[id]}</h4><table><thead><tr><th>画面</th><th>触る前</th><th>触っている間</th><th>離して0.5秒</th></tr></thead><tbody>`;
  for(const size of ['pc','sp'])sections+=`<tr><th>${size.toUpperCase()}</th>${['before','during','after'].map(phase=>`<td>${photo(`${engine}-${size}-${id}-${phase}.jpg`,names[id]+' '+size+' '+phase)}</td>`).join('')}</tr>`;
  sections+='</tbody></table>';
 }
}
const html=`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>あわい 通し仮版の確認</title><link rel="icon" href="data:,"><style>body{margin:0;background:#111316;color:#d6d7da;font:15px/1.8 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:28px 18px 80px}h1{font-size:26px;font-weight:500}h2{font-size:23px;margin-top:70px}h3{margin-top:32px}a{color:inherit;text-underline-offset:4px}video{display:block;width:min(100%,390px);max-height:76vh;background:#090a0c}table{width:100%;border-collapse:collapse;table-layout:fixed;margin:18px 0 35px}th,td{text-align:left;vertical-align:top;padding:8px;border-top:1px solid #34383d}th{font-weight:400}table th:first-child{width:18%}img{display:block;width:100%;height:auto}p{max-width:800px}li{margin:6px 0}code{font-size:12px;overflow-wrap:anywhere}.links{display:flex;gap:18px;flex-wrap:wrap}@media(max-width:500px){main{padding:20px 10px 60px}th,td{padding:5px;font-size:12px}table th:first-child{width:18%}h1{font-size:22px}}</style></head><body><main>
<p>あわい / インタラクティブ通し仮版 / 2026-10-11</p><h1>5場面と、4か所の介入。</h1><p class="links"><a href="./?v=interactive-20261011">通し仮版を開く</a><a href="notes.md">制作メモ</a><a href="assets-ledger.md">素材台帳</a><a href="decision-log.md">判断記録</a></p>
<p>スクロールで鑑賞し、触れることで過程を変える粗い仮版です。iPhoneとAndroidの実機で、最後まで体験して評価してください。</p><ul><li>説明なしで、触れると気づいたか。</li><li>S0で、奥に世界があったと感じたか。</li><li>一本の映画に見えたか。</li><li>いちばん弱かった場面はどこか。</li></ul>
<h2>触らずに通した録画</h2><video controls playsinline preload="metadata" poster="evidence/chromium-sp-center-s0-membrane.jpg" src="evidence/mobile-interactive.mp4"></video><p><a href="evidence/mobile-interactive.mp4">録画を直接開く</a>。スクロール75秒、390×844。ブラウザの画面を録画したもので、実機撮影ではありません。</p>
<h2>検証と残っている所</h2><p>Chromium/WebKit、SP/PCの4設定。9区間の到達、4か所の反応、往復、染み保持、KASANEの戻り、Canvas 1枚・WebGL要求0、reduced motionとJS無効時の相談リンクを確認。Consoleエラーは${report.browsers.reduce((n,b)=>n+b.errors.length,0)}。検証で記録した失敗は${report.failures.length}。美術や触感の評価は本人の実機確認待ちです。</p>
<p>Lighthouseスマホ設定・ローカル：LCP ${lh.audits['largest-contentful-paint'].numericValue}ms / CLS ${lh.audits['cumulative-layout-shift'].numericValue} / TBT ${lh.audits['total-blocking-time'].numericValue}ms。INPはLighthouseに項目がなく未取得。Chrome実タッチのEventTiming実験値 ${input.labInteractionP98Ms}ms（フィールドINP・実機値ではありません）。</p>
<p>KASANEの3層素材とAIMAの黒布版は仮です。元G1の未染領域が藍版にも残ります。つなぎの斜めの軸は共通ですが、元写真どうしの稜線の曲率・位置の完全一致は残件です。100lvhでアドレスバーの伸縮による舞台の高さの変化を抑えています。実機のアドレスバー、暗部の視認性、ネイティブWebKitの縦スワイプは未確認です。</p>
<p>S0/S4の初回弱反応15%、押し続け260ms、戻り1200ms、透過上限.64、稜線方向へ長軸1.30/短軸.56、指より上へ半径.4、跡6個、にじみ.15。S0/S4で同じ値と形を使っています。</p>
<p class="links"><a href="evidence/checks-interactive.json">操作記録</a><a href="evidence/lighthouse-mobile.json">Lighthouse</a><a href="evidence/input-performance.json">入力時間</a><a href="evidence/recording-interactive.json">録画記録</a></p>
${sections}</main></body></html>`;
fs.writeFileSync(path.join(root,'review.html'),html);console.log('Review: 9 intervals and 4 interventions, PC/SP, both engines');
