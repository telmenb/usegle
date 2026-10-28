<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Preview } from '$lib/editor-types';
	let { data, form } = $props();
	let pending = $state(false);
	let preview = $state<Preview | null>(null);
	let uncertain = $state(false);
	let message = $state('');
	const nextDate = $derived(data.schedule?.rows.at(-1)?.date);
	function nextPage(date: string) {
		return new Date(Date.parse(date) + 86400000).toISOString().slice(0, 10);
	}
	const submit = () => {
		pending = true;
		return async ({
			result,
			update
		}: {
			result: { type: string; status?: number; data?: Record<string, unknown> };
			update: (options?: { reset?: boolean }) => Promise<void>;
		}) => {
			if (result.type === 'success') {
				if (result.data?.preview) preview = structuredClone(result.data.preview as Preview);
				if (result.data && 'saved' in result.data) {
					preview = null;
					message = `${result.data.saved} dates saved.`;
				}
				uncertain = false;
			} else if (result.type === 'failure') {
				if (result.data?.preview) preview = structuredClone(result.data.preview as Preview);
				uncertain = (result.status ?? 500) >= 500;
			} else if (result.type === 'error') {
				uncertain = true;
				message = 'Connection interrupted. Recheck the schedule before trying again.';
				pending = false;
				return;
			}
			await update({ reset: false });
			pending = false;
		};
	};
</script>

<h1>Schedule</h1>
<p>Fill gaps from tomorrow through the next 30 UTC days. Existing dates stay assigned.</p>
{#if data.error}<p role="alert" class="error">
		{data.error} <a href="/editor/schedule">Retry</a>
	</p>{/if}
{#if form && 'error' in form && form.error}<p class="error" role="alert">
		{form.error}
		{form.conflict ? 'A refreshed preview is shown below. Review every row before saving.' : ''}
	</p>{/if}
{#if message}<p role="status" class="notice">{message}</p>{/if}
<form method="POST" action="?/preview" use:enhance={submit}>
	<button class="primary" disabled={pending}>Fill next 30 days — preview</button>
</form>
{#if preview}
	<section class="card preview">
		<h2>{preview.replacement ? 'Replacement preview' : 'Schedule preview'}</h2>
		<p>{preview.assignments.length} dates will be saved. Nothing changes until you save.</p>
		{#if preview.shortage}<p class="warning">
				Queue shortage: {preview.shortage}
				{preview.shortage === 1 ? 'date remains' : 'dates remain'} empty. You can save the {preview
					.assignments.length} shown assignments.
			</p>{/if}
		<p>Swap a proposal by selecting or entering another queued word. Each word can appear once.</p>
		<datalist id="queue-words"
			>{#each data.queue?.words ?? [] as word}<option value={word.word}></option>{/each}</datalist
		>
		<fieldset disabled={pending}>
			{#each preview.assignments as assignment}<div class="schedule-row">
					<label for={`word-${assignment.date}`}
						><strong>{assignment.date}</strong>{#if assignment.previous}<small
								>Replaces {assignment.previous}</small
							>{/if}</label
					><input
						id={`word-${assignment.date}`}
						list="queue-words"
						autocapitalize="none"
						spellcheck="false"
						bind:value={assignment.word}
						maxlength="5"
						lang="mn"
						aria-label={`Queued word for ${assignment.date}`}
					/>
				</div>{/each}
		</fieldset>
		{#if preview.existing.length}<details>
				<summary>{preview.existing.length} existing dates (unchanged)</summary
				>{#each preview.existing as row}<div class="schedule-row">
						<span>{row.date}</span><strong lang="mn">{row.word}</strong>
					</div>{/each}
			</details>{/if}
		{#if uncertain}<p role="alert" class="warning">
				The save result is uncertain. Recheck to reload the schedule and prepare a fresh preview.
			</p>
			<form method="POST" action="?/preview" use:enhance={submit}>
				{#if preview.replacement}<input
						type="hidden"
						name="date"
						value={preview.assignments[0]?.date}
					/>{/if}<button disabled={pending}>Recheck schedule and preview</button>
			</form>
		{:else}<form method="POST" action="?/save" use:enhance={submit}>
				<input type="hidden" name="preview" value={JSON.stringify(preview)} /><button
					class="primary"
					disabled={pending || !preview.assignments.length}
					>{pending
						? 'Working…'
						: `Save ${preview.assignments.length} ${preview.replacement ? 'replacement' : 'assignments'}`}</button
				>
			</form>{/if}
		<button
			class="quiet"
			disabled={pending}
			onclick={() => {
				preview = null;
			}}>Close preview</button
		>
	</section>
{/if}
<section aria-label="Assigned dates" class="date-list">
	{#each data.schedule?.rows ?? [] as row}<div class="schedule-row">
			<div>
				<strong>{row.date}</strong>
				<p lang="mn">{row.word ?? 'Empty'}</p>
			</div>
			{#if row.word}<form method="POST" action="?/preview" use:enhance={submit}>
					<input type="hidden" name="date" value={row.date} /><button disabled={pending}
						>Change</button
					>
				</form>{/if}
		</div>{/each}
</section>
<div class="actions">
	{#if data.schedule && data.schedule.rows[0]?.date !== nextPage(data.schedule.today)}<a
			class="button"
			href="/editor/schedule">Next 30 days</a
		>{/if}{#if nextDate}<a class="button" href={`?from=${nextPage(nextDate)}`}
			>Browse another 30 days</a
		>{/if}
</div>
