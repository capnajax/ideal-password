# password-entropy

Estimates the entropy of a password

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
        "upperRoman",
        "lowerRoman" ],
      "length": 9,          // note this only counts unique characters
      "entropy": 58.64573768438668,
      "max_entropy_scale": 128,   // a suggested scale for bar graphs,
                                  // note this can change in future versions
      "acceptable": false,  // standard for "acceptable" and "ideal" can change
      "ideal": false        // or be configurable in future versions
    }
 */
```

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

* Arabic numerals
* Uppercase Roman letter
* Lowercase Roman letter
* Special characters `!"#$%&'()*+,-./:;<=>?`
* Common Passwords (e.g. `Passw0rd` - treats entire common password as a
    single token)
* Emoji (complex emoji are treated as a single token)
* Uppercase Greek letter
* Lowercase Greek letter
* Uppercase Cyrillic letter
* Lowercase Cyrillic letter
* Hiragana
* Katakana
* Most Common Hanzi
* Other Hanzi
* Unknown

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

```$ entropy HueyDeweyLouie
Entropy score for "HueyDeweyLouie": 58.64573768438668
  Unique characters : 9
  Character classes : upperRoman,lowerRoman
Password is not acceptable.
```

If they were all in lowercase, `hueydeweylouie`, even though the number of
unique characters is still the same (`hueydwloi`), the entropy is even worse.

```$ entropy hueydeweylouie
Entropy score for "hueydeweylouie": 29.32286884219334
  Unique characters : 9
  Character classes : lowerRoman
Password is not acceptable.
```

If we change on letter to an emoji, `Huey🦆eweyLouie`, now we have a third
character class. This ups the score to 100.

```$ entropy Huey🦆eweyLouie
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

```$ entropy hell0hi
Entropy score for "hell0hi": 18.761486434726418
  Unique characters : 3
  Character classes : common-passwords,lower-roman
Password is not acceptable.
```

## Change history

### v1.2

* "common passwords" -- treats common passwords as an entropy class, reducing the
  entropy of password that contains one of the common ones.

### v1.1

* test automation
* bug fixes working with utf16 high/low surrogates. This affects emoji processing.
