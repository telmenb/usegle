<script lang="ts">
	import { fly } from 'svelte/transition';
	import { modals } from 'svelte-modals';
	import { toast } from '@zerodevx/svelte-toast';
	import axios, { type AxiosResponse } from 'axios';
	import Board from '$lib/components/Board.svelte';
	import Keyboard from '$lib/components/Keyboard.svelte';
	import HowToPlayModal from '$lib/components/HowToPlayModal.svelte';
	import { TextColor, StateColor } from '$lib/colors';
	import type { SvelteMap } from 'svelte/reactivity';
	import EndGame from '$lib/components/EndGame.svelte';
	import { setItemInStorage, getItemFromStorage } from '$lib/storageHelper';
	import { PUBLIC_USEGLE_API_HOST } from '$env/static/public';
	import { onMount, onDestroy } from 'svelte';
	import {
		getThemeContext,
		initBoard,
		initCurrentRow,
		initKeysColorMap,
		initWon,
		type Cell
	} from '$lib';

	let { data } = $props();
	let theme = getThemeContext();

	let currentRow: number = $state(0);
	let currentCol: number = $state(0);
	const wordLength: number = $derived(data.wordLength);
	let keysColorMap: SvelteMap<string, StateColor> = $state(initKeysColorMap());
	let board: Array<Array<Cell>> = $state([]);
	let won: boolean = $state(false);
	let gameOver: boolean = $derived(currentRow > data.wordLength);
	let isLoading: boolean = $state(true);

	let timeLeft: { hours: number; minutes: number; seconds: number } = $state({
		hours: 0,
		minutes: 0,
		seconds: 0
	});
	let timerInterval: number;

	function isFirstVisit(): boolean {
		return getItemFromStorage('hasSeenTutorial') !== 'true';
	}

	$effect(() => {
		if (wordLength > 0) {
			board = initBoard(wordLength);
		}
	});

	onMount(() => {
		currentRow = initCurrentRow();
		won = initWon();
		isLoading = false;

		updateTimeLeft();
		timerInterval = setInterval(updateTimeLeft, 1000);

		setTimeout(() => {
			if (isFirstVisit()) {
				modals.open(HowToPlayModal, {
					onClose: () => setItemInStorage('hasSeenTutorial', 'true')
				});
			}
		}, 300);
	});

	onDestroy(() => {
		clearInterval(timerInterval);
	});

	function toggleDarkMode() {
		theme.darkMode = !theme.darkMode;
		setItemInStorage('darkMode', theme.darkMode ? 'true' : 'false');

		if (theme.darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

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
			return;
		}

		updateCellAndKeyColors(guess, result);

		if (board[currentRow].every((cell) => cell.backgroundColor === StateColor.CORRECT)) {
			won = true;
			setItemInStorage('won', 'true');
		}
		currentCol = 0;
		currentRow = won ? wordLength + 1 : currentRow + 1;

		setItemInStorage(new Date().toISOString().slice(0, 10), JSON.stringify(board));
		setItemInStorage('currentRow', JSON.stringify(currentRow));
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
		try {
			const response = await axios.post(
				`${PUBLIC_USEGLE_API_HOST}/api/game/checkGuess`,
				{ guess },
				{
					timeout: 10000, // 10 second timeout
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);
			result = response.data.result;
		} catch (error) {
			if (axios.isAxiosError(error) && error.response) {
				handleAxiosErrorResponse(error.response);
			}
			result = [];
		}
		return result;
	}

	function handleAxiosErrorResponse(response: AxiosResponse<any, any>): void {
		if (response.status === 404) {
			toast.push('Бөглөсөн үг үгийн санд байхгүй байна');
		} else {
			toast.push(`Серверийн алдаа: ${response.status}`);
			console.error('Response error:', response.status, response.data);
		}
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

<nav
	class="flex w-full items-center justify-between border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-6 dark:border-gray-700"
>
	<button
		onclick={() => modals.open(HowToPlayModal)}
		class="flex h-8 w-8 touch-manipulation items-center justify-center rounded-full hover:bg-gray-200 sm:h-10 sm:w-10 lg:h-12 lg:w-12 dark:hover:bg-gray-700"
	>
		<img
			src="question-mark.svg"
			alt="How to play"
			class="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 dark:invert"
		/>
	</button>

	<div class="text-center">
		<p class="text-xs text-gray-600 sm:text-sm lg:text-base dark:text-gray-300">Шинэ үг гарахад</p>
		<div class="font-mono text-sm sm:text-lg lg:text-xl xl:text-2xl">
			{timeLeft.hours.toString().padStart(2, '0')}:{timeLeft.minutes
				.toString()
				.padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}
		</div>
	</div>

	<button
		onclick={toggleDarkMode}
		class="flex h-8 w-8 touch-manipulation items-center justify-center rounded-full hover:bg-gray-200 sm:h-8 sm:w-8 lg:h-12 lg:w-12 dark:hover:bg-gray-700"
	>
		{#if theme.darkMode}
			<!-- Sun icon -->
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
					clip-rule="evenodd"
				/>
			</svg>
		{:else}
			<!-- Moon icon -->
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
			</svg>
		{/if}
	</button>
</nav>

<main
	class="container flex h-full flex-1 flex-col px-2 py-4 sm:px-4 sm:py-8 lg:px-8 lg:py-12 xl:max-w-6xl overflow-hidden"
>
	{#if isLoading}
		<div class="flex flex-1 items-center justify-center">
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 sm:h-16 sm:w-16 lg:h-20 lg:w-20"
			></div>
		</div>
	{:else if gameOver}
		<div
			class="flex flex-1 flex-col items-center justify-center"
			in:fly={{ y: 200, duration: 1000 }}
		>
			<EndGame {board} {won} />
		</div>
	{:else}
		<div
			class="flex h-full max-h-full flex-col items-center justify-center gap-2 sm:gap-4 lg:gap-8"
			in:fly={{ y: 20, duration: 300 }}
		>
			<div class="flex max-h-[50vh] flex-1 items-center justify-center sm:max-h-[60vh] lg:max-h-none">
				<Board {board} />
			</div>
			<div class="w-full max-w-lg lg:max-w-2xl xl:max-w-4xl flex-shrink-0">
				<Keyboard {keyClicked} {keysColorMap} />
			</div>
		</div>
	{/if}
</main>
