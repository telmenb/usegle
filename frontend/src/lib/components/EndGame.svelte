<script lang="ts">
	import Board from './Board.svelte';
	import { StateColor } from '$lib/colors';
	import type { Cell } from '$lib/index';
	import { toast } from '@zerodevx/svelte-toast';

	let { board, won } = $props();


	function buildShareText(): string {
		const date = new Date().toISOString().slice(0, 10);
		const scoredRows = board.filter((row: Cell[]) =>
			row.some(
				(cell: Cell) =>
					cell.backgroundColor === StateColor.CORRECT ||
					cell.backgroundColor === StateColor.PARTIAL ||
					cell.backgroundColor === StateColor.INCORRECT
			)
		);
		const rowCount = won ? scoredRows.length : 'X';

		const emojiRows = scoredRows
			.map((row: Cell[]) =>
				row
					.map((cell: Cell) => {
						if (cell.backgroundColor === StateColor.CORRECT) return '🟩';
						if (cell.backgroundColor === StateColor.PARTIAL) return '🟨';
						return '⬛';
					})
					.join('')
			)
			.join('\n');

		return `Usegle ${date} ${rowCount}/${board.length}\n\n${emojiRows}`;
	}

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(buildShareText());
		} catch {
			const el = document.createElement('textarea');
			el.value = buildShareText();
			document.body.appendChild(el);
			el.select();
			document.execCommand('copy');
			document.body.removeChild(el);
		} finally {
			toast.push('Үр дүн хуулагдлаа');
		}
	}
</script>

<div class="flex w-full max-w-lg flex-col items-center px-4">
	<h1 class="text-center text-2xl font-semibold sm:text-3xl">
		{#if won}
			Баяр хүргэе 🥳
		{:else}
			Даанч буруу бөглөлөө 😅
		{/if}
	</h1>
	<h1 class="mb-8 mt-3 text-center text-lg sm:mb-16 sm:mt-4 sm:text-xl">
		{#if won}
			Та амжилттай бөглөлөө.<br />
			Маргааш дахин тоглоорой!
		{:else}
			Маргааш дахин оролдоорой!
		{/if}
	</h1>
	<div class="flex w-full justify-center">
		<Board {board} />
	</div>

	<button
		onclick={copyToClipboard}
		class="mt-6 sm:mt-10 flex items-center gap-2 rounded-lg bg-green-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-green-600 active:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
	>
		Хуулах
	</button>
</div>
