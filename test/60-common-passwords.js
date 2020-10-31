'use strict';

const entropy = require('../lib/entropy');
const expect = require('chai').expect;

describe('Common Passwords test', function() {

  let control = entropy('distance');
  // bad password test
  let badPassword1 = entropy('123456789');
  let badPassword2 = entropy('12e456789');
  let badPassword3 = entropy('h3Ll0hi');
  let badPassword4 = entropy('hih3ll0');
  // custom bad password test
  entropy.addCommonPasswords(['Blinky', 'Pinky'], 'Inky', 'Clyde');
  let customPassword1 = entropy('bliNKy');
  let customPassword2 = entropy('PInkY');
  let customPassword3 = entropy('inky');
  let customPassword4 = entropy('clyd3');

  console.log({
    customPassword1,
    customPassword2,
    customPassword3,
    customPassword4});

  it('entropy with a default bad password', function() {
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

  it('entropy with a custom bad password', function() {
    expect(control.entropy).to.be.greaterThan(customPassword1.entropy);
    expect(control.entropy).to.be.greaterThan(customPassword2.entropy);
    expect(control.entropy).to.be.greaterThan(customPassword3.entropy);
    expect(control.entropy).to.be.greaterThan(customPassword4.entropy);
    expect(customPassword1.entropy).to.be.equal(badPassword1.entropy);
    expect(customPassword1.entropy).to.be.equal(customPassword3.entropy);
    expect(customPassword1.entropy).to.be.equal(customPassword4.entropy);
    expect(customPassword1.entropy).to.be.equal(customPassword4.entropy);
    expect(customPassword1.sets.length).to.be.equal(1);
    expect(customPassword2.sets.length).to.be.equal(1);
    expect(customPassword3.sets.length).to.be.equal(1);
    expect(customPassword4.sets.length).to.be.equal(1);
    expect(customPassword1.sets).to.include('common-passwords');
    expect(customPassword2.sets).to.include('common-passwords');
    expect(customPassword3.sets).to.include('common-passwords');
    expect(customPassword4.sets).to.include('common-passwords');
  });
});

