'use strict';

/**
 *  Exercise the entropy calculator to ensure calculation behaves as expected.
 *  This WILL NOT check the numbers (as the formula is likely to be tweaked 
 *  over time), just ensures that the numbers increase as expected.
 */

const entropy = require('../lib/entropy');
const expect = require('chai').expect;

describe('Entropy Calculation test', function() {

  let control = entropy('distance');
  // simple passwords
  let test1 = entropy('distances'); // same password with a letter added
  let test2 = entropy('distancez'); // same password with a unique letter added
  let test3 = entropy('distance1'); // same password with a number added
  let test4 = entropy('Distance1'); // same password with a cap and a number added
  // special characters
  let specialTest1 = entropy('distance+'); // + is from first range of special characters
  let specialTest2 = entropy('distance:'); // : is from second range of special characters
  // complex emoji test
  let emojiTest1 = entropy('distance🐶');
  let emojiTest2 = entropy('distance👨‍👩‍👧‍👦');
  let emojiTest3 = entropy('distance👨‍👩‍👧‍👦👨‍👩‍👧‍👦');
  // hanzi test
  let hanziTest1 = entropy('distance我');
  let hanziTest2 = entropy('distance我我');
  let hanziTest3 = entropy('distance魏');
  let hanziTest4 = entropy('distance魏魏');
  // hanzi test, mizing common and less-common characters
  let hanziControl1 = entropy('我的心'); // three common characters
  let hanziControl2 = entropy('魏柏特'); // three less-common characters
  let hanziTest5 = entropy('我柏特'); // count as three less-common characters
  let hanziTest6 = entropy('我的魏'); // count as three common charaters
  // bad password test
  let badPassword1 = entropy('123456789');
  let badPassword2 = entropy('12e456789');
  let badPassword3 = entropy('h3Ll0hi');
  let badPassword4 = entropy('hih3ll0');

  it('entropy of a simple password', function() {
    expect(test1.length).to.be.equal(control.length);
    expect(test1.sets.length).to.be.equal(1);
    expect(test1.entropy).to.be.equal(control.entropy);
    expect(test2.length).to.be.equal(control.length + 1);
    expect(test2.sets.length).to.be.equal(1);
    expect(test2.entropy).to.be.greaterThan(control.entropy);
    expect(test3.length).to.be.equal(control.length + 1);
    expect(test3.sets.length).to.be.equal(2);
    expect(test3.entropy).to.be.greaterThan(control.entropy);
    expect(test3.entropy).to.be.greaterThan(test1.entropy);
    expect(test4.length).to.be.equal(control.length + 1);
    expect(test4.sets.length).to.be.equal(3);
    expect(test4.entropy).to.be.greaterThan(control.entropy);
    expect(test4.entropy).to.be.greaterThan(test1.entropy);
  });
  it('entropy with special characters', function() {
    let test = function(e) {
      expect(e.sets).to.include('special');
      expect(e.length).to.be.equal(test2.length);
      expect(e.sets.length).to.be.equal(test3.sets.length);
      expect(e.entropy).to.be.greaterThan(control.entropy);
      // because special is a larger character class than number
      expect(e.entropy).to.be.greaterThan(test3.entropy); 
    }
    test(specialTest1);
    test(specialTest2);
    expect(specialTest1.entropy).to.be.equal(specialTest2.entropy);
  });
  it('entropy with a complex emoji', function() {
    let test = function(e) {
      expect(e.sets).to.include('emoji');
      expect(e.length).to.be.equal(test2.length);
      expect(e.sets.length).to.be.equal(test3.sets.length);
      expect(e.entropy).to.be.greaterThan(control.entropy);
      // because emoji is a larger character class than number
      expect(e.entropy).to.be.greaterThan(test3.entropy); 
    }
    test(emojiTest1);
    test(emojiTest2);
    test(emojiTest3);
    expect(emojiTest1.entropy).to.be.equal(emojiTest2.entropy);
    expect(emojiTest2.entropy).to.be.equal(emojiTest3.entropy);
  });
  it('entropy with hanzi, common and rarer', function() {
    let test = function(e, c) {
      expect(e.sets).to.include(c);
      expect(e.length).to.be.equal(test2.length);
      expect(e.sets.length).to.be.equal(test3.sets.length);
      expect(e.entropy).to.be.greaterThan(control.entropy);
      // because emoji is a larger character class than number
      expect(e.entropy).to.be.greaterThan(test3.entropy); 
    }
    test(hanziTest1, 'common-hanzi');
    test(hanziTest2, 'common-hanzi');
    test(hanziTest3, 'hanzi');
    test(hanziTest4, 'hanzi');
    expect(hanziTest1.entropy).to.be.equal(hanziTest2.entropy);
    expect(hanziTest3.entropy).to.be.equal(hanziTest4.entropy);
    // less common hanzi get a higher entropy score
    expect(hanziTest3.entropy).to.be.greaterThan(hanziTest1.entropy);

    expect(hanziTest5.entropy).to.be.equal(hanziControl2.entropy);
    expect(hanziTest5.sets).to.include('hanzi');
    expect(hanziTest5.sets).to.not.include('common-hanzi');
    expect(hanziTest6.entropy).to.be.equal(hanziControl1.entropy);
    expect(hanziTest6.sets).to.not.include('hanzi');
    expect(hanziTest6.sets).to.include('common-hanzi');
  });
  it('entropy with a bad password', function() {
    expect(control.entropy).to.be.greaterThan(badPassword1.entropy);
    expect(badPassword2.entropy).to.be.equal(badPassword1.entropy);
    expect(control.entropy).to.be.greaterThan(badPassword3.entropy);
    expect(badPassword3.entropy).to.be.greaterThan(badPassword1.entropy);
    expect(badPassword1.sets.length).to.be.equal(1);
    expect(badPassword2.sets.length).to.be.equal(1);
    expect(badPassword1.sets).to.include('common-passwords');
    expect(badPassword2.sets).to.include('common-passwords');
    expect(badPassword3.sets).to.include('common-passwords');
    expect(badPassword3.sets).to.include('latin-small');
    expect(badPassword3.entropy).to.be.equal(badPassword4.entropy);
  });
});

