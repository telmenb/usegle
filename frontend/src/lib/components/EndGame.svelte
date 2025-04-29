<script lang="ts">
	import Board from "./Board.svelte";

	let { board, won } = $props();
</script>

<h1 class="text-3xl font-semibold mt-8 text-center">
  {#if won}
    Баяр хүргэе 🥳
  {:else}
    Даанч буруу бөглөлөө 😅
  {/if}
</h1>
<h1 class="text-xl mt-4 mb-16 text-center">
  {#if won}
    Та амжилттай бөглөлөө.<br />
    Маргааш дахин тоглоорой!
  {:else}
    Маргааш дахин оролдоорой!
  {/if}
</h1>
<Board {board} />
