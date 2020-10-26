'use strict';

// Please note that this is NOT intended to and never will be a definitive
// or even an accurate reference on unicode character blocks. It is purpose
// built for the entropy calculator

const HSR = [ 0xD800, 0xDB75 ]; // high surrogate range
const LSR = [ 0xDC00, 0xDFFF ]; // low surrogate range

const LAST_UNICODE = 0x10FFFF;

let debug = false;

let entropyClasses = [
  { score: Math.log(2), name: "white-space",
    characters: " \f\n\r\t\v\u00a0\u1680\u2000\u2001\u2002\u2003\u2004" +
                "\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f" +
                "\u205f\u3000\ufeff" },
  { score: Math.log(10), name: "number", range: [ 0x30, 0x39 ]},
  { score: Math.log(26), name: "latin-small", range: [ 0x61, 0x7a ]},
  { score: Math.log(26), name: "latin-capital", range: [ 0x41, 0x5a ]},
  // rated "10" because most languages only a small number of accented characters.
  // includes letters from Latin1 Supplement, Latins Extended A to E, IPA extensions,
  // and Latin Extended Additional
  { score: Math.log(10), name: "latin-extended", 
    range: [ 0xc0, 0xd6, 0xd8, 0xf6, 0xf8, 0x02af, 0x1e00, 0x1eff,
             0x2c60, 0x2c7f, 0xa720, 0xa7ff, 0xab30, 0xab6f ]},
  { score: Math.log(12), name: "special", 
    range: [ 0x21, 0x2f, 0x3a, 0x3f, 0x5b, 0x60 ]},
  { score: Math.log(33), name: "cyrillic-capital", range: [ 0x410, 0x42f ]},
  { score: Math.log(33), name: "cyrillic-small", range: [ 0x430, 0x44f ]},
  // includes letters from Cyrillic Supplements, Cyrillic Extended A, B, and C, 
  // and Cyrillic letters not included in upper-cyrillic or lower-cyrillic
  { score: Math.log(10), name: "cyrillic-extended",
    range: [ 0x400, 0x40f, 0x450, 0x52f, 0x2de0, 0x2dff, 0xa640, 0xa69f,
             0x1c80, 0x1c8f ]},
  { score: Math.log(24), name: "greek-capital", range: [ 0x391, 0x3a9 ]},
  { score: Math.log(24), name: "greek-small", range: [ 0x3b1, 0x3c9 ]},
  // includes a few unassigned code points so we only have to test one range
  // instead of 16
  { score: Math.log(10), name: "greek-extended", range: [0x1f00, 0x1fff ]},
  { score: Math.log(40), name: "hiragana", range: [ 0x3041, 0x3096 ]},
  { score: Math.log(40), name: "katakana", range: [ 0x30A0, 0x30fa ]},
  { score: Math.log(40), name: "bopomofo",
    range: [ 0x3105, 0x312c, 0x31a0, 0x31b7 ]},
  { score: Math.log(500), name: "hangul",
  range: [ 0x1100, 0x11ff, 0x3130, 0x318f, 0xa960, 0xa97F,
             0xac00, 0xd7af, 0xd7B0,0xd7FF ]},
  { score: Math.log(100), name: "common-hanzi", 
    characters:   // 100 most common Chinese words, Simplified and Traditional
      "的一是不了人我在有他这为之大来以个中上们到说国和地也子时道出而要于就下得可你年生" +
      "的一是不了人我在有他這為之大來以個中上們到說國和地也子時道出而要於就下得可你年生" +
      "自会那后能对着事其里所去行过家十用发天如然作方成者多日都三小军二无同么经法当起与" +
      "自會那後能對著事其里所去行過家十用發天如然作方成者多日都三小軍二無同麼經法當起與" +
      "好看学进种将还分此心前面又定见只主没公从" +
      "好看學進種將還分此心前面又定見只主沒公從" +
      // added passwordy words
      "爱你四死秘" +
      "愛妳四死秘",
    override: "hanzi"
  },
  { score: Math.log(1000), name: "hanzi", range: [0x4e00, 0x9fbf]}
]

let ranges = [];
let overrides = {};

function assert(test, ...message) {
  if (!test) {
    console.log('assert failed');
    console.log(...message);
  }
}

/**
 *  Returns `true` if `c` is between `a` and `b` inclusive.
 *  @param {number} c 
 *  @param {number|Array} a - if the second parameter is an array, assume
 *    two-element and we're testing `c` is between `a[0]` and `a[1]`
 *  @param {number} [b] - required if the second parameter is not an array
 *  @returns {boolean}
 */
