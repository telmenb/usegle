<script lang="ts">
	import Board from './Board.svelte';
	import Keyboard from './Keyboard.svelte';

	const wordLength = 5;
	let board = $state(new Array(wordLength + 1).fill('').map((_) => new Array(wordLength).fill('')));
	let currentRow = $state(0);
	let currentCol = $state(0);

	$inspect(currentRow);
	$inspect(currentCol);

	function keyClicked(key: string): void {
		if (key === 'enter') {
			if (currentCol !== wordLength - 1 || board[currentRow][currentCol] === '') {
				// Display error message
				return;
			}
			// Check if word exists in word bank
			//   If word not in word bank, display error message
			// Post current row to server to check if word is match
			updateCellAndKeyColors(board[currentRow].join("").toLowerCase(), "уруул"); // let's say API response is lowercase
			if (board[currentRow].join("").toLowerCase() === "уруул") {
				// End game
			}
			currentCol = 0;
			currentRow += 1;
			if (currentRow === wordLength + 1) {
				// End game
				return;
			}
			return;
		}

		if (key === 'backspace') {
			if (board[currentRow][currentCol] === '' && currentCol !== 0) {
				currentCol -= 1;
				board[currentRow][currentCol] = '';
				return;
			}
			board[currentRow][currentCol] = '';
			return;
		}

		if (currentCol === wordLength - 1 && board[currentRow][currentCol] !== '') {
			return;
		}

		board[currentRow][currentCol] = key;
		currentCol += currentCol === wordLength - 1 ? 0 : 1;
	}

	// TODO: Flesh out this logic
	function updateCellAndKeyColors(guess: string, answer: string): void {
		for (let i = 0; i < guess.length; i++) {
			let cell = document.getElementById(currentRow + '-' + i);
			let key = document.getElementById(guess[i].toUpperCase());
			if (guess[i] === answer[i]) {
				cell?.classList.add('bg-green-300');
				key?.classList.add('bg-green-300');
			} else if (answer.includes(guess[i])) {
				cell?.classList.add('bg-yellow-300');
				key?.classList.add('bg-yellow-300');
			} else {
				cell?.classList.add('bg-gray-500')
				key?.classList.add('bg-gray-500')
			}
		}
	}
</script>

<nav class="w-full border-b p-4 text-black dark:text-white">
	<a href="/about" class="hover:underline">About</a>
</nav>

<Board {board} />
<Keyboard {keyClicked} />

<h1 class="mt-24 text-3xl font-bold">Welcome to Usegle! ⌨️ 🚀</h1>
