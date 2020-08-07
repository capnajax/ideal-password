'use strict';

/**
 *  Runthrough test
 *  Exercise the functionality of `entropy` to ensure there are no crashes
 */

const entropy = require('../lib/entropy');
const expect = require('chai').expect;

const longTextSample = require('fs').readFileSync(
    __dirname + '/longtextsample.txt').toString();

describe('Crash test', function() {
    it('entropy of undefined', function() {
        entropy();
    });
    it('entropy of a null password', function() {
        entropy(null);
    });
    it('entropy of an empty password', function() {
        entropy('');
    });
    it('entropy of a non-string', function() {
        entropy({});
    });
    it('entropy of a simple password', function() {
        entropy('password');
    });
    it('entropy with special characters', function() {
        entropy('this:password');
    });
    it('entropy with a complex emoji', function() {
        entropy('this👨‍👩‍👧‍👦password');
    });
    it('entropy with hanzi', function() {
        entropy('this我password');
    });
    it('entropy with less-common hanzi', function() {
        entropy('this魏password');
    });
    it('entropy of war and peace', function() {
        entropy(longTextSample);
    })
});

