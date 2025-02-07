<script lang="ts">
	import Board from './Board.svelte';
	import Keyboard from './Keyboard.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { keys } from '$lib';
	import { TextColor, StateColor } from '$lib/colors';

	const WORD_LENGTH = 5;
	const ANSWER = 'хамаг';

	let darkMode = $state(false);
	let board = $state(initBoard());
	let keysColorMap = $state(initKeysColorMap());

	let currentRow = $state(0);
	let currentCol = $state(0);

	// $inspect(board);
	// $inspect(keysColorMap);
	// $inspect(currentRow);
	// $inspect(currentCol);

	function initBoard(): Array<Array<Cell>> {
		return new Array<Array<Cell>>(WORD_LENGTH + 1).fill([]).map(() => {
			return new Array<Cell>(WORD_LENGTH).fill({
				value: '',
				backgroundColor: StateColor.INACTIVE,
				textColor: darkMode ? TextColor.WHITE : TextColor.BLACK
			});
		});
	}

	function initKeysColorMap(): SvelteMap<string, StateColor> {
		let keysMap = new SvelteMap<string, StateColor>();
		keys.forEach((row) => {
			row.forEach((key) => {
				keysMap.set(key, StateColor.INACTIVE);
			});
		});
		return keysMap;
	}

	function keyClicked(key: string): void {
		if (key === 'enter') {
			handleEnterPress();
			return;
		}

		if (key === 'backspace') {
			handleBackspacePress();
			return;
		}

		if (currentCol === WORD_LENGTH - 1 && board[currentRow][currentCol].value !== '') {
			return;
		}

		board[currentRow][currentCol].value = key;
		currentCol += currentCol === WORD_LENGTH - 1 ? 0 : 1;
	}

	function handleEnterPress(): void {
		if (currentCol !== WORD_LENGTH - 1 || board[currentRow][currentCol].value === '') {
			// Display error message
			return;
		}

		// Check if word exists in word bank
		//   If word not in word bank, display error message

		// Post current row to server to check if word is match

		let guess = board[currentRow]
			.map((row) => row.value)
			.join('').toLowerCase();
		updateCellAndKeyColors(guess, ANSWER); // let's say API response is lowercase
		if (guess === ANSWER) {
			// End game
		}
		currentCol = 0;
		currentRow += 1;
		if (currentRow === WORD_LENGTH + 1) {
			// End game
			return;
		}
	}

	function handleBackspacePress(): void {
		if (board[currentRow][currentCol].value === '' && currentCol !== 0) {
			currentCol -= 1;
			board[currentRow][currentCol].value = '';
			return;
		}
		board[currentRow][currentCol].value = '';
	}

	function updateCellAndKeyColors(guess: string, answer: string): void {
		for (let i = 0; i < guess.length; i++) {
			let key = guess[i].toUpperCase();
			if (guess[i] === answer[i]) {
				setCellBackgroundColor(i, StateColor.CORRECT);
				setKeyBackgroundColor(key, StateColor.CORRECT);
			} else if (answer.includes(guess[i])) {
				setCellBackgroundColor(i, StateColor.PARTIAL);
				setKeyBackgroundColor(key, StateColor.PARTIAL);
			} else {
				setCellBackgroundColor(i, StateColor.INCORRECT);
				setKeyBackgroundColor(key, StateColor.INCORRECT);
			}
			board[currentRow][i].textColor = TextColor.WHITE;
		}
	}

	function setCellBackgroundColor(idx: number, color: StateColor): void {
		let currentCell = board[currentRow][idx];
		if (color === StateColor.PARTIAL) {
			if (currentCell.backgroundColor !== StateColor.CORRECT) {
				currentCell.backgroundColor = StateColor.PARTIAL;
			}
			return;
		}
		currentCell.backgroundColor = color;
	}

	function setKeyBackgroundColor(key: string, color: StateColor): void {
		keysColorMap.set(key, color);
	}

	interface Cell {
		value: string;
		backgroundColor: StateColor;
		textColor: TextColor;
	}
</script>

<nav class="w-full border-b p-4 text-black dark:text-white">
	<a href="/about" class="hover:underline">About</a>
</nav>

<Board {board} />
<Keyboard {keyClicked} {keysColorMap} />
