const romajiMap = {'ア':'a','イ':'i','ウ':'u','エ':'e','オ':'o','カ':'ka','キ':'ki','ク':'ku','ケ':'ke','コ':'ko','サ':'sa','シ':'si','ス':'su','セ':'se','ソ':'so','タ':'ta','チ':'ti','ツ':'tu','テ':'te','ト':'to','ナ':'na','ニ':'ni','ヌ':'nu','ネ':'ne','ノ':'no','ハ':'ha','ヒ':'hi','フ':'hu','ヘ':'he','ホ':'ho','マ':'ma','ミ':'mi','ム':'mu','メ':'me','モ':'mo','ヤ':'ya','ユ':'yu','ヨ':'yo','ラ':'ra','リ':'ri','ル':'ru','レ':'re','ロ':'ro','ワ':'wa','ヲ':'wo','ン':'n','ガ':'ga','ギ':'gi','グ':'gu','ゲ':'ge','ゴ':'go','ザ':'za','ジ':'zi','ズ':'zu','ゼ':'ze','ゾ':'zo','ダ':'da','ヂ':'di','ヅ':'du','デ':'de','ド':'do','バ':'ba','ビ':'bi','ブ':'bu','ベ':'be','ボ':'bo','パ':'pa','ピ':'pi','プ':'pu','ペ':'pe','ポ':'po','キャ':'kya','キュ':'kyu','キェ':'kye','キョ':'kyo','シャ':'ša','シュ':'šu','シェ':'še','ショ':'šo','チャ':'ča','チュ':'ču','チェ':'če','チョ':'čo','ニャ':'nya','ニュ':'nyu','ニェ':'nye','ニョ':'nyo','ヒャ':'hya','ヒュ':'hyu','ヒェ':'hye','ヒョ':'hyo','ミャ':'mya','ミュ':'myu','ミェ':'mye','ミョ':'myo','リャ':'rya','リュ':'ryu','リェ':'rye','リョ':'ryo','ファ':'fa','フィ':'f','フェ':'fe','フォ':'fo','フュ':'fyu','フョ':'fyo','ギャ':'gya','ギュ':'gyu','ギェ':'gye','ギョ':'gyo','ジャ':'ja','ジュ':'ju','ジェ':'je','ジョ':'jo','ヂャ':'dya','ヂュ':'dyu','ヂェ':'dye','ヂョ':'dyo','ビャ':'bya','ビュ':'byu','ビェ':'bye','ビョ':'byo','ピャ':'pya','ピュ':'pyu','ピェ':'pye','ピョ':'pyo','スィ':'si','ティ':'ti','トゥ':'tu','ズィ':'zi','ディ':'di','ドゥ':'du','ヴァ':'va','ヴィ':'vi','ヴ':'vu','ヴェ':'ve','ヴォ':'vo','ヴャ':'vya','ヴュ':'vyu','ヴョ':'vyo','ァ':'a','ィ':'i','ゥ':'u','ェ':'e','ォ':'o','ャ':'ya','ュ':'yu','ョ':'yo','ッ':'','ー':''} as {[key: string]: string}

const exceptionChars = '0123456789'

export function katakanaToRomaji(str: string, strict = false) {
  const chars = [...str.matchAll(/[アイウエオカ-ヂツ-モヤユヨラ-ロワヲンヴ][ァィゥェォャュョ]?|[ッー0-9]/g)].map(m => m[0])
  if (strict && chars.join('') !== str.replace(/[・＝]/g,'')) { throw new Error(str + chars.join('')) }
  return chars.map(c => {
    if (exceptionChars.includes(c)) { return c }
    if (romajiMap[c] !== undefined) { return romajiMap[c] }
    return romajiMap[c[0]] + romajiMap[c[1]]
  }).join('')
}
