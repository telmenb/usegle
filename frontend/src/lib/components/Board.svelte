<script lang="ts">
	import { getThemeContext, type Cell } from '$lib';
	import { StateColor, TextColor } from '$lib/colors';

	let { board } = $props();
	let theme = getThemeContext();

	const baseCellClasses = `game-cell touch-manipulation rounded border border-gray-300 text-center font-semibold transition-colors duration-500 dark:border-gray-400 h-10 w-10 text-lg md:h-14 md:w-14 md:text-3xl lg:h-16 lg:w-16 lg:text-4xl xl:h-18 xl:w-18 xl:text-5xl`;

	function buildCellClasses(cell: Cell): string {
		const textClass =
			cell.backgroundColor === StateColor.ACTIVE
				? theme.darkMode
					? TextColor.WHITE
					: TextColor.BLACK
				: theme.darkMode
					? TextColor.WHITE
					: cell.textColor;
		return `${baseCellClasses} ${cell.backgroundColor} ${textClass}`;
	}
</script>

<div class="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2">
	{#each board as row, i}
		<div class="flex gap-1 sm:gap-1.5 lg:gap-2">
			{#each row as _, j}
				<input id={i + '-' + j} class={buildCellClasses(board[i][j])} bind:value={board[i][j].value} disabled />
			{/each}
		</div>
	{/each}
</div>
