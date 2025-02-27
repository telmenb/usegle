<script lang="ts">
  const {
    isOpen,
    close,
  } = $props()

</script>

{#if isOpen}
  <div role="dialog" class="modal">
    <div class="contents">
      <h2>How to Play</h2>
      <p>Placeholder. Guess the word by typing it out on the keyboard. Press Enter to submit your guess.</p>
      <div class="actions">
        <button onclick={() => close()}>OK</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;

    /* allow click-through to backdrop */
    pointer-events: none;
  }

  .contents {
    min-width: 240px;
    max-width: 640px;
    padding: 16px;
    background: white;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    pointer-events: auto;
  }

  h2 {
    text-align: center;
    font-size: 24px;
  }

  p {
    text-align: center;
    margin-top: 16px;
    border-radius: 6px;
  }

  .actions {
    margin-top: 32px;
    display: flex;
    justify-content: flex-end;
  }

</style>
