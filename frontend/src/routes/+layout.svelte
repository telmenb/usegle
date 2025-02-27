<script lang="ts">
	import '../app.css';
  import { Modals } from 'svelte-modals'
	let { children } = $props();
</script>

<div
	class="bg-light-background dark:bg-dark-background notranslate flex h-screen flex-col items-center font-sans dark:text-white"
>
	<Modals>
		<!-- shown when any modal is opened -->
		{#snippet backdrop({ close })}
			<div
				class="backdrop"
				onclick={() => close()}
			/>
		{/snippet}
	</Modals>
	{@render children()}
</div>

<style>
  .backdrop {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    background: rgba(0,0,0,.1)
  }
</style>
