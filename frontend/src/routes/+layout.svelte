<script lang="ts">
	import '../app.css';
	import { Modals } from 'svelte-modals';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { initDarkMode } from '$lib';
	import { setContext, onMount } from 'svelte';
	import { setItemInStorage } from '$lib/storageHelper';

	const siteUrl = 'https://usegle.com';
	const title = 'Usegle – Mongolian Wordle';
	const description =
		'Usegle бол монгол хэл дээрх Wordle тоглоом. Өдөр бүр шинэ үг тааварла! The Mongolian Wordle game — guess the daily Mongolian word in 6 tries.';
	const ogImage = `${siteUrl}/mongolian_wordle_favicon.png`;

	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Usegle – Mongolian Wordle',
		url: siteUrl,
		description,
		applicationCategory: 'GameApplication',
		operatingSystem: 'Any',
		inLanguage: 'mn',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		publisher: { '@type': 'Organization', name: 'Usegle', url: siteUrl }
	});
	// Split the closing tag so Svelte's parser doesn't terminate the <script> block early
	const jsonLdScript = `<script type="application/ld+json">${jsonLd}<` + `/script>`;

	let { children } = $props();
	const toastOptions = { duration: 3000 };
	let theme = $state({
		darkMode: initDarkMode()
	});
	setContext('theme', theme);

	injectAnalytics({ mode: 'auto' });

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

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={siteUrl} />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={siteUrl} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:locale" content="mn_MN" />
	<meta property="og:locale:alternate" content="en_US" />
	<meta property="og:site_name" content="Usegle" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />

	<!-- Extra SEO signals -->
	<meta name="keywords" content="mongolian wordle, монгол wordle, usegle, монгол үг тааварлах тоглоом, wordle mn" />
	<meta name="robots" content="index, follow" />

	<!-- JSON-LD structured data (content is our own static constants, not user input) -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html jsonLdScript}
</svelte:head>

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
