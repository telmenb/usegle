<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { PUBLIC_USEGLE_API_HOST } from '$env/static/public';
	import { StateColor } from '$lib/colors';
	import type { Cell } from '$lib/index';
	import { toast } from '@zerodevx/svelte-toast';

	let {
		board = [],
		won = false,
		isOpen,
		close
	}: {
		board?: Cell[][];
		won?: boolean;
		isOpen: boolean;
		close: () => void;
	} = $props();
	let result: { word: string; meanings: { pos: string; meaning: string }[] } | null = $state(null);
	let mounted = $state(false);
	let loading = $state(true);
	let loadError = $state(false);

	async function loadDefinition() {
		loading = true;
		loadError = false;
		try {
			const response = await fetch(`${PUBLIC_USEGLE_API_HOST}/api/game/results`);
			if (!response.ok) throw new Error('Results unavailable');
			result = await response.json();
		} catch {
			loadError = true;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		// Insert the screen after mounting so dynamically opened modals animate too.
		mounted = true;
		void loadDefinition();
	});

	function resultsTransition(node: Element) {
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		return fly(node, { y: 32, duration: reducedMotion ? 0 : 500, easing: cubicOut });
	}

	function buildShareText(): string {
		const date = new Date().toISOString().slice(0, 10);
		const scoredRows = board.filter((row: Cell[]) =>
			row.some(
				(cell: Cell) =>
					cell.backgroundColor === StateColor.CORRECT ||
					cell.backgroundColor === StateColor.PARTIAL ||
					cell.backgroundColor === StateColor.INCORRECT
			)
		);
		const rowCount = won ? scoredRows.length : 'X';

		const emojiRows = scoredRows
			.map((row: Cell[]) =>
				row
					.map((cell: Cell) => {
						if (cell.backgroundColor === StateColor.CORRECT) return '🟩';
						if (cell.backgroundColor === StateColor.PARTIAL) return '🟨';
						return '⬛';
					})
					.join('')
			)
			.join('\n');

		return `Usegle ${date} ${rowCount}/${board.length}\n\n${emojiRows}`;
	}

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(buildShareText());
		} catch {
			const el = document.createElement('textarea');
			el.value = buildShareText();
			document.body.appendChild(el);
			el.select();
			document.execCommand('copy');
			document.body.removeChild(el);
		} finally {
			toast.push('Үр дүн хуулагдлаа');
		}
	}
</script>

{#if isOpen && mounted}
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="results-title"
		tabindex="-1"
		transition:resultsTransition|global
		class="results-screen fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-gray-800"
	>
		<div class="mx-auto flex min-h-full w-full max-w-2xl flex-col p-6 sm:p-10">
			<div class="mb-2 flex justify-end">
				<button
					onclick={() => close()}
					aria-label="Хаах"
					class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
				>
					<img src="cross.svg" alt="" class="h-6 w-6 dark:invert" />
				</button>
			</div>
			<div class="flex flex-1 flex-col items-center justify-center py-8">
				<h1 id="results-title" class="text-center text-2xl font-semibold sm:text-3xl">
					{#if won}
						Баяр хүргэе 🥳
					{:else}
						Даанч буруу бөглөлөө 😅
					{/if}
				</h1>
				<h1 class="mb-6 mt-3 text-center text-lg sm:mt-4 sm:text-xl">
					{#if won}
						Та амжилттай бөглөлөө.<br />
						Маргааш дахин тоглоорой!
					{:else}
						Маргааш дахин оролдоорой!
					{/if}
				</h1>
				<div class="w-full rounded-xl bg-gray-100 p-4 dark:bg-gray-700" aria-live="polite">
					{#if loading}
						<p class="text-center">Үгийн тайлбарыг уншиж байна…</p>
					{:else if loadError}
						<p>Үгийн тайлбарыг ачаалж чадсангүй.</p>
						<button onclick={loadDefinition} class="mt-2 underline">Дахин оролдох</button>
					{:else if result}
						<h2 class="mb-3 text-center text-xl font-semibold uppercase">{result.word}</h2>
						{#each result.meanings.filter((entry) => entry.meaning) as entry}
							<p class="mt-2"><span class="font-semibold">{entry.pos}</span> {entry.meaning}</p>
						{:else}
							<p class="text-center">Үгийн тайлбар байхгүй байна.</p>
						{/each}
					{/if}
				</div>

				<button
					onclick={copyToClipboard}
					class="mt-6 flex items-center gap-2 rounded-lg bg-green-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-green-600 active:bg-green-700 sm:mt-10 dark:bg-green-600 dark:hover:bg-green-700"
				>
					Хуулах
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.results-screen {
		padding-top: env(safe-area-inset-top);
		padding-right: env(safe-area-inset-right);
		padding-bottom: env(safe-area-inset-bottom);
		padding-left: env(safe-area-inset-left);
	}
</style>
