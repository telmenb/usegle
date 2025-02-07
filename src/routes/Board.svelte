<script lang="ts">
	let { board } = $props();
</script>

<div class="mt-auto mb-16 flex flex-col items-center">
	{#each board as row, i}
		<div class="flex">
			{#each row as cell, j}
				<input
          id={i + '-' + j}
					class="m-0.5 h-14 w-14 border border-gray-300 text-center text-3xl"
					bind:value={board[i][j]}
					disabled
				/>
			{/each}
		</div>
	{/each}
</div>
