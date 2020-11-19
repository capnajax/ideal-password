type TokenSet =
  | "white-space"
  | "number"
  | "latin-small"
  | "latin-capital"
  | "latin-extended"
  | "special"
  | "cyrillic-capital"
  | "cyrillic-small"
  | "cyrillic-extended"
  | "greek-capital"
  | "greek-small"
  | "greek-extended"
  | "hiragana"
  | "katakana"
  | "bopomofo"
  | "hangul"
  | "common-hanzi"
  | "hanzi";

interface EntropyInfo {
  sets: TokenSet[];
  length: number;
  entropy: number;
  acceptable: boolean;
  ideal: boolean;
  legal: boolean;
}

declare const entropy: (password: string) => EntropyInfo;

export default entropy;
