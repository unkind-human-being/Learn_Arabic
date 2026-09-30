/** Pure Arabic input helpers. No browser API is required; these can be unit tested. */
export const MARKS = [
  { char: "َ", name: "Fatha", sound: "short a" },
  { char: "ِ", name: "Kasra", sound: "short i" },
  { char: "ُ", name: "Damma", sound: "short u" },
  { char: "ْ", name: "Sukun", sound: "no vowel" },
  { char: "ّ", name: "Shadda", sound: "double consonant" },
] as const;

const LETTER_NAMES: Record<string, string> = {
  "ا": "Alif", "أ": "Alif with hamza", "ب": "Ba", "ت": "Ta", "ث": "Tha",
  "ج": "Jeem", "ح": "Ha", "خ": "Kha", "د": "Dal", "ذ": "Dhal", "ر": "Ra",
  "ز": "Zay", "س": "Seen", "ش": "Sheen", "ص": "Sad", "ض": "Dad", "ط": "Ta (emphatic)",
  "ظ": "Za (emphatic)", "ع": "Ayn", "غ": "Ghayn", "ف": "Fa", "ق": "Qaf", "ك": "Kaf",
  "ل": "Lam", "م": "Meem", "ن": "Noon", "ه": "Ha (light)", "و": "Waw", "ي": "Ya",
  "ة": "Ta marbuta", "ء": "Hamza",
};
const ALPHABET = [..."اأبتثجحخدذرزسشصضطظعغفقكلمنهويءة"];
const SHORT_VOWELS: readonly string[] = ["َ", "ِ", "ُ"];

export const isMark = (char: string): boolean => MARKS.some((mark) => mark.char === char);
export const tokenName = (char: string): string => MARKS.find((mark) => mark.char === char)?.name ?? LETTER_NAMES[char] ?? char;
export const tokenDisplay = (char: string): string => isMark(char) ? `◌${char}` : char;

export function joinedWord(tokens: readonly string[]): string {
  // A SINGLE string, without spaces or one-letter spans, preserves Arabic shaping.
  return tokens.join("").normalize("NFC");
}

export function wordsMatch(tokens: readonly string[], target: string): boolean {
  // Normalize canonical mark order, but NEVER discard harakat or conflate letters.
  return joinedWord(tokens) === target.normalize("NFC");
}

type Cluster = { letter: string; marks: string[] };
function clusters(tokens: readonly string[]): Cluster[] {
  const result: Cluster[] = [];
  for (const char of tokens) {
    if (isMark(char)) {
      const last = result[result.length - 1];
      if (last) last.marks.push(char);
      else return [];
    } else result.push({ letter: char, marks: [] });
  }
  return result;
}

function equalMarks(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && [...a].sort().join("") === [...b].sort().join("");
}

/** Accept either input order for a vowel + shadda on the same letter. */
export function nextExpectedToken(input: readonly string[], steps: readonly string[]): string | null {
  if (!input.length) return steps[0] ?? null;
  if (isMark(input[0])) return null;
  const built = clusters(input);
  const target = clusters(steps);
  if (built.length > target.length) return null;
  for (let i = 0; i < built.length; i++) {
    const a = built[i];
    const b = target[i];
    if (!b || a.letter !== b.letter) return null;
    if (i < built.length - 1 && !equalMarks(a.marks, b.marks)) return null;
    if (i === built.length - 1) {
      if (new Set(a.marks).size !== a.marks.length || a.marks.some((m) => !b.marks.includes(m))) return null;
      const missing = b.marks.find((m) => !a.marks.includes(m));
      return missing ?? target[i + 1]?.letter ?? null;
    }
  }
  return null;
}

export function letterBank(steps: readonly string[]): string[] {
  const needed = new Set(steps.filter((char) => !isMark(char)));
  // A few distractors keep this a choice, without presenting the whole alphabet.
  for (const char of ["ب", "ت", "ن"]) if (needed.size < 8) needed.add(char);
  return ALPHABET.filter((char) => needed.has(char));
}

export function inputError(tokens: readonly string[], token: string): string | null {
  if (!(token in LETTER_NAMES) && !isMark(token)) return "Choose a tile from the tray.";
  if (tokens.length >= 18) return "That word is quite long! Use Undo or Clear to try again.";
  if (!isMark(token)) return null;
  if (!tokens.length) return "Choose a letter first. A mark belongs to a letter.";
  const last = clusters(tokens).at(-1);
  if (!last) return "Choose a letter first.";
  if (last.marks.includes(token)) return "That letter already has this mark. Try another tile.";
  if (SHORT_VOWELS.includes(token) && last.marks.some((m) => SHORT_VOWELS.includes(m))) {
    return "One short vowel at a time. Use Undo to change this letter's vowel.";
  }
  if ((token === "ْ" && last.marks.some((m) => SHORT_VOWELS.includes(m))) ||
      (SHORT_VOWELS.includes(token) && last.marks.includes("ْ"))) {
    return "Sukun means no vowel. Use Undo before choosing a different mark.";
  }
  return null;
}
