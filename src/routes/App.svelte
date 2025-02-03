<script lang="ts">
	import Board from './Board.svelte';
	import Keyboard from './Keyboard.svelte';

	const wordLength = 5;
	let board = $state(new Array(wordLength + 1).fill('').map((_) => new Array(wordLength).fill('')));
	let currentRow = $state(0);
	let currentCol = $state(0);

	$inspect(currentRow);
	$inspect(currentCol);

	function keyClicked(key: string) {
		if (key === 'enter') {
			if (currentCol !== wordLength - 1 || board[currentRow][currentCol] === '') {
				// Display error message
				return;
			}
			currentRow += 1;
			currentCol = 0;
			// Check if all cells in row are filled
			// Check if word exists in word bank
			//   If word not in word bank, display error message
			// Post current row to server to check if word is match
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
</script>

<nav class="w-full border-b p-4 text-black dark:text-white">
	<a href="/about" class="hover:underline">About</a>
</nav>

<Board {board} />
<Keyboard {keyClicked} />

<h1 class="mt-24 text-3xl font-bold">Welcome to Usegle! ⌨️ 🚀</h1>