function inRange(c, a, b) {
  if (typeof a === 'number') {
    return (c >= a && c <= b);
  } else {
    return (c >= a[0] && c <= a[1]);
  }
}

/**
 *  @method stringsToRanges
 *  Convert strings to ranges in the entropyClasses
 */
function charactersToRanges() {
  entropyClasses.forEach(eClass => {
    if (eClass.hasOwnProperty('characters')) {
      let codePoints = [];
      let str = eClass.characters;
      let strLen = str.length;
      for (let i = 0; i < strLen; i++) {
        let cp = str.codePointAt(i);
        // detect low surrogates and ignore them, because, if the string is
        // valid, would have been part of the previous code point.
        let cc = str.charCodeAt(i);
        if (inRange(cc, LSR)) {
          // this eliminates low surrogates
          continue;
        }
        codePoints.push(cp);
      }

      codePoints.sort();
      for (let i = 0; i < codePoints.length - 1;) {
        debug && console.log(i, codePoints[i], codePoints[i+1], codePoints.length);
        if (codePoints[i] === codePoints[i+1]) {
          codePoints.splice(i, 1);
        } else {
          i++;
        }
      }

      debug && console.log('codePoints:', codePoints);

      // convert to ranges


      // TODO )))) fix this section -- it's getting it all wrong

      let ranges = [];
      for (let i of codePoints) {
        ranges.push(i); ranges.push(i);
      }
      for (let i = 0; i + 2 < ranges.length; ) {
        debug && console.log(i, ranges[i+1], ranges[i+2], ranges.length);
        if (ranges[i+1] + 1 === ranges[i+2]) {
          ranges.splice(i+1, 2);
        } else {
          i+=2;
        }
      }

      eClass.range = ranges;
    }
  });

  debug && console.log(
      'charachtersToRanges:\n',
      JSON.stringify(entropyClasses, null, 3));
}

/**
 *  @method buildRanges
 *  Set up character ranges based on data above
 */
function buildRanges() {
  // organize ranges into array
  entropyClasses.forEach((eClass) => {
    assert((eClass.range.length % 2 === 0), "Range array for",
        eClass.name, "length must be even.");
    for (let i = 0; i < eClass.range.length; i += 2) {
      let newRange = {
        start: eClass.range[i],
        end: eClass.range[i+1],
        name: eClass.name,
        score: eClass.score
      };
      assert(newRange.start <= newRange.end, "Range array for",
          eClass.name, "not in sequence.");
      ranges.push(newRange);
    }
    if (eClass.hasOwnProperty('override')) {
      overrides[eClass.name] = eClass.override;
    }
  });

  // then sort the ranges by start
  ranges.sort((a, b) => {
    return (a.start - b.start) || (a.end - b.end);
  });

  debug && console.log(
    'buildRanges -- sorted list:\n',
    JSON.stringify(ranges, null, 3));
  debug && console.log('overrides ==', overrides);

  // search for overlaps
  for (let i = 0; i + 1 < ranges.length; i++) {
    let isOverlap;
    if (ranges[i].end >= ranges[i+1].start) {
      isOverlap = true;
    }

    debug && console.log(`${i}/${ranges.length}: ${ranges[i].start}-${ranges[i].end}, ${ranges[i+1].start}-${ranges[i+1].end}${isOverlap?' OVERLAP':''} (${ranges[i].name},${ranges[i+1].name})`);

    if (isOverlap) {
      let overlapRange = {
        start: ranges[i+1].start,
        end: Math.min(ranges[i].end, ranges[i+1].end)
      };
      //debug && console.log('overlap between', ranges[i].name, 'and', ranges[i+1].name, 'range', overlapRange);
      if (overrides[ranges[i].name] === ranges[i+1].name) {
        // the first range dominates
        if (ranges[i].start === ranges[i+1].start) {
          // we know from the sort earlier that the second range must
          // at the same place or later as the first range
          if (ranges[i].end === ranges[i+1].end) {
            ranges = ranges.splice(i+1, 1);
            // ensure that the `i` range doesn't also overlap the `i+2` range
            i--;
          } else {
            assert(ranges[i].end <= ranges[i+1].end, "Range sort wrong for",
              ranges[i].name, "and", ranges[i+1].name);
            ranges[i+1].start = ranges[i].end + 1;
          }
        } else {
          if (ranges[i].end < ranges[i+1].end) {
            // dominant range covers the start of other range
            ranges[i+1].start === ranges[i].end + 1;
          } else if (ranges[i].end >= ranges[i+1].end) {
            // dominant range completely covers other range
            ranges = ranges.splice(i+1, 1);
            i--;
          }
        }
      } else if (overrides[ranges[i+1].name] === ranges[i].name) {
        // the second range dominates
        if (ranges[i].start === ranges[i+1].start) {
          // first range is completely covered.
          assert(ranges[i].end <= ranges[i+1].end, "Range sort wrong for",
          ranges[i].name, "and", ranges[i+1].name);
          ranges = ranges.splice(i, 1);
          i--;
        } else {
          if (ranges[i].end <= ranges[i+1].end) {
            // dominant range covers the end of the other range
            ranges[i].end = ranges[i+1].start - 1;
          } else {
            // this is the most complex scenario -- the dominant range is
            // completely within the other range
            let newRange = {
              start: ranges[i+1].end + 1,
              end: ranges[i].end,
              name: ranges[i].name,
              score: ranges[i].score
            }
            ranges[i].end = ranges[i+1].start - 1;
            ranges.splice(i+2, 0, newRange);
          }
        }
      } else {
        assert(false, "Range overlap between", ranges[i].name,
          "and", ranges[i+1].name, "without establishing override.");
      }
    }
  }

  debug && console.log(
    'buildRanges -- overlaps resolved:\n',
    JSON.stringify(ranges, null, 3));
}

