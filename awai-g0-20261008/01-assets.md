# AWAI 既存素材台帳（G0）

監査日: 2026-10-08。対象は実ファイル。新方針は暗い短編映画、S0膜 → S1助任珈琲 → S2KASANE → S3AIMA → S4白紙。旧7作品の縦紹介はアーカイブ。完成Web画面を連続表示する演出は新本編で不採用。ここでの「不採用」は新本編に対する判定で、アーカイブ素材の廃棄を意味しない。台帳以外の実装・公開設定は変更していない。

判定は「採用／保留／不採用」の3種。素材として適合する候補もG1の見た目合意・権利確認前のため「保留」とした。出典IDを下表へ結び、各ファイルの用途・寸法・容量・判定を後半へ記録。公開済み作品URLは元画像のライセンス証明ではない。権利未確認を商用可と断定しない。

## 出典・利用条件（IDは個別台帳に対応）

| ID | 出典URL／内部証跡 | ライセンス確認状況 | 加工可否 |
|---|---|---|---|
| SK | https://suketo-demo.github.io/suketo/ ; site-suketo/assets ; v3 works/CREDITS.md | 自主制作デモの再利用記録あり。助任の元写真・hero/roast動画の個別取得URL・撮影者・利用条件は対象内に未発見 | 出典照合まで再編集・新公開は保留 |
| KAS | https://kasane-demo.github.io/kasane/ ; site-kasane/CREDITS.md ; v3 works/CREDITS.md | 元作品のUnsplash10点の記録あり。ただし kasane.webp のどの原画からの派生か対応記録不足 | 対応元照合後、Unsplash条件下で可 |
| AI | https://karisyacho.github.io/aima/ ; site-aima/ASSET-PROMPTS.md・README.md | OpenAI組込みimagegenによる架空施設の新規生成、PNGからWebP圧縮の記録あり。外部ストック由来ではない | ユーザー所有生成物として編集候補。実在施設の実写として扱わない |
| GEN | v3 public/media/washi/CREDITS.md ; materials/*source.png | imagegenによる架空の和紙・町、生成元とプロンプト記録あり。第三者写真のライセンスではない | 編集候補。徳島の実写と表示しない |
| SHOP | site-awai/assets/shops/ASSET-PROMPTS.md ; v2 shops/src/CREDITS.md | 架空5店の生成記録。旧src/v1とcontact-sheetは確認版。派生WebP/仮画像の加工はprep-shops.py | 編集候補。元10点は1536×1024／1024×1536で指定最低解像度未達 |
| PROC | site-awai/bin/make-ink-textures.py | 自前手続き生成、乱数seed=7。外部画像ではない | 可（旧表現） |
| USER | v3 materials/footage/user-clips/README.md | 本人スマホ撮影・本人権利の内部記録、12本。IMG_2022欠番。場所の実証は別 | 本人提供範囲で候補。原音は公開前に確認 |
| WATER | v3 app/compare/page.tsx（IMG_2025冒頭2.3秒の記載） | 本人撮影の派生記録。水面動画・ポスター候補 | 上記本人提供範囲で候補 |
| OPEN | v3 lib/config.ts（opening/sky参照） | opening.mp4/opening.webp/sky.webp の具体的派生元・切出し記録が不足 | 元照合まで保留 |
| MX | docs/handoff/2026-10-07-あわい場面の見本.md（Mixkit1968/32101）; https://mixkit.co/license/ | 引継ぎは無料/クレジット不要と記す。公式にはFree/Restrictedの2種。ID別原ページ/適用ライセンス証跡未確認 | 各素材のFree確認まで保留。一般ライセンスを個別証明にしない |
| PX-window | https://www.pexels.com/video/28702865/ ; 上記見本メモ | Pexels ID記録あり。光の派生は横回転・ループ加工。公式一般条件確認 | 条件内で可。実店舗の実写と誤認させない |
| PX-leaves | https://www.pexels.com/video/10721904/ ; 上記見本メモ | Pexels ID記録あり。葉影の派生は手の影より上を切出し・ぼかし | 条件内で可 |
| PX-maple | https://www.pexels.com/video/serene-view-of-maple-leaves-in-sunlight-38869672/ ; footage/CREDITS.md | FENG HE、Pexels取得記録 | 条件内で可 |
| PX-rice | https://www.pexels.com/video/drone-footage-of-a-rural-area-in-japan-6799270/ ; footage/CREDITS.md | Hide、Pexels取得記録。ログの可能性、色確認要 | 条件内で可 |
| PX-forest | https://www.pexels.com/video/misty-morning-in-chichibu-forest-japan-31386838/ ; footage/CREDITS.md | TimePRO TV、Pexels取得記録 | 条件内で可 |
| PX-bakery | https://www.pexels.com/video/nighttime-street-scene-outside-a-local-bakery-36576017/ ; external-dusk/CREDITS.md | Özgür Sürmeli、1–8秒派生。看板/清掃者/蛍光灯あり、旧判断未採用 | 条件内で可、実案件店舗と結び付けない |
| PX-cafe | https://www.pexels.com/video/a-woman-reading-a-book-in-a-cafe-19339407/ ; external-dusk/CREDITS.md | Orhan Pergel、4.68秒縦、識別可能人物、旧判断未採用 | 条件内で可、推奨/関係性を暗示しない |
| US-bakery | https://unsplash.com/photos/586PLCuMXeo ; v2 shops/src/CREDITS.md | wei、無料Unsplashの記録。値札塗潰し・横縦切出し済み | Unsplash条件内で可。架空店名＋外部写真と明記 |
| PH | https://polyhaven.com ; https://polyhaven.com/license ; v2 assets/models/CREDITS.md | croissant、Camera01、brown_photostudio_02はPoly Haven CC0の記録。公式CC0確認。json/wasm改名あり | CC0で可（新方針では旧3D不採用） |
| TX | v2 prototype/real/tex ; review copies | rough_linen、white_oak_veneer、white_stuccoという名前のみ。上記モデルクレジットはこれら8点を明記していない | 個別取得URLと権利照合まで保留 |
| STUDIO | v3 public/media/works/CREDITS.md ; https://karisyacho.github.io/#w-studiofree | 元広告は実案件、v9/v10は構成用生成仮画像。motion-study手元動画の生成サービス/利用条件未記録 | 新方針では不採用。案件素材を他店素材に転用しない |
| OLDWORK | v3 public/media/works/CREDITS.md ; 旧works.ts | おきのはま・UCHIMACHI・ARCは旧7作品。元サイト参照記録あり、各権利は今回採用外のため未再検証 | 新本編不採用。再利用時は元台帳照合 |
| OWN | 各サイトfavicon | 自作表示用と推定するが著作者証跡不足 | 確認のうえ候補 |
| UNKNOWN | 個別出典未発見 | 不明。root assets/images はAWAI3作品本番とは紐付かない旧美容室素材、storyboardは旧見た目案 | 保留 |
| US-fabric-linen | https://unsplash.com/photos/k9gLfaJq60Y ; site-kasane/CREDITS.md | 無料Unsplash写真と加工（彩度/コントラスト/墨/粒子）記録。一般条件を公式確認 | 条件内で可。人物/商標等の独立権利は別確認 |
| US-fabric-rib | https://unsplash.com/photos/Xag89-CFc0s ; site-kasane/CREDITS.md | 無料Unsplash写真と加工（彩度/コントラスト/墨/粒子）記録。一般条件を公式確認 | 条件内で可。人物/商標等の独立権利は別確認 |
| US-look-01 | https://unsplash.com/photos/iIjResyhhW0 ; site-kasane/CREDITS.md | 無料Unsplash写真と加工（彩度/コントラスト/墨/粒子）記録。一般条件を公式確認 | 条件内で可。人物/商標等の独立権利は別確認 |
| US-look-02 | https://unsplash.com/photos/SvOyq3G4nb0 ; site-kasane/CREDITS.md | 無料Unsplash写真と加工（彩度/コントラスト/墨/粒子）記録。一般条件を公式確認 | 条件内で可。人物/商標等の独立権利は別確認 |
| US-look-03 | https://unsplash.com/photos/FcXo8WX8aK8 ; site-kasane/CREDITS.md | 無料Unsplash写真と加工（彩度/コントラスト/墨/粒子）記録。一般条件を公式確認 | 条件内で可。人物/商標等の独立権利は別確認 |
| US-look-04 | https://unsplash.com/photos/o-VtXaJD7Uc ; site-kasane/CREDITS.md | 無料Unsplash写真と加工（彩度/コントラスト/墨/粒子）記録。一般条件を公式確認 | 条件内で可。人物/商標等の独立権利は別確認 |
| US-atelier-01 | https://unsplash.com/photos/5ZQn_gWKvLE ; site-kasane/CREDITS.md | 無料Unsplash写真と加工（彩度/コントラスト/墨/粒子）記録。一般条件を公式確認 | 条件内で可。人物/商標等の独立権利は別確認 |
| US-rack | https://unsplash.com/photos/5iQrhv2iT0c ; site-kasane/CREDITS.md | 無料Unsplash写真と加工（彩度/コントラスト/墨/粒子）記録。一般条件を公式確認 | 条件内で可。人物/商標等の独立権利は別確認 |
| US-founder | https://unsplash.com/photos/_q1F356xF48 ; site-kasane/CREDITS.md | 無料Unsplash写真と加工（彩度/コントラスト/墨/粒子）記録。一般条件を公式確認 | 条件内で可。人物/商標等の独立権利は別確認 |
| US-store | https://unsplash.com/photos/qDBxfh5Idak ; site-kasane/CREDITS.md | 無料Unsplash写真と加工（彩度/コントラスト/墨/粒子）記録。一般条件を公式確認 | 条件内で可。人物/商標等の独立権利は別確認 |

公式条件の確認（2026-10-08）: [Pexels](https://www.pexels.com/license/) は無料利用・編集・Web/広告利用を認め、人物への攻撃的利用、推奨の暗示、未加工転売、素材プラットフォーム再配布、商標利用を禁止。[Unsplash](https://unsplash.com/license) は無料写真の商用利用・加工を認め、実質無加工の販売と競合素材サービスへの収集を禁止。一般条件は各ファイルの取得証明を代替しない。[Poly Haven](https://polyhaven.com/license) のアセットはCC0。サイト内ロゴ・見本レンダー等は同じ扱いではない。[Mixkit](https://mixkit.co/license/) は素材ごとのFree/Restrictedを確認する必要がある。

## フォント・手続き表現

対象の実ファイルにはwoff/woff2/ttf/otfなし。旧v1はGoogle FontsのShippori Mincho B1 / Zen Kaku Gothic New / DM Mono、v2はZen Kaku Gothic New / Inter Tightを外部CSS参照。v3はYu Mincho / Hiragino Mincho ProN / Noto Serif JP、Yu Gothic / Hiragino Kaku Gothic ProNを端末のCSSフォールバックで参照し、埋め込み配信なし。新本編のフォント採用は保留。Web配信に切り替える場合は実フォントファイルと各OFL原文・配布元を保存してから採用する。OSフォントファイルを抽出・再配布しない。KASANE元サイトはBodoni Moda / Archivo / Zen Old Mincho / Zen Kaku Gothic NewのOFL1.1記録（site-kasane/CREDITS.md）。参考公式: https://fonts.google.com/faq 。

awai-motion/ は awai-motion.js のみで画像・動画・フォントなし。旧AIMA/KASANEの布の手続き表現はWebGLコードで、外部画像のライセンスと別。旧本編からそのまま転載する採用判断はしていない。

## 不足と新本編への扱い

- S0膜: 現存する紙テクスチャは生成りの和紙案。暗い膜を確定する静止材質案・透過/歪みマスク・縦横派生・低負荷版が不足。既存和紙を本採用と扱わない。
- S1助任: 写真/Web画面はある。元写真動画の出典確認とMixkit素材ごとのライセンス証拠が不足。新案承認後、黒背景湯気の合成・寄りトリム・無動作ポスターを作る。
- S2KASANE: コートのレイヤー写真とWeb画面がある。detail元写真の取得ID対応が不足。採用カットとPC/SPマスク・暗い調色を決める。独立した布の輪郭・重なり・陰影を持つ派生素材は未作成。
- S3AIMA: 生成写真3種と小サイズ派生がある。新場面用の藍の寄り、濡れ/染み境界マスク、染色前後と染料の広がりを分離した派生素材、縦横トリムは不足。元施設の実写とは表示しない。
- S4白紙: 紙画像はあるが新終幕用の白紙/膜の質感案・微細変化・軽量静止版は未作成。映像を使用するなら本人撮影を優先し、採否を先に決める。
- STUDIO FREE・おきのはま・UCHIMACHI・ARC、旧5店舗写真、3D物体はアーカイブ。旧7作品を新本編へ戻す採用はしない。

## 個別ファイル一覧

容量は実バイト、画像は実ピクセル。動画はffprobe（寸法は符号化寸法、回転メタ情報は併記）。同一内容はSHA-256一致の件数で、出典を示す証明ではない。モデルJSON/GLTF/BIN/HDRを含む。3D形状・favicon以外の寸法不適用のバイナリは解像度を「—」とする。次の一覧は書類・コードを除く素材の全件。

| パス（workspace相対） | 用途 | 出典ID | 解像度 | 形式 | bytes | 判定 | 不足派生/確認 | 備考 |
|---|---|---|---|---|---:|---|---|---|
| `assets/favicon.svg` | アーカイブ | UNKNOWN | viewBox 0 0 440 440 | SVG | 328 | 保留 | 由来の記録照合 |  |
| `assets/images/hero.webp` | アーカイブ | UNKNOWN | 1800×2200 | WEBP | 158,796 | 保留 | 由来の記録照合 |  |
| `assets/images/journal-01.webp` | アーカイブ | UNKNOWN | 1000×1000 | WEBP | 69,926 | 保留 | 由来の記録照合 |  |
| `assets/images/journal-02.webp` | アーカイブ | UNKNOWN | 1000×1000 | WEBP | 40,516 | 保留 | 由来の記録照合 |  |
| `assets/images/journal-03.webp` | アーカイブ | UNKNOWN | 1000×1000 | WEBP | 26,788 | 保留 | 由来の記録照合 |  |
| `assets/images/journal-04.webp` | アーカイブ | UNKNOWN | 1000×1000 | WEBP | 32,730 | 保留 | 由来の記録照合 |  |
| `assets/images/journal-05.webp` | アーカイブ | UNKNOWN | 1000×1000 | WEBP | 54,616 | 保留 | 由来の記録照合 |  |
| `assets/images/story-01.webp` | アーカイブ | UNKNOWN | 1200×1500 | WEBP | 79,072 | 保留 | 由来の記録照合 |  |
| `assets/images/story-02.webp` | アーカイブ | UNKNOWN | 1200×1500 | WEBP | 81,488 | 保留 | 由来の記録照合 |  |
| `assets/images/story-03.webp` | アーカイブ | UNKNOWN | 1200×1500 | WEBP | 72,716 | 保留 | 由来の記録照合 |  |
| `assets/images/stylist-01.webp` | アーカイブ | UNKNOWN | 1200×1500 | WEBP | 65,862 | 保留 | 由来の記録照合 |  |
| `assets/images/stylist-02.webp` | アーカイブ | UNKNOWN | 1200×1500 | WEBP | 64,156 | 保留 | 由来の記録照合 |  |
| `assets/og.png` | アーカイブ | UNKNOWN | 1731×909 | PNG | 1,728,881 | 保留 | 由来の記録照合 |  |
| `docs/awai-v3/motion-study/media/arc-hero.webp` | アーカイブ | OLDWORK | 1600×1131 | WEBP | 51,916 | 不採用 | なし（新本編3作品へ整理） |  |
| `docs/awai-v3/motion-study/media/arc-web-hp.webp` | アーカイブ（完成Web画面） | OLDWORK | 2880×1800 | WEBP | 113,132 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `docs/awai-v3/motion-study/media/arc-web-mobile.webp` | アーカイブ（完成Web画面） | OLDWORK | 780×1688 | WEBP | 65,796 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `docs/awai-v3/motion-study/media/arc-web.webp` | アーカイブ（完成Web画面） | OLDWORK | 2880×1800 | WEBP | 119,220 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `docs/awai-v3/motion-study/media/fabric-linen.webp` | S2 KASANE | US-fabric-linen | 1300×866 | WEBP | 435,264 | 保留 | 実作品との連続性確認（旧本編未使用） | 同一内容 2件 |
| `docs/awai-v3/motion-study/media/fabric-rib.webp` | S2 KASANE | US-fabric-rib | 1300×866 | WEBP | 210,144 | 保留 | 実作品との連続性確認（旧本編未使用） | 同一内容 2件 |
| `docs/awai-v3/motion-study/media/kasane-detail.webp` | S2 KASANE | KAS | 1300×866 | WEBP | 37,082 | 保留 | 採用画面のPC/SPマスク・暗部グレード | 同一内容 7件 |
| `docs/awai-v3/motion-study/media/kasane-layer.webp` | S2 KASANE | US-look-03 | 900×1200 | WEBP | 134,240 | 保留 | 暗部グレード・縦構図検証 | 同一内容 4件 |
| `docs/awai-v3/motion-study/media/kasane-web-bg.webp` | アーカイブ（完成Web画面） | KAS | 2160×1350 | WEBP | 162,050 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `docs/awai-v3/motion-study/media/kasane-web-mobile-bg.webp` | アーカイブ（完成Web画面） | KAS | 780×1688 | WEBP | 56,602 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `docs/awai-v3/motion-study/media/kasane-web-mobile.webp` | アーカイブ（完成Web画面） | KAS | 780×1688 | WEBP | 72,298 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `docs/awai-v3/motion-study/media/kasane-web.webp` | アーカイブ（完成Web画面） | KAS | 2160×1350 | WEBP | 180,402 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `docs/awai-v3/motion-study/media/kasane.webp` | S2 KASANE | KAS | 1300×866 | WEBP | 37,082 | 保留 | 採用画面のPC/SPマスク・暗部グレード | 同一内容 7件 |
| `docs/awai-v3/motion-study/media/light-window-wide.mp4` | アーカイブ | PX-window | 1600×450 | MP4/h264 30/1fps 12.40s | 1,334,668 | 不採用 | なし（旧7作品構成） | 無音 |
| `docs/awai-v3/motion-study/media/light-window.mp4` | アーカイブ | PX-window | 450×1600 | MP4/h264 30/1fps 12.40s | 1,403,028 | 不採用 | なし（旧7作品構成） | 無音 |
| `docs/awai-v3/motion-study/media/okinohama-dark.webp` | アーカイブ | OLDWORK | 1920×1280 | WEBP | 49,900 | 不採用 | なし（新本編3作品へ整理） |  |
| `docs/awai-v3/motion-study/media/okinohama-web-mobile.webp` | アーカイブ（完成Web画面） | OLDWORK | 780×1688 | WEBP | 108,532 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `docs/awai-v3/motion-study/media/okinohama-web.webp` | アーカイブ（完成Web画面） | OLDWORK | 2160×1350 | WEBP | 170,544 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `docs/awai-v3/motion-study/media/okinohama.webp` | アーカイブ | OLDWORK | 1920×1280 | WEBP | 110,468 | 不採用 | なし（新本編3作品へ整理） | 同一内容 4件 |
| `docs/awai-v3/motion-study/media/paper.webp` | S0 膜／S4 白紙（旧和紙候補） | GEN | 1254×1254 | WEBP | 265,478 | 保留 | 和紙→膜にする場合は生成りを転用せず新材質案 | 同一内容 3件 |
| `docs/awai-v3/motion-study/media/shadow-leaves.mp4` | アーカイブ | PX-leaves | 720×654 | MP4/h264 30000/1001fps 7.61s | 557,161 | 不採用 | なし（旧7作品構成） | 無音 |
| `docs/awai-v3/motion-study/media/src/mixkit-1968-720.mp4` | S1 助任珈琲 | MX | 720×1280 | MP4/h264 24/1fps 15.00s | 4,597,780 | 保留 | 各IDのFree/Restricted証跡・合成マスク | 無音 |
| `docs/awai-v3/motion-study/media/src/mixkit-32101-720.mp4` | S1 助任珈琲 | MX | 1280×720 | MP4/h264 30000/1001fps 12.31s | 3,825,348 | 保留 | 各IDのFree/Restricted証跡・合成マスク | 無音 |
| `docs/awai-v3/motion-study/media/src/pexels-10721904-leaves.mp4` | アーカイブ | PX-leaves | 1080×1920 | MP4/h264 30000/1001fps 9.61s | 6,042,636 | 不採用 | なし（旧7作品構成） | 音声あり |
| `docs/awai-v3/motion-study/media/src/pexels-28702865-window.mp4` | アーカイブ | PX-window | 1080×1920 | MP4/h264 30/1fps 14.90s | 15,830,035 | 不採用 | なし（旧7作品構成） | 無音 |
| `docs/awai-v3/motion-study/media/src/studiofree-hands-start.png` | アーカイブ | STUDIO | 1280×720 | PNG | 1,101,574 | 不採用 | なし（新本編3作品へ整理） |  |
| `docs/awai-v3/motion-study/media/src/studiofree-hands-stroke-seed51-raw.mp4` | アーカイブ | STUDIO | 1280×704 | MP4/h264 24/1fps 4.04s | 4,924,927 | 不採用 | なし（新本編3作品へ整理） | 無音 |
| `docs/awai-v3/motion-study/media/src/studiofree-hands-v1-5s.mp4` | アーカイブ | STUDIO | 1280×704 | MP4/h264 24/1fps 5.04s | 442,789 | 不採用 | なし（新本編3作品へ整理） | 無音 |
| `docs/awai-v3/motion-study/media/src/studiofree-hands-v2-pingpong.mp4` | アーカイブ | STUDIO | 1280×704 | MP4/h264 24/1fps 3.04s | 857,306 | 不採用 | なし（新本編3作品へ整理） | 無音 |
| `docs/awai-v3/motion-study/media/steam-thick.mp4` | S1 助任珈琲 | MX | 1280×720 | MP4/h264 30000/1001fps 9.81s | 1,000,759 | 保留 | 各IDのFree/Restricted証跡・合成マスク | 無音 |
| `docs/awai-v3/motion-study/media/steam-thin.mp4` | S1 助任珈琲 | MX | 720×1280 | MP4/h264 24/1fps 12.50s | 1,393,525 | 保留 | 各IDのFree/Restricted証跡・合成マスク | 無音 |
| `docs/awai-v3/motion-study/media/studiofree-hands.mp4` | アーカイブ | STUDIO | 1280×704 | MP4/h264 24/1fps 3.21s | 1,021,691 | 不採用 | なし（新本編3作品へ整理） | 無音 |
| `docs/awai-v3/motion-study/media/studiofree-mobile.webp` | アーカイブ | STUDIO | 720×1281 | WEBP | 88,260 | 不採用 | なし（新本編3作品へ整理） | 同一内容 3件 |
| `docs/awai-v3/motion-study/media/studiofree.webp` | アーカイブ | STUDIO | 1536×1024 | WEBP | 114,614 | 不採用 | なし（新本編3作品へ整理） | 同一内容 3件 |
| `docs/awai-v3/motion-study/media/suketo-web-mobile.webp` | アーカイブ（完成Web画面） | SK | 520×1125 | WEBP | 32,640 | 不採用 | 新本編で連続サイト画面を表示しない | 同一内容 4件 |
| `docs/awai-v3/motion-study/media/suketo-web.webp` | アーカイブ（完成Web画面） | SK | 1200×750 | WEBP | 54,322 | 不採用 | 新本編で連続サイト画面を表示しない | 同一内容 4件 |
| `docs/awai-v3/motion-study/media/suketo.webp` | S1 助任珈琲 | SK | 1600×1068 | WEBP | 176,954 | 保留 | 元素材出典照合・湯気合成用マスク・PC/SP | 同一内容 4件 |
| `docs/awai-v3/motion-study/media/uchimachi-web-mobile.webp` | アーカイブ（完成Web画面） | OLDWORK | 780×1688 | WEBP | 86,110 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `docs/awai-v3/motion-study/media/uchimachi-web.webp` | アーカイブ（完成Web画面） | OLDWORK | 2160×1350 | WEBP | 144,138 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `docs/awai-v3/motion-study/media/uchimachi.webp` | アーカイブ | OLDWORK | 1536×1024 | WEBP | 146,036 | 不採用 | なし（新本編3作品へ整理） | 同一内容 3件 |
| `site-aima/assets/craft-small.webp` | S3 AIMA | AI | 768×512 | WEBP | 61,258 | 保留 | 藍の寄り・染みマスク・PC/SPトリム |  |
| `site-aima/assets/craft.webp` | S3 AIMA | AI | 1536×1024 | WEBP | 192,562 | 保留 | 藍の寄り・染みマスク・PC/SPトリム |  |
| `site-aima/assets/favicon.svg` | S3 AIMA | AI | viewBox 0 0 64 64 | SVG | 251 | 保留 | 藍の寄り・染みマスク・PC/SPトリム |  |
| `site-aima/assets/hero-small.webp` | S3 AIMA | AI | 768×512 | WEBP | 68,844 | 保留 | 藍の寄り・染みマスク・PC/SPトリム |  |
| `site-aima/assets/hero.webp` | S3 AIMA | AI | 1536×1024 | WEBP | 238,608 | 保留 | 藍の寄り・染みマスク・PC/SPトリム | 同一内容 3件 |
| `site-aima/assets/stay-small.webp` | S3 AIMA | AI | 768×512 | WEBP | 74,298 | 保留 | 藍の寄り・染みマスク・PC/SPトリム |  |
| `site-aima/assets/stay.webp` | S3 AIMA | AI | 1536×1024 | WEBP | 294,438 | 保留 | 藍の寄り・染みマスク・PC/SPトリム |  |
| `site-awai/assets/favicon.svg` | アーカイブ | UNKNOWN | viewBox 0 0 64 64 | SVG | 696 | 保留 | 由来の記録照合 |  |
| `site-awai/assets/ink/band-h.webp` | アーカイブ | PROC | 1800×360 | WEBP | 54,664 | 不採用 | なし（旧墨/和紙表現） |  |
| `site-awai/assets/ink/edge.webp` | アーカイブ | PROC | 140×1400 | WEBP | 14,576 | 不採用 | なし（旧墨/和紙表現） |  |
| `site-awai/assets/ink/stroke-v.webp` | アーカイブ | PROC | 18×900 | WEBP | 2,682 | 不採用 | なし（旧墨/和紙表現） |  |
| `site-awai/assets/shops/bar-land.webp` | アーカイブ | SHOP | 1600×1067 | WEBP | 145,016 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/bar-port-sm.webp` | アーカイブ | SHOP | 720×1080 | WEBP | 47,470 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/bar-port.webp` | アーカイブ | SHOP | 1067×1600 | WEBP | 118,964 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/cafe-land.webp` | アーカイブ | SHOP | 1600×1067 | WEBP | 166,376 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/cafe-port-sm.webp` | アーカイブ | SHOP | 720×1080 | WEBP | 56,390 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/cafe-port.webp` | アーカイブ | SHOP | 1067×1600 | WEBP | 130,270 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/clothes-land.webp` | アーカイブ | SHOP | 1600×1067 | WEBP | 148,392 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/clothes-port-sm.webp` | アーカイブ | SHOP | 720×1080 | WEBP | 65,044 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/clothes-port.webp` | アーカイブ | SHOP | 1067×1600 | WEBP | 158,060 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/salon-land.webp` | アーカイブ | SHOP | 1600×1067 | WEBP | 75,142 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/salon-port-sm.webp` | アーカイブ | SHOP | 720×1080 | WEBP | 31,422 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/salon-port.webp` | アーカイブ | SHOP | 1067×1600 | WEBP | 91,762 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/01-cafe-land.png` | アーカイブ | SHOP | 1536×1024 | PNG | 2,617,814 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/01-cafe-port.png` | アーカイブ | SHOP | 1024×1536 | PNG | 2,227,575 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/02-salon-land.png` | アーカイブ | SHOP | 1536×1024 | PNG | 2,184,080 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/02-salon-port.png` | アーカイブ | SHOP | 1024×1536 | PNG | 2,277,567 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/03-clothes-land.png` | アーカイブ | SHOP | 1536×1024 | PNG | 2,473,129 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/03-clothes-port.png` | アーカイブ | SHOP | 1024×1536 | PNG | 2,442,093 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/04-sweets-land.png` | アーカイブ | SHOP | 1536×1024 | PNG | 2,203,115 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/04-sweets-port.png` | アーカイブ | SHOP | 1024×1536 | PNG | 2,254,226 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/05-bar-land.png` | アーカイブ | SHOP | 1536×1024 | PNG | 2,466,388 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/05-bar-port.png` | アーカイブ | SHOP | 1024×1536 | PNG | 2,131,990 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/contact-sheet-v2.png` | アーカイブ | SHOP | 1430×3530 | PNG | 9,202,117 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/contact-sheet.png` | アーカイブ | SHOP | 1430×3530 | PNG | 9,730,532 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/v1/02-salon-land.png` | アーカイブ | SHOP | 1536×1024 | PNG | 2,605,816 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/v1/02-salon-port.png` | アーカイブ | SHOP | 1024×1536 | PNG | 2,341,713 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/v1/03-clothes-land.png` | アーカイブ | SHOP | 1536×1024 | PNG | 2,318,260 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/v1/03-clothes-port.png` | アーカイブ | SHOP | 1024×1536 | PNG | 2,397,507 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/v1/04-sweets-land.png` | アーカイブ | SHOP | 1536×1024 | PNG | 2,524,387 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/src/v1/04-sweets-port.png` | アーカイブ | SHOP | 1024×1536 | PNG | 2,201,127 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/sweets-land.webp` | アーカイブ | SHOP | 1600×1067 | WEBP | 120,192 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/sweets-port-sm.webp` | アーカイブ | SHOP | 720×1080 | WEBP | 49,108 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai/assets/shops/sweets-port.webp` | アーカイブ | SHOP | 1067×1600 | WEBP | 120,998 | 不採用 | なし（架空5店舗旧案） |  |
| `site-awai-v2/assets/env/studio_1k.wasm` | アーカイブ | PH | 1024×512 | WASM（旧記録:HDR/glTFバイナリ改名） | 1,648,130 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/assets/favicon.svg` | アーカイブ | UNKNOWN | viewBox 0 0 32 32 | SVG | 154 | 保留 | 由来の記録照合 |  |
| `site-awai-v2/assets/models/camera/Camera_01-geo.wasm` | アーカイブ | PH | — | WASM（旧記録:HDR/glTFバイナリ改名） | 845,028 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/assets/models/camera/Camera_01.json` | アーカイブ | PH | — | JSON | 6,565 | 不採用 | なし（旧3D） | 同一内容 2件 |
| `site-awai-v2/assets/models/camera/textures/Camera_01_body_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 228,449 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/assets/models/camera/textures/Camera_01_body_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 175,778 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/assets/models/camera/textures/Camera_01_body_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 271,892 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/assets/models/camera/textures/Camera_01_lens_body_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 163,109 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/assets/models/camera/textures/Camera_01_lens_body_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 106,198 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/assets/models/camera/textures/Camera_01_lens_body_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 147,816 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/assets/models/camera/textures/Camera_01_strap_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 159,433 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/assets/models/camera/textures/Camera_01_strap_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 132,449 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/assets/models/camera/textures/Camera_01_strap_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 199,844 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/assets/models/croissant/croissant-geo.wasm` | アーカイブ | PH | — | WASM（旧記録:HDR/glTFバイナリ改名） | 44,932 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/assets/models/croissant/croissant.json` | アーカイブ | PH | — | JSON | 1,781 | 不採用 | なし（旧3D） | 同一内容 2件 |
| `site-awai-v2/assets/models/croissant/textures/croissant_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 632,316 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/assets/models/croissant/textures/croissant_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 573,933 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/assets/models/croissant/textures/croissant_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 844,912 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/assets/photos/aima.webp` | S3 AIMA | AI | 1536×1024 | WEBP | 191,692 | 保留 | 藍の寄り・染みマスク・PC/SPトリム |  |
| `site-awai-v2/assets/photos/arc.webp` | アーカイブ | OLDWORK | 1600×1131 | WEBP | 50,282 | 不採用 | なし（新本編3作品へ整理） | 同一内容 3件 |
| `site-awai-v2/assets/photos/kasane.webp` | S2 KASANE | KAS | 1300×866 | WEBP | 37,082 | 保留 | 採用画面のPC/SPマスク・暗部グレード | 同一内容 7件 |
| `site-awai-v2/assets/photos/okinohama.webp` | アーカイブ | OLDWORK | 1920×1280 | WEBP | 110,468 | 不採用 | なし（新本編3作品へ整理） | 同一内容 4件 |
| `site-awai-v2/assets/photos/studiofree.mp4` | アーカイブ | STUDIO | 720×1280 | MP4/h264 30/1fps 22.00s | 351,862 | 不採用 | なし（新本編3作品へ整理） | 無音 |
| `site-awai-v2/assets/photos/suketo.webp` | S1 助任珈琲 | SK | 1600×1068 | WEBP | 176,954 | 保留 | 元素材出典照合・湯気合成用マスク・PC/SP | 同一内容 4件 |
| `site-awai-v2/assets/photos/uchimachi.webp` | アーカイブ | OLDWORK | 1122×1402 | WEBP | 101,576 | 不採用 | なし（新本編3作品へ整理） |  |
| `site-awai-v2/assets/shops/bakery.webp` | アーカイブ | US-bakery | 640×960 | WEBP | 42,362 | 不採用 | なし |  |
| `site-awai-v2/assets/shops/src/04-bakery-land.jpg` | アーカイブ | US-bakery | 2400×1600 | JPEG | 823,251 | 不採用 | なし |  |
| `site-awai-v2/assets/shops/src/04-bakery-port.jpg` | アーカイブ | US-bakery | 1500×2250 | JPEG | 727,937 | 不採用 | なし |  |
| `site-awai-v2/assets/works/aima-sp.webp` | アーカイブ（完成Web画面） | AI | 520×1125 | WEBP | 23,090 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `site-awai-v2/assets/works/aima.webp` | アーカイブ（完成Web画面） | AI | 1200×750 | WEBP | 29,120 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `site-awai-v2/assets/works/arc-sp.webp` | アーカイブ（完成Web画面） | OLDWORK | 520×1125 | WEBP | 33,178 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `site-awai-v2/assets/works/arc.webp` | アーカイブ（完成Web画面） | OLDWORK | 1200×750 | WEBP | 37,582 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `site-awai-v2/assets/works/kasane-sp.webp` | アーカイブ（完成Web画面） | KAS | 520×1125 | WEBP | 30,584 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `site-awai-v2/assets/works/kasane.webp` | アーカイブ（完成Web画面） | KAS | 1200×750 | WEBP | 67,642 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `site-awai-v2/assets/works/okinohama-sp.webp` | アーカイブ（完成Web画面） | OLDWORK | 520×1125 | WEBP | 41,168 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `site-awai-v2/assets/works/okinohama.webp` | アーカイブ（完成Web画面） | OLDWORK | 1200×750 | WEBP | 59,402 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `site-awai-v2/assets/works/studiofree-sp.webp` | アーカイブ（完成Web画面） | STUDIO | 520×1125 | WEBP | 17,436 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `site-awai-v2/assets/works/studiofree.webp` | アーカイブ（完成Web画面） | STUDIO | 1200×750 | WEBP | 11,872 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `site-awai-v2/assets/works/suketo-sp.webp` | アーカイブ（完成Web画面） | SK | 520×1125 | WEBP | 32,640 | 不採用 | 新本編で連続サイト画面を表示しない | 同一内容 4件 |
| `site-awai-v2/assets/works/suketo.webp` | アーカイブ（完成Web画面） | SK | 1200×750 | WEBP | 54,322 | 不採用 | 新本編で連続サイト画面を表示しない | 同一内容 4件 |
| `site-awai-v2/assets/works/uchimachi-sp.webp` | アーカイブ（完成Web画面） | OLDWORK | 520×1125 | WEBP | 35,584 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `site-awai-v2/assets/works/uchimachi.webp` | アーカイブ（完成Web画面） | OLDWORK | 1200×750 | WEBP | 54,530 | 不採用 | 新本編で連続サイト画面を表示しない |  |
| `site-awai-v2/prototype/real/camera/Camera_01.bin` | アーカイブ | PH | — | BIN | 845,028 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/prototype/real/camera/Camera_01.gltf` | アーカイブ | PH | — | GLTF | 9,886 | 不採用 | なし（旧3D） |  |
| `site-awai-v2/prototype/real/camera/textures/Camera_01_body_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 228,449 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/prototype/real/camera/textures/Camera_01_body_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 175,778 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/prototype/real/camera/textures/Camera_01_body_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 271,892 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/prototype/real/camera/textures/Camera_01_lens_body_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 163,109 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/prototype/real/camera/textures/Camera_01_lens_body_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 106,198 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/prototype/real/camera/textures/Camera_01_lens_body_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 147,816 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/prototype/real/camera/textures/Camera_01_strap_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 159,433 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/prototype/real/camera/textures/Camera_01_strap_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 132,449 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/prototype/real/camera/textures/Camera_01_strap_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 199,844 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/prototype/real/croissant/croissant.bin` | アーカイブ | PH | — | BIN | 44,932 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/prototype/real/croissant/croissant.gltf` | アーカイブ | PH | — | GLTF | 2,680 | 不採用 | なし（旧3D） |  |
| `site-awai-v2/prototype/real/croissant/textures/croissant_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 632,316 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/prototype/real/croissant/textures/croissant_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 573,933 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/prototype/real/croissant/textures/croissant_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 844,912 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/prototype/real/studio_1k.hdr` | アーカイブ | PH | 1024×512 | HDR | 1,648,130 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/prototype/real/tex/rough_linen_nor_1k.jpg` | アーカイブ | TX | 1024×1026 | JPEG | 916,843 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/prototype/real/tex/rough_linen_rough_1k.jpg` | アーカイブ | TX | 1024×1026 | JPEG | 1,083,725 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/prototype/real/tex/white_oak_veneer_diff_1k.jpg` | アーカイブ | TX | 1024×1024 | JPEG | 595,257 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/prototype/real/tex/white_oak_veneer_nor_1k.jpg` | アーカイブ | TX | 1024×1024 | JPEG | 623,607 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/prototype/real/tex/white_oak_veneer_rough_1k.jpg` | アーカイブ | TX | 1024×1024 | JPEG | 520,649 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/prototype/real/tex/white_stucco_diff_1k.jpg` | アーカイブ | TX | 1024×1024 | JPEG | 557,550 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/prototype/real/tex/white_stucco_nor_1k.jpg` | アーカイブ | TX | 1024×1024 | JPEG | 932,038 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/prototype/real/tex/white_stucco_rough_1k.jpg` | アーカイブ | TX | 1024×1024 | JPEG | 347,861 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/camera/Camera_01-geo.wasm` | アーカイブ | PH | — | WASM（旧記録:HDR/glTFバイナリ改名） | 845,028 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/camera/Camera_01.json` | アーカイブ | PH | — | JSON | 6,565 | 不採用 | なし（旧3D） | 同一内容 2件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/camera/textures/Camera_01_body_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 228,449 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/camera/textures/Camera_01_body_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 175,778 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/camera/textures/Camera_01_body_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 271,892 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/camera/textures/Camera_01_lens_body_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 163,109 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/camera/textures/Camera_01_lens_body_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 106,198 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/camera/textures/Camera_01_lens_body_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 147,816 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/camera/textures/Camera_01_strap_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 159,433 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/camera/textures/Camera_01_strap_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 132,449 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/camera/textures/Camera_01_strap_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 199,844 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/croissant/croissant-geo.wasm` | アーカイブ | PH | — | WASM（旧記録:HDR/glTFバイナリ改名） | 44,932 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/croissant/croissant.json` | アーカイブ | PH | — | JSON | 1,781 | 不採用 | なし（旧3D） | 同一内容 2件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/croissant/textures/croissant_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 632,316 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/croissant/textures/croissant_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 573,933 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/bg-proto/assets/models/croissant/textures/croissant_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 844,912 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/bg-proto/real/studio_1k.wasm` | アーカイブ | PH | — | WASM（旧記録:HDR/glTFバイナリ改名） | 1,648,130 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/bg-proto/real/tex/clay_plaster_diff_1k.jpg` | アーカイブ | TX | 1024×1024 | JPEG | 354,209 | 保留 | 個別出典・マテリアル名照合 |  |
| `site-awai-v2/REVIEW-shots/bg-proto/real/tex/clay_plaster_nor_1k.jpg` | アーカイブ | TX | 1024×1024 | JPEG | 784,921 | 保留 | 個別出典・マテリアル名照合 |  |
| `site-awai-v2/REVIEW-shots/bg-proto/real/tex/clay_plaster_rough_1k.jpg` | アーカイブ | TX | 1024×1024 | JPEG | 345,709 | 保留 | 個別出典・マテリアル名照合 |  |
| `site-awai-v2/REVIEW-shots/bg-proto/real/tex/rough_linen_diff_1k.jpg` | アーカイブ | TX | 1024×1026 | JPEG | 835,801 | 保留 | 個別出典・マテリアル名照合 |  |
| `site-awai-v2/REVIEW-shots/bg-proto/real/tex/rough_linen_nor_1k.jpg` | アーカイブ | TX | 1024×1026 | JPEG | 916,843 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/REVIEW-shots/bg-proto/real/tex/rough_linen_rough_1k.jpg` | アーカイブ | TX | 1024×1026 | JPEG | 1,083,725 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/REVIEW-shots/bg-proto/real/tex/white_oak_veneer_diff_1k.jpg` | アーカイブ | TX | 1024×1024 | JPEG | 595,257 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/REVIEW-shots/bg-proto/real/tex/white_oak_veneer_nor_1k.jpg` | アーカイブ | TX | 1024×1024 | JPEG | 623,607 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/REVIEW-shots/bg-proto/real/tex/white_oak_veneer_rough_1k.jpg` | アーカイブ | TX | 1024×1024 | JPEG | 520,649 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/REVIEW-shots/bg-proto/real/tex/white_stucco_diff_1k.jpg` | アーカイブ | TX | 1024×1024 | JPEG | 557,550 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/REVIEW-shots/bg-proto/real/tex/white_stucco_nor_1k.jpg` | アーカイブ | TX | 1024×1024 | JPEG | 932,038 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/REVIEW-shots/bg-proto/real/tex/white_stucco_rough_1k.jpg` | アーカイブ | TX | 1024×1024 | JPEG | 347,861 | 保留 | 個別出典・マテリアル名照合 | 同一内容 2件 |
| `site-awai-v2/REVIEW-shots/real-proto/real/camera/Camera_01-geo.wasm` | アーカイブ | PH | — | WASM（旧記録:HDR/glTFバイナリ改名） | 845,028 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/real-proto/real/camera/textures/Camera_01_body_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 228,449 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/real-proto/real/camera/textures/Camera_01_body_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 175,778 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/real-proto/real/camera/textures/Camera_01_body_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 271,892 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/real-proto/real/camera/textures/Camera_01_lens_body_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 163,109 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/real-proto/real/camera/textures/Camera_01_lens_body_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 106,198 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/real-proto/real/camera/textures/Camera_01_lens_body_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 147,816 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/real-proto/real/camera/textures/Camera_01_strap_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 159,433 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/real-proto/real/camera/textures/Camera_01_strap_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 132,449 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/real-proto/real/camera/textures/Camera_01_strap_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 199,844 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/real-proto/real/croissant/croissant-geo.wasm` | アーカイブ | PH | — | WASM（旧記録:HDR/glTFバイナリ改名） | 44,932 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/real-proto/real/croissant/textures/croissant_arm_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 632,316 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/real-proto/real/croissant/textures/croissant_diff_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 573,933 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/real-proto/real/croissant/textures/croissant_nor_gl_1k.jpg` | アーカイブ | PH | 1024×1024 | JPEG | 844,912 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v2/REVIEW-shots/real-proto/real/studio_1k.wasm` | アーカイブ | PH | — | WASM（旧記録:HDR/glTFバイナリ改名） | 1,648,130 | 不採用 | なし（旧3D） | 同一内容 4件 |
| `site-awai-v3/materials/footage/A_momiji-komorebi_38869672.mp4` | S0 膜（候補） | PX-maple | 1920×1080 | MP4/h264 60000/1001fps 9.51s | 9,756,863 | 保留 | 暗部グレード・短尺/ポスター | 無音 |
| `site-awai-v3/materials/footage/C_niigata-tanbo_6799270.mp4` | アーカイブ | PX-rice | 1920×1080 | MP4/h264 30000/1001fps 18.25s | 12,682,573 | 不採用 | なし | 無音 |
| `site-awai-v3/materials/footage/D_chichibu-kiri_31386838.mp4` | S4 白紙の奥（候補） | PX-forest | 1920×1080 | MP4/h264 25/1fps 19.72s | 17,879,458 | 保留 | 新方針との整合・暗部グレード | 無音 |
| `site-awai-v3/materials/footage/user-clips/IMG_2013.mov` | S0 膜／S4 白紙の奥（候補） | USER | 1920×1080 回転-90° | MOV/hevc 89400/2981fps 4.97s | 5,541,905 | 保留 | 暗部グレード・無音SDR短尺・ポスター | 音声あり |
| `site-awai-v3/materials/footage/user-clips/IMG_2014.mov` | S0 膜／S4 白紙の奥（候補） | USER | 1920×1080 回転-90° | MOV/hevc 35600/1187fps 5.93s | 6,647,862 | 保留 | 暗部グレード・無音SDR短尺・ポスター | 音声あり |
| `site-awai-v3/materials/footage/user-clips/IMG_2015.mov` | S0 膜／S4 白紙の奥（候補） | USER | 1920×1080 回転-90° | MOV/hevc 93000/3101fps 5.17s | 5,857,311 | 保留 | 暗部グレード・無音SDR短尺・ポスター | 音声あり |
| `site-awai-v3/materials/footage/user-clips/IMG_2016.mov` | S0 膜／S4 白紙の奥（候補） | USER | 1920×1080 回転-90° | MOV/hevc 30/1fps 3.47s | 3,818,978 | 保留 | 暗部グレード・無音SDR短尺・ポスター | 音声あり |
| `site-awai-v3/materials/footage/user-clips/IMG_2017.mov` | S0 膜／S4 白紙の奥（候補） | USER | 1920×1080 回転-90° | MOV/hevc 35600/1187fps 5.93s | 6,611,986 | 保留 | 暗部グレード・無音SDR短尺・ポスター | 音声あり |
| `site-awai-v3/materials/footage/user-clips/IMG_2018.mov` | S0 膜／S4 白紙の奥（候補） | USER | 1920×1080 回転-90° | MOV/hevc 105600/3521fps 5.87s | 6,455,579 | 保留 | 暗部グレード・無音SDR短尺・ポスター | 音声あり |
| `site-awai-v3/materials/footage/user-clips/IMG_2019.mov` | S0 膜／S4 白紙の奥（候補） | USER | 1920×1080 回転-90° | MOV/hevc 115200/3841fps 6.40s | 7,295,505 | 保留 | 暗部グレード・無音SDR短尺・ポスター | 音声あり |
| `site-awai-v3/materials/footage/user-clips/IMG_2020.mov` | S0 膜／S4 白紙の奥（候補） | USER | 1920×1080 回転-90° | MOV/hevc 112800/3761fps 6.27s | 7,165,099 | 保留 | 暗部グレード・無音SDR短尺・ポスター | 音声あり |
| `site-awai-v3/materials/footage/user-clips/IMG_2021.mov` | S0 膜／S4 白紙の奥（候補） | USER | 1920×1080 回転-90° | MOV/hevc 112800/3761fps 6.27s | 6,889,639 | 保留 | 暗部グレード・無音SDR短尺・ポスター | 音声あり |
| `site-awai-v3/materials/footage/user-clips/IMG_2023.mov` | S0 膜／S4 白紙の奥（候補） | USER | 1920×1080 回転-90° | MOV/hevc 30/1fps 3.93s | 4,424,384 | 保留 | 暗部グレード・無音SDR短尺・ポスター | 音声あり |
| `site-awai-v3/materials/footage/user-clips/IMG_2024.mov` | S0 膜／S4 白紙の奥（候補） | USER | 1920×1080 回転-90° | MOV/hevc 30/1fps 4.33s | 4,875,908 | 保留 | 暗部グレード・無音SDR短尺・ポスター | 音声あり |
| `site-awai-v3/materials/footage/user-clips/IMG_2025.mov` | S0 膜／S4 白紙の奥（候補） | USER | 1920×1080 回転-90° | MOV/hevc 135000/4501fps 7.50s | 14,852,863 | 保留 | 暗部グレード・無音SDR短尺・ポスター | 音声あり |
| `site-awai-v3/materials/storyboard/1-写真1.jpg` | アーカイブ | UNKNOWN | 1280×960 | JPEG | 211,889 | 保留 | 由来の記録照合 |  |
| `site-awai-v3/materials/storyboard/2-写真2.jpg` | アーカイブ | UNKNOWN | 1280×960 | JPEG | 196,392 | 保留 | 由来の記録照合 |  |
| `site-awai-v3/materials/storyboard/3-写真3.jpg` | アーカイブ | UNKNOWN | 1280×960 | JPEG | 224,030 | 保留 | 由来の記録照合 |  |
| `site-awai-v3/materials/storyboard/4-写真4.jpg` | アーカイブ | UNKNOWN | 1280×960 | JPEG | 193,940 | 保留 | 由来の記録照合 |  |
| `site-awai-v3/materials/storyboard/5-写真5.jpg` | アーカイブ | UNKNOWN | 1280×960 | JPEG | 176,139 | 保留 | 由来の記録照合 |  |
| `site-awai-v3/materials/storyboard/6-写真6.jpg` | アーカイブ | UNKNOWN | 1280×960 | JPEG | 182,696 | 保留 | 由来の記録照合 |  |
| `site-awai-v3/paper-prototype/materials/dusk-source.png` | S0 膜／S4 白紙（旧和紙候補） | GEN | 1536×1024 | PNG | 2,100,989 | 保留 | 和紙→膜にする場合は生成りを転用せず新材質案 |  |
| `site-awai-v3/paper-prototype/materials/external-dusk/bakery-source.mp4` | アーカイブ | PX-bakery | 3840×2160 | MP4/h264 25/1fps 12.84s | 48,388,192 | 不採用 | なし（人物/文字が主役・旧判断未採用） | 無音 |
| `site-awai-v3/paper-prototype/materials/external-dusk/cafe-poster.webp` | アーカイブ | PX-cafe | 406×720 | WEBP | 13,130 | 不採用 | なし（人物/文字が主役・旧判断未採用） |  |
| `site-awai-v3/paper-prototype/materials/external-dusk/cafe.mp4` | アーカイブ | PX-cafe | 406×720 | MP4/h264 25/1fps 4.64s | 347,859 | 不採用 | なし（人物/文字が主役・旧判断未採用） | 無音 |
| `site-awai-v3/paper-prototype/materials/external-dusk/dusk.mp4` | アーカイブ | PX-bakery | 1280×720 | MP4/h264 25/1fps 7.00s | 3,945,440 | 不採用 | なし（人物/文字が主役・旧判断未採用） | 無音 |
| `site-awai-v3/paper-prototype/materials/external-dusk/poster.webp` | アーカイブ | PX-bakery | 1280×720 | WEBP | 107,978 | 不採用 | なし（人物/文字が主役・旧判断未採用） |  |
| `site-awai-v3/paper-prototype/materials/external-dusk/source.mp4` | アーカイブ | PX-cafe | 1080×1920 | MP4/h264 50/1fps 4.69s | 1,541,012 | 不採用 | なし（人物/文字が主役・旧判断未採用） | 音声あり |
| `site-awai-v3/paper-prototype/materials/paper-source.png` | S0 膜／S4 白紙（旧和紙候補） | GEN | 1254×1254 | PNG | 2,991,768 | 保留 | 和紙→膜にする場合は生成りを転用せず新材質案 |  |
| `site-awai-v3/paper-prototype/materials/studiofree-v10-mobile-source.png` | アーカイブ | STUDIO | 940×1672 | PNG | 2,035,736 | 不採用 | なし（新本編3作品へ整理） |  |
| `site-awai-v3/paper-prototype/materials/studiofree-v10-source.png` | アーカイブ | STUDIO | 1536×1024 | PNG | 1,984,526 | 不採用 | なし（新本編3作品へ整理） |  |
| `site-awai-v3/paper-prototype/materials/studiofree-v9-mobile-source.png` | アーカイブ | STUDIO | 941×1672 | PNG | 2,253,553 | 不採用 | なし（新本編3作品へ整理） |  |
| `site-awai-v3/paper-prototype/materials/studiofree-v9-source.png` | アーカイブ | STUDIO | 1536×1024 | PNG | 2,106,658 | 不採用 | なし（新本編3作品へ整理） |  |
| `site-awai-v3/paper-prototype/materials/washi-v9-source.png` | S0 膜／S4 白紙（旧和紙候補） | GEN | 1254×1254 | PNG | 2,967,467 | 保留 | 和紙→膜にする場合は生成りを転用せず新材質案 |  |
| `site-awai-v3/paper-prototype/out/media/opening.mp4` | S0 膜（候補） | OPEN | 480×854 | MP4/h264 30/1fps 7.50s | 3,588,832 | 保留 | 派生元記録・新膜での採否 | 無音／同一内容 2件 |
| `site-awai-v3/paper-prototype/out/media/opening.webp` | S0 膜（候補） | OPEN | 480×854 | WEBP | 85,734 | 保留 | 派生元記録・新膜での採否 | 同一内容 2件 |
| `site-awai-v3/paper-prototype/out/media/sky.webp` | S0 膜（候補） | OPEN | 480×854 | WEBP | 50,834 | 保留 | 派生元記録・新膜での採否 | 同一内容 2件 |
| `site-awai-v3/paper-prototype/out/media/washi/dusk-study.webp` | S0 膜／S4 白紙（旧和紙候補） | GEN | 1536×1024 | WEBP | 107,152 | 保留 | 和紙→膜にする場合は生成りを転用せず新材質案 | 同一内容 2件 |
| `site-awai-v3/paper-prototype/out/media/washi/paper-v9.webp` | S0 膜／S4 白紙（旧和紙候補） | GEN | 960×960 | WEBP | 176,766 | 保留 | 和紙→膜にする場合は生成りを転用せず新材質案 | 同一内容 2件 |
| `site-awai-v3/paper-prototype/out/media/washi/paper.webp` | S0 膜／S4 白紙（旧和紙候補） | GEN | 1254×1254 | WEBP | 265,478 | 保留 | 和紙→膜にする場合は生成りを転用せず新材質案 | 同一内容 3件 |
| `site-awai-v3/paper-prototype/out/media/water.mp4` | S0 膜（候補） | WATER | 480×854 | MP4/h264 30/1fps 2.30s | 1,141,460 | 保留 | 新膜の背景として採否・暗部グレード | 無音／同一内容 2件 |
| `site-awai-v3/paper-prototype/out/media/water.webp` | S0 膜（候補） | WATER | 480×854 | WEBP | 68,638 | 保留 | 新膜の背景として採否・暗部グレード | 同一内容 2件 |
| `site-awai-v3/paper-prototype/out/media/works/aima.webp` | S3 AIMA | AI | 1536×1024 | WEBP | 238,608 | 保留 | 藍の寄り・染みマスク・PC/SPトリム | 同一内容 3件 |
| `site-awai-v3/paper-prototype/out/media/works/arc.webp` | アーカイブ | OLDWORK | 1600×1131 | WEBP | 50,282 | 不採用 | なし（新本編3作品へ整理） | 同一内容 3件 |
| `site-awai-v3/paper-prototype/out/media/works/kasane-detail.webp` | S2 KASANE | KAS | 1300×866 | WEBP | 37,082 | 保留 | 採用画面のPC/SPマスク・暗部グレード | 同一内容 7件 |
| `site-awai-v3/paper-prototype/out/media/works/kasane-layer.webp` | S2 KASANE | US-look-03 | 900×1200 | WEBP | 134,240 | 保留 | 暗部グレード・縦構図検証 | 同一内容 4件 |
| `site-awai-v3/paper-prototype/out/media/works/kasane.webp` | S2 KASANE | KAS | 1300×866 | WEBP | 37,082 | 保留 | 採用画面のPC/SPマスク・暗部グレード | 同一内容 7件 |
| `site-awai-v3/paper-prototype/out/media/works/okinohama.webp` | アーカイブ | OLDWORK | 1920×1280 | WEBP | 110,468 | 不採用 | なし（新本編3作品へ整理） | 同一内容 4件 |
| `site-awai-v3/paper-prototype/out/media/works/studiofree-mood-mobile-v10.webp` | アーカイブ | STUDIO | 720×1281 | WEBP | 88,260 | 不採用 | なし（新本編3作品へ整理） | 同一内容 3件 |
| `site-awai-v3/paper-prototype/out/media/works/studiofree-mood-mobile-v9.webp` | アーカイブ | STUDIO | 720×1279 | WEBP | 105,548 | 不採用 | なし（新本編3作品へ整理） | 同一内容 2件 |
| `site-awai-v3/paper-prototype/out/media/works/studiofree-mood-v10.webp` | アーカイブ | STUDIO | 1536×1024 | WEBP | 114,614 | 不採用 | なし（新本編3作品へ整理） | 同一内容 3件 |
| `site-awai-v3/paper-prototype/out/media/works/studiofree-mood-v9.webp` | アーカイブ | STUDIO | 1536×1024 | WEBP | 118,646 | 不採用 | なし（新本編3作品へ整理） | 同一内容 2件 |
| `site-awai-v3/paper-prototype/out/media/works/studiofree.webp` | アーカイブ | STUDIO | 1080×1920 | WEBP | 51,310 | 不採用 | なし（新本編3作品へ整理） | 同一内容 2件 |
| `site-awai-v3/paper-prototype/out/media/works/suketo-web-mobile.webp` | アーカイブ（完成Web画面） | SK | 520×1125 | WEBP | 32,640 | 不採用 | 新本編で連続サイト画面を表示しない | 同一内容 4件 |
| `site-awai-v3/paper-prototype/out/media/works/suketo-web.webp` | アーカイブ（完成Web画面） | SK | 1200×750 | WEBP | 54,322 | 不採用 | 新本編で連続サイト画面を表示しない | 同一内容 4件 |
| `site-awai-v3/paper-prototype/out/media/works/suketo.webp` | S1 助任珈琲 | SK | 1600×1068 | WEBP | 176,954 | 保留 | 元素材出典照合・湯気合成用マスク・PC/SP | 同一内容 4件 |
| `site-awai-v3/paper-prototype/out/media/works/uchimachi.webp` | アーカイブ | OLDWORK | 1536×1024 | WEBP | 146,036 | 不採用 | なし（新本編3作品へ整理） | 同一内容 3件 |
| `site-awai-v3/paper-prototype/public/media/opening.mp4` | S0 膜（候補） | OPEN | 480×854 | MP4/h264 30/1fps 7.50s | 3,588,832 | 保留 | 派生元記録・新膜での採否 | 無音／同一内容 2件 |
| `site-awai-v3/paper-prototype/public/media/opening.webp` | S0 膜（候補） | OPEN | 480×854 | WEBP | 85,734 | 保留 | 派生元記録・新膜での採否 | 同一内容 2件 |
| `site-awai-v3/paper-prototype/public/media/sky.webp` | S0 膜（候補） | OPEN | 480×854 | WEBP | 50,834 | 保留 | 派生元記録・新膜での採否 | 同一内容 2件 |
| `site-awai-v3/paper-prototype/public/media/washi/dusk-study.webp` | S0 膜／S4 白紙（旧和紙候補） | GEN | 1536×1024 | WEBP | 107,152 | 保留 | 和紙→膜にする場合は生成りを転用せず新材質案 | 同一内容 2件 |
| `site-awai-v3/paper-prototype/public/media/washi/paper-v9.webp` | S0 膜／S4 白紙（旧和紙候補） | GEN | 960×960 | WEBP | 176,766 | 保留 | 和紙→膜にする場合は生成りを転用せず新材質案 | 同一内容 2件 |
| `site-awai-v3/paper-prototype/public/media/washi/paper.webp` | S0 膜／S4 白紙（旧和紙候補） | GEN | 1254×1254 | WEBP | 265,478 | 保留 | 和紙→膜にする場合は生成りを転用せず新材質案 | 同一内容 3件 |
| `site-awai-v3/paper-prototype/public/media/water.mp4` | S0 膜（候補） | WATER | 480×854 | MP4/h264 30/1fps 2.30s | 1,141,460 | 保留 | 新膜の背景として採否・暗部グレード | 無音／同一内容 2件 |
| `site-awai-v3/paper-prototype/public/media/water.webp` | S0 膜（候補） | WATER | 480×854 | WEBP | 68,638 | 保留 | 新膜の背景として採否・暗部グレード | 同一内容 2件 |
| `site-awai-v3/paper-prototype/public/media/works/aima.webp` | S3 AIMA | AI | 1536×1024 | WEBP | 238,608 | 保留 | 藍の寄り・染みマスク・PC/SPトリム | 同一内容 3件 |
| `site-awai-v3/paper-prototype/public/media/works/arc.webp` | アーカイブ | OLDWORK | 1600×1131 | WEBP | 50,282 | 不採用 | なし（新本編3作品へ整理） | 同一内容 3件 |
| `site-awai-v3/paper-prototype/public/media/works/kasane-detail.webp` | S2 KASANE | KAS | 1300×866 | WEBP | 37,082 | 保留 | 採用画面のPC/SPマスク・暗部グレード | 同一内容 7件 |
| `site-awai-v3/paper-prototype/public/media/works/kasane-layer.webp` | S2 KASANE | US-look-03 | 900×1200 | WEBP | 134,240 | 保留 | 暗部グレード・縦構図検証 | 同一内容 4件 |
| `site-awai-v3/paper-prototype/public/media/works/kasane.webp` | S2 KASANE | KAS | 1300×866 | WEBP | 37,082 | 保留 | 採用画面のPC/SPマスク・暗部グレード | 同一内容 7件 |
| `site-awai-v3/paper-prototype/public/media/works/okinohama.webp` | アーカイブ | OLDWORK | 1920×1280 | WEBP | 110,468 | 不採用 | なし（新本編3作品へ整理） | 同一内容 4件 |
| `site-awai-v3/paper-prototype/public/media/works/studiofree-mood-mobile-v10.webp` | アーカイブ | STUDIO | 720×1281 | WEBP | 88,260 | 不採用 | なし（新本編3作品へ整理） | 同一内容 3件 |
| `site-awai-v3/paper-prototype/public/media/works/studiofree-mood-mobile-v9.webp` | アーカイブ | STUDIO | 720×1279 | WEBP | 105,548 | 不採用 | なし（新本編3作品へ整理） | 同一内容 2件 |
| `site-awai-v3/paper-prototype/public/media/works/studiofree-mood-v10.webp` | アーカイブ | STUDIO | 1536×1024 | WEBP | 114,614 | 不採用 | なし（新本編3作品へ整理） | 同一内容 3件 |
| `site-awai-v3/paper-prototype/public/media/works/studiofree-mood-v9.webp` | アーカイブ | STUDIO | 1536×1024 | WEBP | 118,646 | 不採用 | なし（新本編3作品へ整理） | 同一内容 2件 |
| `site-awai-v3/paper-prototype/public/media/works/studiofree.webp` | アーカイブ | STUDIO | 1080×1920 | WEBP | 51,310 | 不採用 | なし（新本編3作品へ整理） | 同一内容 2件 |
| `site-awai-v3/paper-prototype/public/media/works/suketo-web-mobile.webp` | アーカイブ（完成Web画面） | SK | 520×1125 | WEBP | 32,640 | 不採用 | 新本編で連続サイト画面を表示しない | 同一内容 4件 |
| `site-awai-v3/paper-prototype/public/media/works/suketo-web.webp` | アーカイブ（完成Web画面） | SK | 1200×750 | WEBP | 54,322 | 不採用 | 新本編で連続サイト画面を表示しない | 同一内容 4件 |
| `site-awai-v3/paper-prototype/public/media/works/suketo.webp` | S1 助任珈琲 | SK | 1600×1068 | WEBP | 176,954 | 保留 | 元素材出典照合・湯気合成用マスク・PC/SP | 同一内容 4件 |
| `site-awai-v3/paper-prototype/public/media/works/uchimachi.webp` | アーカイブ | OLDWORK | 1536×1024 | WEBP | 146,036 | 不採用 | なし（新本編3作品へ整理） | 同一内容 3件 |
| `site-kasane/assets/atelier-01.jpg` | S2 KASANE | US-atelier-01 | 1300×866 | JPEG | 74,666 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/atelier-01.webp` | S2 KASANE | US-atelier-01 | 1300×866 | WEBP | 43,496 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/fabric-linen.jpg` | S2 KASANE | US-fabric-linen | 1300×866 | JPEG | 436,464 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/fabric-linen.webp` | S2 KASANE | US-fabric-linen | 1300×866 | WEBP | 435,264 | 保留 | 場面選定後のPC/SP寄り・マスク | 同一内容 2件 |
| `site-kasane/assets/fabric-rib.jpg` | S2 KASANE | US-fabric-rib | 1300×866 | JPEG | 229,092 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/fabric-rib.webp` | S2 KASANE | US-fabric-rib | 1300×866 | WEBP | 210,144 | 保留 | 場面選定後のPC/SP寄り・マスク | 同一内容 2件 |
| `site-kasane/assets/favicon.svg` | アーカイブ | OWN | viewBox 0 0 32 32 | SVG | 317 | 不採用 | なし |  |
| `site-kasane/assets/founder.jpg` | S2 KASANE | US-founder | 1000×1250 | JPEG | 56,203 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/founder.webp` | S2 KASANE | US-founder | 1000×1250 | WEBP | 27,604 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/look-01.jpg` | S2 KASANE | US-look-01 | 900×1200 | JPEG | 88,487 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/look-01.webp` | S2 KASANE | US-look-01 | 900×1200 | WEBP | 58,840 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/look-02.jpg` | S2 KASANE | US-look-02 | 900×1200 | JPEG | 166,247 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/look-02.webp` | S2 KASANE | US-look-02 | 900×1200 | WEBP | 123,068 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/look-03.jpg` | S2 KASANE | US-look-03 | 900×1200 | JPEG | 160,149 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/look-03.webp` | S2 KASANE | US-look-03 | 900×1200 | WEBP | 134,240 | 保留 | 場面選定後のPC/SP寄り・マスク | 同一内容 4件 |
| `site-kasane/assets/look-04.jpg` | S2 KASANE | US-look-04 | 900×1200 | JPEG | 103,792 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/look-04.webp` | S2 KASANE | US-look-04 | 900×1200 | WEBP | 118,126 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/rack.jpg` | S2 KASANE | US-rack | 1400×934 | JPEG | 65,801 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/rack.webp` | S2 KASANE | US-rack | 1400×934 | WEBP | 30,474 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/store.jpg` | S2 KASANE | US-store | 1000×1250 | JPEG | 96,438 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-kasane/assets/store.webp` | S2 KASANE | US-store | 1000×1250 | WEBP | 74,454 | 保留 | 場面選定後のPC/SP寄り・マスク |  |
| `site-suketo/assets/beans.webp` | S1 助任珈琲 | SK | 1100×1650 | WEBP | 319,290 | 保留 | 元素材出典照合・湯気合成用マスク・PC/SP |  |
| `site-suketo/assets/cooling.webp` | S1 助任珈琲 | SK | 1600×1066 | WEBP | 203,208 | 保留 | 元素材出典照合・湯気合成用マスク・PC/SP |  |
| `site-suketo/assets/counter.webp` | S1 助任珈琲 | SK | 1100×1468 | WEBP | 116,220 | 保留 | 元素材出典照合・湯気合成用マスク・PC/SP |  |
| `site-suketo/assets/drip.webp` | S1 助任珈琲 | SK | 1100×1650 | WEBP | 29,580 | 保留 | 元素材出典照合・湯気合成用マスク・PC/SP |  |
| `site-suketo/assets/hands.webp` | S1 助任珈琲 | SK | 1100×1650 | WEBP | 66,832 | 保留 | 元素材出典照合・湯気合成用マスク・PC/SP |  |
| `site-suketo/assets/hero-poster.webp` | S1 助任珈琲 | SK | 1280×720 | WEBP | 80,532 | 保留 | 元素材出典照合・湯気合成用マスク・PC/SP |  |
| `site-suketo/assets/hero.mp4` | S1 助任珈琲 | SK | 1280×720 | MP4/h264 30/1fps 12.00s | 1,737,791 | 保留 | 元素材出典照合・湯気合成用マスク・PC/SP | 無音 |
| `site-suketo/assets/hero.webp` | S1 助任珈琲 | SK | 1600×1068 | WEBP | 210,128 | 保留 | 元素材出典照合・湯気合成用マスク・PC/SP |  |
| `site-suketo/assets/roast-poster.webp` | S1 助任珈琲 | SK | 1280×720 | WEBP | 38,346 | 保留 | 元素材出典照合・湯気合成用マスク・PC/SP |  |
| `site-suketo/assets/roast.mp4` | S1 助任珈琲 | SK | 1280×720 | MP4/h264 30/1fps 10.00s | 624,890 | 保留 | 元素材出典照合・湯気合成用マスク・PC/SP | 無音 |

## 監査範囲・集計

台帳対象 **319ファイル**、合計 **363,350,311 bytes**。内訳: assets=13, docs=40, site-aima=7, site-awai=37, site-awai-v2=111, site-awai-v3=80, site-kasane=21, site-suketo=10。

除外は node_modules / .next / .git の依存/ビルド作業物。out/media は本番コピーなので省略せず掲載。REVIEW-shots 内もモデル/テクスチャ実素材は掲載。

検証用スクリーンショット/フィルム確認用コマは計 428件を台帳の個別行から除外し、以下の場所別件数にまとめた（素材の採用対象ではない）。

- `site-awai-v2/REVIEW-shots/`: 61件
- `site-awai-v2/REVIEW-shots/ref/`: 15件
- `site-awai-v2/REVIEW-shots/scenes/`: 64件
- `site-awai-v3/paper-prototype/`: 74件
- `site-awai-v3/paper-prototype/out/film-review/`: 78件
- `site-awai-v3/paper-prototype/public/film-review/`: 78件
- `site-awai/REVIEW-shots/`: 58件

その他: root assets/ の所在を確認し13件を収録。docs/awai-v3/motion-study/media の派生動画・src原動画を全件収録。本人撮影の別置き候補（footage/CREDITS.md記載のDesktop側フォルダ）はこの台帳の実ファイル収集外。出典不明を含め既存の実ファイルを列挙しており、未取得素材のダウンロード、新素材生成、実装変更、公開は行っていない。
