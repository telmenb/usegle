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

<!-- Responsive keyboard for mobile, tablet, desktop and large screens -->
<div class="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2">
	{#each keys as row, i}
		<div
			class="flex gap-1 sm:gap-1.5 lg:gap-2 {i === 0
				? 'ml-auto mr-6 sm:mr-14 md:mr-12 lg:mr-18 xl:mr-36'
				: ''}"
		>
			{#if i === keys.length - 1}
				<button
					class="xl:h-18 h-10 min-w-[30px] touch-manipulation select-none rounded-sm border bg-gray-300 px-1 text-center text-xs font-semibold text-black transition-colors
					duration-700 sm:h-12 sm:min-w-[35px] sm:px-2
					sm:text-sm md:h-14 md:min-w-[40px]
					md:text-lg lg:h-16 lg:min-w-[48px] lg:rounded-md lg:px-3
					lg:text-xl xl:min-w-[56px] xl:px-4 xl:text-2xl
					dark:border-gray-400 dark:bg-gray-500 dark:text-white"
					onclick={() => keyClicked('backspace')}>⌫</button
				>
			{/if}
			{#each row as key}
				<button
					id={key}
					class="xl:h-18 h-10 w-6 touch-manipulation select-none rounded-sm border bg-gray-300 text-center text-sm font-semibold transition-colors duration-700 active:bg-gray-500
					active:duration-75 sm:h-12 sm:w-7
					sm:text-lg md:h-14 md:w-8
					md:text-xl lg:h-16 lg:w-10 lg:rounded-md
					lg:text-2xl xl:w-12 xl:text-3xl
					dark:border-gray-400
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
					class="xl:h-18 h-10 min-w-[40px] touch-manipulation select-none rounded-sm border bg-gray-300 px-1 text-center text-xs font-semibold text-black transition-colors
					duration-700 sm:h-12 sm:min-w-[50px] sm:px-2
					sm:text-sm md:h-14 md:min-w-[64px]
					md:text-base lg:h-16 lg:min-w-[80px] lg:rounded-md lg:px-3
					lg:text-lg xl:min-w-[96px] xl:px-4 xl:text-xl
					dark:border-gray-400 dark:bg-gray-500 dark:text-white"
					onclick={() => keyClicked('enter')}>ENTER</button
				>
			{/if}
		</div>
	{/each}
</div>

<svelte:window on:keydown|preventDefault={onKeyDown} />
