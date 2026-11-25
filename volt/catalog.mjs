export const colors = {
  bone: { name: 'Bone / Volt', hex: '#dcd8c9' },
  carbon: { name: 'Carbon / Volt', hex: '#353638' },
  moss: { name: 'Moss / Volt', hex: '#74775b' },
};

export const angles = [
  { id: 'hero', label: '斜め' },
  { id: 'side', label: '側面' },
  { id: 'top', label: '上面' },
  { id: 'heel', label: 'かかと' },
  { id: 'sole', label: '靴底' },
];

export const sizes = ['25.0', '25.5', '26.0', '26.5', '27.0', '27.5', '28.0'];

export const products = [
  { id: 'orbit', code: 'V-01', name: 'ORBIT', use: 'Performance Runner', price: 28600, colors: ['bone', 'carbon', 'moss'], shot: 'orbit-hero', lead: '着地から蹴り出しまで。足の動きに沿ってソールがしなる、VOLT.の最初のランニングシューズ。', parts: ['編み分けたメッシュアッパー', '空洞を設けたフレームソール', '前足部とかかとに配置したラバー'] },
  { id: 'rift', code: 'V-02', name: 'RIFT', use: 'Technical Trail', price: 30800, colors: ['carbon'], shot: 'reference-rift', lead: '岩場や砂利道へ。足の横ぶれを抑えるフレームと、深い溝を刻んだアウトソール。', parts: ['つま先を覆うガード', '足の両側を支えるフレーム', '深い溝のラバーアウトソール'] },
  { id: 'nexus', code: 'V-03', name: 'NEXUS', use: 'Everyday Trainer', price: 24200, colors: ['bone'], shot: 'reference-nexus', lead: '一日歩くための一足。甲を広く包むストラップで、足の収まりを調整できる。', parts: ['甲を覆うワイドストラップ', '広い接地面', 'かかとのプルタブ'] },
  { id: 'pulse', code: 'V-04', name: 'PULSE', use: 'Trail High', price: 33000, colors: ['carbon'], shot: 'reference-pulse', lead: '不整地に踏み込む足を、足首まで覆うニットで包む。岩や砂利が入りやすい履き口を高く設計した。', parts: ['足首まで覆うニット', '補強したつま先', '立体的なラバートレッド'] },
  { id: 'flux', code: 'V-05', name: 'FLUX', use: 'Tempo Trainer', price: 27500, colors: ['bone'], shot: 'reference-flux', lead: '短いピッチで走る日の一足。前足部の反りと、後ろから見えるライム色のソールが特徴。', parts: ['反りを付けた前足部', 'ライム色のラバー', 'かかとを囲むフレーム'] },
  { id: 'origin', code: 'V-06', name: 'ORIGIN', use: 'Urban Movement', price: 26400, colors: ['carbon'], shot: 'reference-origin-shoe', lead: 'ランニングシューズの骨格を、街を歩く一足に。黒いアッパーに、ソールのライムがのぞく。', parts: ['メッシュと合成素材のアッパー', '足裏に沿うフレーム', '部分配置のラバー'] },
];

