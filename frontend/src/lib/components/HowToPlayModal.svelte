<script lang="ts">
	import { getThemeContext, type Cell } from '$lib';
	import { StateColor, TextColor } from '$lib/colors';

	const { isOpen, close, onClose = () => {} } = $props();

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

	function handleClose() {
		onClose();
		close();
	}
</script>

{#if isOpen}
	<div
		role="dialog"
		class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
	>
		<div class="contents bg-white dark:bg-gray-600">
			<div class="flex justify-end">
				<button
					onclick={handleClose}
					class="flex h-8 w-8 touch-manipulation items-center justify-center rounded-full hover:bg-gray-200 sm:h-10 sm:w-10 dark:hover:bg-gray-700"
				>
					<img src="cross.svg" alt="Close" class="h-6 w-6 sm:h-8 sm:w-8 dark:invert" />
				</button>
			</div>
			<div class="flex flex-col px-3 sm:px-4">
				<h2 class="text-center text-xl font-semibold sm:text-2xl">Хэрхэн тоглох вэ?</h2>
				<p class="mt-3 text-sm sm:mt-4 sm:text-lg">
					<b>Usegle</b> тоглоом нь дэлхийд алдартай болсон
					<b>
						<a
							href="https://www.nytimes.com/games/wordle/index.html"
							target="_blank"
							style="color: #6aaa64"
						>
							Wordle
						</a>
					</b> тоглоомын Монгол хувилбар юм.
				</p>

				<hr class="solid my-3 sm:my-4" />

				<ul class="mb-3 ml-4 list-outside list-disc text-sm sm:mb-4 sm:ml-6 sm:text-base">
					<li>Тоглоомын зорилго нь 5 үсэгтэй нууц үгийг 6 оролдлогоор таах юм.</li>
					<li>Тоглоомын явцад та зөв үсгүүдийн зөв байрыг олох хэрэгтэй.</li>
					<li>Оролдлого болгон дээр аль үсгийг зөв, буруу байршуулсан талаар хариу өгөх болно.</li>
				</ul>

				<div class="flex justify-start gap-1 sm:justify-start">
					{#each greenExample as cell, i}
						<input
							id={i.toString()}
							class="h-8 w-8 rounded border border-gray-300 text-center text-lg font-semibold sm:h-10 sm:w-10 sm:text-2xl
                {cell.backgroundColor != StateColor.INACTIVE
								? cell.backgroundColor
								: ''} {!theme.darkMode ? cell.textColor : TextColor.WHITE}"
							bind:value={cell.value}
							disabled
						/>
					{/each}
				</div>
				<p class="mb-3 text-sm sm:text-base">
					<span class="font-semibold text-green-500">Ногоон</span> өнгөтэй үсэг нь зөв байранд байгаа
					үсэг.
				</p>

				<div class="flex justify-start gap-1 sm:justify-start">
					{#each yellowExample as cell, i}
						<input
							id={i.toString()}
							class="h-8 w-8 rounded border border-gray-300 text-center text-lg font-semibold sm:h-10 sm:w-10 sm:text-2xl
                {cell.backgroundColor != StateColor.INACTIVE
								? cell.backgroundColor
								: ''} {!theme.darkMode ? cell.textColor : TextColor.WHITE}"
							bind:value={cell.value}
							disabled
						/>
					{/each}
				</div>
				<p class="mb-3 text-sm sm:text-base">
					<span class="font-semibold text-yellow-500">Шар</span> өнгөтэй үсэг нь үгэнд байгаа боловч
					буруу байранд байгаа үсэг.
				</p>

				<div class="flex justify-start gap-1 sm:justify-start">
					{#each grayExample as cell, i}
						<input
							id={i.toString()}
							class="h-8 w-8 rounded border border-gray-300 text-center text-lg font-semibold sm:h-10 sm:w-10 sm:text-2xl
                {cell.backgroundColor != StateColor.INACTIVE
								? cell.backgroundColor
								: ''} {!theme.darkMode ? cell.textColor : TextColor.WHITE}"
							bind:value={cell.value}
							disabled
						/>
					{/each}
				</div>
				<p class="text-sm sm:text-base">
					<span class="font-semibold text-gray-500 dark:text-gray-700">Саарал</span> өнгөтэй үсэг нь
					нууц үгэнд байхгүй үсэг.
				</p>

				<hr class="solid my-3 sm:my-4" />

				<p class="text-sm sm:text-base">
					Өдөр болгон Улаанбаатарын цагаар өглөөний 8-с шинэ үг гарч байна.
				</p>
			</div>
		</div>
	</div>
{/if}

<style>
	.contents {
		min-width: 280px;
		max-width: 90vw;
		width: 640px;
		/* Fallback for older browsers */
		max-height: 90vh;
		/* Use safer viewport units on mobile */
		max-height: min(90svh, calc(var(--app-vh, 1vh) * 90));
		max-height: min(90dvh, calc(var(--app-vh, 1vh) * 90));
		overflow-y: auto;
		padding: 0.75rem 0.75rem 1.5rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		pointer-events: auto;
		box-shadow: 0 0 15px rgba(0, 0, 0, 0.15);
		border-radius: 15px;
	}

	@media (min-width: 640px) {
		.contents {
			padding: 1rem 1rem 2rem;
		}
	}
</style>
