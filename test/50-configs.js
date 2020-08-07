'use strict';

/**
 *  Exercise the entropy calculator's configurations
 */

const entropy = require('../lib/entropy');
const expect = require('chai').expect;

describe('Entropy Configuration test', function() {

  // entropy of 'password' is 2.995732273553991

  it('set ranges', function() {
    let e;
    entropy.config({minAcceptable: 1, minIdeal: 2});
    e = entropy('password');
    expect(e.acceptable).to.be.true;
    expect(e.ideal).to.be.true;
    entropy.config({minAcceptable: 11, minIdeal: 12});
    e = entropy('password');
    expect(e.acceptable).to.be.false;
    expect(e.ideal).to.be.false;
    entropy.config('minAcceptable', 1);
    e = entropy('password');
    expect(e.acceptable).to.be.true;
    expect(e.ideal).to.be.false;
    entropy.config('minAcceptable');
    entropy.config('minIdeal');
    e = entropy('password');
    expect(e.acceptable).to.be.false;
    expect(e.ideal).to.be.false;
  });

  if('set character classes', function() {
    let e;
    e=entropy('passw⚽️rd');
    expect(e.legal).to.be.true;

    entropy.config('characterClasses', ['lower-roman', 'emoji']);
    e=entropy('passw⚽️rd');
    expect(e.legal).to.be.true;
    e=entropy('passw0rd');
    expect(e.legal).to.be.false;

    entropy.config('characterClasses', ['lower-roman']);
    e=entropy('passw⚽️rd');
    expect(e.legal).to.be.false;

    entropy.config('characterClasses', 'lower-roman');
    e=entropy('passw⚽️rd');
    expect(e.legal).to.be.false;
    e=entropy('password');
    expect(e.legal).to.be.true;

    entropy.config('characterClasses', 'western');
    e=entropy('passw⚽️rd');
    expect(e.legal).to.be.false;
    e=entropy('password');
    expect(e.legal).to.be.true;

    entropy.config('characterClasses', ['western', 'emoji']);
    e=entropy('passw⚽️rd');
    expect(e.legal).to.be.false;
    e=entropy('password');
    expect(e.legal).to.be.true;
  });

});

