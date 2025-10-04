<script lang="ts">
	const { isOpen, close } = $props();
</script>

{#if isOpen}
	<div
		role="dialog"
		class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
	>
		<div class="contents">
			<div class="flex justify-end">
				<button
					onclick={() => close()}
					class="flex h-8 w-8 touch-manipulation items-center justify-center rounded-full hover:bg-gray-200 sm:h-10 sm:w-10 dark:hover:bg-gray-700"
				>
					<img src="cross.svg" alt="Close" class="h-6 w-6 sm:h-8 sm:w-8 dark:invert" />
				</button>
			</div>
			<h2 class="text-center text-xl font-semibold sm:text-2xl">Usegle тоглоомын тухай</h2>
			<p class="mt-3 text-center text-sm sm:mt-4 sm:text-base">
				Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has
				been the industry's standard dummy text ever since the 1500s, when an unknown printer took a
				galley of type and scrambled it to make a type specimen book. It has survived not only five
				centuries, but also the leap into electronic typesetting, remaining essentially unchanged.
				It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum
				passages, and more recently with desktop publishing software like Aldus PageMaker including
				versions of Lorem Ipsum.
			</p>
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
		padding: 0.75rem;
		background: white;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		pointer-events: auto;
		box-shadow: 0 0 15px rgba(0, 0, 0, 0.15);
		border-radius: 15px;
	}

	@media (min-width: 640px) {
		.contents {
			padding: 1rem;
		}
	}

	@media (prefers-color-scheme: dark) {
		.contents {
			background: #374151;
			color: white;
		}
	}
</style>
