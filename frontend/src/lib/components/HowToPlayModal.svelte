<script lang="ts">
	import { getThemeContext, type Cell } from '$lib';
	import { StateColor, TextColor } from '$lib/colors';

	const { isOpen, close } = $props();

	let theme = getThemeContext();

	// Setup green example
	const greenExampleLetters: Array<string> = ['А', 'Х', 'М', 'А', 'Д'];
	const greenExample: Array<Cell> = createCellArray(greenExampleLetters);
	greenExample[2].backgroundColor = StateColor.CORRECT;
	greenExample[2].textColor = TextColor.WHITE;

	// Setup yellow example
	const yellowExampleLetters: Array<string> = ['Ч', 'А', 'Н', 'А', 'Р'];
	const yellowExample: Array<Cell> = createCellArray(yellowExampleLetters);
	yellowExample[0].backgroundColor = StateColor.PARTIAL;
	yellowExample[0].textColor = TextColor.WHITE;

	// Setup gray example
	const grayExampleLetters: Array<string> = ['Г', 'У', 'Т', 'А', 'Л'];
	const grayExample: Array<Cell> = createCellArray(grayExampleLetters);
	grayExample[1].backgroundColor = StateColor.INCORRECT;
	grayExample[1].textColor = TextColor.WHITE;

	function createCellArray(letters: Array<string>): Array<Cell> {
		return letters.map((letter) => ({
			value: letter,
			backgroundColor: StateColor.INACTIVE,
			textColor: TextColor.BLACK
		}));
	}
</script>

{#if isOpen}
	<div role="dialog" class="pointer-events-none fixed inset-0 flex items-center justify-center">
		<div class="contents bg-white dark:bg-gray-600">
			<div class="flex justify-end">
				<button
					onclick={() => close()}
					class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
				>
					<img src="cross.svg" alt="Close" class="h-8 w-8 dark:invert" />
				</button>
			</div>
			<div class="flex flex-col px-4">
				<h2 class="text-center text-2xl font-semibold">Хэрхэн тоглох вэ?</h2>
				<p class="mt-4 text-lg">
					<b>Usegle</b> тоглоом нь дэлхийд алдартай болсон
					<b><a href="https://www.nytimes.com/games/wordle/index.html" target="_blank">Wordle</a></b
					> тоглоомын Монгол хувилбар юм.
				</p>

				<hr class="solid my-4" />

				<ul class="mb-4 ml-6 list-outside list-disc">
					<li>Тоглоомын зорилго нь 5 үсэгтэй нууц үгийг 6 оролдлогоор таах юм.</li>
					<li>Тоглоомын явцад та зөв үсгүүдийн зөв байрыг олох хэрэгтэй.</li>
					<li>Оролдлого болгон дээр аль үсгийг зөв, буруу байршуулсан талаар хариу өгөх болно.</li>
				</ul>

				<div class="flex">
					{#each greenExample as cell, i}
						<input
							id={i.toString()}
							class="m-0.5 h-10 w-10 border border-gray-300 text-center text-2xl font-semibold
                {cell.backgroundColor != StateColor.INACTIVE
								? cell.backgroundColor
								: ''} {!theme.darkMode ? cell.textColor : TextColor.WHITE}"
							bind:value={cell.value}
							disabled
						/>
					{/each}
				</div>
				<p class="mb-3">
					<span class="font-semibold text-green-500">Ногоон</span> өнгөтэй үсэг нь зөв байранд байгаа
					үсэг.
				</p>

				<div class="flex">
					{#each yellowExample as cell, i}
						<input
							id={i.toString()}
							class="m-0.5 h-10 w-10 border border-gray-300 text-center text-2xl font-semibold
                {cell.backgroundColor != StateColor.INACTIVE
								? cell.backgroundColor
								: ''} {!theme.darkMode ? cell.textColor : TextColor.WHITE}"
							bind:value={cell.value}
							disabled
						/>
					{/each}
				</div>
				<p class="mb-3">
					<span class="font-semibold text-yellow-500">Шар</span> өнгөтэй үсэг нь үгэнд байгаа боловч
					буруу байранд байгаа үсэг.
				</p>

				<div class="flex">
					{#each grayExample as cell, i}
						<input
							id={i.toString()}
							class="m-0.5 h-10 w-10 border border-gray-300 text-center text-2xl font-semibold
                {cell.backgroundColor != StateColor.INACTIVE
								? cell.backgroundColor
								: ''} {!theme.darkMode ? cell.textColor : TextColor.WHITE}"
							bind:value={cell.value}
							disabled
						/>
					{/each}
				</div>
				<p>
					<span class="font-semibold text-gray-500 dark:text-gray-700">Саарал</span> өнгөтэй үсэг нь нууц үгэнд байхгүй
					үсэг.
				</p>

				<hr class="solid my-4" />

				<p>Өдөр болгон Улаанбаатарын цагаар өглөөний 8-с шинэ үг гарч байна.</p>
			</div>
		</div>
	</div>
{/if}

<style>
	.contents {
		min-width: 240px;
		max-width: 640px;
		padding: 1rem 1rem 2rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		pointer-events: auto;
		box-shadow: 0 0 15px rgba(0, 0, 0, 0.15);
		border-radius: 15px;
	}
</style>
