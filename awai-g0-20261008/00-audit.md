# AWAI G0 — 既存資産監査

監査日：2026-10-08。対象は実ファイル・設定・既存検証記録・現行公開ページ。G0のみ。サイトのコード、表示、挙動、公開設定の変更、素材削除、依存更新、ビルドは行っていない。採否は新制作への持ち越し判断であり、現物の削除指示ではない。

新制作の基準：S0黒い膜 → S1助任珈琲豆店 → S2 KASANE → S3 AIMA → S4白い紙。暗い映画館、モード・前衛的な高級感、60〜90秒程度。スクロールは時間、接触は介入。完成Web画面と7作品の情報はアーカイブへ分離。

## 1. リポジトリ構造と正本の所在

| 所在 | 実際の役割 | 新制作への扱い |
|---|---|---|
| ルート `index.html` / `styles.css` / `script.js` / `package.json` | LUEUR AOYAMAサイト。複数案件を置くワークスペース | AWAIの本体と混同しない |
| `site-awai/index.html`, `css/`, `js/`, `assets/` | 初代。店写真と合成Web、料金・進め方・相談の縦構成 | 情報/素材と補助処理を選別 |
| `site-awai-v2/` | 静的HTML/CSS/ES modules、Three.js立体・7作品reel | 旧演出構造は終了 |
| `site-awai-v3/paper-prototype/` | Next.js紙試作。`/`, `/compare/`, `/material/`, `/work-study/`, `/film/` | 現行技術検討の主要対象 |
| 同 `app/film/`, `lib/film.ts` | sticky舞台の通し仮組み。20場面、2060vh | 5場面へそのまま流用しない |
| 同 `public/film-review/`, `public/film/price/` | 旧コマ表と料金静的ページ | 記録/実用情報。最新料金として無確認転記しない |
| `site-awai-v3/materials/` | 絵コンテ、映像元素材、film-plan | 参考と制作素材を区別 |
| `docs/awai-v3/motion-study/` | 後続の場面見本HTML、画像/映像。紙試作の本編に統合済みとは限らない | 資産台帳には含める |
| `awai-motion/awai-motion.js` | GSAP前提の旧共通道具箱 | beat等の小機能のみ候補。粒子/装飾思想を持ち越さない |
| `site-suketo/`, `site-kasane/`, `site-aima/`ほか | 作品サイトの元データ | 本編用素材とアーカイブ情報の出典候補 |
| `tmp/awai-paper-publish/` | 別Gitリポジトリの既存公開チェックアウト | 公開対象を明確に分ける |

ワークスペースのremoteは `makoto0808ellhome-ui/hello-pr`。公開チェックアウトのremoteは `karisyacho/karisyacho.github.io`。多数の既存未コミット/未追跡ファイルがあり、HEADだけでは資産を再現できない。`.gitignore`は `docs/awai-v3/motion-study/media/src/` を除外している。素材保管/再取得の確認が必要。

## 2. フレームワーク・依存・ビルド・公開

