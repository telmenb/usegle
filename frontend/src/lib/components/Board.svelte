<script lang="ts">
	import { getThemeContext } from '$lib';
	import { StateColor, TextColor } from '$lib/colors';

	let { board } = $props();
	let theme = getThemeContext();
</script>

<div class="flex flex-col items-center">
	{#each board as row, i}
		<div class="flex">
			{#each row as _, j}
				<input
					id={i + '-' + j}
					class="m-0.5 h-14 w-14 border border-gray-300 text-center text-3xl font-semibold transition-colors duration-500
						{board[i][j].backgroundColor != StateColor.INACTIVE ? board[i][j].backgroundColor : ''}
						{!theme.darkMode ? board[i][j].textColor : TextColor.WHITE}"
					bind:value={board[i][j].value}
					disabled
				/>
			{/each}
		</div>
	{/each}
</div>