/**
 *  @method searchRange
 *  Search for the range that contains a codePoint
 *  @param {number} codePoint 
 *  @returns {object} object that describes the environs of a code point.
 */
function searchRange(codePoint) {
  let result = undefined;
  if (ranges.length === 0) {
    // nothing is in range because no ranges are defined.
    result = {
      codePoint,    // the code point we searched for
      known: false, // if the code point is in a known range
      open: [0, LAST_UNICODE], // the how far the open range goes
      next: null,   // if open, and there is a known range after the
                    // code point put it here
      range: null   // the range the code point was found in
    };
  } else {

    let low = 0;
    let high = ranges.length - 1;
    // codePoints outside the existing ranges need special handling
    if (ranges[high].end < codePoint) {
      // codePoint is beyond the end of the last range
      result = {
        codePoint,
        known: false,
        open: [ranges[high-1].end + 1, LAST_UNICODE],
        next: null,
        range: null
      }
    } else if (ranges[0].start > codePoint) {
      // codePoint is beyond the start of the first range
      result = {
        codePoint,
        known: false,
        open: [0, ranges[0] - 1],
        next: ranges[0],
        range: null
      }
    } else {
      // binary search for a range start lower than codePoint. At this point it
      // is guaranteed that such a range exists.
      let lastRangeBefore = null;
      while (high > low) {
        // relies on integer division that 1/2 === 0. Thus is should be
        // impossible for mid === high
        let mid = low + Math.floor((high-low)/2);

        debug && console.log(`${codePoint} :: ${low}:[${ranges[low].start},${ranges[low].end}]`, `${mid}:[${ranges[mid].start},${ranges[mid].end}]`, `${high}:[${ranges[high].start},${ranges[high].end}]`);

        // we know that range[low].start <= codePoint and mid < high
        assert(ranges[low].start <= codePoint, "ranges[low].start ! <= codePoint");
        assert(ranges[high].end >= codePoint, "ranges[high].end ! >= codePoint");
        assert(mid < high, "mid ! < high");

        if (ranges[mid].start > codePoint) {
          if (low + 1 === mid) {
            lastRangeBefore = low;
            break;
          } else {
            high = mid;
          }
        } else if (ranges[mid].start === codePoint) {
          lastRangeBefore = mid;
          break;
        } else {
          if (low === mid) {
            lastRangeBefore = mid;
            break;
          } else {
            low = mid;
          }
        }
      }

      // now that I have found the last range the starts before the codePoint,
      // I can find the result
      result = {
          codePoint,
          known: false,
          open: null,
          next: null,
          range: null
        };
      if (ranges[lastRangeBefore].end >= codePoint) {
        // codePoint is within the range
        result.known = true;
        result.range = ranges[lastRangeBefore];
      } else {
        // codePoint is after the range
        if (lastRangeBefore + 1 < ranges.length) {
          result.open = [ ranges[lastRangeBefore].end + 1, 
                          ranges[lastRangeBefore + 1].start - 1];
          result.next = ranges[lastRangeBefore + 1];
        } else {
          result.open = [ ranges[lastRangeBefore].end + 1, LAST_UNICODE ];
        }
      }
    }

    return result;
  }
}

(function () {
  charactersToRanges();
  buildRanges();
})();

module.exports = {
  search: searchRange
}

