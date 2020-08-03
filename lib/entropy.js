'use strict';

const emojiRegex = require('emoji-regex');

// maps codes to characters (easier to handle emoji this way)
let codeToChar = {};

// most common 100 Chinese words in both Traditional and Simplified
const COMMON_HANZI = letterSet( 
  "的一是不了人我在有他这为之大来以个中上们到说国和地也子时道出而要于就下得可你年生自会那后能对着事其里" +
  "的一是不了人我在有他這為之大來以個中上們到說國和地也子時道出而要於就下得可你年生自會那後能對著事其里" +
  "所去行过家十用发天如然作方成者多日都三小军二无同么经法当起与好看学进种将还分此心前面又定见只主没公从" +
  "所去行過家十用發天如然作方成者多日都三小軍二無同麼經法當起與好看學進種將還分此心前面又定見只主沒公從");

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
    return codeToChar[c] && codeToChar[c].isEmoji;
  }},
  { score: Math.log(10), desc: "number", range: [0x30, 0x39]},
  { score: Math.log(26), desc: "lowerRoman", range: [0x61,0x7a]},
  { score: Math.log(26), desc: "upperRoman", range: [0x41,0x5a]},
  { score: Math.log(12), desc: "special", range: [0x21, 0x2f, 0x3a, 0x3f]},
  { score: Math.log(33), desc: "lowerCyrillic", range: [0x410,0x42f]},
  { score: Math.log(33), desc: "upperCyrillic", range: [0x430,0x44f]},
  { score: Math.log(24), desc: "lowerGreek", range: [0x391,0x3a9]},
  { score: Math.log(24), desc: "upperGreek", range: [0x3b1,0x3c9]},
  { score: Math.log(40), desc: "hiragana", range: [0x3041,0x3096]},
  { score: Math.log(40), desc: "katakana", range: [0x30A0,0x30fa]},
  { score: Math.log(40), desc: "bopomofo", range: [0x31A0,0x31ba]},
  { score: Math.log(100), desc: "commonhanzi", test: (c) => {
      return COMMON_HANZI.has(c);
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

function letterSet(str) {
  var seen = new Set(),
    i = 0;
  while(i < str.length) {
    let c = str.charCodeAt(i);
    let emoji = emojiRegex().exec(str.substring(i));
    let charOfC = str.charAt(i);
    let isEmoji = false;
    if (c >= 0xDC00 && c <= 0xDFFF) {
      // skip unicode low surrogates
      i++;
      continue;
    }
    if (emoji && emoji.index === 0) {
      let codePoints = [...emoji[0]].length;
      charOfC = emoji[0];
      c = simpleHash(str.substring(i, i+codePoints));      
      isEmoji = true;
      i += codePoints;
    } else {
      i++;
    }
    if (!seen.has(c)) {
      seen.add(c);
      codeToChar[c] = {char: charOfC, isEmoji};
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
  var entropyClassnamesFound = new Set(),
    uniquePasswordLetters = letterSet(_password),
    cancelations = new Set(), // in case one set cancels the entropy of another set
    result = {
        classes: [], 
        classNames: [],
        length: uniquePasswordLetters.size, 
        entropy: 0,
        max_entropy_scale: ENTROPY_SCALE_MAX
      },
    i,
    foundClass = function(ecj) {
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