# Phase2 mechanical verification

PC Edge headless, DPR1; PC1440x900/SP390x844/width320 are desktop browser viewport emulation.

Generated: 2026-10-09T07:43:09.742Z

PASS; 112 passed / 0 failed.

| Result | Check |
| --- | --- |
| PASS | grid-model.js old Grid SHA256 unchanged |
| PASS | grid-shader.js old Grid SHA256 unchanged |
| PASS | source syntax checks |
| PASS | interactive path never calls settle |
| PASS | fixed plate screen UV and independent optical field |
| PASS | 120ms shorttap optical state opportunity at 500/600/700ms |
| PASS | 800ms hold state and 700ms optical fade |
| PASS | cancel cannot create shorttap grace |
| PASS | pc one canvas and WebGL2 |
| PASS | pc no horizontal overflow |
| PASS | pc rest canvas vs saved old Grid max<=1 |
| PASS | pc 120ms tap software submit<100ms |
| PASS | pc shorttap visible scalar at600ms |
| PASS | pc tap optical recovery |
| PASS | pc hold800 independent contact/reveal state |
| PASS | pc PC drag tracks hit |
| PASS | pc release optical fade <=760ms |
| PASS | pc contact 0.42,0.55 |
| PASS | pc contact 0.2,0.3 |
| PASS | pc contact 0.75,0.65 |
| PASS | pc contact 0.55,0.5 |
| PASS | pc edge/title excluded |
| PASS | pc resize releases contact |
| PASS | pc quality balanced |
| PASS | pc quality full |
| PASS | pc destroy timers RAF resources |
| PASS | pc postdestroy input has no draw |
| PASS | pc page errors |
| PASS | sp one canvas and WebGL2 |
| PASS | sp no horizontal overflow |
| PASS | sp rest canvas vs saved old Grid max<=1 |
| PASS | sp 120ms tap software submit<100ms |
| PASS | sp shorttap visible scalar at600ms |
| PASS | sp tap optical recovery |
| PASS | sp hold800 independent contact/reveal state |
| PASS | sp PC drag tracks hit |
| PASS | sp release optical fade <=760ms |
| PASS | sp contact 0.42,0.55 |
| PASS | sp contact 0.2,0.3 |
| PASS | sp contact 0.75,0.65 |
| PASS | sp contact 0.55,0.5 |
| PASS | sp edge/title excluded |
| PASS | sp resize releases contact |
| PASS | sp quality balanced |
| PASS | sp quality full |
| PASS | native CDP shorttap trusted and no required pressure |
| PASS | native CDP horizontal touch follows hit |
| PASS | native CDP cancel releases without tap grace |
| PASS | native vertical scroll + trusted pointercancel |
| PASS | native multitouch cancels with no tap grace |
| PASS | native pinch zoom releases input |
| PASS | small320 one canvas and WebGL2 |
| PASS | small320 no horizontal overflow |
| PASS | small320 120ms tap software submit<100ms |
| PASS | small320 shorttap visible scalar at600ms |
| PASS | small320 tap optical recovery |
| PASS | small320 hold800 independent contact/reveal state |
| PASS | small320 PC drag tracks hit |
| PASS | small320 release optical fade <=760ms |
| PASS | small320 contact 0.42,0.55 |
| PASS | small320 contact 0.2,0.3 |
| PASS | small320 contact 0.75,0.65 |
| PASS | small320 contact 0.55,0.5 |
| PASS | small320 edge/title excluded |
| PASS | small320 resize releases contact |
| PASS | small320 quality balanced |
| PASS | small320 quality full |
| PASS | small320 destroy timers RAF resources |
| PASS | small320 postdestroy input has no draw |
| PASS | small320 page errors |
| PASS | pc Grid on/off same contact/optical state and plate |
| PASS | pc same optical mask Grid on/off |
| PASS | pc touch/no-touch same S1 endpoint pixels |
| PASS | pc optical/endpoint pages no errors |
| PASS | sp Grid on/off same contact/optical state and plate |
| PASS | sp same optical mask Grid on/off |
| PASS | sp touch/no-touch same S1 endpoint pixels |
| PASS | sp optical/endpoint pages no errors |
| PASS | synthetic blur stops input/RAF |
| PASS | blur solver/draw pause |
| PASS | synthetic hidden stops input/RAF |
| PASS | synthetic hidden no solver advancement |
| PASS | WebGL context loss static and stopped |
| PASS | WebGL context restore rebuilds |
| PASS | optical/grid recovery idle RAF stop |
| PASS | lifecycle destroy all GL resources/input/timers |
| PASS | lifecycle page errors |
| PASS | fallback static cannot accept contact |
| PASS | fallback scroll reaches S1 |
| PASS | fallback destroy GL resources |
| PASS | fallback page errors |
| PASS | reduced motion no dynamic Grid and no settle |
| PASS | reduced release idle |
| PASS | reduced destroy GL resources |
| PASS | reduced page errors |
| PASS | controlled layout offscreen stops RAF/solver |
| PASS | PC 60s continuous Grid/full collection completed |
| PASS | benchmark dispose true/full |
| PASS | PC 60s continuous Grid/balanced collection completed |
| PASS | benchmark dispose true/balanced |
| PASS | PC 60s continuous flat/full collection completed |
| PASS | benchmark dispose false/full |
| PASS | PC 60s continuous flat/balanced collection completed |
| PASS | benchmark dispose false/balanced |
| PASS | native touch force0 still responds |
| PASS | native repeated taps release without stuck pointers |
| PASS | viewport rotation releases input and swaps PC plate |
| PASS | synthetic persisted pagehide stops and deletes resources |
| PASS | synthetic persisted pageshow rebuilds renderer |
| PASS | diagnostic arrays remain bounded |
| PASS | SP destroy all resources and lifetime state |
| PASS | supplemental page errors |

