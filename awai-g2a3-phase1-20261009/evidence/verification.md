# Phase1 機械検証

日時: 2026-10-09T07:09:36.833Z

Edge headless; DPR1; PC1440x900/SP390x844 (viewport emulation, no physical device)

全判定: PASS

| 判定 | 確認 |
| --- | --- |
| PASS | grid-model.js旧版SHA256一致 |
| PASS | grid-shader.js旧版SHA256一致 |
| PASS | 対象JS syntax |
| PASS | 光学参照が固定screen/refUV |
| PASS | 静止ページソース no RAF/pointer/touch |
| PASS | pc rest evidence最新 |
| PASS | pc rest旧保存版 title以外<=1 |
| PASS | pc rest canvas旧版<=1 |
| PASS | pc 旧版baseline再現 |
| PASS | pc 同hit/load1 Grid diagnostics一致 |
| PASS | pc contact全画素差あり |
| PASS | pc mask完全一致 |
| PASS | pc contactGrid evidence最新 |
| PASS | pc contactFlat evidence最新 |
| PASS | pc plate参照完全同一 |
| PASS | pc 光学uniform固定 |
| PASS | pc runtime mask完全一致 |
| PASS | pc mask evidence最新 |
| PASS | pc no RAF/no pointer-touch handlers/静止 |
| PASS | pc canvas1/context1 |
| PASS | pc dispose WebGL全resource delete |
| PASS | pc dispose後setPose停止 |
| PASS | pc page JS/GL errorなし |
| PASS | sp rest evidence最新 |
| PASS | sp rest旧保存版 title以外<=1 |
| PASS | sp rest canvas旧版<=1 |
| PASS | sp 旧版baseline再現 |
| PASS | sp 同hit/load1 Grid diagnostics一致 |
| PASS | sp contact全画素差あり |
| PASS | sp mask完全一致 |
| PASS | sp contactGrid evidence最新 |
| PASS | sp contactFlat evidence最新 |
| PASS | sp plate参照完全同一 |
| PASS | sp 光学uniform固定 |
| PASS | sp runtime mask完全一致 |
| PASS | sp mask evidence最新 |
| PASS | sp no RAF/no pointer-touch handlers/静止 |
| PASS | sp canvas1/context1 |
| PASS | sp dispose WebGL全resource delete |
| PASS | sp dispose後setPose停止 |
| PASS | sp page JS/GL errorなし |

pc: rest全画面 max=1, title領域外 max=1, canvas max=1; contact差分 944437px (72.8732%), max=42; mask max=0; plate SHA256=ff5df2a015c9aa47cc56a1e4e28da596deb24d53413a2571717fb9cade05e0c6

sp: rest全画面 max=1, title領域外 max=1, canvas max=1; contact差分 237868px (72.2652%), max=51; mask max=0; plate SHA256=11862b7c3457ea166e3da10387f8ab16ba963bb44cba3d9fb0891d99696c605a

タイトルは旧版color-scheme等のCSS環境も記録し、旧保存画像との全画面差とタイトルを除く差を分けた。数値はRGB8全画素・全色チャンネルで計測。画像差は美術的な価値や接触感の優劣を示さない。

未確認・制限:

- 画像美術の合否は判定しない。
- 実機GPU/スマホ/Safari/長時間動作は未確認。
- WebGL資源のdelete呼出しを確認するがドライバの物理解放時刻は未確認。
- Gridのdisposeはactive=falseのみ。JS配列はstaticArtクロージャから参照され続け、GCによる解放は未確認。

公開gallery/HTTPS確認はこの検証の対象外。詳しい設定・diagnostics・SHA256・uniform・resource数はverification.json。

追加集計（contact Grid/Flat、sRGB8全画素）:

| viewport | RGB mean absolute | p95(maxRGB) | >8/255画素% | mean encoded luma Grid / Flat |
| --- | --- | --- | --- | --- |
| pc | 1.019805 | 3 | 0.3530 | 21.037256 / 20.991983 |
| sp | 2.519182 | 11 | 7.0741 | 21.833587 / 21.125196 |

encoded lumaはsRGB符号値のRec709重み付き平均（0〜255）。物理輝度ではない。全画面の差分画素率は1チャンネルでも1以上違う画素を含む。差の知覚・美術・接触感の合否は判定しない。

登録元stackでページJSとPlaywright注入listenerを区別。静止ページ由来のpointer/touch登録0。
favicon.icoのみHTTPエラー集計対象から除外。その他の資源HTTP失敗、console error、pageerrorなし。