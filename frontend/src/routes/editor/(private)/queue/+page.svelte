<script lang="ts">
	import { editorEnhance } from '$lib/editor-enhance';
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	let pending = $state(false);
	let connectionError = $state('');
	const submit = editorEnhance(
		(value) => {
			pending = value;
		},
		(value) => {
			connectionError = value;
		}
	);
</script>

{#if connectionError}<p class="error" role="alert">
		{connectionError} <a href="/editor/queue">Refresh</a>
	</p>{/if}
<h1>Approved queue</h1>
<p>First approved, first scheduled. {data.queue?.total ?? 0} words awaiting a date.</p>
<form method="GET" class="search">
	<label for="search">Search queue</label>
	<div class="inline">
		<input id="search" name="search" value={data.search} maxlength="80" /><button>Search</button>
	</div>
</form>
{#if data.error}<p role="alert" class="error">
		{data.error} <a href="/editor/queue">Retry</a>
	</p>{/if}
{#if form && 'error' in form && form.error}<p class="error" role="alert">{form.error}</p>{/if}
{#each data.queue?.words ?? [] as item (item.word)}
	<article class="card queue-item">
		<details>
			<summary lang="mn">{item.word}</summary>
			<ul class="meanings" lang="mn">
				{#each item.meanings as meaning}<li><span>{meaning.pos}</span> {meaning.meaning}</li>{/each}
			</ul>
		</details>
		<details class="menu">
			<summary>Actions for {item.word}</summary>
			<form method="POST" action="?/change" use:enhance={submit}>
				<input type="hidden" name="word" value={item.word} /><input
					type="hidden"
					name="revision"
					value={data.queue?.revision}
				/>
				<div class="actions">
					<button name="operation" value="top" disabled={pending}>Move to top</button><button
						name="operation"
						value="reject"
						disabled={pending}>Reject</button
					>
				</div>
			</form>
		</details>
	</article>
{:else}{#if !data.error}<div class="card">
			<p>
				{data.search
					? 'No queued words match.'
					: 'Your queue is empty. Approve a few words to start.'}
			</p>
			<a href="/editor">Review words</a>
		</div>{/if}{/each}
<div class="actions">
	{#if data.offset > 0}<a
			class="button"
			href={`?search=${encodeURIComponent(data.search)}&offset=${Math.max(0, data.offset - 50)}`}
			>Previous</a
		>{/if}{#if data.queue && data.offset + 50 < data.queue.total}<a
			class="button"
			href={`?search=${encodeURIComponent(data.search)}&offset=${data.offset + 50}`}>Next 50</a
		>{/if}
</div>
{#if form && 'undo' in form && form.undo}<form
		class="notice"
		method="POST"
		action="?/undo"
		use:enhance={submit}
	>
		<p role="status">Queue updated.</p>
		<input type="hidden" name="token" value={form.undo} /><button disabled={pending}
			>Undo last change</button
		>
	</form>{/if}
{#if form && 'undone' in form}<p role="status">Queue change undone.</p>{/if}
