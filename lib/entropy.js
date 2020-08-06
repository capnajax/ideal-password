'use strict';

const emojiRegex = require('emoji-regex');
const fs = require('fs');
const path = require('path');

const TOKEN_CLASS_EMOJI = 'emoji';
const TOKEN_CLASS_COMMON = 'common-password';

// maps codes to characters (easier to handle emoji this way)
let codeToChar = {};

// most common 100 Chinese words in both Traditional and Simplified
const COMMON_HANZI = 
  "的一是不了人我在有他这为之大来以个中上们到说国和地也子时道出而要于就下得可你年生自会那后能对着事其里" +
  "的一是不了人我在有他這為之大來以個中上們到說國和地也子時道出而要於就下得可你年生自會那後能對著事其里" +
  "所去行过家十用发天如然作方成者多日都三小军二无同么经法当起与好看学进种将还分此心前面又定见只主没公从" +
  "所去行過家十用發天如然作方成者多日都三小軍二無同麼經法當起與好看學進種將還分此心前面又定見只主沒公從";
let commonHanziSet = null; // lazy evaluation

// the most common passwords, normalized to lowercase, and common l33t changes
// converted to numbers. Read the file, then split into words and sanitize it.
let commonPasswords =
  fs.readFileSync(path.join(__dirname, 'common-passwords.txt'))
  .toString().split('\n')
  .map(pw => { return pw.replace(/#.*/, '').replace(/\s/g,''); })
  .filter(pw => pw.length > 4);
commonPasswords.push('@#$%'); // because this would have messed with the filters

/**
 *  Do not processes characters in these ranges. Ranges are inclusive.
 */
const skipRanges = [
  [0x0000, 0x001f],
  [0x0080, 0x00a0],
  [0x00ad],
  [0x2000, 0x200f],
  [0x2011],
  [0x2028, 0x202f],
  [0xdb80, 0xdfff], // high-private and low surrogates
  [0xe000, 0xf8ff], // private use area
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
  { score: Math.log(100), desc: "emoji", test: (c) => {
    return codeToChar[c] && codeToChar[c].tokenClass === TOKEN_CLASS_EMOJI;
  }},
  { score: Math.log(20), desc: "common-passwords", test: (c) => {
    return codeToChar[c] && codeToChar[c].tokenClass === TOKEN_CLASS_COMMON;
  }},
  { score: Math.log(10), desc: "number", range: [0x30, 0x39]},
  { score: Math.log(26), desc: "lower-roman", range: [0x61,0x7a]},
  { score: Math.log(26), desc: "upper-roman", range: [0x41,0x5a]},
  { score: Math.log(12), desc: "special", range: [0x21, 0x2f, 0x3a, 0x3f]},
  { score: Math.log(33), desc: "upper-cyrillic", range: [0x410,0x42f]},
  { score: Math.log(33), desc: "lower-cyrillic", range: [0x430,0x44f]},
  { score: Math.log(24), desc: "lower-greek", range: [0x391,0x3a9]},
  { score: Math.log(24), desc: "upper-greek", range: [0x3b1,0x3c9]},
  { score: Math.log(40), desc: "hiragana", range: [0x3041,0x3096]},
  { score: Math.log(40), desc: "katakana", range: [0x30A0,0x30fa]},
  { score: Math.log(40), desc: "bopomofo", range: [0x31A0,0x31ba]},
  { score: Math.log(100), desc: "common-hanzi", test: (c) => {
    if (null === commonHanziSet) {
      commonHanziSet=letterSet(COMMON_HANZI);
    }
    return commonHanziSet.has(c);
  }},
  { score: Math.log(1000), desc: "hanzi", range: [0x4e00, 0x9fbf], cancel: ["commonhanzi"]},
  // unknown can cover "burred" latin, cyrillic, etc, so the
  // entropy is limited to 100.
  { score: Math.log(100), desc: "unknown", test: (c) => {return true;}}
];

const ENTROPY_RANGES = [
  { max: 64, acceptable: false, ideal: false},
  { max: 96, acceptable: true, ideal: false},
  { max: Infinity, acceptable: true, ideal: true}
];

// suggested maximum scale for measuring entropy
// the real score goes to infinity
const ENTROPY_SCALE_MAX = 128;

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
    if (c >= HSR[0] && c <= HSR[1]) {
      let cNext = str.charCodeAt(1);
      if (cNext >= LSR[0] && cNext <= LSR[1]) {
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
    for (let skip of skipRanges) {
      if ((skip.length === 1 && c == skip[0]) || (skip.length === 2 && c >= skip[0] && c <= skip[1])) {
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

function inRange(c, a, b) {
  return (c >= a && c <= b);
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

  let entropyClassnamesFound = new Set();
  let uniquePasswordLetters = letterSet(_password);
  let cancelations = new Set(); // in case one set cancels the entropy of another set
  let result = {
    classes: [], 
    classNames: [],
    length: uniquePasswordLetters.size, 
    entropy: 0,
    max_entropy_scale: ENTROPY_SCALE_MAX
  };
  let i;
  let foundClass = function(ecj) {
    if (!entropyClassnamesFound.has(ecj.desc)) {
      entropyClassnamesFound.add(ecj.desc);
      result.classes.push(ecj);
    }
  };

  for(let pci of uniquePasswordLetters) {
    // first find the right class
    for(let j = 0; j < ENTROPY_CLASSES.length; j++) {
      let ecj = ENTROPY_CLASSES[j],
        found = false;
        if (ecj.hasOwnProperty("range")) {
        for (let k = 0; k < ecj.range.length; k += 2) {
          if (inRange(pci, ecj.range[k], ecj.range[k+1])) {
            foundClass(ecj);
            found = true;
            break;
          }
        }
        if (found) {
          break;
        }
      } else if(ecj.hasOwnProperty("test")) {
        if (ecj.test(pci)) {
          foundClass(ecj);
          break;
        }
      }
    }
  }

  // TODO filter out "cancel"s so hanzi scores cancel commonhanzi scores.

  for (let i = 0; i < result.classes.length; i++) {
    if (result.classes[i].hasOwnProperty('cancel')) {
      for (let j = 0; j < result.classes[i].cancel.length; j++ ) {
        cancelations.add(result.classes[i].cancel[j]);
      }
    }
  }

  for (i = 0; i < result.classes.length; i++) {
    if (cancelations.has(result.classes[i].desc)) {
      continue;
    }
    result.entropy += result.classes[i].score;
    result.classNames.push(result.classes[i].desc)
  }
  result.entropy *= result.length;

  // get the acceptability range
  i = ENTROPY_RANGES.length;
  while(i--) {
    if (result.entropy < ENTROPY_RANGES[i].max) {
      result.acceptable = ENTROPY_RANGES[i].acceptable;
      result.ideal = ENTROPY_RANGES[i].ideal;
    } else {
      break;
    }
  }

  delete result.classes;

  return result;
}
module.exports = passwordEntropy;