<script lang="ts">
	import { fly } from 'svelte/transition';
	import { modals } from 'svelte-modals';
	import { toast } from '@zerodevx/svelte-toast';
	import type { PageProps } from './$types';
	import axios from 'axios';
	import Board from '$lib/components/Board.svelte';
	import Keyboard from '$lib/components/Keyboard.svelte';
	import HowToPlayModal from '$lib/components/HowToPlayModal.svelte';
	import { initBoard, initCurrentRow, initKeysColorMap, initWon, type Cell } from '$lib';
	import { TextColor, StateColor } from '$lib/colors';
	import type { SvelteMap } from 'svelte/reactivity';
	import EndGame from '$lib/components/EndGame.svelte';
	import { setItemInStorage, getItemFromStorage } from '$lib/storageHelper';
	import { PUBLIC_USEGLE_API_HOST } from '$env/static/public';
	import { onMount, onDestroy } from 'svelte';

	let { data }: PageProps = $props();

	let darkMode: boolean = $state(false);
	const wordLength: number = $derived(data.wordLength);
	let keysColorMap: SvelteMap<string, StateColor> = $state(initKeysColorMap());
	let board: Array<Array<Cell>> = $state([]);
	let currentRow: number = $state(0);
	let currentCol: number = $state(0);
	let won: boolean = $state(false);
	$effect(() => {
		board = initBoard(wordLength);
		currentRow = initCurrentRow();
		won = initWon();
	});
	let gameOver: boolean = $derived(currentRow > data.wordLength);

	// Countdown timer implementation
	let timeLeft: { hours: number; minutes: number; seconds: number } = $state({
		hours: 0,
		minutes: 0,
		seconds: 0
	});
	let timerInterval: number;

	function updateTimeLeft() {
		const now = new Date();
		const tomorrow = new Date();
		tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
		tomorrow.setUTCHours(0, 0, 0, 0);

		const diffMs = tomorrow.getTime() - now.getTime();
		const diffSecs = Math.floor(diffMs / 1000);

		const hours = Math.floor(diffSecs / 3600);
		const minutes = Math.floor((diffSecs % 3600) / 60);
		const seconds = diffSecs % 60;

		timeLeft = { hours, minutes, seconds };
	}

	function toggleDarkMode() {
		darkMode = !darkMode;
		if (darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
		setItemInStorage('darkMode', darkMode);
	}

	onMount(() => {
		// Initialize dark mode from storage
		const storedDarkMode = getItemFromStorage('darkMode');
		if (storedDarkMode !== null) {
			darkMode = storedDarkMode === 'true' || Boolean(storedDarkMode) === true;
		} else {
			// Check if user prefers dark mode
			const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
			darkMode = prefersDarkMode;
		}

		// Apply dark mode
		if (darkMode) {
			document.documentElement.classList.add('dark');
		}

		// Start timer
		updateTimeLeft();
		timerInterval = setInterval(updateTimeLeft, 1000);
	});

	onDestroy(() => {
		clearInterval(timerInterval);
	});

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
		currentRow = won ? wordLength + 1 : currentRow + 1;

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

<nav class="w-full border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
	<button onclick={() => modals.open(HowToPlayModal)} class="hover:opacity-80 transition-opacity">
		<img src="question-mark.svg" alt="How to play" class="h-8 w-8 dark:invert" />
	</button>

	<div class="text-center">
		<p class="text-sm text-gray-600 dark:text-gray-300">Шинэ үг гарахад</p>
		<div class="font-mono text-lg">
			{timeLeft.hours.toString().padStart(2, '0')}:{timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}
		</div>
	</div>

	<button onclick={toggleDarkMode} class="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
		{#if darkMode}
			<!-- Sun icon -->
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
				<path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
			</svg>
		{:else}
			<!-- Moon icon -->
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
				<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
			</svg>
		{/if}
	</button>
</nav>

<main class="container mx-auto px-4 py-8">
	{#if gameOver}
		<div
			class="flex flex-col items-center justify-center"
			style="height: 70vh"
			transition:fly={{ y: 200, duration: 1000 }}
		>
			<EndGame {board} {won} />
		</div>
	{:else}
		<div class="flex flex-col items-center justify-evenly h-full gap-8">
			<Board {board} />
			<Keyboard {keyClicked} {keysColorMap} />
		</div>
	{/if}
</main>
