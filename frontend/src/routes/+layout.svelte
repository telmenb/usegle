<script lang="ts">
	import '../app.css';
	import { Modals } from 'svelte-modals';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { initDarkMode } from '$lib';
	import { setContext, onMount } from 'svelte';
	import { setItemInStorage } from '$lib/storageHelper';

	let { children } = $props();
	const toastOptions = { duration: 3000 };
	let theme = $state({
		darkMode: initDarkMode()
	});
	setContext('theme', theme);

	onMount(() => {
		if (theme.darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}

		// Set a CSS var to the actual visible viewport height to avoid mobile address bar issues
		const setAppVh = () => {
			try {
				const vh = window.innerHeight * 0.01;
				document.documentElement.style.setProperty('--app-vh', `${vh}px`);
			} catch (_) {
				// no-op
			}
		};
		setAppVh();
		window.addEventListener('resize', setAppVh);
		window.addEventListener('orientationchange', setAppVh);

		return () => {
			window.removeEventListener('resize', setAppVh);
			window.removeEventListener('orientationchange', setAppVh);
		};
	});
</script>

<div
	id="root-layout"
	class="bg-light-background dark:bg-dark-background notranslate flex min-h-screen w-full flex-col items-center overflow-x-hidden font-sans transition-colors duration-500 dark:text-white"
	style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); min-height: 100vh; min-height: 100dvh; min-height: calc(var(--app-vh, 1vh) * 100);"
>
	<div class="toast-container">
		<SvelteToast options={toastOptions} />
	</div>
	<Modals>
		<!-- shown when any modal is opened -->
		{#snippet backdrop({ close })}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="backdrop"
				onclick={() => {
					setItemInStorage('hasSeenTutorial', 'true');
					close();
				}}
			></div>
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
