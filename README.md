# password-entropy

Estimates the entropy of a password

## Usage

TODOC

## Forward Compatitibility Note

Only the interface will be considered in selecting sematic versions. That is,
the minor number will be advanced if a method or endpoint is added, and the
major number will be advanced if there is a breaking change. Any updates to the
formula for caulculating entropy, without interface changes, will be treated as
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
* Special characters
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

If we change on letter to an emoji, `HueyD🦆eweyLouie`, now we have a third
character class. This ups the score to 100.

```$ entropy Huey🦆eweyLouie
Entropy score for "Huey🦆eweyLouie": 100.09226935827951
  Unique characters : 9
  Character classes : upperRoman,lowerRoman,emoji
Password is ideal.
```
