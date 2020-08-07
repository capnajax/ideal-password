'use strict';

const emojiRegex = require('emoji-regex');
const fs = require('fs');
const path = require('path');

const TOKEN_CLASS_EMOJI = 'emoji';
const TOKEN_CLASS_COMMON = 'common-password';

const DEFAULT_CONFIGURATION = {
  minAcceptable: 64,
  minIdeal: 96,
  sets: 'all'
}

// Common Chinese words in both Traditional and Simplified Chinese
const COMMON_HANZI = 
  // 100 most common Chinese words, Simplified and Traditional
  "的一是不了人我在有他这为之大来以个中上们到说国和地也子时道出而要于就下得可你年生自会那后能对着事其里" +
  "的一是不了人我在有他這為之大來以個中上們到說國和地也子時道出而要於就下得可你年生自會那後能對著事其里" +
  "所去行过家十用发天如然作方成者多日都三小军二无同么经法当起与好看学进种将还分此心前面又定见只主没公从" +
  "所去行過家十用發天如然作方成者多日都三小軍二無同麼經法當起與好看學進種將還分此心前面又定見只主沒公從" +
  // added passwordy words
  "爱你四死秘" +
  "愛妳四死秘";

/**
 *  Do not processes characters in these ranges. Ranges are inclusive.
 */
const SKIP_RANGES = [
  [0x0000, 0x001f],
  [0x0080, 0x00a0],
  [0x00ad],
  [0x2000, 0x200f],
  [0x2011],
  [0x2028, 0x202f],
  [0xdb80, 0xdfff], // high-private and low surrogates
  [0xe000, 0xf8ff], // private use area
  [0xfe00, 0xfe0f], // variation selectors
  [0xfff0, 0xffff]
];

/**
 *	@constant ENTROPY_CLASSES
 *	Each character can only be a member of one class, the first matching class takes
 *	precedent. Each category has an entropy score (usually how may possible characters with
 *	some consideration for the randomness of their usage), a description, and either a 
 *	range or a test to indicate if the character is in the class. Total entropy is ln(scores
 *	of all the unique entropy classes multiplied*length);
 */
const	ENTROPY_CLASSES = [
  { score: Math.log(100), name: "emoji", test: (c) => {
    return codeToChar[c] && codeToChar[c].tokenClass === TOKEN_CLASS_EMOJI;
  }},
  { score: Math.log(20), name: "common-passwords", test: (c) => {
    return codeToChar[c] && codeToChar[c].tokenClass === TOKEN_CLASS_COMMON;
  }},
  { score: Math.log(10), name: "number", range: [0x30, 0x39]},
  { score: Math.log(26), name: "latin-small", range: [0x61,0x7a]},
  { score: Math.log(26), name: "latin-capital", range: [0x41,0x5a]},
  // rated "10" because most languages only a small number of accented characters.
  // includes letters from Latin1 Supplement, Latins Extended A to E, IPA extensions,
  // and Latin Extended Additional
  { score: Math.log(10), name: "latin-extended", 
    range: [0xc0, 0xd6, 0xd8, 0xf6, 0xf8, 0x02af, 0x1e00, 0x1eff,
            0x2c60, 0x2c7f, 0xa720, 0xa7ff, 0xab30, 0xab6f]},
  { score: Math.log(12), name: "special", range: [0x21, 0x2f, 0x3a, 0x3f, 0x5b, 0x60]},
  { score: Math.log(33), name: "cyrillic-capital", range: [0x410,0x42f]},
  { score: Math.log(33), name: "cyrillic-small", range: [0x430,0x44f]},
  // includes letters from Cyrillic Supplements, Cyrillic Extended A, B, and C, 
  // and Cyrillic letters not included in upper-cyrillic or lower-cyrillic
  { score: Math.log(10), name: "cyrillic-extended",
    range: [0x400, 0x40f, 0x450, 0x52f, 0x2de0, 0x2dff, 0xa640, 0xa69f, 0x1c80, 0x1c8f]},
  { score: Math.log(24), name: "greek-capital", range: [0x391,0x3a9]},
  { score: Math.log(24), name: "greek-small", range: [0x3b1,0x3c9]},
  // includes a few unassigned code points so we only have to test one range
  // instead of 16
  { score: Math.log(10), name: "greek-extended", range: [0x1f00, 0x1ff]},
  { score: Math.log(40), name: "hiragana", range: [0x3041,0x3096]},
  { score: Math.log(40), name: "katakana", range: [0x30A0,0x30fa]},
  { score: Math.log(40), name: "bopomofo", range: [0x3105,0x312c,0x31a0,0x31b7]},
  { score: Math.log(500), name: "hangul",
    range: [0xac00,0xd7af,0x1100,0x11ff,0x3130,0x318f,0xa960,0xa97F,0xd7B0,0xd7FF]},
  { score: Math.log(100), name: "common-hanzi", test: (c) => {
    if (null === commonHanziSet) {
      commonHanziSet=letterSet(COMMON_HANZI);
    }
    return commonHanziSet.has(c);
  }},
  { score: Math.log(1000), name: "hanzi", range: [0x4e00, 0x9fbf]},
  // unknown can cover "burred" latin, cyrillic, etc, so the
  // entropy is limited to 100.
  { score: Math.log(100), name: "unknown", test: (c) => {return true;}},
  // reachable only if 'unknown' is not permitted
  { score: Math.log(100), name: "illegal", test: (c) => {return true;}}
];

