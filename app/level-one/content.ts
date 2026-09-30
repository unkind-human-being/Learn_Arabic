/** Level 1 vocabulary. Harakat are separate input tokens, not alphabet letters.
 * Words are taught in standalone/pausal form, without grammatical case endings.
 * Keep lesson paraphrases distinct from the practical activity and source text.
 */
export type ItemId = "cap" | "shirt" | "pants" | "socks" | "shoes" | "bag";
export type Area = { left: number; top: number; width: number; height: number };
export type ClothingItem = {
  id: ItemId;
  english: string;
  arabic: string;
  pronunciation: string;
  steps: readonly string[];
  vocabularySource: string;
  audioSrc?: string;
  areas: readonly Area[];
  label: { side: "left" | "right"; top: number };
  lesson: { title: string; meaning: string; activity: string; source: string; url: string; note: string };
};

// Spaces in your existing folder name are intentionally preserved.
export const ASSET_BASE = "/assets/child%20wearing";
export const CHILD_IMAGE = `${ASSET_BASE}/child.png`;
export const SUCCESS_AUDIO: string | undefined = undefined;
// Optional example: SUCCESS_AUDIO = "/audio/masha-allah.mp3";
export const STORAGE_KEY = "learn-arabic:wear-to-madrasa:v1";

export const ITEMS: readonly ClothingItem[] = [
  {
    id: "cap", english: "Cap", arabic: "طَاقِيَّة", pronunciation: "taa-qiy-yah",
    steps: ["ط", "َ", "ا", "ق", "ِ", "ي", "ّ", "َ", "ة"],
    vocabularySource: "https://dictionary.ksaa.gov.sa/entry/اسم%20ذات/طَاقِيَّة",
    areas: [{ left: 37, top: 1, width: 25, height: 13 }],
    label: { side: "left", top: 10 },
    lesson: {
      title: "Nice clothes, kind heart",
      meaning: "The Prophet ﷺ taught that enjoying nice clothes is not arrogance. Looking down on people is wrong.",
      activity: "Be kind to your friends, whatever they wear.",
      source: "Sahih Muslim 91a", url: "https://sunnah.com/muslim:91a",
      note: "A general teaching about clothing and humility, not a claim that this particular cap is required. The child text is a paraphrase, not a quotation.",
    },
  },
  {
    id: "shirt", english: "Shirt", arabic: "قَمِيص", pronunciation: "qa-mees",
    steps: ["ق", "َ", "م", "ِ", "ي", "ص"],
    vocabularySource: "https://en.wiktionary.org/wiki/قميص#Arabic",
    areas: [{ left: 43, top: 24, width: 15, height: 31 }, { left: 30, top: 39, width: 9, height: 14 }],
    label: { side: "left", top: 37 },
    lesson: {
      title: "Right sleeve first",
      meaning: "The Prophet ﷺ taught us to begin with the right side when putting on clothes.",
      activity: "Put your right arm into your shirt first.",
      source: "Sunan Abi Dawud 4141", url: "https://sunnah.com/abudawud:4141",
      note: "Graded Sahih by Al-Albani on the linked source. The sleeve activity applies the general instruction about dressing.",
    },
  },
  {
    id: "pants", english: "Pants", arabic: "سِرْوَال", pronunciation: "sir-waal",
    steps: ["س", "ِ", "ر", "ْ", "و", "َ", "ا", "ل"],
    vocabularySource: "https://en.wiktionary.org/wiki/سروال#Arabic",
    areas: [{ left: 37, top: 56, width: 27, height: 28 }],
    label: { side: "right", top: 62 },
    lesson: {
      title: "Start on the right",
      meaning: "The Prophet ﷺ taught us to begin with the right side when getting dressed.",
      activity: "When putting on your pants, start with your right leg.",
      source: "Sunan Abi Dawud 4141", url: "https://sunnah.com/abudawud:4141",
      note: "A child-friendly application of the general dressing instruction. This is not presented as a separate pants-specific narration.",
    },
  },
  {
    id: "socks", english: "Socks", arabic: "جَوَارِب", pronunciation: "ja-waa-rib",
    steps: ["ج", "َ", "و", "َ", "ا", "ر", "ِ", "ب"],
    vocabularySource: "https://en.wiktionary.org/wiki/جورب#Arabic",
    areas: [{ left: 40, top: 85, width: 8, height: 4 }, { left: 56, top: 85, width: 8, height: 4 }],
    label: { side: "left", top: 84 },
    lesson: {
      title: "A little habit to remember",
      meaning: "The Prophet ﷺ taught us to begin with the right side when putting on clothes.",
      activity: "Try putting your right sock on first today.",
      source: "Sunan Abi Dawud 4141", url: "https://sunnah.com/abudawud:4141",
      note: "The activity applies the general dressing instruction; the source is not a socks-specific narration. The vocabulary is the plural of جَوْرَب.",
    },
  },
  {
    id: "shoes", english: "Shoes", arabic: "أَحْذِيَة", pronunciation: "ah-dhi-yah",
    steps: ["أ", "َ", "ح", "ْ", "ذ", "ِ", "ي", "َ", "ة"],
    vocabularySource: "https://madinaharabic.com/free-content/vocabulary/clothes/shoe",
    areas: [{ left: 33, top: 89, width: 16, height: 8 }, { left: 55, top: 89, width: 14, height: 8 }],
    label: { side: "right", top: 88 },
    lesson: {
      title: "Right on. Left off.",
      meaning: "The Prophet ﷺ taught us to put the right shoe on first, and take the left shoe off first.",
      activity: "Point to your right foot. That shoe goes on first!",
      source: "Sahih al-Bukhari 5855", url: "https://sunnah.com/bukhari:5855",
      note: "A child-friendly paraphrase of the instruction about shoes. The Arabic word used is the plural of حِذَاء, to match the English label Shoes.",
    },
  },
  {
    id: "bag", english: "Bag", arabic: "حَقِيبَة", pronunciation: "ha-qee-bah",
    steps: ["ح", "َ", "ق", "ِ", "ي", "ب", "َ", "ة"],
    vocabularySource: "https://en.wiktionary.org/wiki/حقيبة#Arabic",
    areas: [{ left: 38, top: 23, width: 6, height: 20 }, { left: 55, top: 23, width: 7, height: 20 }],
    label: { side: "right", top: 27 },
    lesson: {
      title: "Ready to learn something good",
      meaning: "The Prophet ﷺ taught that Allah makes a path to Paradise easier for someone who seeks knowledge.",
      activity: "Pack your learning things and go to Madrasa ready to learn.",
      source: "Sahih Muslim 2699a", url: "https://sunnah.com/muslim:2699a",
      note: "A general teaching about seeking knowledge. This is not a claim that there is a special narration about school bags.",
    },
  },
];

export function getItem(id: string | null): ClothingItem | undefined {
  return ITEMS.find((item) => item.id === id);
}

export function itemImage(id: ItemId): string {
  return `${ASSET_BASE}/${id}.png`;
}
