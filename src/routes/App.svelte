<script lang="ts">
	import Board from './Board.svelte';
	import Keyboard from './Keyboard.svelte';

	const WORD_LENGTH = 5;
	const ANSWER = "хамаг";
	const CORRECT = "bg-green-500";
	const INCORRECT = "bg-gray-500";
	const PARTIAL = "bg-yellow-500";
	const INACTIVE = "bg-gray-300";

	let board = $state(new Array(WORD_LENGTH + 1).fill('').map((_) => new Array(WORD_LENGTH).fill('')));
	let currentRow = $state(0);
	let currentCol = $state(0);

	$inspect(currentRow);
	$inspect(currentCol);

	function keyClicked(key: string): void {
		if (key === 'enter') {
			handleEnterPress();
			return;
		}

		if (key === 'backspace') {
			handleBackspacePress();
			return;
		}

		if (currentCol === WORD_LENGTH - 1 && board[currentRow][currentCol] !== '') {
			return;
		}

		board[currentRow][currentCol] = key;
		currentCol += currentCol === WORD_LENGTH - 1 ? 0 : 1;
	}

	function handleEnterPress() {
		if (currentCol !== WORD_LENGTH - 1 || board[currentRow][currentCol] === '') {
				// Display error message
				return;
			}

			// Check if word exists in word bank
			//   If word not in word bank, display error message

			// Post current row to server to check if word is match

			updateCellAndKeyColors(board[currentRow].join("").toLowerCase(), ANSWER); // let's say API response is lowercase
			if (board[currentRow].join("").toLowerCase() === ANSWER) {
				// End game
			}
			currentCol = 0;
			currentRow += 1;
			if (currentRow === WORD_LENGTH + 1) {
				// End game
				return;
			}
	}

	function handleBackspacePress() {
		if (board[currentRow][currentCol] === '' && currentCol !== 0) {
				currentCol -= 1;
				board[currentRow][currentCol] = '';
				return;
			}
			board[currentRow][currentCol] = '';
	}

	function updateCellAndKeyColors(guess: string, answer: string): void {
		for (let i = 0; i < guess.length; i++) {
			let cell = document.getElementById(currentRow + '-' + i);
			let key = document.getElementById(guess[i].toUpperCase());
			if (guess[i] === answer[i]) {
				tryUpdateHtmlElementBackgroundColor(cell, CORRECT);
				tryUpdateHtmlElementBackgroundColor(key, CORRECT);
			} else if (answer.includes(guess[i])) {
				tryUpdateHtmlElementBackgroundColor(cell, PARTIAL);
				tryUpdateHtmlElementBackgroundColor(key, PARTIAL);
			} else {
				tryUpdateHtmlElementBackgroundColor(cell, INCORRECT);
				tryUpdateHtmlElementBackgroundColor(key, INCORRECT);
			}
		}
	}

	function tryUpdateHtmlElementBackgroundColor(element: HTMLElement | null, bgColor: string) {
		element?.classList.remove(INACTIVE);
		if (bgColor === PARTIAL) {
			if (!element?.classList.contains(CORRECT)) {
				element?.classList.add(PARTIAL);
				element?.classList.add("text-white");
			}
			return;
		}
		element?.classList.remove(CORRECT);
		element?.classList.remove(PARTIAL);
		element?.classList.remove(INCORRECT);
		element?.classList.add(bgColor);
		element?.classList.add("text-white");
	}
</script>

<nav class="w-full border-b p-4 text-black dark:text-white">
	<a href="/about" class="hover:underline">About</a>
</nav>

<Board {board} />
<Keyboard {keyClicked} />