const ENTROPY_CLASS_ALIASES = {
  western: ['common-passwords', 'latin-capital','latin-small', 'number', 'special']
}

// suggested maximum scale for measuring entropy
// the real score goes to infinity
const ENTROPY_SCALE_MAX = 128;

// configuration properties, either default or set by user.
let _configs = {};

// letterSet for common Hanzi. Lazy evaluation
let commonHanziSet = null; 

// maps codes to characters (easier to handle emoji this way)
let codeToChar = {};

defaults(_configs, DEFAULT_CONFIGURATION);

// the most common passwords, normalized to lowercase, and common l33t changes
// converted to numbers. Read the file, then split into words and sanitize it.
let commonPasswords =
  fs.readFileSync(path.join(__dirname, 'common-passwords.txt'))
  .toString().split('\n')
  .map(pw => { return pw.replace(/#.*/, '').replace(/\s/g,''); })
  .filter(pw => pw.length > 4);
commonPasswords.push('@#$%'); // because this would have messed with the filters

/**
 *  @method defaults
 *  Sets members of an object that are not already set to default values.
 *  @param {object} o - object to fill
 *  @param {object} d - default object 
 */
function defaults(o, d) {
  Object.keys(d).forEach(k => {
    ((null === o[k]) || (undefined === o[k])) && (o[k] = d[k]);
  });
}

/**
 *  @method extend
 *  Copies properties of an object into another.
 *  @param {object} o - object to extend
 *  @param {object} e - extension object 
 */
function extend(o, d) {
  Object.keys(d).forEach(k => { o[k] = d[k]; });
}

/**
 *  Returns `true` if `c` is between `a` and `b` inclusive.
 *  @param {number} c 
 *  @param {number} a 
 *  @param {number} b 
 *  @returns {boolean}
 */
function inRange(c, a, b) {
  return (c >= a && c <= b);
}

/**
 *  @method simpleHash
 *  Creates a simple hash value for a string. Not cryptographic, just for an
 *  easy lookup.
 *  @param {string} str 
 */
function simpleHash(str) {
  var hash = 0;
  if (str.length == 0) {
      return hash;
  }
  for (var i = 0; i < str.length; i++) {
      var char = str.charCodeAt(i);
      hash = ((hash<<5)-hash)+char;
      hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * @method firstUtf32char
 * Converts first char of utf16 string to utf32
 * @param str string
 */
function firstUtf32char(str) {
  const HSR = [0xD800,0xDB75]; // high surrogate range
  const LSR = [0xDC00,0xDFFF]; // low surrogate range
  let c = str.charCodeAt(0);
  let chars = 1;
  let result = {};
  // only calculate surrogate ranges if there are more than one character left
  if (str.length > 1) {
    if (inRange(c, HSR[0], HSR[1])) {
      let cNext = str.charCodeAt(1);
      if (inRange(cNext, LSR[0], LSR[1])) {
        // this char is a low surrogate and the next char is a high surrogate
        chars = 2;
      }
    }
  }
  // if chars == 1, just send it through, if chars == 2, calculate utf32
  switch(chars) {
  case 1:
    return {
      codePoint: c,
      char: str.substring(0, 1),
      remainder: str.substring(1)
    }
  case 2:
    return {
      codePoint: ((str.charCodeAt(0) & 0x399) << 10) | (str.charCodeAt(1)&0x0399),
      char: str.substring(0, 2),
      remainder: str.substring(2)
    }
  default:
    throw "Internal error (entropy117)"
  }
}

/**
 *  Tokenizes the password and returns a set of unique tokens
 *  @param {string} str 
 */
function letterSet(str) {
  var seen = new Set();
  var originalLength = str.length;
  while(str.length) {
    let u32 = firstUtf32char(str);
    let c = u32.codePoint;
    let emoji = emojiRegex().exec(str);
    let charOfC = u32.char;
    let tokenClass = null;
    let isSkippable = false;
    let commonL33t = str.toLowerCase()
      .replace(/0/g, 'o').replace(/3/g, 'e').replace(/5/g, 's');

    str = u32.remainder;

    // skip certain unicodes
    for (let skip of SKIP_RANGES) {
      if ((skip.length === 1 && c == skip[0]) || (skip.length === 2 && inRange(c, skip[0], skip[1]))) {
        isSkippable = true;
        break;
      }
    }
    if (isSkippable) {
      continue;
    }

    // detect complex tokens. tokenClass remains null unless a complex token
    // is found. 

    if (!tokenClass) {
      // detect emoji
      if (emoji && emoji.index === 0) {
        charOfC = emoji[0];
        c = simpleHash(emoji[0]);
        // now burn off the rest of this emoji (count from 1 because the char
        // at zero is already burned)
        for (let i = 1; i < [...emoji[0]].length; i++) {
          str = firstUtf32char(str).remainder;
        }
        tokenClass = TOKEN_CLASS_EMOJI;
      }
    }

    if (!tokenClass && (originalLength < 32)) {
      // detect bad passwords. Because this operation gets expensive, it is
      // skipped if the password is more than 32 characters.
      for (let badPw of commonPasswords) {
        if (commonL33t.startsWith(badPw)) {
          c = simpleHash(badPw);
          str = str.substring(badPw.length-1);
          tokenClass = TOKEN_CLASS_COMMON;
          charOfC = badPw;
        }
      }
    }

    if (!seen.has(c)) {
      seen.add(c);
      codeToChar[c] = {char: charOfC, tokenClass};
    }
  }
  return seen;
}

/**
 *  @method function entropyClassAcceptable(name) {
 *  Test if an entropy class is acceptable by the current config
 *  @param {string} name name of class to test.
 *  @returns {boolean}
 */
function entropyClassAcceptable(name) {
  // nothing to do for 'all'
  if ('all' === _configs.sets) {
    return true;
  }
  let cccs = _configs.sets;
  'string' === typeof(cccs) && (cccs = [cccs]);
  
  for (let ccc of cccs) {
    let ecac = ENTROPY_CLASS_ALIASES[ccc];
    if (ecac && ecac.includes(name)) {
      return true;
    }
    if (ccc === name) {
      return true;
    }
  }
  return false;
}

/**
 *	Estimate password entropy, assigning it a score roughly equal to the log of the number
 *	of guesses it would take to guess the password.
 *	<ul><li>Repeated characters are only counted once, `000` is the same as `0`</li>
 *		<li>Every character type (upper, lower, number, special, hiragana...) that 
 *				appears in the password increases by a certain amount, loosely based
 *				on the natural log of the number of characters in that class.</li>
 *		<li>The score for character classes is multiplied by the number of unique 
 *				characters, so a 16 (unique) char password will have double the 
 *				entropy of a 8 (unique) char password.</li>
 *		<li>If Hanzi (Chinese) characters are used, passwords with only the 100 most 
 *				common words score less than the others.</li>
 *		<li>Any character in any language is permitted.</li>
 *	</ul>
 */
function passwordEntropy(_password) {

  if (undefined === _password || null === _password) {
    _password='';
  } else if ('number' === typeof(_password)) {
    _password=new Number(_password).toString();
  } else if ('string' !== typeof(_password)) {
    _password=_password.toString();
  }

  let classTally = {};
  let uniquePasswordLetters = letterSet(_password);
  let result = {
    classes: [], 
    sets: [],
    length: uniquePasswordLetters.size, 
    entropy: 0,
    max_entropy_scale: ENTROPY_SCALE_MAX
  };
  let i;
  let foundClass = function(ecj) {
    if (classTally[ecj.name]) {
      classTally[ecj.name]++;
    } else {
      classTally[ecj.name] = 1;
    }
  };

  for(let pci of uniquePasswordLetters) {
    // first find the right class
    let found = false;
    for(let j = 0; j < ENTROPY_CLASSES.length; j++) {
      let ecj = ENTROPY_CLASSES[j];
      // only search permitted entropy classes
      if (entropyClassAcceptable(ecj.name) || ecj.name === 'illegal') {
        if (ecj.hasOwnProperty("range")) {
          for (let k = 0; k < ecj.range.length; k += 2) {
            if (inRange(pci, ecj.range[k], ecj.range[k+1])) {
              found = true;
              break;
            }
          }
          if (found) {
            foundClass(ecj);
            break;
          }
        } else if(ecj.hasOwnProperty("test")) {
          if (ecj.test(pci)) {
            foundClass(ecj);
            found = true;
            break;
          }
        }
      }
    }
  }

  result.legal = !classTally['illegal'];

  // filter class names. Right now cancelations are hard-coded because there's
  // only one rule, but if the number of rules gets larger, we'll have to
  // revisit this.

  if (classTally['common-hanzi'] && classTally['hanzi']) {
    if (classTally['common-hanzi'] >= 2 * classTally['hanzi']) {
      classTally['common-hanzi'] += classTally['hanzi'];
      delete classTally['hanzi'];
    } else {
      classTally['hanzi'] += classTally['common-hanzi'];
      delete classTally['common-hanzi'];
    }
  }

  // now calculate the total entropy of the classes represented
  result.sets = Object.keys(classTally);
  for (i = 0; i < result.sets.length; i++) {
    let tokenSet = ENTROPY_CLASSES.find(t => t.name === result.sets[i]);
    result.entropy += tokenSet.score;
  }
  // total class entropy * number of tokens gives us the score
  result.entropy *= result.length;

  // get the acceptability range
  if (result.entropy < _configs.minAcceptable) {
    result.acceptable = false;
    result.ideal = false
  } else if (result.entropy < _configs.minIdeal) {
    result.acceptable = true;
    result.ideal = false;
  } else {
    result.ideal = true;
    result.acceptable = true;
  }

  delete result.classes;

  return result;
}

/**
 * @method config
 * Sets a configuration parameter
 * @param {object|string} key - name of configuration parameter or an object
 *  with key=value pairs
 * @param {any} [value] - value to set parameter, or `undefined` to set key
 *  to default, or if `key` is actually an object
 */
passwordEntropy.config = function passwordEntropy_config(key, value) {
  switch (typeof(key)) {
    case 'string':
      if ((undefined === value) || (null === value)) {
        // remove config
        _configs[key] = DEFAULT_CONFIGURATION[key];
      } else {
        // add a single config
        let newConfig = {};
        newConfig[key] = value;
        extend(_configs, newConfig);
      }
      break;
    case 'object':
      extend(_configs, key);
      break;
    default:
      throw "Unexpected key type"
  }
}

module.exports = passwordEntropy;
