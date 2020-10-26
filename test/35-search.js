'use strict';

/**
 *  Runthrough test
 *  Exercise the functionality of `entropy` to ensure there are no crashes
 */

const ranges = require('../lib/ranges');
const expect = require('chai').expect;

const debug = false;

function stringTest(str, sets) {
  for (var i = 0; i < str.length; i++) {
    let searchResult = ranges.search(str.codePointAt(i))
    debug && console.log(str, sets, searchResult);
    expect(searchResult.known).to.be.true;
    expect(sets).to.include(searchResult.range.name);
  }
}

describe('Search test', function() {
  it('identify common characters', function() {
    // latin characters
    stringTest('brownfoxlazydog', ['latin-small']);
    stringTest('BROWNFOXLAZYDOG', ['latin-capital']);
  });
  it('identify hanzi classes', function() {
    stringTest('的一是不了人我過家十用發天四死秘', ['common-hanzi']);
    stringTest('魏柏特', ['hanzi']);
  });
  it('identify multiple character classes', function() {
    stringTest('The quick brown fox jumps over the lazy dog', ['latin-small', 'latin-capital', 'special', 'white-space']);
  });
});

