<script lang="ts">
	import '../app.css';
	import { Modals } from 'svelte-modals';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { initDarkMode } from '$lib';
	import { setContext } from 'svelte';

	let { children } = $props();
	const toastOptions = { duration: 3000 };
	let theme = $state({
		darkMode: initDarkMode()
	});
	setContext('theme', theme);
</script>

<div
	id="root-layout"
	class="bg-light-background dark:bg-dark-background notranslate flex h-screen flex-col items-center font-sans transition-colors duration-1000 dark:text-white
		{theme.darkMode ? 'dark': ''}"
>
	<div class="toast-container">
		<SvelteToast options={toastOptions} />
	</div>
	<Modals>
		<!-- shown when any modal is opened -->
		{#snippet backdrop({ close })}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="backdrop" onclick={() => close()}></div>
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
		background: rgba(0, 0, 0, 0.08);
	}

	.toast-container {
		--toastBackground: #6b7280;
		--toastBarBackground: #fff;
	}
</style>
