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
  max_entropy_scale?: number;
  acceptable: boolean;
  ideal: boolean;
  legal: boolean;
}

interface EntropyConfig {
  /**
   * The lowest entropy score considered acceptable.
   * That is, in the return object, the lowest entropy that have `acceptable == true`.
   *
   * Default: `64`.
   */
  minAcceptable: number;
  /**
   * The lowest entropy score considered ideal.
   * If `minIdeal` is set lower that `minAcceptable`, it will be ignored and `ideal` will always be true when `acceptable` is true.
   *
   * Default: `96`.
   */
  minIdeal: number;
  /**
   * A string or an array of strings, each being either a token set name or an alias for a preset list of token set names.
   * Currently supported aliases are `'all'` and `'western'`.
   *
   * Default: `'all'`.
   */
  sets: string|string[];
}

interface Entropy {
  (password: string): EntropyInfo;
  addCommonPasswords(passwords: string[]): EntropyInfo;
  addCommonPasswords(...passwords: string[]): EntropyInfo;
  config(config: Partial<EntropyConfig>): void;
  config(key: keyof EntropyConfig, value?: number|string|string[]): void;
}

declare const entropy: Entropy;

export default entropy;
