<script lang="ts">
	import { fly } from 'svelte/transition';
	import { modals } from 'svelte-modals';
	import { toast } from '@zerodevx/svelte-toast';
	import type { PageProps } from './$types';
	import axios from 'axios';
	import Board from '$lib/components/Board.svelte';
	import Keyboard from '$lib/components/Keyboard.svelte';
	import HowToPlayModal from '$lib/components/HowToPlayModal.svelte';
	import AboutModal from '$lib/components/AboutModal.svelte';
	import { initBoard, initCurrentRow, initKeysColorMap, initWon, type Cell } from '$lib';
	import { TextColor, StateColor } from '$lib/colors';
	import type { SvelteMap } from 'svelte/reactivity';
	import EndGame from '$lib/components/EndGame.svelte';
	import { setItemInStorage } from '$lib/storageHelper';
	import { PUBLIC_USEGLE_API_HOST } from '$env/static/public'

	let { data }: PageProps = $props();

	let darkMode: boolean = $state(false);
	const wordLength: number = $derived(data.wordLength);
	let keysColorMap: SvelteMap<string, StateColor> = $state(initKeysColorMap());
	
	let board: Array<Array<Cell>> = $state([]);
		let currentRow = $state(0);
		let currentCol = $state(0);
		let won: boolean = $state(false);
		$effect(() => {
			board = initBoard(wordLength);
			currentRow = initCurrentRow();
			won = initWon();
		});
		let gameOver: boolean = $derived(currentRow >= data.wordLength);

	// $inspect(board);
	// $inspect(keysColorMap);
	// $inspect(currentRow);
	// $inspect(currentCol);

	function keyClicked(key: string): void {
		if (gameOver) {
			return;
		}

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
			toast.push('Дутуу бөглөсөн байна');
			return;
		}

		// Post current row to server to check if word in wordbank and is match
		let guess = board[currentRow]
			.map((row) => row.value)
			.join('')
			.toLowerCase();
		let result = await checkGuess(guess);

		// Show error if word not in wordbank
		if (result.length === 0) {
			toast.push('Бөглөсөн үг үгийн санд байхгүй байна');
			return;
		}

		updateCellAndKeyColors(guess, result);

		if (board[currentRow].every((cell) => cell.backgroundColor === StateColor.CORRECT)) {
			won = true;
			setItemInStorage('won', true);
		}
		currentCol = 0;
		currentRow += won ? wordLength + 1 : 1;

		setItemInStorage(new Date().toISOString().slice(0, 10), board);
		setItemInStorage('currentRow', currentRow);
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
			.post(`${PUBLIC_USEGLE_API_HOST}/api/game/checkGuess`, { guess })
			.then((response) => {
				console.log(response.data);
				result = response.data.result;
			})
			.catch((error) => {
				console.error(error);
				result = [];
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
		if (
			keysColorMap.get(key) === StateColor.CORRECT ||
			(keysColorMap.get(key) === StateColor.PARTIAL && color === StateColor.INCORRECT)
		) {
			return;
		}
		keysColorMap.set(key, color);
	}
</script>

<nav class="w-full space-x-2 border-b px-6 py-4 text-black dark:text-white">
	<!-- <button onclick={() => modals.open(AboutModal)} class="hover:underline">
		<img src="info.svg" alt="About" class="w-8 h-8" />
	</button> -->
	<button onclick={() => modals.open(HowToPlayModal)} class="hover:underline">
		<img src="question-mark.svg" alt="How to play" class="h-8 w-8" />
	</button>
</nav>

{#if gameOver}
	<div
		class="flex flex-col items-center justify-center"
		style="height: 80vh"
		transition:fly={{ y: 200, duration: 1000 }}
	>
		<EndGame {board} {won} />
	</div>
{:else}
	<div class="flex flex-col items-center justify-evenly h-full">
		<Board {board} />
		<Keyboard {keyClicked} {keysColorMap} />
	</div>
{/if}