export const articles = [
  { id: 'cushioning', category: 'DESIGN', title: 'The science behind VOLT cushioning', ja: 'ソールに空洞をつくる理由', image: 'reference-cushion', date: '2026.10.21', body: [
    ['どこが沈むかを決める', '着地で力を受け止める場所と、蹴り出すときに曲がる場所は違う。ORBITの断面図では、かかとの外側と前足部の下に空洞を設け、その間をフレームでつないだ。'],
    ['形をつくって、足で確かめる', 'フレームの厚みを変えると、体重をかけたときにソールがたわむ場所も変わる。試作では断面を見比べながら、どこが先に沈み、どこまで曲がるかを確認する。'],
    ['地面に触れる部分を残す', '足裏を一枚のラバーで覆うと、その分だけ曲がり方も変わる。ORBITでは、ラバーをかかとと前足部に置き、ソール中央のフレームを露出させた。'],
  ] },
  { id: 'uneven-ground', category: 'FIELD', title: 'Movement on uneven ground', ja: '足場が変わる道を走る', image: 'reference-run', date: '2026.10.08', body: [['視線を一歩先へ', '岩や砂利が続く道では、同じ歩幅で走り続けるのが難しい。足元に合わせて歩幅が変わる様子を記録し、シューズの接地面を考える手がかりにした。'], ['横から支える', '斜面で外側に荷重が寄るとき、足とソールの間でずれが起こる。RIFTでは厚いフレームをソールの外周まで伸ばし、そのずれを抑える形を探った。']] },
  { id: 'workbench', category: 'STUDIO', title: 'Notes from the workbench', ja: '作業台から見えたこと', image: 'reference-stitch', date: '2026.09.24', body: [['縫い目の位置をずらす', '足を曲げたときに折れ目ができる場所を、型紙に書き込む。その線が縫い目に重なるなら、縫う場所を少しずらして、もう一度履いてみる。'], ['最後に手で確かめる', '左右を並べ、かかとの高さや履き口の形を確認する。指で内側をなぞると、見た目では分かりにくい段差にも気づく。']] },
  { id: 'origin-notes', category: 'FIELD', title: 'Where it started', ja: '舗装が途切れるところから', image: 'reference-origin', date: '2026.09.10', body: [['舗装と砂利の境目', 'VOLT.の出発点は、朝の道を走って舗装が途切れた瞬間にあった。足の置き方が変わる。その小さな変化を、シューズの形を考える起点にした。'], ['最初の一足', 'ORBITの初期スケッチには、足裏を囲む大きな曲線が一本あった。素材を減らせる場所を探すうちに、曲線の内側に空洞が生まれた。']] },
];

export const story = [
  ['ORIGIN', '舗装が途切れるところから。', '足元がアスファルトから砂利に変わると、歩幅も、地面を押す方向も変わる。VOLT.は、その小さな変化からシューズの設計を始めた。', 'reference-origin'],
  ['PHILOSOPHY', '足の動きから、形を決める。', 'どこが曲がり、どこに力がかかるか。足を観察してから、素材の厚みや編み方を決める。ORBITの空洞も、その順番で生まれた。', 'reference-structure'],
  ['EVOLUTION', '走って、つくり直す。', '試作を履き、平らな道と荒れた道を走る。そこで見つかった段差や硬さを、次の型紙とソールに反映させる。', 'reference-run'],
  ['BEYOND', '次の一歩は、まだ見ぬ道へ。', '足元が変われば、行ってみたい場所が一つ増える。VOLT.は、その一歩に寄り添うシューズを考える。', 'reference-motion'],
];

export const technology = [
  ['MATERIAL', '足の部位に合わせた編み方', '汗がこもりやすい甲は目を粗く、伸びを抑えたい側面は密に編む。ひと続きのアッパーの中で、編み方を切り替えている。', 'reference-knit'],
  ['SOLE STRUCTURE', '接地を支えるフレーム', '踏み込んだときに力が集中する場所をフレームでつなぎ、その間に空洞を設けた。横から見ると、どこに素材を残したかが分かる。', 'reference-structure'],
  ['CUSHIONING SYSTEM', '荷重を受けるクッション', '着地で力が集まりやすいかかとと前足部にクッションを配置。フレームの開口部から、ライム色のパーツが見える。', 'reference-cushion'],
];

export const craftsmanship = [
  ['MATERIAL', '曲げたときの表情を見る', 'アッパーの生地は、引っ張ったときの伸びと、折り曲げたときの戻り方を手で確かめる。', 'reference-material'],
  ['PATTERN', '立体を型紙に起こす', '木型に沿わせた線を平面に移し、縫い代を書き込む。甲が曲がるところには、縫い目が重ならないようにする。', 'reference-pattern'],
  ['STITCHING', '強さが要るところだけ縫う', 'ひもを締める部分とかかとを縫い合わせる。内側を指でなぞり、足に当たる段差がないかを見る。', 'reference-stitch'],
  ['MOLDING', '木型の上で形を整える', '縫い上がったアッパーを木型にかぶせ、左右の張り方をそろえてからソールと合わせる。', 'reference-mold'],
  ['FINISHING', '左右を並べて見る', '接着面、縫い目、かかとの高さを確かめる。最後にひもを通し、左右の形を見比べる。', 'reference-finish'],
];
