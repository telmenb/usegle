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
      <h2 class="text-center text-2xl">Usegle тоглоомын тухай</h2>
      <p class="text=center mt-4">Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
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
