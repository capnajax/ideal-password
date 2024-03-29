# ideal-password

Password entropy test, loosely inspired by [xkcd](https://xkcd.com/936/). Key
features:

* Detects most frequently used passwords and common l33t-ized and mix-case
    versions of these passwords. For example, `password` is equivalent to
    `Pa55w0rD`.
* Detects uppercase, lowercase, special, emoji, and several non-latin
    character sets and gives credit for the number of character sets
    represented.
* Detects repeated characters and excludes them. For example `aaaaaaaaaaa`
    gets the same score as `a` and `passwordpassword` and `passwordPa55w0rd`
    gets the same score as `password`.

## Usage

### To use this in code

```sh
npm install ideal-password
```

In your code, measure entropy with this.

```javascript
const entropy = require('ideal-password');

entropy('HueyDeweyLouie');
/* Returns
    {
      "sets": [             // see section on token sets below
        "latin-capital",
        "latin-small" ],
      "length": 9,          // note this only counts *unique* tokens
      "entropy": 58.64573768438668,
                            // ranges from zero to infinity. For the purpose
                            // of bar charts, 128 is a good maximum for the
                            // scale
      "acceptable": false,  // standard for "acceptable" and "ideal" can change
      "ideal": false,       // or be configurable in future versions
      "legal": true         // all the tokens are acceptable.
    }
 */
```

#### config

In code this can be configured using the `entropy.config()` method. This takes
key and a value, or an object with key/value pairs. Omitting the value (in the
`(string, value)` form) resets that configuration to the default.

```javascript
entropy.config('minAcceptable', 24);
entropy.config({minAcceptable: 24, minIdeal: 64});
entropy.config('minAcceptable'); // sets to default value
```

* `minAcceptable` - (default: 64) the lowest entropy score considered
  acceptable. That is, in the return object, the lowest entropy that have
  `acceptable == true`.
* `minIdeal` - (default: 96) the lowest entropy score considered ideal. If
  `minIdeal` is set lower that `minAcceptable`, it will be ignored and
  `ideal` will always be true when `acceptable` is true.
* `sets` - (default: `'all'`) a string or an array of strings,
  each being either a token set name or an alias for a preset list of token
  set names. Currently supported aliases are `'all'` and `'western'`.

#### bad passwords

This module detects bad passwords from a list of common passwords. In some
situations industry jargon may also emerge as easily guessable passwords. The
`addCommonPasswords` method will automatically check for l33t and mixed case
versions of passwords.

```javascript
// pass new passwords as an array or as a individual parameters.
entropy.addCommonPasswords(['Blinky', 'Pinky', 'Inky', 'Clyde']);
// or
entropy.addCommonPasswords('Blinky', 'Pinky', 'Inky', 'Clyde');

entropy('clYd3');
/* Returns
  {
    sets: [ 'common-passwords' ],
    length: 1,
    entropy: 2.995732273553991,
    max_entropy_scale: 128,
    legal: true,
    acceptable: false,
    ideal: false
  }
 */
```

### On the command line

```sh
% npm install -g ideal-password

% entropy HueyDeweyLouie
Entropy score for "HueyDeweyLouie": 58.64573768438668
  Unique characters : 9
  Token sets: latin-capital, latin-small
Password is not acceptable.
```

## Forward Compatitibility Note

Only the interface will be considered in selecting sematic versions. That is,
the minor number will be advanced if a method or endpoint is added, and the
major number will be advanced if there is a breaking change. Any updates to the
formula for calculating entropy, without interface changes, will be treated as
a tiny fix.

## Formula

This formula estimates the entropy by multiplying the number of characters by
a weight for each of the token sets represented. Each unique character is only
counted once. That is, `000` counts the same as `0`, `HueyDeweyLouie` counts
as `HueyDwLoi`.

### token sets

A "token" is usualy a single character, but in the case of common passwords or
complex emoji, a token is composed of multiple characters.

A "token set" is a type of token. These token sets are identified:

* `common-passwords` e.g. `Passw0rd`. Treats entire common password as a
    single token, case- and l33t-insensitive, e.g. `password` and `Pa55w0rD`
    are treated as the same.
* `white-space` All white space characters
* `number` Arabic numerals
* `latin-small` Unaccented lowercase Latin alphabet
* `latin-capital` Unaccented uppercase Latin alphabet
* `latin-extended` Includes Latin 1 Supplement, Latin Extended A, B, C, D,
    and E, IP Extensions, and Latin Extended Additional
* `special` Includes `` !"#$%&'()*+,-./:;<=>?[\]^_` ``
* `greek-capital` Unaccented uppercase Greek alphabet
* `greek-small` Unaccented lowercase Greek alphabet
* `greek-extended` Includes letters from Greek Extended. For performance,
    includes some unassigned code points within the Greek Extended range.
* `cyrillic-capital` Unaccented uppercase Cyrillic alphabet
* `cyrillic-small` Unaccented lowercase Cyrillic alphabet
* `cyrillic-extended` Includes letters from Cyrillic Supplement, Cyrillic
    Extended A, B, and C, and Cyrillic letters not included in
    `cyrillic-capital` or `lower-cyrillic`
* `arabic` Arabic alphabet
* `arabic-extended` Includes characters from the Arabic Extended A block.
* `devangari`
* `bengali`
* `tamil`
* `telagu`
* `devangari`
* `kannada`
* `malayalam`
* `thai`
* `hiragana` Japanese Hiragana characters
* `katakana` Japanese Katakana characters
* `bopomofo` Mandarin and Taiwanese phonetic symbols, includes characters from
    [Bopomofo](https://www.unicode.org/charts/PDF/U3100.pdf) and
    [Bopomofo Extended](https://www.unicode.org/charts/PDF/U31A0.pdf) character
    sets.
* `hangul` Korean Hangul characters
* `hanzi-common` 100 most common Chinese characters, in both Traditional and
    Simplified Chinese. Note results will never include both `common-hanzi`
    and `hanzi`. If both types of characters exist, only one type will be
    selected.
* `hanzi` Chinese characters.
* `emoji` Complex emoji are treated as single characters

Each token set has a score that is loosely based on the log of the number
possible characters in that set.

As noted earlier, these token sets can be updated in future versions,
and updates will not be considered "enhancements" or "breaking changes" for the
purpose of semantic versioning.

### Examples

In our example `HueyDeweyLouie`, there are nine unique characters over two
token sets. Each of those token sets adds ln(26) to the
entropy score, so we come to a score of 58.6.

```sh
$ HueyDeweyLouie
Entropy score for "HueyDeweyLouie": 58.64573768438668
  Unique characters : 9
  Token sets: latin-capital, latin-small
Password is not acceptable.
```

If they were all in lowercase, `hueydeweylouie`, even though the number of
unique characters is still the same (`hueydwloi`), the entropy is even worse.

```sh
$ entropy hueydeweylouie
Entropy score for "hueydeweylouie": 29.32286884219334
  Unique characters : 9
  Token sets: latin-small
Password is not acceptable.
```

Adding a special character adds a third token set, improving the score to 81.

```sh
$ entropy Huey#eweyLouie
Entropy score for "Huey#eweyLouie": 81.00989753247869
  Unique characters : 9
  Token sets: latin-capital, latin-small, special
Password is acceptable but not ideal.
```

If we change one letter to an emoji, `Huey🦆eweyLouie`, we up the score
even more. This is because emoji have more weight than special characters.

```sh
$ entropy Huey🦆eweyLouie
Entropy score for "Huey🦆eweyLouie": 100.09226935827951
  Unique characters : 9
  Token sets: latin-capital, latin-small, emoji
Password is ideal.
```

Common passwords or passwords that contain common passwords are treated
harshly. A password that resembles a common password, `hell0hi`, got a
low score of only 19. Notice the length is 3 because the `hello` was
treated as a single "character" of the set "common-password". Changing
the `o` to a `0` did not help either. The `hi` at the end was treated as
two Latin letters.

```sh
$ entropy hell0hi
Entropy score for "hell0hi": 18.761486434726418
  Unique characters : 3
  Token sets: common-passwords, latin-small
Password is not acceptable.
```

## Change history

### v2.4.0

Typescript bindings updated.

### v2.3.1

`npm audit fix` to update vulnerable package dependencies 

### v2.3

Browser and typescript usability

### v2.2

Added new configuration features to allow user-supplied common passwords.
Added more character sets.

### v2.1

The algorithm for detecting character ranges changed to allow for detecting
even more character sets and finer-grained classification with little
performance loss.

### v2.0

Version 2.0 is a breaking change in that some vocabulary will change for
semantic accuracy and to more closely match Unicode Consortiums's use of
language:

* `roman` becomes `latin`
* `upper-roman` becomes `latin-capital`
* `lower-roman` becomes `latin-small`
* `extended-roman` becomes `latin-extended`
* `upper-greek` becomes `greek-capital`
* `lower-greek` becomes `greek-small`
* `extended-greek` becomes `greek-extended`
* `upper-cyrillic` becomes `cyrillic-capital`
* `lower-cyrillic` becomes `cyrillic-small`
* `extended-cyrillic` becomes `cyrillic-extended`
* `common-hanzi` becomes `hanzi-common`

However `common-passwords` will remain as `common-passwords`

Also "classes" become "sets" and most "characters" become "tokens".
The output object also changed in that now `classNames` are `sets`.

### v1.3.2

* Documentation updates

### v1.3.1

* Added accented characters sets for Roman, Greek, and Cyrillic
* Hanzi classes cancel, so mixing common and less-common Chinese characters
  will not result in a higher score than using only less-common characters

### v1.3

* Added configuratability for character sets and acceptable/ideal thresholds

### v1.2.1

* Added a Hangul (Korean) character class

### v1.2

* "common passwords" -- treats common passwords as an entropy class, reducing the
  entropy of password that contains one of the common ones

### v1.1

* test automation
* bug fixes working with utf16 high/low surrogates. This affects emoji processing.
