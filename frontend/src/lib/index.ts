import { SvelteMap } from "svelte/reactivity";
import { StateColor, TextColor } from "./colors";

// Junk drawer for now
export const keys: Array<Array<string>> = [
  ['Е', 'Щ'],
  ['Ф', 'Ц', 'У', 'Ж', 'Э', 'Н', 'Г', 'Ш', 'Ү', 'З', 'К', 'Ъ'],
  ['Й', 'Ы', 'Б', 'Ө', 'А', 'Х', 'Р', 'О', 'Л', 'Д', 'П'],
  ['Я', 'Ч', 'Ё', 'С', 'М', 'И', 'Т', 'Ь', 'В', 'Ю']
];

export function initBoard(wordLength: number, darkModeEnabled: boolean): Array<Array<Cell>> {
  return new Array<Array<Cell>>(wordLength + 1).fill([]).map(() => {
    return new Array<Cell>(wordLength).fill({
      value: '',
      backgroundColor: StateColor.INACTIVE,
      textColor: darkModeEnabled ? TextColor.WHITE : TextColor.BLACK
    });
  });
}

export function initKeysColorMap(): SvelteMap<string, StateColor> {
  const keysMap = new SvelteMap<string, StateColor>();
  keys.forEach((row) => {
    row.forEach((key) => {
      keysMap.set(key, StateColor.INACTIVE);
    });
  });
  return keysMap;
}

export interface Cell {
  value: string;
  backgroundColor: StateColor;
  textColor: TextColor;
}
