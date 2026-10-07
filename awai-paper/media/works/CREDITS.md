# WORK静止構成の素材

既存の本人ポートフォリオに掲載されている制作見本の素材を再利用。
6作品は自主制作の見本。STUDIO FREEのみ依頼制作。

- 助任珈琲豆店: https://suketo-demo.github.io/suketo/ 。既存 site-awai-v2/assets/photos/suketo.webp。
- おきのはま製パン: https://okinohama-demo.github.io/okinohama/ 。既存 site-awai-v2/assets/photos/okinohama.webp。作品の素材記録: site-okinnohama-seipan/CREDITS.md。
- UCHIMACHI HAIR: https://uchimachi-demo.github.io/uchimachi/ 。site-uchimachi-hair/assets/salon-interior.webp。
- KASANE: https://kasane-demo.github.io/kasane/ 。既存 site-awai-v2/assets/photos/kasane.webp。
- ARC: https://arc-pilates-demo.github.io/arc/ 。既存 site-awai-v2/assets/photos/arc.webp。素材記録: site-arc-pilates/CREDITS.md。構成上の朱はCSSの単色面とmultiply処理。
- STUDIO FREE: https://karisyacho.github.io/#w-studiofree 。既存広告 assets/serapeel-reel.mp4 の12秒位置から静止画を抽出。本段階では動画は再生しない。
- AIMA: https://karisyacho.github.io/aima/ 。site-aima/assets/hero.webp。

架空店の写真は実在店舗の取材写真として扱わない。広告静止画内の表記は元の広告素材のまま。

## v9：STUDIO FREEの構成用イメージ
元のセラピール広告静止画は本構成の雰囲気と合わず、本人指示で生成した施術風景に置換。
これは実案件の納品広告・撮影写真ではなく、静止構成のための仮画像。画面の札にも「構成用の生成イメージ」を表示。
内蔵imagegenで、服の上から肩をほぐす施術、午後の自然光、生成りの衣服と寝具、窓のある静かな室内を生成。
PC: public/media/works/studiofree-mood-v9.webp（materials/studiofree-v9-source.png）。
Mobile: public/media/works/studiofree-mood-mobile-v9.webp（materials/studiofree-v9-mobile-source.png）。同じ画像を参照し縦向き構図に変更、顔と両手を保持。
公開画像には広告コピー・商品瓶・ブランドロゴなし。作品リンクは本人の既存ポートフォリオの実案件へ。
ARCは元画像を維持。PCは全体を収め、スマホは顔・支持する手・足が切れない正方形に近い表示範囲を朱の面の中へ配置。人物のポーズは変更していない。

## v10：サロンとして認識できる施術風景
v9は家庭的な服装と寝具で、本人から「寝ている娘を揉む母親」と指摘。v10ではチャコールの業務用制服・まとめ髪・高さ調節式の業務用施術ベッド・フェイスクレードル・タオルワゴンを明確にした。
内蔵imagegenによる構成確認用生成画像。実際のSTUDIO FREEの撮影/納品作品ではない。札の生成イメージ表記を維持。
横: materials/studiofree-v10-source.png → studiofree-mood-v10.webp。縦: materials/studiofree-v10-mobile-source.png → studiofree-mood-mobile-v10.webp。
姿勢は施術者が立って服の上から肩周りに両手を置く。写っている施設と人物は架空。元の実案件へのリンクは維持。
## WORK motion：助任のWeb画面
- suketo-web.webp：site-awai-v2/assets/works/suketo.webp を無加工コピー。1200×750px、54,322 bytes。
- suketo-web-mobile.webp：site-awai-v2/assets/works/suketo-sp.webp を無加工コピー。520×1125px、32,640 bytes。
- 両ファイルはコピー元とのSHA-256一致を確認。既存助任作品のWeb画面で、写真の向こう側の表示に使用。
## WORK motion：KASANEのカット素材
- kasane-layer.webp：site-kasane/assets/look-03.webp を無加工コピー。900×1200px、134,240 bytes。灰色コートと襟元のレイヤーを写した元素材で、黒のトーンは構成上CSSにより調整。
- kasane-detail.webp：public/media/works/kasane.webp を無加工コピー。1300×866px、37,082 bytes。既存KASANE作品写真を、本編CSSで別の寄りの構図として使用。
- 両ファイルはコピー元とのSHA-256一致を確認。fabric-rib.webp / fabric-linen.webp は使用しない。
