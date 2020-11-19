// one word per line, spaces are ignored, convert 0 to o, 3 to e, 5 to s, and 
// upper to lowercase.
// this list is distilled from SplashData's lists of most common passwords
// from 2011 to 2019
// https://en.wikipedia.org/wiki/List_of_the_most_common_passwords#SplashData

const commonPasswordsStr = `
!@\#$%^&*
111111
121212
12e12e
12e4
12e4s
12e4s6
12e4s67
12e4s678
12e4s6789
12e4s6789o
12eqwe
1q2wee4r
1qaz2wsx
666666
696969
6s4e21
7777777
888888
aa12e4s6
abc12e
access
admin
adobe12e
ashley
azerty
bailey
baseball
batman
charlie
donald
dragon
flower
football
freedom
hello
hottie
iloveyou
jesus
letmein
login
lovely
loveme
master
michael
monkey
mustang
ninja
oooooo
password
password1
photoshop
princess
qazwsx
qwerty
qwerty12e
qwertyuiop
shadow
solo
ssssss
starwars
sunshine
superman
trustno1
welcome
whatever
zaq1zaq1
`

// the most common passwords, normalized to lowercase, and common l33t changes
// converted to numbers. Read the file, then split into words and sanitize it.
let commonPasswords =
  commonPasswordsStr
    .toString().split('\n')
    .map(pw => { return pw.replace(/#.*/, '').replace(/\s/g,''); })
    .filter(pw => pw.length > 4);
commonPasswords.push('@#$%'); // because this would have messed with the filters

module.exports = commonPasswords
