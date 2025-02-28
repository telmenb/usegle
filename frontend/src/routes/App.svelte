<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
  import { modals } from 'svelte-modals'
	import type { PageProps } from './$types';
	import axios from 'axios';
	import Board from '$lib/components/Board.svelte';
	import Keyboard from '$lib/components/Keyboard.svelte';
	import HowToPlayModal from '$lib/components/HowToPlayModal.svelte';
	import AboutModal from '$lib/components/AboutModal.svelte';
	import { keys } from '$lib';
	import { TextColor, StateColor } from '$lib/colors';

	let { data }: PageProps = $props();

	let darkMode = $state(false);
	const wordLength = $derived(data.wordLength);
	let board = $state(initBoard());
	let keysColorMap = $state(initKeysColorMap());

	let currentRow = $state(0);
	let currentCol = $state(0);

	// $inspect(board);
	// $inspect(keysColorMap);
	// $inspect(currentRow);
	// $inspect(currentCol);

	function initBoard(): Array<Array<Cell>> {
		console.log('wordlength:', wordLength);
		return new Array<Array<Cell>>(wordLength + 1).fill([]).map(() => {
			return new Array<Cell>(wordLength).fill({
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

		let currentCell = board[currentRow][currentCol];
		if (currentCol === wordLength - 1 && currentCell.value !== '') {
			return;
		}

		currentCell.value = key;
		currentCell.backgroundColor = StateColor.ACTIVE;
		currentCol += currentCol === wordLength - 1 ? 0 : 1;
	}

	async function handleEnterPress(): Promise<void> {
		if (currentCol !== wordLength - 1 || board[currentRow][currentCol].value === '') {
			// Display error message
			return;
		}

		// Post current row to server to check if word in wordbank and is match
		let guess = board[currentRow]
			.map((row) => row.value)
			.join('')
			.toLowerCase();
		let result = await checkGuess(guess);

		// Maybe return 404 if not found in wordbank
		updateCellAndKeyColors(guess, result);

		if (board[currentRow].every((cell) => cell.backgroundColor === StateColor.CORRECT)) {
			// End game
		}
		currentCol = 0;
		currentRow += 1;
		if (currentRow === wordLength + 1) {
			// End game
			return;
		}
	}

	function handleBackspacePress(): void {
		if (board[currentRow][currentCol].value === '' && currentCol !== 0) {
			currentCol -= 1;
			board[currentRow][currentCol].value = '';
			board[currentRow][currentCol].backgroundColor = StateColor.INACTIVE;
			return;
		}
		board[currentRow][currentCol].value = '';
		board[currentRow][currentCol].backgroundColor = StateColor.INACTIVE;
	}

	async function checkGuess(guess: string): Promise<Array<number>> {
		let result: Array<number> = [];
		await axios
			.post('http://localhost:3000/api/game/checkGuess', { guess })
			.then((response) => {
				console.log(response.data);
				result = response.data.result;
			})
			.catch((error) => {
				console.error(error);
			});
		return result;
	}

	function updateCellAndKeyColors(guess: string, result: Array<number>): void {
		console.log(result);
		for (let i = 0; i < guess.length; i++) {
			let key = guess[i].toUpperCase();
			if (result[i] === 1) {
				setCellBackgroundColor(i, StateColor.CORRECT);
				setKeyBackgroundColor(key, StateColor.CORRECT);
			} else if (result[i] === 0) {
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
		currentCell.backgroundColor = color;
	}

	function setKeyBackgroundColor(key: string, color: StateColor): void {
		if (keysColorMap.get(key) === StateColor.CORRECT ||
			 (keysColorMap.get(key) === StateColor.PARTIAL && color === StateColor.INCORRECT)) {
			return;
		}
		keysColorMap.set(key, color);
	}

	interface Cell {
		value: string;
		backgroundColor: StateColor;
		textColor: TextColor;
	}
</script>

<nav class="w-full border-b px-6 py-4 text-black dark:text-white space-x-2">
	<button onclick={() => modals.open(AboutModal)} class="hover:underline">
		<img src="info.svg" alt="About" class="w-8 h-8" />
	</button>
	<button onclick={() => modals.open(HowToPlayModal)} class="hover:underline">
		<img src="question-mark.svg" alt="How to play" class="w-8 h-8" />
	</button>
</nav>

<Board {board} />
<Keyboard {keyClicked} {keysColorMap} />
