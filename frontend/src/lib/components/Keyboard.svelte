<script lang="ts">
	import { getThemeContext, keys } from '$lib';
	import { StateColor, TextColor } from '$lib/colors';

	let { keyClicked, keysColorMap } = $props();
	let theme = getThemeContext();

	const letterKeys = new Set<string>(
		keys.reduce((accumulator, row) => {
			accumulator.push(...row);
			return accumulator;
		}, [] as string[])
	);

	let pressedKey: string | null = $state(null);

	function pressKey(key: string) {
		pressedKey = key;
	}

	function releaseKey(key?: string) {
		if (!key || pressedKey === key) {
			pressedKey = null;
		}
	}

	function submitKey(key: string, options?: { skipPress?: boolean }) {
		if (!options?.skipPress) {
			pressKey(key);
		}

		keyClicked(key);
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			submitKey('enter');
			return;
		} else if (e.key === 'Backspace') {
			submitKey('backspace');
			return;
		}

		const normalizedKey = e.key.toUpperCase();
		if (!letterKeys.has(normalizedKey)) {
			console.log(`Invalid character ${e.key}`);
			return;
		}

		submitKey(normalizedKey);
	}

	function onKeyUp(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			releaseKey('enter');
			return;
		} else if (e.key === 'Backspace') {
			releaseKey('backspace');
			return;
		}

		const normalizedKey = e.key.toUpperCase();
		if (letterKeys.has(normalizedKey)) {
			releaseKey(normalizedKey);
		}
	}
</script>

<div class="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2">
	{#each keys as row, i}
		<div
			class="flex gap-1 sm:gap-1.5 lg:gap-2 {i === 0
				? 'ml-auto mr-6 sm:mr-14 md:mr-12 lg:mr-18 xl:mr-36'
				: ''}"
		>
			{#if i === keys.length - 1}
				<button
					class="key-button h-10 min-w-[30px] touch-manipulation select-none rounded-sm border bg-gray-300 px-1 text-center text-xs font-semibold text-black transition-colors duration-700
					sm:h-12 sm:min-w-[35px] sm:px-2 sm:text-sm
					md:h-14 md:min-w-[40px] md:text-lg
					lg:h-16 lg:min-w-[48px] lg:rounded-md lg:px-3 lg:text-xl
					xl:h-18 xl:min-w-[56px] xl:px-4 xl:text-2xl
					dark:border-gray-400 dark:bg-gray-500 dark:text-white"
					class:pressing={pressedKey === 'backspace'}
					onpointerdown={() => pressKey('backspace')}
					onpointerup={() => releaseKey('backspace')}
					onpointerleave={() => releaseKey('backspace')}
					onpointercancel={() => releaseKey('backspace')}
					onclick={() => submitKey('backspace', { skipPress: true })}
					aria-pressed={pressedKey === 'backspace'}
					type="button">⌫</button
				>
			{/if}
			{#each row as key}
				<button
					id={key}
					class="key-button h-10 w-6 touch-manipulation select-none rounded-sm border bg-gray-300 text-center text-sm font-semibold transition-colors duration-700
					sm:h-12 sm:w-7 sm:text-lg
					md:h-14 md:w-8 md:text-xl
					lg:h-16 lg:w-10 lg:rounded-md lg:text-2xl
					xl:h-18 xl:w-12 xl:text-3xl
					dark:border-gray-400
					{keysColorMap.get(key) !== StateColor.INACTIVE
						? keysColorMap.get(key)
						: !theme.darkMode
							? StateColor.INACTIVE
							: 'bg-gray-500'}
					{!theme.darkMode && keysColorMap.get(key) === StateColor.INACTIVE
						? TextColor.BLACK
						: TextColor.WHITE}"
					class:pressing={pressedKey === key}
					onpointerdown={() => pressKey(key)}
					onpointerup={() => releaseKey(key)}
					onpointerleave={() => releaseKey(key)}
					onpointercancel={() => releaseKey(key)}
					onclick={() => submitKey(key, { skipPress: true })}
					aria-pressed={pressedKey === key}
					type="button">{key}</button
				>
			{/each}
			{#if i === keys.length - 1}
				<button
					class="key-button h-10 min-w-[40px] touch-manipulation select-none rounded-sm border bg-gray-300 px-1 text-center text-xs font-semibold text-black transition-colors duration-700
					sm:h-12 sm:min-w-[50px] sm:px-2 sm:text-sm
					md:h-14 md:min-w-[64px] md:text-base
					lg:h-16 lg:min-w-[80px] lg:rounded-md lg:px-3 lg:text-lg
					xl:h-18 xl:min-w-[96px] xl:px-4 xl:text-xl
					dark:border-gray-400 dark:bg-gray-500 dark:text-white"
					class:pressing={pressedKey === 'enter'}
					onpointerdown={() => pressKey('enter')}
					onpointerup={() => releaseKey('enter')}
					onpointerleave={() => releaseKey('enter')}
					onpointercancel={() => releaseKey('enter')}
					onclick={() => submitKey('enter', { skipPress: true })}
					aria-pressed={pressedKey === 'enter'}
					type="button">ENTER</button
				>
			{/if}
		</div>
	{/each}
</div>

<svelte:window on:keydown|preventDefault={onKeyDown} on:keyup={onKeyUp} on:blur={() => releaseKey()} />

<style>
	.key-button {
		will-change: transform, filter, box-shadow;
		transition: transform 80ms ease, box-shadow 120ms ease, filter 120ms ease, background-color 120ms ease;
	}

	.key-button.pressing {
		transform: translateY(1px) scale(0.97);
		box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.25);
		filter: brightness(0.93);
	}

	:global(html.dark) .key-button.pressing {
		filter: brightness(1.08);
		box-shadow: inset 0 3px 6px rgba(255, 255, 255, 0.15);
	}
</style>
