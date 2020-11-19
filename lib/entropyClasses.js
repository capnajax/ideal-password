/* eslint-disable indent */
'use strict';

// Please note that this is NOT intended to and never will be a definitive
// or even an accurate reference on unicode character blocks. It is purpose
// built for the entropy calculator

let entropyClasses = [
  { score: Math.log(2), name: 'white-space',
    characters: ' \f\n\r\t\v\u00a0\u1680\u2000\u2001\u2002\u2003\u2004' +
                '\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f' +
                '\u205f\u3000\ufeff' },
  { score: Math.log(10), name: 'number', range: [ 0x30, 0x39 ]},
  { score: Math.log(26), name: 'latin-small', range: [ 0x61, 0x7a ]},
  { score: Math.log(26), name: 'latin-capital', range: [ 0x41, 0x5a ]},
  // rated "10" because most languages only a small number of accented characters.
  // includes letters from Latin1 Supplement, Latins Extended A to E, IPA extensions,
  // and Latin Extended Additional
  { score: Math.log(10), name: 'latin-extended', 
    range: [ 0xc0, 0xd6, 0xd8, 0xf6, 0xf8, 0x02af, 0x1e00, 0x1eff,
             0x2c60, 0x2c7f, 0xa720, 0xa7ff, 0xab30, 0xab6f ]},
  { score: Math.log(12), name: 'special', 
    range: [ 0x21, 0x2f, 0x3a, 0x3f, 0x5b, 0x60 ]},
  { score: Math.log(33), name: 'cyrillic-capital', range: [ 0x410, 0x42f ]},
  { score: Math.log(33), name: 'cyrillic-small', range: [ 0x430, 0x44f ]},
  // includes letters from Cyrillic Supplements, Cyrillic Extended A, B, and C, 
  // and Cyrillic letters not included in upper-cyrillic or lower-cyrillic
  { score: Math.log(10), name: 'cyrillic-extended',
    range: [ 0x400, 0x40f, 0x450, 0x52f, 0x2de0, 0x2dff, 0xa640, 0xa69f,
             0x1c80, 0x1c8f ]},
  { score: Math.log(24), name: 'greek-capital', range: [ 0x391, 0x3a9 ]},
  { score: Math.log(24), name: 'greek-small', range: [ 0x3b1, 0x3c9 ]},
  // includes a few unassigned code points so we only have to test one range
  // instead of 16
  { score: Math.log(10), name: 'greek-extended', range: [0x1f00, 0x1fff ]},
  { score: Math.log(28), name: 'arabic', range: [0x0600, 0x06ff]},
  { score: Math.log(10), name: 'arabic-extended', range: [0x08a0, 0x08ff]},
  { score: Math.log(36), name: 'devangari', range: [0x0900, 0x097f]},
  { score: Math.log(36), name: 'bengali', range: [0x0980, 0x09ff]},
  { score: Math.log(36), name: 'tamil', range: [0x0b80, 0x0bff]},
  { score: Math.log(36), name: 'telagu', range: [0x0c00, 0x0c7f]},
  { score: Math.log(36), name: 'kannada', range: [0x0c80, 0x0cff]},
  { score: Math.log(28), name: 'malayalam', range: [0x0d00, 0x0d7f]},
  { score: Math.log(28), name: 'thai', range: [0x0e00, 0x0e7f]},
  { score: Math.log(40), name: 'hiragana', range: [ 0x3041, 0x3096 ]},
  { score: Math.log(40), name: 'katakana', range: [ 0x30A0, 0x30fa ]},
  { score: Math.log(40), name: 'bopomofo',
    range: [ 0x3105, 0x312c, 0x31a0, 0x31b7 ]},
  { score: Math.log(500), name: 'hangul',
  range: [ 0x1100, 0x11ff, 0x3130, 0x318f, 0xa960, 0xa97F,
           0xac00, 0xd7af, 0xd7B0,0xd7FF ]},
  { score: Math.log(100), name: 'common-hanzi', 
    characters:   // 100 most common Chinese words, Simplified and Traditional
      '的一是不了人我在有他这为之大来以个中上们到说国和地也子时道出而要于就下得可你年生' +
      '的一是不了人我在有他這為之大來以個中上們到說國和地也子時道出而要於就下得可你年生' +
      '自会那后能对着事其里所去行过家十用发天如然作方成者多日都三小军二无同么经法当起与' +
      '自會那後能對著事其里所去行過家十用發天如然作方成者多日都三小軍二無同麼經法當起與' +
      '好看学进种将还分此心前面又定见只主没公从' +
      '好看學進種將還分此心前面又定見只主沒公從' +
      // added passwordy words
      '爱你四死秘' +
      '愛妳四死秘',
    override: 'hanzi'
  },
  { score: Math.log(1000), name: 'hanzi', range: [0x4e00, 0x9fbf]}
];

module.exports = entropyClasses;