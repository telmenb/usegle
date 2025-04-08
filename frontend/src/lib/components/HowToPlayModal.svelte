<script lang="ts">
	import { getThemeContext, type Cell } from "$lib";
	import { StateColor, TextColor } from "$lib/colors";

  const {
    isOpen,
    close,
  } = $props()

  let theme = getThemeContext();

  // Setup green example
  const greenExampleLetters: Array<string> = ['А', 'Х', 'М', 'А', 'Д']
  const greenExample: Array<Cell> = createCellArray(greenExampleLetters);
  greenExample[2].backgroundColor = StateColor.CORRECT;
  greenExample[2].textColor = TextColor.WHITE;

  // Setup yellow example
  const yellowExampleLetters: Array<string> = ['Ч', 'А', 'Н', 'А', 'Р']
  const yellowExample: Array<Cell> = createCellArray(yellowExampleLetters);
  yellowExample[0].backgroundColor = StateColor.PARTIAL;
  yellowExample[0].textColor = TextColor.WHITE;

  // Setup gray example
  const grayExampleLetters: Array<string> = ['Г', 'У', 'Т', 'А', 'Л']
  const grayExample: Array<Cell> = createCellArray(grayExampleLetters);
  grayExample[1].backgroundColor = StateColor.INCORRECT;
  grayExample[1].textColor = TextColor.WHITE;

  function createCellArray(letters: Array<string>): Array<Cell> {
    return letters.map((letter) => ({
      value: letter,
      backgroundColor: StateColor.INACTIVE,
      textColor: TextColor.BLACK,
    }));
  }
</script>

{#if isOpen}
  <div role="dialog" class="fixed inset-0 flex justify-center items-center pointer-events-none">
    <div class="bg-white dark:bg-gray-600 contents">
      <div class="flex justify-end">
        <button onclick={() => close()}>
          <img src="cross.svg" alt="Close" class="w-8 h-8 dark:invert" />
        </button>
      </div>
      <div class = "flex flex-col px-4">
        <h2 class="text-center text-2xl font-semibold">Хэрхэн тоглох вэ?</h2>
        <p class="mt-4 text-lg"><b>Usegle</b> тоглоом нь дэлхийд алдартай болсон <b><a href="https://www.nytimes.com/games/wordle/index.html" target="_blank">Wordle</a></b> тоглоомын Монгол хувилбар юм.</p>

        <hr class="solid my-4">

        <ul class="list-disc list-outside mb-4 ml-6">
          <li>Тоглоомын зорилго нь 5 үсэгтэй нууц үгийг 6 оролдлогоор таах юм.</li>
          <li>Тоглоомын явцад та зөв үсгүүдийн зөв байрыг олох хэрэгтэй.</li>
          <li>Оролдлого болгон дээр аль үсгийг зөв, буруу байршуулсан талаар хариу өгөх болно.</li>
        </ul>

        <div class="flex">
          {#each greenExample as cell, i}
            <input
              id={i.toString()}
              class="m-0.5 h-10 w-10 border border-gray-300 text-center text-2xl font-semibold
                {cell.backgroundColor != StateColor.INACTIVE ? cell.backgroundColor : ''} {!theme.darkMode ? cell.textColor : TextColor.WHITE}"
              bind:value={cell.value}
              disabled
            />
          {/each}
        </div>
        <p class="mb-3"><span class="text-green-500 font-semibold">Ногоон</span> өнгөтэй үсэг нь зөв байранд байгаа үсэг.</p>

        <div class="flex">
          {#each yellowExample as cell, i}
            <input
              id={i.toString()}
              class="m-0.5 h-10 w-10 border border-gray-300 text-center text-2xl font-semibold
                {cell.backgroundColor != StateColor.INACTIVE ? cell.backgroundColor : ''} {!theme.darkMode ? cell.textColor : TextColor.WHITE}"
              bind:value={cell.value}
              disabled
            />
          {/each}
        </div>
        <p class="mb-3"><span class="text-yellow-500 font-semibold">Шар</span> өнгөтэй үсэг нь үгэнд байгаа боловч буруу байранд байгаа үсэг.</p>

        <div class="flex">
          {#each grayExample as cell, i}
            <input
              id={i.toString()}
              class="m-0.5 h-10 w-10 border border-gray-300 text-center text-2xl font-semibold
                {cell.backgroundColor != StateColor.INACTIVE ? cell.backgroundColor : ''} {!theme.darkMode ? cell.textColor : TextColor.WHITE}"
              bind:value={cell.value}
              disabled
            />
          {/each}
        </div>
        <p><span class="text-gray-500 font-semibold">Саарал</span> өнгөтэй үсэг нь нууц үгэнд байхгүй үсэг.</p>

        <hr class="solid my-4">

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
