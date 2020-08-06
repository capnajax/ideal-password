#!/usr/bin/env node

'use strict';

const entropy = require('./lib/entropy');

(() => {
  if (require.main === module) {
    let pass = process.argv[2]
    let score = entropy(pass);
    console.log(`Entropy score for "${pass}":`, score.entropy);
    console.log(`  Unique characters : ${score.length}`);
    console.log(`  Character classes : ${score.classNames}`);
    if (score.acceptable) {
      if (score.ideal) {
        console.log(`Password is ideal.`);
      } else {
        console.log(`Password is acceptable but not ideal.`);
      }
    } else {
      console.log(`Password is not acceptable.`);
    }
  } else {
    module.exports = entropy;
  }
})();

