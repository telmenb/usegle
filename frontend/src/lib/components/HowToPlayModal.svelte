<script lang="ts">
  const {
    isOpen,
    close,
  } = $props()

</script>

{#if isOpen}
  <div role="dialog" class="fixed inset-0 flex justify-center items-center pointer-events-none">
    <div class="contents">
      <div class="flex justify-end">
        <button onclick={() => close()}>
          <img src="cross.svg" alt="Close" class="w-8 h-8" />
        </button>
      </div>
      <h2 class="text-center text-2xl">Хэрхэн тоглох вэ?</h2>
      <p class="text=center mt-4">Placeholder. Guess the word by typing it out on the keyboard. Press Enter to submit your guess.</p>
    </div>
  </div>
{/if}

<style>
  .contents {
    min-width: 240px;
    max-width: 640px;
    padding: 16px;
    background: white;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    pointer-events: auto;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.15);
    border-radius: 15px;
  }
</style>
