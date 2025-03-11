import { SvelteMap } from "svelte/reactivity";
import { StateColor, TextColor } from "./colors";
import { clearStorage, getItemFromStorage } from "./storageHelper";

// Junk drawer for now
export const keys: Array<Array<string>> = [
  ['Е', 'Щ'],
  ['Ф', 'Ц', 'У', 'Ж', 'Э', 'Н', 'Г', 'Ш', 'Ү', 'З', 'К', 'Ъ'],
  ['Й', 'Ы', 'Б', 'Ө', 'А', 'Х', 'Р', 'О', 'Л', 'Д', 'П'],
  ['Я', 'Ч', 'Ё', 'С', 'М', 'И', 'Т', 'Ь', 'В', 'Ю']
];

export function initBoard(wordLength: number): Array<Array<Cell>> {
  const currentDate = new Date().toISOString().slice(0,10);
  const savedBoardState = getItemFromStorage(currentDate);
  if (savedBoardState) {
    console.log('we got a board bih');
    return JSON.parse(savedBoardState);
  }

  clearStorage();
  return new Array<Array<Cell>>(wordLength + 1).fill([]).map(() => {
    return new Array<Cell>(wordLength).fill({
      value: '',
      backgroundColor: StateColor.INACTIVE,
      textColor: TextColor.BLACK
    });
  });
}

export function initCurrentRow(): number
{
  return Number(getItemFromStorage('currentRow'));
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
