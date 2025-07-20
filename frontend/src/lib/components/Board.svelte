<script lang="ts">
	import { getThemeContext } from '$lib';
	import { StateColor, TextColor } from '$lib/colors';

	let { board } = $props();
	let theme = getThemeContext();
</script>

<div class="flex flex-col items-center gap-1">
	{#each board as row, i}
		<div class="flex gap-1">
			{#each row as _, j}
				<input
					id={i + '-' + j}
					class="h-10 w-10 touch-manipulation rounded border border-gray-300 text-center text-lg font-semibold transition-colors duration-500 sm:h-12 sm:w-12 sm:text-2xl md:h-14 md:w-14 md:text-3xl dark:border-gray-400
						{board[i][j].backgroundColor !== StateColor.INACTIVE ? board[i][j].backgroundColor : ''}
						{!theme.darkMode ? board[i][j].textColor : TextColor.WHITE}"
					bind:value={board[i][j].value}
					disabled
				/>
			{/each}
		</div>
	{/each}
</div>
