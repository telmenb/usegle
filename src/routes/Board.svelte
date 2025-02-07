<script lang="ts">
	import { StateColor } from '$lib/colors';

	let { board } = $props();
</script>

<div class="mb-16 mt-auto flex flex-col items-center">
	{#each board as row, i}
		<div class="flex">
			{#each row as cell, j}
				<input
					id={i + '-' + j}
					class="m-0.5 h-14 w-14 border border-gray-300 text-center text-3xl transition-colors duration-500
						{board[i][j].backgroundColor != StateColor.INACTIVE ? board[i][j].backgroundColor : ''} {board[i][j].textColor}"
					bind:value={board[i][j].value}
					disabled
				/>
			{/each}
		</div>
	{/each}
</div>
