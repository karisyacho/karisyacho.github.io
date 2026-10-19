export const PRODUCTS = [
  {
    id:'labsence', number:'01', name:'L’Absence', category:'fragrance', categoryLabel:'Fragrance',
    image:'fragrance.webp', alt:'厚い透明ガラスに淡い香水を収め、シャンパン色の金属キャップを合わせた香水瓶',
    subtitle:'一日の終わり、静けさをまとう。', material:'Eau de parfum',
    storyTitle:'A moment,\nheld in glass.',
    story:'帰宅して、灯りをひとつ落とす。肌に残る香りが、外の時間と自分の時間の境目になる。L’Absenceは、そんなひとりの時間のために考えた香水です。',
    description:'ベルガモットの明るさから、アイリスの柔らかさへ。最後に残るシダーウッドとムスクが、肌の近くで静かに続きます。',
    quote:'A scent that stays close.',
    variants:[{id:'labsence-50',label:'50 ml',price:36300},{id:'labsence-100',label:'100 ml',price:52800}],
    notes:[['TOP','Bergamot / Violet leaf'],['HEART','Iris / White tea'],['BASE','Cedarwood / Soft musk']],
    specs:[['種類','オードパルファム'],['香りの系統','ウッディ・フローラル・ムスク'],['容器','ガラス、ブラッシュドメタル'],['内容量','50 ml / 100 ml']],
    care:'直射日光と高温を避けて保管してください。',
    materialTitle:'Light, through glass.',materialText:'厚い底に光をためる、透明なガラス。金属のキャップに触れるときの重みまで、ひとつの造形として。'
  },
  {
    id:'interval', number:'02', name:'Interval', category:'objects', categoryLabel:'Sculpture',
    image:'interval.webp', alt:'細い空隙を彫り込んだ石灰岩の彫刻が、白い台座の上で長い影を落とす',
    subtitle:'光と影のあいだに、余白を置く。',material:'Limestone sculpture',
    storyTitle:'The space\nbetween.',
    story:'窓辺に置くと、朝は細い影を、夕方は長い影を落とす。形は変わらなくても、見えるものは少しずつ変わります。Intervalは、部屋の中に時間の移ろいをつくる彫刻です。',
    description:'石灰岩の塊に、ひと筋の空隙を刻む。ざらりとした外側と、まっすぐに切り出した内側。ふたつの表情を、光がつなぎます。',
    quote:'A small place for the eye to rest.',
    variants:[{id:'interval-stone',label:'Natural limestone',price:48400}],notes:[],
    specs:[['素材','石灰岩'],['寸法','W 140 × D 60 × H 220 mm'],['重さ','約 2.1 kg'],['仕上げ','ナチュラル・マット']],
    care:'乾いた柔らかい布で拭いてください。天然石の色や小さな孔には個体差があります。',
    materialTitle:'A quiet weight.',materialText:'細かな孔と、わずかな色のゆらぎ。石がもともと持つ表情を残し、空隙の輪郭だけを研ぎ澄ませる。'
  },
  {
    id:'ligne', number:'03', name:'Ligne', category:'interiors', categoryLabel:'Lighting',
    image:'ligne.webp', alt:'誰もいない白い部屋に置かれた、細い金属のフロアライト。壁と床に柔らかな光が差す',
    subtitle:'部屋に、もうひとつの静けさを。',material:'Sculptural floor light',
    storyTitle:'A line\nof quiet.',
    story:'部屋のすべてを明るくしなくても、過ごす場所はつくれる。Ligneは、壁際に細い光を置くフロアライトです。夜の読書や、一日の終わりに。光が届く範囲に、自分の時間が生まれます。',
    description:'ブラッシュドメタルの垂直な線に、暖かな光を収めました。消灯しているときも、部屋の輪郭を整える彫刻として。',
    quote:'Light only where it is needed.',
    variants:[{id:'ligne-champagne',label:'Champagne aluminium',price:132000}],notes:[],
    specs:[['素材','アルミニウム、アクリル'],['寸法','W 200 × D 200 × H 1450 mm'],['光源','LED / 2700 K'],['電源','AC 100 V / 調光スイッチ付き']],
    care:'電源を抜き、乾いた柔らかい布で拭いてください。屋内の平らな場所に設置してください。',
    materialTitle:'A softer edge.',materialText:'金属の細い稜線と、壁へ逃がす柔らかな光。存在感を抑えながら、空間の見え方を変える。'
  }
];
export const findProduct = id => PRODUCTS.find(p=>p.id===id);
export const findVariant = id => { for(const product of PRODUCTS){const variant=product.variants.find(v=>v.id===id);if(variant)return {product,variant};}return null; };
export const yen = amount => new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY',maximumFractionDigits:0}).format(amount);
