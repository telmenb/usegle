<script lang="ts">
	let { board, won } = $props();
</script>

<div class="flex flex-col items-center">
  <h1 class="text-3xl font-semibold mt-8">
    {#if won}
      Та амжилттай бөглөсөн байна!
    {:else}
      Даанч буруу бөглөлөө. 😅 Маргааш дахин оролдоорой!
    {/if}
  </h1>
</div>
