import { getItem, ITEMS, type ItemId } from "./content";
import { inputError, nextExpectedToken, wordsMatch } from "./arabic";

export type Overlay = "help" | "teacher" | "success" | "complete" | "reset" | null;
export type SavedProgress = { version: 1; completed: ItemId[]; guide: boolean; sound: boolean; selected: ItemId | null; input: string[] };
export type GameState = {
  hydrated: boolean; completed: ItemId[]; selected: ItemId | null; input: string[];
  guide: boolean; sound: boolean; hint: boolean; message: string; attention: boolean; overlay: Overlay;
};
export const INITIAL_STATE: GameState = {
  hydrated: false, completed: [], selected: null, input: [], guide: true, sound: true,
  hint: false, message: "", attention: false, overlay: null,
};

export function parseProgress(raw: string | null): SavedProgress {
  const fallback: SavedProgress = { version: 1, completed: [], guide: true, sound: true, selected: null, input: [] };
  if (!raw) return fallback;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || !("version" in value) || value.version !== 1) return fallback;
    const data = value as Partial<SavedProgress>;
    const selected = typeof data.selected === "string" && getItem(data.selected) ? data.selected : null;
    const input: string[] = [];
    if (selected && Array.isArray(data.input)) {
      for (const token of data.input.slice(0, 18)) {
        if (typeof token !== "string" || inputError(input, token)) break;
        input.push(token);
      }
    }
    return {
      version: 1, selected, input,
      completed: Array.isArray(data.completed)
        ? [...new Set(data.completed.filter((id): id is ItemId => typeof id === "string" && Boolean(getItem(id))))]
        : [],
      guide: typeof data.guide === "boolean" ? data.guide : true,
      sound: typeof data.sound === "boolean" ? data.sound : true,
    };
  } catch { return fallback; }
}

export type Action =
  | { type: "hydrate"; data: SavedProgress }
  | { type: "select"; id: ItemId }
  | { type: "tile"; char: string }
  | { type: "undo" | "clear" | "guide" | "sound" | "hint" | "check" | "continue" | "reset" }
  | { type: "overlay"; overlay: Overlay }
  | { type: "message"; text: string };

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "hydrate": return state.hydrated ? state : { ...state, completed: action.data.completed, guide: action.data.guide, sound: action.data.sound, selected: action.data.selected ?? null, input: action.data.input ?? [], hydrated: true };
    case "select": return { ...state, selected: action.id, input: [], hint: false, message: "", attention: false, overlay: null };
    case "tile": {
      if (!state.selected || state.overlay) return state;
      const error = inputError(state.input, action.char);
      return error ? { ...state, message: error, attention: true }
        : { ...state, input: [...state.input, action.char], message: "", attention: false };
    }
    case "undo": return { ...state, input: state.input.slice(0, -1), message: "", attention: false };
    case "clear": return { ...state, input: [], message: "A fresh start! Choose your first letter.", attention: false };
    case "guide": return { ...state, guide: !state.guide, hint: false };
    case "sound": return { ...state, sound: !state.sound };
    case "hint": {
      const item = getItem(state.selected);
      if (!item) return state;
      const next = nextExpectedToken(state.input, item.steps);
      return { ...state, hint: true, message: next || !state.input.length ? "Follow the glowing tile. You can do this!"
        : wordsMatch(state.input, item.arabic) ? "Your word is ready. Tap Check word!"
        : "Compare your word with the guide. Undo a tile, or Clear for a fresh start.", attention: false };
    }
    case "check": {
      const item = getItem(state.selected);
      if (!item) return state;
      if (!wordsMatch(state.input, item.arabic)) return {
        ...state, attention: true,
        message: nextExpectedToken(state.input, item.steps)
          ? "Keep going! Your word still needs a few letters or marks."
          : "Good try! Check the letters and their marks. Hint is here to help.",
      };
      return { ...state, completed: state.completed.includes(item.id) ? state.completed : [...state.completed, item.id],
        overlay: "success", message: "Masha Allah! You built the word!", attention: false };
    }
    case "continue": {
      if (state.completed.length === ITEMS.length) return { ...state, overlay: "complete" };
      const start = ITEMS.findIndex((item) => item.id === state.selected);
      const next = Array.from({ length: ITEMS.length }, (_, offset) => ITEMS[(start + offset + 1) % ITEMS.length])
        .find((item) => !state.completed.includes(item.id));
      return { ...state, selected: next?.id ?? null, input: [], overlay: null, hint: false, message: "", attention: false };
    }
    case "overlay": return { ...state, overlay: action.overlay };
    case "message": return { ...state, message: action.text, attention: false };
    case "reset": return { ...INITIAL_STATE, hydrated: true, guide: state.guide, sound: state.sound };
  }
}
