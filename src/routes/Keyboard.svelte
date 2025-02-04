<script lang="ts">
	let { keyClicked } = $props();
	const keys: Array<Array<string>> = [
		['Е', 'Щ'],
		['Ф', 'Ц', 'У', 'Ж', 'Э', 'Н', 'Г', 'Ш', 'Ү', 'З', 'К', 'Ъ'],
		['Й', 'Ы', 'Б', 'Ө', 'А', 'Х', 'Р', 'О', 'Л', 'Д', 'П'],
		['Я', 'Ч', 'Ё', 'С', 'М', 'И', 'Т', 'Ь', 'В', 'Ю']
	];

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
					class="m-0.5 h-14 w-8 select-none border bg-gray-300 text-center text-xl"
					onclick={() => keyClicked('backspace')}>⌫</button
				>
			{/if}
			{#each row as key}
				<button
					id={key}
					class="m-0.5 h-14 w-8 select-none border bg-gray-300 text-center text-xl"
					onclick={() => keyClicked(key)}>{key}</button
				>
			{/each}
			{#if i === keys.length - 1}
				<button
					class="m-0.5 h-14 w-16 select-none border bg-gray-300 text-center text-sm"
					onclick={() => keyClicked('enter')}>ENTER</button
				>
			{/if}
		</div>
	{/each}
</div>

<svelte:window on:keydown|preventDefault={onKeyDown} />