PASSは機能と測定完了の検査に限る。PC上solver CPU p95はGrid Full3.9ms / Balanced3.8msで、判断書の3ms目安を超過。実機性能合格・美術合格は未確認。

Performance measurements are PC headless observations, not physical-phone acceptance:

| Grid | Quality | elapsed ms | RAF count / p95 ms / >33.3ms % | solver CPU count / p95 ms |
| --- | --- | --- | --- | --- |
| true | full | 60618 | 11047 / 6.099999999998545 / 0.054313388250203674 | 10979 / 3.8999999994412065 |
| true | balanced | 60565 | 11035 / 6.099999999998545 / 0.054372451291345714 | 10977 / 3.7999999998137355 |
| false | full | 60440 | 10984 / 6.099999999998545 / 0.05462490895848507 | 0 / null |
| false | balanced | 60487 | 10976 / 6.099999999998545 / 0.05466472303206997 | 0 / null |

Limits:

- Physical iPhone/Safari and Android/Chrome unverified.
- Actual presentation latency, physical device FPS, temperature, 3-minute thermal stability and first-viewer discovery/contact recognition are unverified.
- GPU execution time is unmeasured; RAF intervals and solver CPU timing are separate measurements.
- Pixel and timing results do not constitute art approval.
- GL delete calls do not establish driver deallocation timing; JavaScript GC is unmeasured.
- Native background visibility was unavailable in this headless configuration; hidden handler separately tested with synthetic document visibility.

RAFは外側collectorによる全区間記録とapp累計counterを照合。開始・終了evaluate境界でapp側は4〜5frame多い。観測平均約5.5msはheadless schedulingであり60Hz実機表示ではない。solverは10秒ごとのbounded array＋累計counterで全区間取得、欠落0。

再実行: node tmp/awai-phase2-verify.cjs（機能）→ node tmp/awai-phase2-verify.cjs --performance-only（4条件60秒）→ node tmp/awai-phase2-verify.cjs --supplemental（SP寿命管理等）。