- ルートpackageは `lueur-aoyama-portfolio`、`build: node bin/build-site.mjs`。このスクリプトは`dist`を削除してLUEURのHTML等をコピーし、LUEURメタデータを検査する。AWAI用に実行しない。
- 初代はGSAP/ScrollTrigger 3.12.5をCDNから遅延読込（`site-awai/js/main.js:11-14`、SRIあり）。外部Google Fontsも使用。v2はローカルThree.js r160（vendorヘッダMIT）とES modules。AWAI専用package/build設定はこの2世代では見つからない。
- 紙試作package：Next `^16.0.0`、React/React DOM `^19.0.0`、TypeScript `^5.0.0`。lock実値はNext 16.4.0、React/React DOM 19.3.0、TypeScript 5.9.3。Nextのlock記載Node要件は`>=20.9.0`。インストール済み実体との完全照合や依存脆弱性監査は未実施。
- 同packageの`dev`はport 3117、`build`は`next build`。`next.config.mjs:1`は`output:'export'`、`basePath:'/awai-paper'`、`images.unoptimized:true`、`trailingSlash:true`。静的出力`out/`を配信する構成。
- `app/layout.tsx:4`のrobotsは`index:false,follow:false`。公開本番への移行時に意図を再確認。新制作へ自動転記しない。
- GitHub APIで確認したPages設定：`karisyacho/karisyacho.github.io`、legacy build、`main`ブランチの`/`、HTTPS `https://karisyacho.github.io/`。公開チェックアウトに`.nojekyll`あり。設定変更はしていない。
- 既存公開チェックアウトはclean、AWAI最終公開コミット`1e1ed69`。引継ぎ記録とも一致。fetchでremote最新`7d73bb6`（別案件Day15資料5ファイル追加）を確認し、共有前にfast-forwardで同期した。本編は[現行公開ページ](https://karisyacho.github.io/awai-paper/film/?v=12)。ルートに`.github`ディレクトリは見つからない。GitHub ActionsによるAWAI自動デプロイは確認できない。

## 3. 現行画面・アニメーション・入力

| 対象 | ファイルから確認した挙動 | 判定 |
|---|---|---|
| 初代 | WebGLの墨舞台、店写真→合成Web、GSAPの章進行。reduced motion/WebGL・GSAPなしで静的表示（`js/main.js:1-24`） | 旧章構造と合成Web演出は不採用 |
| v2 | しずく→立体道具、作品reel、丸く開くreveal、料金count等（`js/timeline.js`の`introState/reelState/openState/priceState`） | 新本編へ持ち越さない |
| 紙試作入口 | Pointer Events、touch hold 260ms/移動閾値、縦移動解除、mouse hover、Enter/Space。poster fallback、接触再生、scroll scrub（`OpeningScene.tsx:34-43,84-116`） | 入力/動画寿命管理を抽出候補 |
| 紙試作本編 | scroll座標→20場面、1 sticky舞台・Canvas・背後画像2枠。scene分岐と旧素材が密結合（`FilmStage.tsx:45-117`） | 小さな計算関数を残し、本編設計は再構成 |
| KASANE | 写真3カット、最低380ms保持。`film.ts:12`はtouch false。独立した透過布の変形ではない | 素材の参照候補。操作モデルは新規検証が必要 |
| AIMA | cloth placeholderの描画/合成。接触で強度を上げ、releaseで戻す（`FilmStage.tsx:69-95,119-131`） | 染色を残すモデルは確認できない |
| 終端 | blankはtouch true、白の向こうに接触透過（`film.ts:23`）。問い合わせ文とLINE/Instagram（`film-content.ts`） | 文言/連絡情報候補。新S4の無応答と異なる |

Canvas失敗/reduced motionの本編はreading側を残す。OpeningSceneのCanvas/WebGL失敗はSVG、動画拒否時はposter。cleanupでRAF/timer/event/observer等を解放（`FilmStage.tsx:138`, `OpeningScene.tsx:103-116`）。fallback思想は残すが、旧7作品縦一覧を新本編の代替にそのまま使わない。

作品データは`lib/works.ts:1-11`。助任・おきのはま・UCHIMACHI・KASANE・ARC・AIMAがstudy、STUDIO FREEだけclient。UIは見本/ご依頼を表示。STUDIO FREEの現在の風景は実案件の実写ではなく「構成用の生成イメージ」と注記されている。アーカイブでも実案件の存在と仮素材を区別する。

## 4. 再利用の境界

作品元サイトには、本編未統合の追加候補がある。`site-aima/cloth.js:52-75,141-155,205-237`はWebGLの織り目・変形と、12個の染点を時刻付きで保持して広げるshaderを実装している。`script.js:193-247`は接点をUVへ近似変換し、135ms間隔で染点を追加、専用resetで消去する。紙試作本編のAIMAとは別実装であり、染色の技術参考として残す。ただし有限12点の更新、円の距離＋noiseで作る染み、UV近似、常時揺れ、色選択/リセットUIをそのまま採用すると新方針から外れる。残留maskや実布への浸透が完成しているとは扱わない。

`site-kasane/gl.js`はWebGL2の一枚布（上辺固定、織り目、pointer/scrollによる変位）。`createCloth`のCanvas fallback、`destroy`による資源解放もある（同:245-364）。単一面であり独立した複数布ではないが、布目/陰影/変位と寿命管理の参考として残せる。新本編への方式採用はG2/G3で判断する。

**残す候補：** 出典確認済み元素材と変換履歴、作品データとstudy/client区分、実際の連絡先、Pointer Eventsのscroll競合解除、poster/静的fallback、動画の停止・解放、DPR制限、イベントcleanup、`clamp/smooth`等の純粋関数、元作品の布/染点shaderの技術参考、実機未確認を明記した検証記録。

**新本編から外す：** 白/生成りが常時存在するsurface前提、7作品と20場面のscene表、写真からWebを透かす構造、丸い窓・紙の左右開口、共通fade/reveal、KASANEの自動写真切替、残留しないAIMA、blankの再透過、立体道具/水しぶき/粒子を核にする演出。既存ファイルはG0では削除しない。

## 5. 確認と限界

- 今回実行：`node site-awai-v3/paper-prototype/lib/film.test.cjs`。20場面/2060vh/4 touch scene、境界、進捗・seamの範囲を通過。描画品質や新5場面の適合を保証するテストではない。
- 現行公開をブラウザで1280×720、390×844確認。紙起点の静的reading表示、7作品区分・仮素材注記・問い合わせリンクを確認。横overflowなし。ブラウザの`prefers-reduced-motion: reduce`がtrueで、コードどおり`data-motion`は未設定だった。静的代替の表示確認であり、今回インタラクティブ本編の起動/動作は再検証していない。取得ログにerror/warnなし。
- 既存`live-film-verification.json`は1280×800/390×844、20場面、エラーなし、逆scroll比較等を記録。`verify-film-input.cjs`はChromium CDP touchとWebKit合成event、KASANE保持・復元を検証する。今回そのフル検証は再実行していない。既存記録を今回の実機合格として扱わない。
- 物理iPhone/Android、低性能端末、GPU/memory、INP/Core Web Vitals、黒の視認性は未確認。新膜/独立布/残留染色/60〜90秒への適合はG2以降。

素材の個別情報は[01-assets.md](01-assets.md)、制約と事前確認は[02-risks.md](02-risks.md)。G0承認前にG1へ進まない。
