<script lang="ts">
	import Board from './Board.svelte';

	let { board, won } = $props();
</script>

<div class="flex w-full max-w-lg flex-col items-center px-4">
	<h1 class="mt-4 text-center text-2xl font-semibold sm:mt-8 sm:text-3xl">
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
</div>
