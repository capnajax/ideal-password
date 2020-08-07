# ideal-password

Password entropy test, loosely inspired by [XKCD](https://xkcd.com/936/). Key
features:

* Detects most frequently used passwords and common l33t-ized and mix-case
    versions of these passwords. For example, `password` is equivalent to
    `Pa55w0rD`.
* Detects repeated characters and excludes them. For example `aaaaaaaaaaa`
    gets the same score as `a` and `passwordpassword` and `passwordPa55w0rd`
    gets the same score as `password`.
* Detects uppercase, lowercase, special, emoji, and several non-roman
    character classes and gives credit for the number of character classes
    represented.

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
      "classNames": [       // see section on character classes below
        "upper-roman",
        "lower-roman" ],
      "length": 9,          // note this only counts unique characters
      "entropy": 58.64573768438668,
      "max_entropy_scale": 128,   // a suggested scale for bar graphs,
                                  // note this can change in future versions
      "acceptable": false,  // standard for "acceptable" and "ideal" can change
      "legal": true         // all the characters are acceptable
      "ideal": false        // or be configurable in future versions
    }
 */
```

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
* `characterClasses` - (default: `'all'`) a string or an array of strings,
  each being either a class name or an alias for a preset list of class
  names. Currently supported aliases are `'all'` and `'western'`. 

### On the command line

```sh
% npm install -g ideal-password

% entropy HueyDeweyLouie
Entropy score for "HueyDeweyLouie": 58.64573768438668
  Unique characters : 9
  Character classes : upperRoman,lowerRoman
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
the size of character classes represented. Each unique character is only
counted once. That is, `000` counts the same as `0`, `HueyDeweyLouie` counts
as `HueyDwLoi`.

### Character classes

A character class is a type of character. These character classes are identified:

* `common-passwords` e.g. `Passw0rd`. Treats entire common password as a
    single token, case- and l33t-insensitive, e.g. `password` and `Pa55w0rD`
    are treated as the same.
* `number` Arabic numerals
* `lower-roman` Unaccented lowercase Roman alphabet
* `upper-roman` Unaccented uppercase Roman alphabet
* `extended-roman` Includes Latin 1 Supplement, Latins Extended A, B, C, D,
    and E, IP Extensions, and Latin Extended Additional
* `special` Includes `` !"#$%&'()*+,-./:;<=>?[\]^_` ``
* `upper-greek` Unaccented uppercase Greek alphabet
* `lower-greek` Unaccented lowercase Greek alphabet
* `extended-greek` Includes letters from Greek Extended. For performance,
    includes some unassigned code points within the Greek Extended range.
* `upper-cyrillic` Unaccented uppercase Cyrillic alphabet
* `lower-cyrillic` Unaccented lowercase Cyrillic alphabet
* `extended-cyrillic` Includes letters from Cyrillic Supplement, Cyrillic
    Extended A, B, and C, and Cyrillic letters not included in `upper-cyrillic`
    or `lower-cyrillic`
* `hiragana` Japanese Hiragana characters
* `katakana` Japanese Hiragana characters
* `bopomofo` Mandarin and Taiwanese phonetic symbols, includes characters from
    [Bopomofo](https://www.unicode.org/charts/PDF/U3100.pdf) and [Bopomofo Extended](https://www.unicode.org/charts/PDF/U31A0.pdf) character sets.
* `hangul` Korean Hangul characters
* `common-hanzi` 100 most common Chinese characters, in both Traditional and
    Simplified Chinese. Note results will never include both `common-hanzi`
    and `hanzi`. If both types of characters exist, only one type will be
    selected.
* `hanzi` Chinese characters.
* `emoji` Complex emoji are treated as single characters

The `Unknown` class can include burred Roman and Cyrillic letters.

Each entropy class has a score that is loosely based on the log of the number
possible characters in that class.

As noted earlier, these character classes can be updated in future versions,
and updates will not be considered "enhancements" or "breaking changes" for the
purpose of semantic versioning.

### Examples

In our example `HueyDeweyLouie`, there are nine unique characters over two
character classes. Each of those character classes adds ln(26) to the
entropy score, so we come to a score of 58.6.

```sh
$ entropy HueyDeweyLouie
Entropy score for "HueyDeweyLouie": 58.64573768438668
  Unique characters : 9
  Character classes : upper-roman,lower-roman
Password is not acceptable.
```

If they were all in lowercase, `hueydeweylouie`, even though the number of
unique characters is still the same (`hueydwloi`), the entropy is even worse.

```sh
$ entropy hueydeweylouie
Entropy score for "hueydeweylouie": 29.32286884219334
  Unique characters : 9
  Character classes : lower-roman
Password is not acceptable.
```

If we change on letter to an emoji, `Huey🦆eweyLouie`, now we have a third
character class. This ups the score to 100.

```sh
$ entropy Huey🦆eweyLouie
Entropy score for "Huey🦆eweyLouie": 100.09226935827951
  Unique characters : 9
  Character classes : upper-roman,lower-roman,emoji
Password is ideal.
```

Common passwords or passwords that contain common passwords are treated
harshly. A password that resembles a common password, `hell0hi`, got a
low score of only 19. Notice the length is 3 because the `hello` was
treated as a single "character" of class "common-password". Changing
the `o` to a `0` did not help either. The `hi` at the end was treated as
two roman letters.

```sh
$ entropy hell0hi
Entropy score for "hell0hi": 18.761486434726418
  Unique characters : 3
  Character classes : common-passwords,lower-roman
Password is not acceptable.
```

## Change history

### v2.0 (future release)

Version 2.0 will be a breaking change in that some vocabulary will change to
bring this in line with Unicode standards:

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

Also "classes" become "sets" and "characters" will usuall become "tokens".
While the output object may also change to reflect this vocabulary change,
members `entropy`, `ideal`, and `acceptable` will remain the same.

No functionality will be removed, though, as always, the formula may be updated
to account for more character sets or change the weight on existing ones.

### v1.3.1 (current release)

* Added accented characters sers for Roman, Greek, and Cyrillic
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
