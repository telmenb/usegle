<script lang="ts">
	import { getThemeContext, keys } from '$lib';
	import { StateColor, TextColor } from '$lib/colors';

	let { keyClicked, keysColorMap } = $props();
	let theme = getThemeContext();

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			keyClicked('enter');
			return;
		} else if (e.key === 'Backspace') {
			keyClicked('backspace');
			return;
		}

		if (!keys.some((row) => row.includes(e.key.toUpperCase()))) {
			console.log(`Invalid character ${e.key}`);
			return;
		}

		keyClicked(e.key.toUpperCase());
	}
</script>

<!-- TODO: Use media queries to make keys smaller on smaller screens -->
<div class="flex flex-col items-center">
	{#each keys as row, i}
		<div class="flex {i === 0 ? 'ml-auto pr-8' : ''}">
			{#if i === keys.length - 1}
				<button
					class="m-0.5 h-14 w-8 select-none border bg-gray-300 dark:border-gray-400 text-center text-xl font-semibold text-black transition-colors duration-700 dark:bg-gray-500 dark:text-white"
					onclick={() => keyClicked('backspace')}>⌫</button
				>
			{/if}
			{#each row as key}
				<button
					id={key}
					class="m-0.5 h-14 w-8 select-none border bg-gray-300 dark:border-gray-400 text-center text-xl font-semibold transition-colors duration-700
						{keysColorMap.get(key) !== StateColor.INACTIVE
						? keysColorMap.get(key)
						: !theme.darkMode
							? StateColor.INACTIVE
							: 'bg-gray-500'}
						{!theme.darkMode && keysColorMap.get(key) === StateColor.INACTIVE
						? TextColor.BLACK
						: TextColor.WHITE}"
					onclick={() => keyClicked(key)}>{key}</button
				>
			{/each}
			{#if i === keys.length - 1}
				<button
					class="m-0.5 h-14 w-16 select-none border bg-gray-300 dark:border-gray-400 text-center text-sm font-semibold text-black transition-colors duration-700 dark:bg-gray-500 dark:text-white"
					onclick={() => keyClicked('enter')}>ENTER</button
				>
			{/if}
		</div>
	{/each}
</div>

<svelte:window on:keydown|preventDefault={onKeyDown} />
